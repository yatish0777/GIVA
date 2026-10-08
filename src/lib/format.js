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

// Net payable after credit (−) and debit (+) notes
export function netPayable(inv, notes) {
  const mine = notes.filter(n => n.invoice_id === inv.id)
  const credit = mine.filter(n => (n.kind ?? 'credit') === 'credit').reduce((s, n) => s + Number(n.total), 0)
  const debit = mine.filter(n => n.kind === 'debit').reduce((s, n) => s + Number(n.total), 0)
  return Number(inv.total) - credit + debit
}

// Same state (first 2 digits of GSTIN) → CGST + SGST, else IGST
export function taxSplit(sellerGstin, buyerGstin, gst) {
  const g = Number(gst || 0)
  if (sellerGstin?.slice(0, 2) === buyerGstin?.slice(0, 2)) return { cgst: g / 2, sgst: g / 2, igst: 0 }
  return { cgst: 0, sgst: 0, igst: g }
}

export const STATE_CODES = { '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka', '07': 'Delhi' }

export function downloadFile(name, content, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCsv(rows) {
  return rows.map(r => r.map(v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
}

export const STATE_NAMES = {
  '01': 'Jammu & Kashmir', '03': 'Punjab', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '19': 'West Bengal', '23': 'Madhya Pradesh', '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '32': 'Kerala', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh',
}
export function stateOf(gstin) {
  const c = gstin?.slice(0, 2)
  return c ? `${STATE_NAMES[c] ?? 'State'} (${c})` : '—'
}

// Indian-system amount in words: 106200 -> "Rupees One Lakh Six Thousand Two Hundred Only"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
  'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '') }
function three(n) { return (n >= 100 ? ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '') }
export function amountInWords(amount) {
  const v = Math.round(Number(amount || 0) * 100)
  let r = Math.floor(v / 100); const p = v % 100
  if (r === 0 && p === 0) return 'Rupees Zero Only'
  const parts = []
  const crore = Math.floor(r / 1e7); r %= 1e7
  const lakh = Math.floor(r / 1e5); r %= 1e5
  const thousand = Math.floor(r / 1e3); r %= 1e3
  if (crore) parts.push(three(crore) + ' Crore')
  if (lakh) parts.push(two(lakh) + ' Lakh')
  if (thousand) parts.push(two(thousand) + ' Thousand')
  if (r) parts.push(three(r))
  return 'Rupees ' + (parts.join(' ') || 'Zero') + (p ? ' and ' + two(p) + ' Paise' : '') + ' Only'
}

// Deterministic fake 64-char IRN + ack no (real IRN comes from the IRP; simulated here)
function h32(str, seed) {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 2654435761); h = (h << 13) | (h >>> 19) }
  return (h >>> 0).toString(16).padStart(8, '0')
}
export function fakeIrn(inv, sellerGstin) {
  const s = `${sellerGstin}|${inv.invoice_no}|${inv.invoice_date}|${inv.id}`
  return Array.from({ length: 8 }, (_, i) => h32(s, 0x9e3779b1 + i * 7919)).join('')
}
export function fakeAck(inv) {
  return '1' + String(parseInt(h32(inv.id, 42), 16)).padStart(11, '0').slice(0, 11) + String(inv.invoice_no).replace(/\D/g, '').slice(-3)
}

export function daysBetween(a, b = new Date()) {
  const d = (x) => { const t = new Date(x); return Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) }
  return Math.round((d(a) - d(b)) / 86400000)
}

// last N months as 'YYYY-MM', oldest first
export function lastMonths(n = 6) {
  const out = []; const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
