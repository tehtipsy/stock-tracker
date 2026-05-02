import { useState, useCallback } from 'react'

function readStorage(key, def) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : def
  } catch {
    return def
  }
}

function writeStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

export function useStorage(key, defaultValue) {
  const [state, setState] = useState(() => readStorage(key, defaultValue))

  const set = useCallback(valOrFn => {
    setState(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn
      writeStorage(key, next)
      return next
    })
  }, [key])

  return [state, set]
}
