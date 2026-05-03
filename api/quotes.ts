// Server function: fetches live market quotes from Yahoo Finance via yahoo-finance2
// Deployed as a Vercel serverless function at /api/quotes
// Maps internal app tickers to Yahoo Finance symbols and returns normalised quote fields.
import type { IncomingMessage, ServerResponse } from 'http'
import YahooFinance from 'yahoo-finance2'
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary-iface'
import type { LiveQuote, QuotesResponse } from '../src/types'

// Instantiate with validation warnings suppressed in production
const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false },
})

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

const MODULES = ['price', 'defaultKeyStatistics', 'summaryDetail'] as const

function round2(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

function toQuote(d: QuoteSummaryResult, usdRate: number | null): LiveQuote {
  const rawMcap = d.price?.marketCap
  return {
    mcap:       rawMcap != null && usdRate != null ? Math.round((rawMcap * usdRate) / 1e6) : null,
    pe:         round2(d.summaryDetail?.trailingPE),
    ps:         round2(d.summaryDetail?.priceToSalesTrailing12Months),
    ev_revenue: round2(d.defaultKeyStatistics?.enterpriseToRevenue),
    ev_ebitda:  round2(d.defaultKeyStatistics?.enterpriseToEbitda),
  }
}

/** Fetch 1-unit-of-currency → USD rates for each non-USD currency. */
async function fetchFxRates(currencies: string[]): Promise<Record<string, number>> {
  const rates: Record<string, number> = { USD: 1 }
  const nonUSD = currencies.filter(c => c !== 'USD')
  if (!nonUSD.length) return rates

  const fxResults = await Promise.allSettled(
    nonUSD.map(c => yf.quoteSummary(`${c}USD=X`, { modules: ['price'] })),
  )
  nonUSD.forEach((currency, i) => {
    const r = fxResults[i]
    if (r.status === 'fulfilled') {
      const rate = r.value.price?.regularMarketPrice
      if (rate != null && isFinite(rate) && rate > 0) rates[currency] = rate
    }
  })
  return rates
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Only allow GET
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const entries = Object.entries(TICKER_MAP)

  const results = await Promise.allSettled(
    entries.map(([, yahooTicker]) =>
      yf.quoteSummary(yahooTicker, { modules: [...MODULES] }),
    ),
  )

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

  const quotes: Record<string, LiveQuote> = {}
  entries.forEach(([appTicker], i) => {
    const result = results[i]
    if (result.status !== 'fulfilled') return
    const d = result.value
    const currency = d.price?.currency ?? 'USD'
    const usdRate = fxRates[currency]
    if (usdRate == null) {
      console.warn(`[quotes] No USD rate found for currency "${currency}" (${appTicker}); market cap will be omitted.`)
    }
    quotes[appTicker] = toQuote(d, usdRate ?? null)
  })

  const body: QuotesResponse = { quotes, fetchedAt: new Date().toISOString() }

  // Cache for 15 minutes on CDN; 5 minutes stale-while-revalidate
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
  })
  res.end(JSON.stringify(body))
}

