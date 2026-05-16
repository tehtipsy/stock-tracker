// Server function: fetches a live market quote for a single Yahoo Finance symbol.
// Deployed as a Vercel serverless function at /api/lookup
// Usage: GET /api/lookup?symbol=AAPL  or  /api/lookup?symbol=GIVN.SW
import type { IncomingMessage, ServerResponse } from 'http'
import type { FundamentalsTimeSeriesFinancialsResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { LookupResponse } from '../src/types'
import { rejectNonGet, sendJson } from './lib/http'
import {
  EMPTY_FINANCIAL_DATA,
  extractFinancials,
  FTS_PERIOD1,
  MODULES,
  toQuote,
  yf,
} from './lib/quoteService'
const FX_MAX_ATTEMPTS = 2
const FX_RETRY_DELAY_MS = 400

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

    // Fetch USD exchange rate for non-USD currencies.
    // Strategy 1: direct pair  {CURRENCY}USD=X  (e.g. EURUSD=X)
    // Strategy 2: inverted pair USD{CURRENCY}=X  (e.g. USDILS=X → 1/rate)
    // Each strategy retries FX_MAX_ATTEMPTS times with FX_RETRY_DELAY_MS between attempts.
    let usdRate: number | null = 1
    if (currency !== 'USD') {
      usdRate = null

      // Strategy 1: direct pair
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

      // Strategy 2: inverted pair (e.g. USDILS=X → 1/rate) when direct pair is unavailable
      if (usdRate == null) {
        for (let attempt = 0; attempt < FX_MAX_ATTEMPTS; attempt++) {
          try {
            if (attempt > 0) await new Promise(r => setTimeout(r, FX_RETRY_DELAY_MS))
            const fx = await yf.quoteSummary(`USD${currency}=X`, { modules: ['price'] })
            const rate = fx.price?.regularMarketPrice
            if (rate != null && isFinite(rate) && rate > 0) { usdRate = 1 / rate; break }
          } catch {
            // continue to next attempt
          }
        }
      }

      if (usdRate == null) {
        console.warn(`[lookup] Could not fetch USD rate for ${currency}; mcap will be omitted.`)
      }
    }

    const financials = ftsResult.status === 'fulfilled'
      ? extractFinancials(ftsResult.value)
      : EMPTY_FINANCIAL_DATA

    const quote = toQuote(d, usdRate, financials, { allowDerivedMarketCap: true })

    const body: LookupResponse = { name, currency, quote }

    sendJson(res, 200, body)
  } catch (err) {
    sendJson(res, 500, { error: (err as Error).message })
  }
}
