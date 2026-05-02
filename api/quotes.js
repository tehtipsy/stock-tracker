// Server function: fetches live market quotes from Yahoo Finance via yahoo-finance2
// Deployed as a Vercel serverless function at /api/quotes
// Maps internal app tickers to Yahoo Finance symbols and returns normalised quote fields.
import yahooFinance from 'yahoo-finance2'

// Map from app ticker → Yahoo Finance symbol
const TICKER_MAP = {
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

// Suppress yahoo-finance2 schema validation warnings in production
yahooFinance.setGlobalConfig({ validation: { logErrors: false } })

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const entries = Object.entries(TICKER_MAP)

  const results = await Promise.allSettled(
    entries.map(([, yahooTicker]) =>
      yahooFinance.quoteSummary(yahooTicker, {
        modules: ['price', 'defaultKeyStatistics', 'summaryDetail'],
      }),
    ),
  )

  const quotes = {}
  entries.forEach(([appTicker], i) => {
    const result = results[i]
    if (result.status !== 'fulfilled') return
    const d = result.value

    // Market cap: convert from raw units to $M
    const rawMcap = d.price?.marketCap
    const mcap = rawMcap != null ? Math.round(rawMcap / 1e6) : null

    quotes[appTicker] = {
      mcap,
      pe:         round2(d.summaryDetail?.trailingPE ?? null),
      ps:         round2(d.summaryDetail?.priceToSalesTrailing12Months ?? null),
      ev_revenue: round2(d.defaultKeyStatistics?.enterpriseToRevenue ?? null),
      ev_ebitda:  round2(d.defaultKeyStatistics?.enterpriseToEbitda ?? null),
    }
  })

  // Cache for 15 minutes on CDN; 5 minutes stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300')
  return res.status(200).json({ quotes, fetchedAt: new Date().toISOString() })
}

function round2(v) {
  if (v == null || !isFinite(v)) return null
  return Math.round(v * 100) / 100
}
