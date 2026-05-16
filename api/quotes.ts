// Server function: fetches live market quotes from Yahoo Finance via yahoo-finance2
// Deployed as a Vercel serverless function at /api/quotes
// Maps internal app tickers to Yahoo Finance symbols and returns normalised quote fields.
import type { IncomingMessage, ServerResponse } from 'http'
import type { FundamentalsTimeSeriesFinancialsResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { LiveQuote, QuotesResponse } from '../src/types'
import { rejectNonGet, sendJson } from './lib/http'
import {
  EMPTY_FINANCIAL_DATA,
  extractFinancials,
  fetchUsdRate,
  FTS_PERIOD1,
  MODULES,
  toQuote,
  yf,
} from './lib/quoteService'

// Map from app ticker → Yahoo Finance symbol
const TICKER_MAP: Record<string, string> = {
  IFF:    'IFF',
  GIVN:   'GIVN.SW',
  SY1:    'SY1.DE',
  DSFIR:  'DSFIR.AS',
  KRY:    'KYGA.IR',
  SXT:    'SXT',
  RBT:    'RBT.PA',
  '4958': '4958.T',
  '4914': '4914.T',
}

/** Fetch 1-unit-of-currency → USD rates for each non-USD currency. */
async function populateFxRates(rates: Record<string, number>, currencies: string[]): Promise<void> {
  const missingCurrencies = currencies.filter(currency => currency !== 'USD' && rates[currency] == null)
  if (!missingCurrencies.length) return

  const fxResults = await Promise.all(missingCurrencies.map(async currency => [currency, await fetchUsdRate(currency)] as const))
  fxResults.forEach(([currency, rate]) => {
    if (rate != null) rates[currency] = rate
  })
}

async function fetchFxRates(currencies: string[]): Promise<Record<string, number>> {
  const rates: Record<string, number> = { USD: 1 }
  await populateFxRates(rates, currencies)
  return rates
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (rejectNonGet(req, res)) return

  const entries = Object.entries(TICKER_MAP)

  const [results, ftsResults] = await Promise.all([
    Promise.allSettled(
      entries.map(([, yahooTicker]) =>
        yf.quoteSummary(yahooTicker, { modules: [...MODULES] }),
      ),
    ),
    Promise.allSettled(
      entries.map(([, yahooTicker]) =>
        yf.fundamentalsTimeSeries(yahooTicker, { period1: FTS_PERIOD1, type: 'annual', module: 'financials' }) as Promise<FundamentalsTimeSeriesFinancialsResult[]>,
      ),
    ),
  ])

  // Collect all unique non-USD currencies from the fetched quotes
  const currencySet = new Set<string>()
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      const currency = r.value.price?.currency
      if (currency) currencySet.add(currency)
    }
  })

  // Fetch USD exchange rates for all non-USD currencies encountered
  const fxRates = await fetchFxRates([...currencySet])
  await populateFxRates(fxRates, [...currencySet])

  const quotes: Record<string, LiveQuote> = {}
  for (let i = 0; i < entries.length; i++) {
    const [appTicker] = entries[i]
    const result = results[i]
    if (result.status !== 'fulfilled') continue
    const d = result.value
    const currency = d.price?.currency ?? 'USD'
    const usdRate: number | null = fxRates[currency] ?? null
    if (usdRate == null) {
      console.warn(`[quotes] No USD rate found for currency "${currency}" (${appTicker}); market cap will be omitted.`)
    }
    const ftsResult = ftsResults[i]
    const financials = ftsResult.status === 'fulfilled' ? extractFinancials(ftsResult.value) : EMPTY_FINANCIAL_DATA
    quotes[appTicker] = toQuote(d, usdRate, financials)
  }

  const body: QuotesResponse = { quotes, fetchedAt: new Date().toISOString() }

  // Cache for 15 minutes on CDN; 5 minutes stale-while-revalidate
  sendJson(res, 200, body, {
    'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
  })
}
