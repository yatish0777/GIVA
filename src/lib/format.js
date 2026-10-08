export const APP_NAME = 'GIVA'
export const APP_TAGLINE = 'GST Invoice Management, made simple'

// ₹ with Indian grouping: 118000 -> ₹1,18,000
export function inr(n, { decimals = false } = {}) {
  const v = Number(n || 0)
  return '₹' + v.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
}

// short form for tables: ₹1.18L, ₹85K
export function inrShort(n) {
  const v = Number(n || 0)
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2).replace(/\.?0+$/, '') + 'Cr'
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(2).replace(/\.?0+$/, '') + 'L'
  if (v >= 1e3) return '₹' + Math.round(v / 1e3) + 'K'
  return '₹' + Math.round(v)
}

export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago'
  const days = Math.floor(s / 86400)
  return days === 1 ? 'yesterday' : days + ' days ago'
}

// GST portal check (simulated): compare bill total with what seller reported in GSTR-1
export function gstCheck(inv) {
  if (inv.gst_reported_total === null || inv.gst_reported_total === undefined) return 'missing'
  return Number(inv.gst_reported_total) === Number(inv.total) ? 'match' : 'mismatch'
}

export const STATUS = {
  sent: { label: 'New', tone: 'brand' },
  viewed: { label: 'Needs action', tone: 'brand' },
  accepted: { label: 'Accepted', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  pending: { label: 'Pending', tone: 'warn' },
  disputed: { label: 'Disputed', tone: 'bad' },
  corrected: { label: 'Corrected', tone: 'accent' },
}

export const DISPUTE_TYPES = {
  quantity: 'Quantity mismatch',
  damaged: 'Damaged goods',
  rate: 'Rate mismatch',
  gst: 'GST issue',
  other: 'Other problem',
}

export function creditTotal(inv, creditNotes) {
  return creditNotes.filter(c => c.invoice_id === inv.id).reduce((s, c) => s + Number(c.total), 0)
}

export function friendlyError(e) {
  const msg = e?.message || String(e)
  return msg.replace(/^.*?ERROR:\s*/i, '')
}
