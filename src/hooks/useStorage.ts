import { useState, useCallback } from 'react'

function readStorage<T>(key: string, def: T): T {
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : def
  } catch {
    return def
  }
}

function writeStorage<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

type Setter<T> = (val: T | ((prev: T) => T)) => void

export function useStorage<T>(key: string, defaultValue: T): [T, Setter<T>] {
  const [state, setState] = useState<T>(() => readStorage(key, defaultValue))

  const set: Setter<T> = useCallback(valOrFn => {
    setState(prev => {
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: T) => T)(prev) : valOrFn
      writeStorage(key, next)
      return next
    })
  }, [key])

  return [state, set]
}
