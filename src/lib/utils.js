export const nid = () => Date.now() + Math.floor(Math.random() * 999)

export const fmt = (v, d = 1) => v == null ? '—' : parseFloat(v).toFixed(d) + 'x'
export const fmtPct = v => v == null ? '—' : parseFloat(v).toFixed(1) + '%'
export const fmtM = v => v == null ? '—' : '$' + parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'M'
export const marg = (n, d) => (n == null || d == null || d === 0) ? null : (n / d * 100)
export const num = v => (v === '' || v == null) ? null : (parseFloat(v) || null)

export function median(arr) {
  const a = arr.filter(x => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b)
  if (!a.length) return null
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

export function colorClass(val, med, higherBetter = false) {
  if (val == null || med == null) return ''
  const d = (val - med) / med
  if (!higherBetter) { if (d > 0.15) return 'cell-high'; if (d < -0.15) return 'cell-low' }
  else { if (d > 0.15) return 'cell-low'; if (d < -0.15) return 'cell-high' }
  return ''
}

export function segTagClass(s) {
  if (!s) return 'tag-gray'
  const sl = s.toLowerCase()
  if (sl.includes('flavor') || sl.includes('taste') || sl.includes('nourish')) return 'tag-blue'
  if (sl.includes('fragrance') || sl.includes('scent') || sl.includes('perf')) return 'tag-purple'
  if (sl.includes('ingred') || sl.includes('actives')) return 'tag-green'
  if (sl === 'consolidated') return 'tag-gray'
  return 'tag-amber'
}

export function segBadgeClass(seg) {
  const m = { Flavor: 'tag-flavor', Fragrance: 'tag-fragrance', Ingredients: 'tag-ingredients', Diversified: 'tag-diversified' }
  return m[seg] || 'tag-gray'
}
