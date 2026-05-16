// Server function: fetches a live market quote for a single Yahoo Finance symbol.
// Deployed as a Vercel serverless function at /api/lookup
// Usage: GET /api/lookup?symbol=AAPL  or  /api/lookup?symbol=GIVN.SW
import type { IncomingMessage, ServerResponse } from 'http'
import type { FundamentalsTimeSeriesFinancialsResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { LookupResponse } from '../src/types'
import { rejectNonGet, sendJson } from './lib/http.js'
import {
  EMPTY_FINANCIAL_DATA,
  extractFinancials,
  fetchUsdRate,
  FTS_PERIOD1,
  getRawMarketCap,
  MODULES,
  toQuote,
  yf,
} from './lib/quoteService.js'
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (rejectNonGet(req, res)) return

  const url = new URL(req.url ?? '/', `http://localhost`)
  const symbol = url.searchParams.get('symbol')?.trim().toUpperCase() ?? ''

  if (!symbol) {
    sendJson(res, 400, { error: 'symbol parameter is required' })
    return
  }

  try {
    const [quoteSummaryResult, ftsResult] = await Promise.allSettled([
      yf.quoteSummary(symbol, { modules: [...MODULES] }),
      yf.fundamentalsTimeSeries(symbol, { period1: FTS_PERIOD1, type: 'annual', module: 'financials' }) as Promise<FundamentalsTimeSeriesFinancialsResult[]>,
    ])

    if (quoteSummaryResult.status === 'rejected') {
      sendJson(res, 404, { error: `Symbol not found: ${symbol}` })
      return
    }

    const d = quoteSummaryResult.value
    const currency = d.price?.currency ?? 'USD'
    const name = d.price?.shortName ?? d.price?.longName ?? symbol

    const usdRate = await fetchUsdRate(currency)
    if (usdRate == null) {
      console.warn(`[lookup] Could not fetch USD rate for ${currency}; mcap will be omitted.`)
    }

    const financials = ftsResult.status === 'fulfilled'
      ? extractFinancials(ftsResult.value)
      : EMPTY_FINANCIAL_DATA

    const rawMcap = getRawMarketCap(d, { allowDerivedMarketCap: true })
    const quote = toQuote(d, usdRate, financials, { allowDerivedMarketCap: true })
    const fxRateMissing = currency !== 'USD' && rawMcap != null && usdRate == null

    const body: LookupResponse = fxRateMissing
      ? { name, currency, quote, fxRateMissing: true }
      : { name, currency, quote }

    sendJson(res, 200, body)
  } catch (err) {
    sendJson(res, 500, { error: (err as Error).message })
  }
}
