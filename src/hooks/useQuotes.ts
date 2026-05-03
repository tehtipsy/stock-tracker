import { useState, useEffect, useCallback } from 'react'
import type { Company, LiveQuote, QuotesResponse } from '../types'

// Fields that the live API can update on a company row
const LIVE_FIELDS: (keyof LiveQuote)[] = ['mcap', 'pe', 'ps', 'ev_revenue', 'ev_ebitda', 'ev_ebit']

interface UseQuotesResult {
  quotes: Record<string, LiveQuote>
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  mergeQuotes: (companies: Company[]) => Company[]
}

/**
 * Fetches live market quotes from /api/quotes and returns a merge function.
 * The merge function overlays live fields onto a companies array.
 */
export function useQuotes(): UseQuotesResult {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quotes')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = (await res.json()) as QuotesResponse
      setQuotes(data.quotes ?? {})
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchQuotes() }, [fetchQuotes])

  /**
   * Overlay live quote data onto companies array.
   * Only updates non-null live values so manual edits for unlisted companies are preserved.
   */
  const mergeQuotes = useCallback((companies: Company[]): Company[] => {
    if (!Object.keys(quotes).length) return companies
    return companies.map(c => {
      const q = quotes[c.ticker]
      if (!q) return c
      const overrides: Partial<Company> = {}
      for (const f of LIVE_FIELDS) {
        if (q[f] != null) (overrides as Record<string, number | null>)[f] = q[f]
      }
      return Object.keys(overrides).length ? { ...c, ...overrides } : c
    })
  }, [quotes])

  return { quotes, loading, error, refresh: fetchQuotes, mergeQuotes }
}
