import { useState } from 'react'
import { useData } from '../context/DataContext'
import { nid, fmtM, marg, segTagClass, num } from '../lib/utils'
import type { Company, FinancialRow } from '../types'

type FinFormData = Omit<FinancialRow, 'id'>

// ── Financial row modal ────────────────────────────────────────────────────
interface FinModalProps {
  record: FinancialRow | null
  companies: Company[]
  onSave: (data: FinFormData) => void
  onClose: () => void
}

function FinModal({ record, companies, onSave, onClose }: FinModalProps) {
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

// ── Financials panel ───────────────────────────────────────────────────────
const Q_ORD: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4, H1: 1, H2: 2 }

export default function FinancialsPanel() {
  const { companies, financials, setFinancials } = useData()

  const [filterCo, setFilterCo] = useState('')
  const [filterYr, setFilterYr] = useState('')
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual')
  const [filterQtr, setFilterQtr] = useState('')
  const [view, setView] = useState<'segments' | 'consolidated'>('segments')
  const [modal, setModal] = useState<{ record: FinancialRow | null } | null>(null)

  const isQ = period === 'quarterly'
  const years = [...new Set(financials.map(f => f.year))].sort((a, b) => b - a)

  function openAdd() { setModal({ record: null }) }
  function openEdit(id: number) { setModal({ record: financials.find(f => f.id === id) ?? null }) }
  function closeModal() { setModal(null) }

  function saveFin(data: FinFormData) {
    const editing = modal?.record
    if (editing) {
      setFinancials(prev => prev.map(f => f.id === editing.id ? { ...f, ...data } : f))
    } else {
      setFinancials(prev => [...prev, { id: nid(), ...data }])
    }
    closeModal()
  }

  function delFin(id: number) {
    if (!confirm('Remove this row?')) return
    setFinancials(prev => prev.filter(f => f.id !== id))
  }

  let rows = financials.filter(f => {
    if (filterCo && f.ticker !== filterCo) return false
    if (filterYr && f.year !== Number(filterYr)) return false
    if (view === 'consolidated' && f.scope !== 'Consolidated') return false
    if (isQ && !f.quarter) return false
    if (!isQ && f.quarter) return false
    if (isQ && filterQtr && f.quarter !== filterQtr) return false
    return true
  })

  rows = [...rows].sort((a, b) => {
    if (a.ticker !== b.ticker) return a.ticker.localeCompare(b.ticker)
    if (a.year !== b.year) return b.year - a.year
    if (a.quarter && b.quarter) {
      const qa = Q_ORD[a.quarter] ?? 0, qb = Q_ORD[b.quarter] ?? 0
      if (qa !== qb) return qb - qa
    }
    if (a.scope === 'Consolidated') return -1
    if (b.scope === 'Consolidated') return 1
    return a.scope.localeCompare(b.scope)
  })

  const margCell = (n: number | null | undefined, d: number | null | undefined) => {
    const v = marg(n, d)
    return <td className="mono cell-dim" style={{ fontSize: 11 }}>{v != null ? v.toFixed(1) + '%' : '—'}</td>
  }

  let lastTicker = ''

  return (
    <>
      <div className="toolbar">
        <select id="f-co" value={filterCo} onChange={e => setFilterCo(e.target.value)}>
          <option value="">All companies</option>
          {companies.map(c => <option key={c.id} value={c.ticker}>{c.ticker} – {c.name}</option>)}
        </select>
        <select value={filterYr} onChange={e => setFilterYr(e.target.value)}>
          <option value="">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select id="f-period" value={period} onChange={e => setPeriod(e.target.value as 'annual' | 'quarterly')}>
          <option value="annual">Annual</option>
          <option value="quarterly">Quarterly</option>
        </select>
        {isQ && (
          <select value={filterQtr} onChange={e => setFilterQtr(e.target.value)} style={{ minWidth: 70 }}>
            <option value="">All Qs</option>
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
          </select>
        )}
        <select value={view} onChange={e => setView(e.target.value as 'segments' | 'consolidated')}>
          <option value="segments">Show segments</option>
          <option value="consolidated">Consolidated only</option>
        </select>
        <div className="spacer" />
        <button className="btn-primary" onClick={openAdd}>+ Add financials</button>
      </div>

      <p className="note" style={{ marginBottom: 10 }}>
        All figures in $M. Margins auto-calculated as % of sales.{' '}
        <span style={{ color: 'var(--amber)' }}>Q</span> = quarterly data,{' '}
        <span style={{ color: 'var(--text2)' }}>FY</span> = full year.
      </p>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="left">Ticker</th>
              <th className="left">Name</th>
              <th className="left">Scope</th>
              <th style={{ textAlign: 'center' }}>Period</th>
              <th>Sales ($M)</th>
              <th>Gross profit</th>
              <th>GP%</th>
              <th>EBITDA</th>
              <th>EBITDA%</th>
              <th>EBIT</th>
              <th>EBIT%</th>
              <th>Net profit</th>
              <th>Net%</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                  {isQ ? 'No quarterly data — click "+ Add financials" and select a quarter' : 'No annual data — click "+ Add financials" to get started'}
                </td>
              </tr>
            ) : rows.map(r => {
              const isConsolidated = r.scope === 'Consolidated'
              const sc = segTagClass(r.scope)
              const borderTop = r.ticker !== lastTicker
              lastTicker = r.ticker
              const borderStyle = borderTop ? '2px solid var(--border2)' : undefined
              const periodLabel = r.quarter
                ? <><span style={{ color: 'var(--amber)', fontWeight: 600 }}>{r.quarter}</span> {r.year}</>
                : `FY${r.year}`
              const valCell = (v: number | null | undefined) => (
                <td className={`mono${isConsolidated ? '' : ' cell-dim'}`}>{fmtM(v)}</td>
              )
              return (
                <tr key={r.id} className={`data-row${isConsolidated ? '' : ' sub-row'}`}>
                  <td className={`left ${isConsolidated ? 'ticker-cell' : 'sub-ticker'}`}
                    style={{ paddingLeft: isConsolidated ? undefined : 20, borderTop: borderStyle }}>{r.ticker}</td>
                  <td className="left cell-dim" style={{ fontSize: 11, borderTop: borderStyle }}>{r.name}</td>
                  <td className="left" style={{ borderTop: borderStyle }}><span className={`tag ${sc}`}>{r.scope}</span></td>
                  <td className="cell-dim" style={{ fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap', borderTop: borderStyle }}>{periodLabel}</td>
                  {valCell(r.sales)}
                  {valCell(r.gp)}
                  {margCell(r.gp, r.sales)}
                  {valCell(r.ebitda)}
                  {margCell(r.ebitda, r.sales)}
                  {valCell(r.ebit)}
                  {margCell(r.ebit, r.sales)}
                  {valCell(r.net)}
                  {margCell(r.net, r.sales)}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button style={{ fontSize: 11, padding: '2px 7px', height: 26, marginRight: 4 }} onClick={() => openEdit(r.id)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: 11, padding: '2px 7px', height: 26 }} onClick={() => delFin(r.id)}>Del</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <FinModal
          record={modal.record}
          companies={companies}
          onSave={saveFin}
          onClose={closeModal}
        />
      )}
    </>
  )
}
