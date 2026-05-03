// ── Domain types ────────────────────────────────────────────────────────────

export type Segment = 'Flavor' | 'Fragrance' | 'Ingredients' | 'Diversified'

export interface Company {
  id: number
  ticker: string
  name: string
  segment: Segment
  mcap: number | null
  ev_revenue: number | null
  ev_ebitda: number | null
  ev_ebit: number | null
  pe: number | null
  ps: number | null
  ev_nopat: number | null
  ebitda_margin: number | null
  year: number
}

export interface FinancialRow {
  id: number
  cid: number
  ticker: string
  name: string
  scope: string
  year: number
  quarter?: string | null
  sales: number | null
  gp: number | null
  ebitda: number | null
  ebit: number | null
  net: number | null
}

// ── API types ───────────────────────────────────────────────────────────────

export interface LiveQuote {
  mcap: number | null
  pe: number | null
  ps: number | null
  ev_revenue: number | null
  ev_ebitda: number | null
  ev_ebit: number | null
  ev_nopat: number | null
  ebitda_margin: number | null
}

export interface QuotesResponse {
  quotes: Record<string, LiveQuote>
  fetchedAt: string
}

// ── Context types ───────────────────────────────────────────────────────────

export interface DataContextValue {
  companies: Company[]
  setCompanies: (val: Company[] | ((prev: Company[]) => Company[])) => void
  financials: FinancialRow[]
  setFinancials: (val: FinancialRow[] | ((prev: FinancialRow[]) => FinancialRow[])) => void
  liveCompanies: Company[]
}
