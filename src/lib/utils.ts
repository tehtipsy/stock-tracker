import type { Company } from '../types'

export const nid = (): number => Date.now() + Math.floor(Math.random() * 999)

export function dl(rows: (string | number)[][], fname: string): void {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = fname
  a.click()
}

export const fmt = (v: number | null | undefined, d = 1): string =>
  v == null || v < 0 ? '—' : parseFloat(String(v)).toFixed(d) + 'x'

export const fmtPct = (v: number | null | undefined): string =>
  v == null ? '—' : parseFloat(String(v)).toFixed(1) + '%'

export const fmtM = (v: number | null | undefined): string =>
  v == null ? '—' : '$' + parseFloat(String(v)).toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'M'

export const marg = (n: number | null | undefined, d: number | null | undefined): number | null =>
  n == null || d == null || d === 0 ? null : (n / d * 100)

export const num = (v: string | number | null | undefined): number | null =>
  v === '' || v == null ? null : (parseFloat(String(v)) || null)

export function median(arr: (number | null | undefined)[]): number | null {
  const a = arr.filter((x): x is number => x != null && !isNaN(x as number)).map(Number).sort((a, b) => a - b)
  if (!a.length) return null
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

export function colorClass(val: number | null | undefined, med: number | null, higherBetter = false): string {
  if (val == null || med == null) return ''
  const d = (val - med) / med
  if (!higherBetter) { if (d > 0.15) return 'cell-high'; if (d < -0.15) return 'cell-low' }
  else { if (d > 0.15) return 'cell-low'; if (d < -0.15) return 'cell-high' }
  return ''
}

export function segTagClass(s: string | undefined): string {
  if (!s) return 'tag-gray'
  const sl = s.toLowerCase()
  if (sl.includes('flavor') || sl.includes('taste') || sl.includes('nourish')) return 'tag-blue'
  if (sl.includes('fragrance') || sl.includes('scent') || sl.includes('perf')) return 'tag-purple'
  if (sl.includes('ingred') || sl.includes('actives')) return 'tag-green'
  if (sl === 'consolidated') return 'tag-gray'
  return 'tag-amber'
}

export function segBadgeClass(seg: Company['segment'] | undefined): string {
  const m: Record<string, string> = {
    Flavor: 'tag-flavor',
    Fragrance: 'tag-fragrance',
    Ingredients: 'tag-ingredients',
    Diversified: 'tag-diversified',
  }
  return (seg && m[seg]) || 'tag-gray'
}
