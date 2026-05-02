import { useState } from 'react'
import { num } from '../lib/utils'
import type { Company } from '../types'

export type CompanyFormData = Omit<Company, 'id'>

interface CompanyModalProps {
  company: Company | null
  onSave: (data: CompanyFormData) => void
  onClose: () => void
}

export default function CompanyModal({ company, onSave, onClose }: CompanyModalProps) {
  const [form, setForm] = useState({
    ticker: company?.ticker ?? '',
    name: company?.name ?? '',
    segment: company?.segment ?? 'Diversified',
    year: company?.year ?? 2024,
    mcap: company?.mcap ?? '',
    ev_revenue: company?.ev_revenue ?? '',
    ev_ebitda: company?.ev_ebitda ?? '',
    ev_ebit: company?.ev_ebit ?? '',
    pe: company?.pe ?? '',
    ps: company?.ps ?? '',
    ev_nopat: company?.ev_nopat ?? '',
    ebitda_margin: company?.ebitda_margin ?? '',
  })

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }))

  function handleSave() {
    if (!String(form.ticker).trim() || !String(form.name).trim()) { alert('Ticker and name required.'); return }
    onSave({
      ticker: String(form.ticker).trim().toUpperCase(),
      name: String(form.name).trim(),
      segment: form.segment as Company['segment'],
      year: parseInt(String(form.year)) || 2024,
      mcap: num(form.mcap),
      ev_revenue: num(form.ev_revenue),
      ev_ebitda: num(form.ev_ebitda),
      ev_ebit: num(form.ev_ebit),
      pe: num(form.pe),
      ps: num(form.ps),
      ev_nopat: num(form.ev_nopat),
      ebitda_margin: num(form.ebitda_margin),
    })
  }

  const fld = (label: string, key: string, type = 'text', placeholder = '—', extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input type={type} value={String(form[key as keyof typeof form] ?? '')} placeholder={placeholder}
        onChange={e => set(key, e.target.value)} {...extra} />
    </div>
  )

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">{company ? 'Edit company' : 'Add company'}</div>
        <div className="form-grid">
          {fld('Ticker', 'ticker', 'text', 'e.g. IFF')}
          {fld('Name', 'name', 'text', 'Company name')}
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Segment</label>
            <select value={String(form.segment)} onChange={e => set('segment', e.target.value)}>
              {(['Flavor', 'Fragrance', 'Ingredients', 'Diversified'] as const).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {fld('Fiscal year', 'year', 'number', '2024')}
        </div>
        {fld('Market cap ($M)', 'mcap', 'number', 'e.g. 12000')}
        <div className="modal-section">Multiples</div>
        <div className="form-grid-3">
          {fld('EV/Revenue', 'ev_revenue', 'number', '—', { step: 0.1 })}
          {fld('EV/EBITDA', 'ev_ebitda', 'number', '—', { step: 0.1 })}
          {fld('EV/EBIT', 'ev_ebit', 'number', '—', { step: 0.1 })}
          {fld('P/E', 'pe', 'number', '—', { step: 0.1 })}
          {fld('P/S', 'ps', 'number', '—', { step: 0.1 })}
          {fld('EV/NOPAT', 'ev_nopat', 'number', '—', { step: 0.1 })}
          {fld('EBITDA margin %', 'ebitda_margin', 'number', 'e.g. 22.5', { step: 0.1 })}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
