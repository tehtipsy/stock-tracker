// Server function: fetches a live market quote for a single Yahoo Finance symbol.
// Deployed as a Vercel serverless function at /api/lookup
// Usage: GET /api/lookup?symbol=AAPL  or  /api/lookup?symbol=GIVN.SW
import type { IncomingMessage, ServerResponse } from 'http'
import YahooFinance from 'yahoo-finance2'
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary-iface'
import type { FundamentalsTimeSeriesFinancialsResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { LiveQuote, LookupResponse } from '../src/types'

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false },
})

const MODULES = ['price', 'defaultKeyStatistics', 'summaryDetail'] as const
const FTS_PERIOD1 = '2021-01-01'
const FX_MAX_ATTEMPTS = 2
const FX_RETRY_DELAY_MS = 400

function round2(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

interface FinancialData {
  ebit: number | null
  ebitda: number | null
  totalRevenue: number | null
  taxRate: number | null
}

function extractFinancials(rows: FundamentalsTimeSeriesFinancialsResult[]): FinancialData {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    const ebit = row.EBIT
    if (ebit != null && isFinite(ebit)) {
      const ebitda = row.EBITDA != null && isFinite(row.EBITDA) ? row.EBITDA : null
      const totalRevenue = row.totalRevenue != null && isFinite(row.totalRevenue) ? row.totalRevenue : null
      const taxRate = row.taxRateForCalcs != null && isFinite(row.taxRateForCalcs) ? row.taxRateForCalcs : null
      return { ebit, ebitda, totalRevenue, taxRate }
    }
  }
  return { ebit: null, ebitda: null, totalRevenue: null, taxRate: null }
}

function toQuote(d: QuoteSummaryResult, usdRate: number | null, financials: FinancialData): LiveQuote {
  // Use price.marketCap if available; fall back to price × sharesOutstanding
  // Both sources are in the security's native currency (absolute value, not millions)
  const rawMcap =
    d.price?.marketCap ??
    (d.price?.regularMarketPrice != null && d.defaultKeyStatistics?.sharesOutstanding != null
      ? d.price.regularMarketPrice * d.defaultKeyStatistics.sharesOutstanding
      : null)
  const ev = d.defaultKeyStatistics?.enterpriseValue
  const { ebit, ebitda, totalRevenue, taxRate } = financials
  const ev_ebit = ev != null && ebit != null && ebit !== 0 ? round2(ev / ebit) : null
  const nopat = ebit != null && taxRate != null ? ebit * (1 - taxRate) : null
  const ev_nopat = ev != null && nopat != null && nopat !== 0 ? round2(ev / nopat) : null
  const ebitda_margin = ebitda != null && totalRevenue != null && totalRevenue !== 0 ? round2(ebitda / totalRevenue * 100) : null
  return {
    // mcap is always stored in USD millions; null when FX rate is unavailable to
    // avoid silently displaying a local-currency value labeled as USD.
    mcap:       rawMcap != null && usdRate != null ? Math.round((rawMcap * usdRate) / 1e6) : null,
    pe:         round2(d.summaryDetail?.trailingPE),
    ps:         round2(d.summaryDetail?.priceToSalesTrailing12Months),
    ev_revenue: round2(d.defaultKeyStatistics?.enterpriseToRevenue),
    ev_ebitda:  ev != null && ebitda != null && ebitda !== 0 ? round2(ev / ebitda) : null,
    ev_ebit,
    ev_nopat,
    ebitda_margin,
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const url = new URL(req.url ?? '/', `http://localhost`)
  const symbol = url.searchParams.get('symbol')?.trim().toUpperCase() ?? ''

  if (!symbol) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'symbol parameter is required' }))
    return
  }

  try {
    const [quoteSummaryResult, ftsResult] = await Promise.allSettled([
      yf.quoteSummary(symbol, { modules: [...MODULES] }),
      yf.fundamentalsTimeSeries(symbol, { period1: FTS_PERIOD1, type: 'annual', module: 'financials' }) as Promise<FundamentalsTimeSeriesFinancialsResult[]>,
    ])

    if (quoteSummaryResult.status === 'rejected') {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: `Symbol not found: ${symbol}` }))
      return
    }

    const d = quoteSummaryResult.value
    const currency = d.price?.currency ?? 'USD'
    const name = d.price?.shortName ?? d.price?.longName ?? symbol

    // Fetch USD exchange rate for non-USD currencies.
    // Retry once (after FX_RETRY_DELAY_MS) to survive transient Yahoo Finance failures.
    let usdRate: number | null = 1
    if (currency !== 'USD') {
      usdRate = null
      for (let attempt = 0; attempt < FX_MAX_ATTEMPTS; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, FX_RETRY_DELAY_MS))
          const fx = await yf.quoteSummary(`${currency}USD=X`, { modules: ['price'] })
          const rate = fx.price?.regularMarketPrice
          if (rate != null && isFinite(rate) && rate > 0) { usdRate = rate; break }
        } catch {
          // continue to next attempt
        }
      }
      if (usdRate == null) {
        console.warn(`[lookup] Could not fetch USD rate for ${currency} after ${FX_MAX_ATTEMPTS} attempts; mcap will be omitted.`)
      }
    }

    const financials = ftsResult.status === 'fulfilled'
      ? extractFinancials(ftsResult.value)
      : { ebit: null, ebitda: null, totalRevenue: null, taxRate: null }

    const quote = toQuote(d, usdRate, financials)

    const body: LookupResponse = { name, currency, quote }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: (err as Error).message }))
  }
}
