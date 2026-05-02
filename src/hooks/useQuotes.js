import { useState, useEffect, useCallback } from 'react'

// Fields that the live API can update on a company row
const LIVE_FIELDS = ['mcap', 'pe', 'ps', 'ev_revenue', 'ev_ebitda']

/**
 * Fetches live market quotes from /api/quotes and returns a merge function.
 * The merge function overlays live fields onto a companies array.
 *
 * @returns {{ quotes: object, loading: boolean, error: string|null, refresh: function, mergeQuotes: function }}
 */
export function useQuotes() {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quotes')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data = await res.json()
      setQuotes(data.quotes ?? {})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  /**
   * Overlay live quote data onto companies array.
   * Only updates non-null live values so manual edits for unlisted companies are preserved.
   */
  const mergeQuotes = useCallback((companies) => {
    if (!Object.keys(quotes).length) return companies
    return companies.map(c => {
      const q = quotes[c.ticker]
      if (!q) return c
      const overrides = {}
      for (const f of LIVE_FIELDS) {
        if (q[f] != null) overrides[f] = q[f]
      }
      return Object.keys(overrides).length ? { ...c, ...overrides } : c
    })
  }, [quotes])

  return { quotes, loading, error, refresh: fetchQuotes, mergeQuotes }
}
