import { useState } from 'react'
import { num } from '../../lib/utils'
import type { Segment, LookupResponse } from '../../types'
import type { CompanyFormData } from './CompanyModal'

interface AddTickerModalProps {
  onSave: (data: CompanyFormData) => void
  onClose: () => void
}

export default function AddTickerModal({ onSave, onClose }: AddTickerModalProps) {
  const [symbol, setSymbol] = useState('')
  const [suffix, setSuffix] = useState('')
  const [segment, setSegment] = useState<Segment>('Diversified')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [pendingCompany, setPendingCompany] = useState<CompanyFormData | null>(null)
  const [manualMcap, setManualMcap] = useState('')

  function resetPending() {
    setWarning(null)
    setPendingCompany(null)
    setManualMcap('')
  }

  async function handleAdd() {
    if (pendingCompany) {
      const mcap = manualMcap.trim() === '' ? pendingCompany.mcap : num(manualMcap)
      onSave({ ...pendingCompany, mcap })
      return
    }

    const sym = symbol.trim().toUpperCase()
    if (!sym) { setError('Ticker symbol is required.'); return }

    const fullSymbol = sym + suffix.trim()
    setLoading(true)
    setError(null)
    setWarning(null)

    try {
      const res = await fetch(`/api/lookup?symbol=${encodeURIComponent(fullSymbol)}`)
      const data = await res.json() as LookupResponse & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      const companyData: CompanyFormData = {
        ticker: sym,
        name: data.name,
        segment,
        currency: data.currency,
        year: new Date().getFullYear(),
        mcap: data.quote.mcap,
        ev_revenue: data.quote.ev_revenue,
        ev_ebitda: data.quote.ev_ebitda,
        ev_ebit: data.quote.ev_ebit,
        pe: data.quote.pe,
        ps: data.quote.ps,
        ev_nopat: data.quote.ev_nopat,
        ebitda_margin: data.quote.ebitda_margin,
      }

      if (data.fxRateMissing) {
        setPendingCompany(companyData)
        setWarning(`Could not fetch the ${data.currency}/USD FX rate, so market cap is currently unavailable in USD. You can still add the company and optionally enter market cap manually in USD millions.`)
        return
      }

      onSave(companyData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Add company</div>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Ticker symbol</label>
            <input
              type="text"
              value={symbol}
              placeholder="e.g. AAPL, GIVN"
              onChange={e => { setSymbol(e.target.value); resetPending() }}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Exchange suffix <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
            <input
              type="text"
              value={suffix}
              placeholder="e.g. .SW, .DE — blank for US"
              onChange={e => { setSuffix(e.target.value); resetPending() }}
              disabled={loading}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>
        <div className="form-grid" style={{ marginTop: 10 }}>
          <div className="form-row">
            <label className="form-label">Segment</label>
            <select value={segment} onChange={e => { setSegment(e.target.value as Segment); resetPending() }} disabled={loading}>
              {(['Flavor', 'Fragrance', 'Ingredients', 'Diversified'] as const).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {pendingCompany && (
          <div className="form-grid" style={{ marginTop: 10 }}>
            <div className="form-row">
              <label className="form-label">Market cap (USD M) <span style={{ color: 'var(--text3)' }}>(optional)</span></label>
              <input
                type="number"
                value={manualMcap}
                placeholder="Leave blank to add without market cap"
                onChange={e => setManualMcap(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}
        {warning && <p style={{ color: 'var(--amber)', fontSize: 12, marginTop: 10 }}>{warning}</p>}
        {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd} disabled={loading}>
            {loading ? 'Fetching…' : pendingCompany ? 'Add company' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
