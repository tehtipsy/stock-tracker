import { useState } from 'react'
import { useData } from '../context/DataContext'
import { nid, fmt, fmtPct, median, colorClass, segBadgeClass, num } from '../lib/utils'
import type { Company } from '../types'

type MultiplesField = keyof Pick<Company, 'ticker' | 'mcap' | 'ev_revenue' | 'ev_ebitda' | 'ev_ebit' | 'pe' | 'ps' | 'ev_nopat' | 'ebitda_margin'>

const SORT_OPTIONS: { value: MultiplesField; label: string }[] = [
  { value: 'ev_ebitda', label: 'Sort: EV/EBITDA' },
  { value: 'ev_revenue', label: 'Sort: EV/Revenue' },
  { value: 'ev_ebit', label: 'Sort: EV/EBIT' },
  { value: 'pe', label: 'Sort: P/E' },
  { value: 'ps', label: 'Sort: P/S' },
  { value: 'ev_nopat', label: 'Sort: EV/NOPAT' },
  { value: 'ebitda_margin', label: 'Sort: EBITDA%' },
  { value: 'mcap', label: 'Sort: Mkt Cap' },
]

type CompanyFormData = Omit<Company, 'id'>

// ── Company modal ──────────────────────────────────────────────────────────
interface CompanyModalProps {
  company: Company | null
  onSave: (data: CompanyFormData) => void
  onClose: () => void
}

function CompanyModal({ company, onSave, onClose }: CompanyModalProps) {
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

// ── Multiples panel ────────────────────────────────────────────────────────
export default function MultiplesPanel() {
  const { companies, setCompanies, setFinancials, liveCompanies } = useData()
  const [seg, setSeg] = useState('')
  const [sortField, setSortField] = useState<MultiplesField>('ev_ebitda')
  const [sortDir, setSortDir] = useState(1)
  const [modal, setModal] = useState<{ company: Company | null } | null>(null)

  function handleSort(f: MultiplesField) {
    if (sortField === f) setSortDir(d => d * -1)
    else { setSortField(f); setSortDir(1) }
  }

  function handleSortSelect(f: MultiplesField) {
    if (f !== sortField) { setSortField(f); setSortDir(1) }
  }

  function openAdd() { setModal({ company: null }) }
  function openEdit(id: number) { setModal({ company: companies.find(c => c.id === id) ?? null }) }
  function closeModal() { setModal(null) }

  function saveCompany(data: CompanyFormData) {
    const editing = modal?.company
    if (editing) {
      setCompanies(prev => prev.map(c => c.id === editing.id ? { ...c, ...data } : c))
    } else {
      setCompanies(prev => [...prev, { id: nid(), ...data }])
    }
    closeModal()
  }

  function delCompany(id: number) {
    if (!confirm('Remove company and its financial data?')) return
    setCompanies(prev => prev.filter(c => c.id !== id))
    setFinancials(prev => prev.filter(f => f.cid !== id))
  }

  let rows = liveCompanies.filter(c => !seg || c.segment === seg)
  rows = [...rows].sort((a, b) => {
    const av = a[sortField] as number | null
    const bv = b[sortField] as number | null
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    return sortDir * (av - bv)
  })

  const meds: Record<string, number | null> = {}
  ;(['ev_revenue', 'ev_ebitda', 'ev_ebit', 'pe', 'ps', 'ev_nopat', 'ebitda_margin', 'mcap'] as MultiplesField[]).forEach(f => {
    meds[f] = median(rows.map(r => r[f] as number | null))
  })

  const arr = (f: string) => sortField === f ? (sortDir === 1 ? ' ↑' : ' ↓') : ''

  const mkCell = (val: number | null | undefined, med: number | null, higherBetter = false, renderFn: (v: number | null | undefined) => string = fmt) => {
    const cls = colorClass(val, med, higherBetter)
    return <td className={`mono${cls ? ' ' + cls : ' cell-dim'}`}>{renderFn(val)}</td>
  }

  return (
    <>
      <div className="toolbar">
        <select value={seg} onChange={e => setSeg(e.target.value)}>
          <option value="">All segments</option>
          {(['Flavor', 'Fragrance', 'Ingredients', 'Diversified'] as const).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={sortField} onChange={e => handleSortSelect(e.target.value as MultiplesField)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="spacer" />
        <button className="btn-primary" onClick={openAdd}>+ Add company</button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="left sortable" onClick={() => handleSort('ticker')}>Ticker{arr('ticker')}</th>
              <th className="left">Name</th>
              <th className="left">Segment</th>
              <th className="sortable" onClick={() => handleSort('mcap')}>Mkt cap ($M){arr('mcap')}</th>
              <th className="sortable" onClick={() => handleSort('ev_revenue')}>EV/Rev{arr('ev_revenue')}</th>
              <th className="sortable" onClick={() => handleSort('ev_ebitda')}>EV/EBITDA{arr('ev_ebitda')}</th>
              <th className="sortable" onClick={() => handleSort('ev_ebit')}>EV/EBIT{arr('ev_ebit')}</th>
              <th className="sortable" onClick={() => handleSort('pe')}>P/E{arr('pe')}</th>
              <th className="sortable" onClick={() => handleSort('ps')}>P/S{arr('ps')}</th>
              <th className="sortable" onClick={() => handleSort('ev_nopat')}>EV/NOPAT{arr('ev_nopat')}</th>
              <th className="sortable" onClick={() => handleSort('ebitda_margin')}>EBITDA%{arr('ebitda_margin')}</th>
              <th>FY</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} className="data-row">
                <td className="left ticker-cell">{c.ticker}</td>
                <td className="left cell-dim" style={{ fontSize: 11, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</td>
                <td className="left"><span className={`tag ${segBadgeClass(c.segment)}`}>{c.segment}</span></td>
                <td className="mono cell-dim">{c.mcap ? '$' + parseFloat(String(c.mcap)).toLocaleString() : '—'}</td>
                {mkCell(c.ev_revenue, meds['ev_revenue'])}
                {mkCell(c.ev_ebitda, meds['ev_ebitda'])}
                {mkCell(c.ev_ebit, meds['ev_ebit'])}
                {mkCell(c.pe, meds['pe'])}
                {mkCell(c.ps, meds['ps'])}
                {mkCell(c.ev_nopat, meds['ev_nopat'])}
                {mkCell(c.ebitda_margin, meds['ebitda_margin'], true, fmtPct)}
                <td className="cell-dim" style={{ fontSize: 11, textAlign: 'center' }}>{c.year || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button style={{ fontSize: 11, padding: '2px 8px', height: 26, marginRight: 4 }} onClick={() => openEdit(c.id)}>Edit</button>
                  <button className="btn-danger" style={{ fontSize: 11, padding: '2px 8px', height: 26 }} onClick={() => delCompany(c.id)}>Del</button>
                </td>
              </tr>
            ))}
            <tr className="median-row">
              <td className="left" colSpan={3} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text3)' }}>Median</td>
              <td className="mono">{meds['mcap'] != null ? '$' + parseFloat(String(meds['mcap'])).toLocaleString() : '—'}</td>
              <td className="mono">{meds['ev_revenue'] != null ? meds['ev_revenue'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['ev_ebitda'] != null ? meds['ev_ebitda'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['ev_ebit'] != null ? meds['ev_ebit'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['pe'] != null ? meds['pe'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['ps'] != null ? meds['ps'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['ev_nopat'] != null ? meds['ev_nopat'].toFixed(1) + 'x' : '—'}</td>
              <td className="mono">{meds['ebitda_margin'] != null ? meds['ebitda_margin'].toFixed(1) + '%' : '—'}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="note">
        Color: <span style={{ color: 'var(--red)' }}>red</span> = 15%+ above median &nbsp;|&nbsp;
        <span style={{ color: 'var(--green)' }}>green</span> = 15%+ below median &nbsp;|&nbsp;
        Market data live from Yahoo Finance
      </p>

      {modal && (
        <CompanyModal
          company={modal.company}
          onSave={saveCompany}
          onClose={closeModal}
        />
      )}
    </>
  )
}
