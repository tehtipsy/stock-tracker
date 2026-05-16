import YahooFinance from 'yahoo-finance2'
import type { FundamentalsTimeSeriesFinancialsResult } from 'yahoo-finance2/modules/fundamentalsTimeSeries'
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary-iface'
import type { LiveQuote } from '../../src/types'

export const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  validation: { logErrors: false },
})

export const MODULES = ['price', 'defaultKeyStatistics', 'summaryDetail'] as const
export const FTS_PERIOD1 = '2021-01-01'
const FX_MAX_ATTEMPTS = 2
const FX_RETRY_DELAY_MS = 400

export interface FinancialData {
  ebit: number | null
  ebitda: number | null
  totalRevenue: number | null
  taxRate: number | null
}

export const EMPTY_FINANCIAL_DATA: FinancialData = {
  ebit: null,
  ebitda: null,
  totalRevenue: null,
  taxRate: null,
}

function round2(v: number | null | undefined): number | null {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}

export function extractFinancials(rows: FundamentalsTimeSeriesFinancialsResult[]): FinancialData {
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

  return EMPTY_FINANCIAL_DATA
}

export function getRawMarketCap(
  d: QuoteSummaryResult,
  options: { allowDerivedMarketCap?: boolean } = {},
): number | null {
  return d.price?.marketCap ??
    (options.allowDerivedMarketCap &&
    d.price?.regularMarketPrice != null &&
    d.defaultKeyStatistics?.sharesOutstanding != null
      ? d.price.regularMarketPrice * d.defaultKeyStatistics.sharesOutstanding
      : null)
}

export function toQuote(
  d: QuoteSummaryResult,
  usdRate: number | null,
  financials: FinancialData,
  options: { allowDerivedMarketCap?: boolean } = {},
): LiveQuote {
  const rawMcap = getRawMarketCap(d, options)
  const ev = d.defaultKeyStatistics?.enterpriseValue
  const { ebit, ebitda, totalRevenue, taxRate } = financials
  const ev_ebit = ev != null && ebit != null && ebit !== 0 ? round2(ev / ebit) : null
  const nopat = ebit != null && taxRate != null ? ebit * (1 - taxRate) : null
  const ev_nopat = ev != null && nopat != null && nopat !== 0 ? round2(ev / nopat) : null
  const ebitda_margin = ebitda != null && totalRevenue != null && totalRevenue !== 0 ? round2(ebitda / totalRevenue * 100) : null

  return {
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

/** Fetch 1 unit of `currency` in USD using a direct pair first, then an inverted USD pair, retrying each strategy. */
export async function fetchUsdRate(currency: string): Promise<number | null> {
  if (currency === 'USD') return 1

  for (let attempt = 0; attempt < FX_MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, FX_RETRY_DELAY_MS))
      const fx = await yf.quoteSummary(`${currency}USD=X`, { modules: ['price'] })
      const rate = fx.price?.regularMarketPrice
      if (rate != null && isFinite(rate) && rate > 0) return rate
    } catch {
      // continue to next attempt
    }
  }

  for (let attempt = 0; attempt < FX_MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, FX_RETRY_DELAY_MS))
      const fx = await yf.quoteSummary(`USD${currency}=X`, { modules: ['price'] })
      const rate = fx.price?.regularMarketPrice
      if (rate != null && isFinite(rate) && rate > 0) return 1 / rate
    } catch {
      // continue to next attempt
    }
  }

  return null
}
