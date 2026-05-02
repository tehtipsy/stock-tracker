import { useState } from 'react'
import { num } from '../lib/utils'
import type { Company, FinancialRow } from '../types'

export type FinFormData = Omit<FinancialRow, 'id'>

interface FinModalProps {
  record: FinancialRow | null
  companies: Company[]
  onSave: (data: FinFormData) => void
  onClose: () => void
}

export default function FinModal({ record, companies, onSave, onClose }: FinModalProps) {
  const [form, setForm] = useState({
    cid: String(record?.cid ?? (companies[0]?.id ?? '')),
    year: record?.year ?? 2024,
    scope: record?.scope ?? 'Consolidated',
    quarter: record?.quarter ?? '',
    sales: record?.sales ?? '',
    gp: record?.gp ?? '',
    ebitda: record?.ebitda ?? '',
    ebit: record?.ebit ?? '',
    net: record?.net ?? '',
  })

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }))

  function handleSave() {
    const co = companies.find(c => c.id === parseInt(form.cid))
    if (!co) return
    onSave({
      ticker: co.ticker,
      name: co.name,
      cid: co.id,
      scope: String(form.scope).trim() || 'Consolidated',
      year: parseInt(String(form.year)) || 2024,
      quarter: form.quarter || null,
      sales: num(form.sales),
      gp: num(form.gp),
      ebitda: num(form.ebitda),
      ebit: num(form.ebit),
      net: num(form.net),
    })
  }

  const fld = (label: string, key: string, type = 'text', placeholder = '—') => (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form] ?? '')} placeholder={placeholder}
        onChange={e => set(key, e.target.value)} />
    </div>
  )

  const qOpts = ['', 'Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2']

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">{record ? 'Edit financials' : 'Add financials'}</div>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Company</label>
            <select value={form.cid} onChange={e => set('cid', e.target.value)}>
              {companies.map(c => <option key={c.id} value={c.id}>{c.ticker} – {c.name}</option>)}
            </select>
          </div>
          {fld('Year', 'year', 'number', '2024')}
        </div>
        <div className="form-grid">
          {fld('Scope (e.g. Consolidated, Fragrance…)', 'scope', 'text', 'Consolidated')}
          <div className="form-row">
            <label className="form-label">Quarter / Period</label>
            <select value={String(form.quarter)} onChange={e => set('quarter', e.target.value)}>
              {qOpts.map(q => <option key={q} value={q}>{q || 'Annual (full year)'}</option>)}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
          Leave quarter blank for annual / full-year data. Use H1/H2 for semi-annual reporters.
        </p>
        <div className="modal-section">P&amp;L figures ($M) — margins calculated automatically</div>
        <div className="form-grid">
          {fld('Sales / Revenue', 'sales', 'number')}
          {fld('Gross profit', 'gp', 'number')}
          {fld('EBITDA', 'ebitda', 'number')}
          {fld('EBIT', 'ebit', 'number')}
          {fld('Net profit', 'net', 'number')}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
