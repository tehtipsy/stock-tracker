import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useMemo, useEffect, useState, useRef } from 'react'
import { DataContext } from '../../context/DataContext'
import { useStorage } from '../../hooks/useStorage'
import { useQuotes } from '../../hooks/useQuotes'
import { useDarkMode } from '../../hooks/useDarkMode'
import { dl } from '../../lib/utils'
import DEFAULTS from '../../data/defaults'
import type { Company, FinancialRow, CompaniesResponse, SessionResponse } from '../../types'

const DEFAULT_COMPANY_IDS = new Set(DEFAULTS.companies.map(c => c.id))

export default function RootLayout() {
  const routerState = useRouterState()
  const isFinancials = routerState.location.pathname === '/financials'

  const [companies, setCompanies] = useStorage<Company[]>('ff_companies', DEFAULTS.companies)
  const [financials, setFinancials] = useStorage<FinancialRow[]>('ff_financials', DEFAULTS.financials)
  const { loading, error, refresh, mergeQuotes } = useQuotes()
  const { theme, toggle } = useDarkMode()
  const [usernameInput, setUsernameInput] = useState('')
  const [authUser, setAuthUser] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loadedUserCompanies, setLoadedUserCompanies] = useState(false)
  const lastSyncedCompanies = useRef<string>('')

  const liveCompanies = useMemo(() => mergeQuotes(companies), [companies, mergeQuotes])

  useEffect(() => {
    let cancelled = false
    async function initSession() {
      setAuthLoading(true)
      setAuthError(null)
      try {
        const res = await fetch('/api/session')
        const data = await res.json() as SessionResponse
        if (!res.ok) throw new Error(`API ${res.status}`)
        if (cancelled) return
        setAuthUser(data.authenticated ? data.username : null)
      } catch (err) {
        if (!cancelled) setAuthError((err as Error).message)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }
    void initSession()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!authUser) {
      setLoadedUserCompanies(true)
      lastSyncedCompanies.current = ''
      return
    }
    let cancelled = false
    async function loadUserCompanies() {
      setLoadedUserCompanies(false)
      try {
        const res = await fetch('/api/companies')
        const data = await res.json() as CompaniesResponse & { error?: string }
        if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
        if (cancelled) return
        setCompanies(prev => {
          const defaults = prev.filter(c => DEFAULT_COMPANY_IDS.has(c.id))
          const byTicker = new Set(defaults.map(c => c.ticker))
          const additions = data.companies.filter(c => !byTicker.has(c.ticker))
          return [...defaults, ...additions]
        })
      } catch (err) {
        if (!cancelled) setAuthError((err as Error).message)
      } finally {
        if (!cancelled) setLoadedUserCompanies(true)
      }
    }
    void loadUserCompanies()
    return () => { cancelled = true }
  }, [authUser, setCompanies])

  useEffect(() => {
    if (!authUser || !loadedUserCompanies) return
    const userAdded = companies.filter(c => !DEFAULT_COMPANY_IDS.has(c.id))
    const payload = JSON.stringify(userAdded)
    if (payload === lastSyncedCompanies.current) return
    const timeout = setTimeout(() => {
      void fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: userAdded }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`API ${res.status}`)
          lastSyncedCompanies.current = payload
        })
        .catch(err => setAuthError((err as Error).message))
    }, 300)
    return () => clearTimeout(timeout)
  }, [authUser, loadedUserCompanies, companies])

  async function login() {
    const username = usernameInput.trim()
    if (!username) {
      setAuthError('username is required')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json() as SessionResponse & { error?: string }
      if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
      setAuthUser(data.username)
      setUsernameInput('')
    } catch (err) {
      setAuthError((err as Error).message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function logout() {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await fetch('/api/logout', { method: 'POST' })
      setAuthUser(null)
      setCompanies(structuredClone(DEFAULTS.companies))
    } catch (err) {
      setAuthError((err as Error).message)
    } finally {
      setAuthLoading(false)
    }
  }

  function resetData() {
    if (!confirm('Reset all data to defaults? This will clear any edits you have made.')) return
    setCompanies(structuredClone(DEFAULTS.companies))
    setFinancials(structuredClone(DEFAULTS.financials))
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
        ['Ticker', 'Name', 'Scope', 'Year', 'Quarter', 'Sales(M)', 'Gross Profit', 'GP%', 'EBITDA', 'EBITDA%', 'EBIT', 'EBIT%', 'Net Profit', 'Net%'],
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
          {authUser
            ? (
                <>
                  <span className="user-badge">user: {authUser}</span>
                  <button onClick={() => { void logout() }} disabled={authLoading}>Logout</button>
                </>
              )
            : (
                <div className="login-menu">
                  <input
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="username"
                    disabled={authLoading}
                    onKeyDown={e => e.key === 'Enter' && void login()}
                  />
                  <button className="btn-primary" onClick={() => { void login() }} disabled={authLoading}>Login</button>
                </div>
              )}
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
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span key={theme} className="theme-icon">{theme === 'dark' ? '☀' : '☽'}</span>
          </button>
        </div>
      </header>
      <main>
        {authError && <p className="note" style={{ marginBottom: 10, color: 'var(--red)' }}>{authError}</p>}
        {authUser
          ? <Outlet />
          : <p className="note">Log in from the header to save and sync your added companies.</p>}
      </main>
    </DataContext.Provider>
  )
}
