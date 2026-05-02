import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { DataContext } from '../context/DataContext'
import { useStorage } from '../hooks/useStorage'
import { useQuotes } from '../hooks/useQuotes'
import { useDarkMode } from '../hooks/useDarkMode'
import DEFAULTS from '../data/defaults'
import type { Company, FinancialRow } from '../types'

// CSV download helper (pure client, no server dependency)
function dl(rows: (string | number)[][], fname: string): void {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = fname
  a.click()
}

export default function RootLayout() {
  const routerState = useRouterState()
  const isFinancials = routerState.location.pathname === '/financials'

  const [companies, setCompanies] = useStorage<Company[]>('ff_companies', DEFAULTS.companies)
  const [financials, setFinancials] = useStorage<FinancialRow[]>('ff_financials', DEFAULTS.financials)
  const { loading, error, refresh, mergeQuotes } = useQuotes()
  const { theme, toggle } = useDarkMode()
  const iconKey = useRef(0)

  const liveCompanies = useMemo(() => mergeQuotes(companies), [companies, mergeQuotes])

  function resetData() {
    if (!confirm('Reset all data to defaults? This will clear any edits you have made.')) return
    setCompanies(JSON.parse(JSON.stringify(DEFAULTS.companies)) as Company[])
    setFinancials(JSON.parse(JSON.stringify(DEFAULTS.financials)) as FinancialRow[])
  }

  function exportCSV() {
    if (!isFinancials) {
      const rows: (string | number)[][] = [
        ['Ticker', 'Name', 'Segment', 'Mkt Cap ($M)', 'EV/Revenue', 'EV/EBITDA', 'EV/EBIT', 'P/E', 'P/S', 'EV/NOPAT', 'EBITDA%', 'FY'],
        ...liveCompanies.map(c => [c.ticker, c.name, c.segment, c.mcap ?? '', c.ev_revenue ?? '', c.ev_ebitda ?? '', c.ev_ebit ?? '', c.pe ?? '', c.ps ?? '', c.ev_nopat ?? '', c.ebitda_margin ?? '', c.year ?? '']),
      ]
      dl(rows, 'ff_multiples.csv')
    } else {
      const isQ = (document.getElementById('f-period') as HTMLSelectElement | null)?.value === 'quarterly'
      const expRows = financials.filter(f => isQ ? !!f.quarter : !f.quarter)
      const rows: (string | number)[][] = [
        ['Ticker', 'Name', 'Scope', 'Year', 'Quarter', 'Sales($M)', 'Gross Profit', 'GP%', 'EBITDA', 'EBITDA%', 'EBIT', 'EBIT%', 'Net Profit', 'Net%'],
        ...expRows.map(f => {
          const gp = f.gp && f.sales ? (f.gp / f.sales * 100).toFixed(1) : ''
          const eb = f.ebitda && f.sales ? (f.ebitda / f.sales * 100).toFixed(1) : ''
          const ei = f.ebit && f.sales ? (f.ebit / f.sales * 100).toFixed(1) : ''
          const np = f.net && f.sales ? (f.net / f.sales * 100).toFixed(1) : ''
          return [f.ticker, f.name, f.scope, f.year, f.quarter ?? 'Annual', f.sales ?? '', f.gp ?? '', gp, f.ebitda ?? '', eb, f.ebit ?? '', ei, f.net ?? '', np]
        }),
      ]
      dl(rows, 'ff_financials.csv')
    }
  }

  const ctx = { companies, setCompanies, financials, setFinancials, liveCompanies }

  return (
    <DataContext.Provider value={ctx}>
      <header>
        <span className="logo">F&amp;F Tracker</span>
        <span className="logo-sub">sector comps</span>
        <div className="tabs">
          <Link to="/" className={`tab${!isFinancials ? ' active' : ''}`}>Multiples</Link>
          <Link to="/financials" className={`tab${isFinancials ? ' active' : ''}`}>Financials</Link>
        </div>
        <div className="spacer" />
        <div className="header-actions">
          {loading
            ? <span className="live-badge stale">loading…</span>
            : error
              ? <span className="live-badge stale" title={error}>live ✕</span>
              : <span className="live-badge" title="Market data live from Yahoo Finance">● live</span>
          }
          <button onClick={() => { void refresh() }} style={{ fontSize: 11, padding: '0 10px', height: 28 }}>↻</button>
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={resetData} style={{ color: 'var(--text3)' }}>Reset</button>
          <button
            className="theme-toggle"
            onClick={() => { iconKey.current += 1; toggle() }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span key={iconKey.current} className="theme-icon">{theme === 'dark' ? '☀' : '☽'}</span>
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </DataContext.Provider>
  )
}
