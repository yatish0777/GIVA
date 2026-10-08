import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Send, Loader2, Download, Package, FileText } from 'lucide-react'
import { useData } from '../lib/data'
import { api } from '../lib/api'
import { Chip, Empty, GstChip, StatusChip } from '../components/ui'
import { downloadFile, fmtDate, friendlyError, gstCheck, inr, inrShort, netPayable, taxSplit, timeAgo, toCsv } from '../lib/format'

/* ---------------- INVOICE LIST ---------------- */
const FILTERS = {
  all: { label: 'All', fn: () => true },
  action: { label: 'Needs action', fn: i => ['sent', 'viewed', 'corrected'].includes(i.status) },
  disputed: { label: 'Disputed', fn: i => i.status === 'disputed' },
  pending: { label: 'Pending', fn: i => i.status === 'pending' },
  accepted: { label: 'Accepted', fn: i => i.status === 'accepted' },
  rejected: { label: 'Rejected', fn: i => i.status === 'rejected' },
  gst: { label: 'GST issue', fn: i => gstCheck(i) !== 'match' },
}

export function InvoiceList({ role, business, onOpen }) {
  const d = useData()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const mine = d.invoices.filter(i => role === 'buyer' ? i.buyer_id === business.id : i.seller_id === business.id)
  const rows = mine.filter(FILTERS[filter].fn).filter(i => {
    if (!q) return true
    const other = d.businesses.find(b => b.id === (role === 'buyer' ? i.seller_id : i.buyer_id))
    return (i.invoice_no + ' ' + other?.name).toLowerCase().includes(q.toLowerCase())
  })
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {Object.entries(FILTERS).map(([k, f]) => {
            const n = mine.filter(f.fn).length
            return (
              <button key={k} onClick={() => setFilter(k)} className={`flex-none rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${filter === k ? 'bg-ink text-white' : 'bg-canvas text-muted hover:text-ink'}`}>
                {f.label} {n > 0 && <span className="opacity-70">{n}</span>}
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-52"><Search size={14} className="absolute left-3 top-3 text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search invoice / party" className="input !py-2 !pl-8" /></div>
      </div>
      {rows.length === 0 ? <div className="p-10 text-center text-sm text-muted">No invoices here.</div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-canvas text-left text-xs text-muted">
              <tr>{['Invoice', role === 'buyer' ? 'Supplier' : 'Buyer', 'Date', 'Amount', 'GST check', 'Status', 'Payment'].map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(i => {
                const other = d.businesses.find(b => b.id === (role === 'buyer' ? i.seller_id : i.buyer_id))
                const openD = d.disputes.some(x => x.invoice_id === i.id && x.status === 'open')
                return (
                  <motion.tr key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => onOpen(i.id)}
                    className={`cursor-pointer border-t border-line hover:bg-canvas ${role === 'seller' && openD ? 'bg-accent-soft/60' : ''}`}>
                    <td className="px-4 py-3 font-bold">{i.invoice_no}{i.status === 'sent' && role === 'buyer' && <span className="ml-1.5 rounded bg-accent px-1 text-[10px] text-white">NEW</span>}</td>
                    <td className="px-4 py-3">{other?.name}</td>
                    <td className="px-4 py-3 text-muted">{fmtDate(i.invoice_date)}</td>
                    <td className="px-4 py-3 font-semibold">{inrShort(i.total)}</td>
                    <td className="px-4 py-3"><GstChip invoice={i} /></td>
                    <td className="px-4 py-3"><StatusChip status={i.status} /></td>
                    <td className="px-4 py-3">{i.payment_status === 'paid' ? <Chip tone="ok">Paid</Chip> : <span className="text-xs text-muted">Unpaid</span>}</td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------------- BILL REQUESTS ---------------- */
export function Requests({ role, business, onCreateFromRequest }) {
  const d = useData()
  const [busy, setBusy] = useState(false)
  const sellers = d.businesses.filter(b => b.kind !== 'buyer' && b.id !== business.id)
  const [sellerId, setSellerId] = useState(sellers[0]?.id ?? '')
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const list = d.requests.filter(r => role === 'buyer' ? r.buyer_id === business.id : r.seller_id === business.id)

  async function send(e) {
    e.preventDefault(); setBusy(true)
    try { await api.requestInvoice({ buyerId: business.id, sellerId: sellerId || sellers[0]?.id, reference, amount: amount ? Number(amount) : null, note }); toast.success('Bill request sent 📩'); setReference(''); setAmount(''); setNote(''); d.refresh() }
    catch (err) { toast.error(friendlyError(err)) } finally { setBusy(false) }
  }
  async function decline(r) {
    try { await api.declineRequest(r.id, 'Already billed earlier'); toast('Request declined'); d.refresh() } catch (err) { toast.error(friendlyError(err)) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      {role === 'buyer' ? (
        <form onSubmit={send} className="card space-y-3 p-5">
          <div className="font-bold">📩 Maal aaya, bill nahi aaya?</div>
          <p className="text-sm text-muted">Request the invoice from the seller. They get an instant alert and can raise the bill in one tap.</p>
          <div><label className="label">Seller</label><select value={sellerId} onChange={e => setSellerId(e.target.value)} className="input">{sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">PO / challan / e-way bill no.</label><input value={reference} onChange={e => setReference(e.target.value)} className="input" required minLength={2} maxLength={80} /></div>
            <div><label className="label">Approx. amount ₹</label><input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="input" /></div>
          </div>
          <div><label className="label">Message</label><input value={note} onChange={e => setNote(e.target.value)} className="input" maxLength={300} placeholder="Maal aa gaya, please bill upload karo" /></div>
          <button disabled={busy} className="btn-accent w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Send request</button>
        </form>
      ) : (
        <div className="card p-5 text-sm">
          <div className="font-bold">📩 Bill requests from buyers</div>
          <p className="mt-1 text-muted">When a buyer received goods but no invoice, their request lands here. "Create bill" opens a pre-filled invoice linked to the request.</p>
        </div>
      )}
      <div className="card divide-y divide-line">
        {list.length === 0 && <div className="p-8 text-center text-sm text-muted">No requests yet.</div>}
        {list.map(r => {
          const other = d.businesses.find(b => b.id === (role === 'buyer' ? r.seller_id : r.buyer_id))
          const inv = d.invoices.find(i => i.id === r.invoice_id)
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm">
                <div className="font-semibold">{r.reference} <span className="font-normal text-muted">· {role === 'buyer' ? 'to' : 'from'} {other?.name}</span></div>
                <div className="text-xs text-muted">{r.approx_amount ? `~${inr(r.approx_amount)} · ` : ''}{timeAgo(r.created_at)}{r.note ? ` · "${r.note}"` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'open' && role === 'seller' ? <>
                  <button onClick={() => decline(r)} className="btn-ghost !py-1.5">Decline</button>
                  <button onClick={() => onCreateFromRequest(r)} className="btn-primary !py-1.5">Create bill</button>
                </> : <Chip tone={r.status === 'open' ? 'warn' : r.status === 'fulfilled' ? 'ok' : 'muted'}>{r.status === 'open' ? 'Waiting' : r.status === 'fulfilled' ? `Billed · ${inv?.invoice_no ?? ''}` : 'Declined'}</Chip>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- CREDIT / DEBIT NOTES ---------------- */
export function Notes({ role, business, onOpen }) {
  const d = useData()
  const myInv = new Map(d.invoices.filter(i => role === 'buyer' ? i.buyer_id === business.id : i.seller_id === business.id).map(i => [i.id, i]))
  const notes = d.creditNotes.filter(n => myInv.has(n.invoice_id))
  if (!notes.length) return <Empty icon="🧾" title="No credit / debit notes yet" text={role === 'seller' ? 'Open an invoice → "Issue credit / debit note", or approve a buyer\'s correction request.' : 'Notes appear here when a seller approves your correction or issues a note.'} />
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-canvas text-left text-xs text-muted"><tr>{['Note', 'Type', 'Against', 'Reason', 'Date', 'Amount'].map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {notes.map(n => {
            const inv = myInv.get(n.invoice_id)
            return (
              <tr key={n.id} className="cursor-pointer border-t border-line hover:bg-canvas" onClick={() => onOpen(inv.id)}>
                <td className="px-4 py-3 font-bold">{n.cn_no}</td>
                <td className="px-4 py-3"><Chip tone={n.kind === 'debit' ? 'brand' : 'ok'}>{n.kind === 'debit' ? 'Debit' : 'Credit'}</Chip></td>
                <td className="px-4 py-3">{inv.invoice_no}</td>
                <td className="px-4 py-3">{n.reason}</td>
                <td className="px-4 py-3 text-muted">{fmtDate(n.created_at)}</td>
                <td className={`px-4 py-3 text-right font-bold ${n.kind === 'debit' ? 'text-brand' : 'text-ok'}`}>{n.kind === 'debit' ? '+' : '−'}{inr(n.total)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- INVENTORY ---------------- */
export function Inventory({ role, business }) {
  const d = useData()
  const moves = d.stock.filter(m => m.business_id === business.id)
  const byItem = useMemo(() => {
    const m = new Map()
    for (const x of moves) {
      const k = x.description
      const r = m.get(k) || { description: k, hsn: x.hsn, unit: x.unit, inQty: 0, outQty: 0 }
      if (Number(x.qty) >= 0) r.inQty += Number(x.qty); else r.outQty += -Number(x.qty)
      m.set(k, r)
    }
    return [...m.values()].sort((a, b) => a.description.localeCompare(b.description))
  }, [moves])
  if (!moves.length) return <Empty icon="📦" title="No stock movements yet" text={role === 'buyer' ? 'Stock is added automatically when you accept an invoice (short / damaged qty is excluded).' : 'Stock goes out automatically when you raise an invoice.'} />
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="card overflow-x-auto">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 font-bold"><Package size={18} />Stock summary</div>
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-canvas text-left text-xs text-muted"><tr>{['Item', 'HSN', 'In', 'Out', 'In hand'].map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {byItem.map(r => {
              const bal = r.inQty - r.outQty
              return (
                <tr key={r.description} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{r.description}</td><td className="px-4 py-3 text-muted">{r.hsn}</td>
                  <td className="px-4 py-3 text-ok">+{r.inQty}</td><td className="px-4 py-3 text-bad">−{r.outQty}</td>
                  <td className={`px-4 py-3 font-bold ${bal < 0 ? 'text-bad' : ''}`}>{bal} {r.unit}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="border-b border-line px-4 py-3 font-bold">Recent movements</div>
        <div className="max-h-[420px] divide-y divide-line overflow-y-auto">
          {moves.slice(0, 30).map(m => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0"><div className="truncate font-medium">{m.description}</div><div className="text-xs text-muted">{m.reason} · {timeAgo(m.created_at)}</div></div>
              <div className={`flex-none font-bold ${Number(m.qty) >= 0 ? 'text-ok' : 'text-bad'}`}>{Number(m.qty) >= 0 ? '+' : ''}{Number(m.qty)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- RETURNS ---------------- */
function monthKey(d) { return new Date(d).toISOString().slice(0, 7) }

export function Returns({ role, business }) {
  const d = useData()
  const months = useMemo(() => {
    const s = new Set(d.invoices.map(i => monthKey(i.invoice_date)))
    s.add(monthKey(new Date()))
    return [...s].sort().reverse()
  }, [d.invoices])
  const [month, setMonth] = useState(months[0])
  const inMonth = x => monthKey(x) === month
  const party = id => d.businesses.find(b => b.id === id)

  if (role === 'seller') {
    const invs = d.invoices.filter(i => i.seller_id === business.id && inMonth(i.invoice_date) && i.gst_reported_total != null)
    const notInGst = d.invoices.filter(i => i.seller_id === business.id && inMonth(i.invoice_date) && i.gst_reported_total == null)
    const notes = d.creditNotes.filter(n => inMonth(n.created_at) && d.invoices.some(i => i.id === n.invoice_id && i.seller_id === business.id))
    const rows = invs.map(i => { const b = party(i.buyer_id); const t = taxSplit(business.gstin, b?.gstin, i.gst_amount); return { i, b, t } })
    const tot = rows.reduce((a, { i, t }) => ({ taxable: a.taxable + Number(i.taxable_value), cgst: a.cgst + t.cgst, sgst: a.sgst + t.sgst, igst: a.igst + t.igst }), { taxable: 0, cgst: 0, sgst: 0, igst: 0 })
    const noteTax = notes.reduce((a, n) => a + (n.kind === 'debit' ? 1 : -1) * Number(n.gst_amount), 0)
    const json = {
      gstin: business.gstin, fp: month.split('-').reverse().join(''),
      b2b: rows.map(({ i, b, t }) => ({ ctin: b?.gstin, inum: i.invoice_no, idt: i.invoice_date, val: Number(i.total), txval: Number(i.taxable_value), rt: Number(i.gst_rate), camt: t.cgst, samt: t.sgst, iamt: t.igst })),
      cdnr: notes.map(n => { const i = d.invoices.find(x => x.id === n.invoice_id); return { ctin: party(i.buyer_id)?.gstin, nt_num: n.cn_no, ntty: n.kind === 'debit' ? 'D' : 'C', inum: i.invoice_no, val: Number(n.total), txval: Number(n.taxable_value) } }),
    }
    return (
      <ReturnShell title="GSTR-1 · Outward supplies" month={month} months={months} setMonth={setMonth}
        onJson={() => downloadFile(`GSTR1_${business.gstin}_${month}.json`, JSON.stringify(json, null, 2))}
        onCsv={() => downloadFile(`GSTR1_${business.gstin}_${month}.csv`, toCsv([['Buyer GSTIN', 'Buyer', 'Invoice', 'Date', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'], ...rows.map(({ i, b, t }) => [b?.gstin, b?.name, i.invoice_no, i.invoice_date, i.taxable_value, t.cgst, t.sgst, t.igst, i.total])]), 'text/csv')}
        stats={[['B2B invoices', rows.length], ['Taxable value', inr(tot.taxable)], ['Output GST', inr(tot.cgst + tot.sgst + tot.igst + noteTax)], ['Credit/Debit notes', notes.length]]}>
        <ReturnTable head={['Buyer', 'Invoice', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total']}
          rows={rows.map(({ i, b, t }) => [b?.name, i.invoice_no, inr(i.taxable_value), inr(t.cgst), inr(t.sgst), inr(t.igst), inr(i.total)])} />
        {notInGst.length > 0 && <div className="mt-3 rounded-xl bg-warn-soft px-4 py-3 text-sm">⚠️ {notInGst.length} invoice(s) this month are not uploaded on GST yet ({notInGst.map(i => i.invoice_no).join(', ')}) — your buyers can't claim credit on them.</div>}
      </ReturnShell>
    )
  }

  // BUYER: ITC as per GSTR-2B (built from IMS actions) + 3B draft
  const invs = d.invoices.filter(i => i.buyer_id === business.id && inMonth(i.invoice_date))
  const bucket = s => invs.filter(i => i.gst_reported_total != null && s(i))
  const accepted = bucket(i => i.status === 'accepted')
  const pending = bucket(i => ['pending', 'disputed', 'viewed', 'sent', 'corrected'].includes(i.status))
  const rejected = bucket(i => i.status === 'rejected')
  const missing = invs.filter(i => i.gst_reported_total == null)
  const itcOf = list => list.reduce((s, i) => s + Number(i.gst_amount), 0)
  const cnGst = d.creditNotes.filter(n => accepted.some(i => i.id === n.invoice_id)).reduce((s, n) => s + (n.kind === 'debit' ? 1 : -1) * Number(n.gst_amount), 0)
  const itc = itcOf(accepted) + cnGst
  const json = { gstin: business.gstin, fp: month.split('-').reverse().join(''), itc_available: itc, itc_deferred: itcOf(pending), itc_rejected: itcOf(rejected),
    docs: invs.map(i => ({ ctin: party(i.seller_id)?.gstin, inum: i.invoice_no, val: Number(i.total), igst_cgst_sgst: Number(i.gst_amount), ims_action: i.status, on_gst: i.gst_reported_total != null })) }
  return (
    <ReturnShell title="GSTR-2B / 3B · Input tax credit" month={month} months={months} setMonth={setMonth}
      onJson={() => downloadFile(`GSTR2B_${business.gstin}_${month}.json`, JSON.stringify(json, null, 2))}
      onCsv={() => downloadFile(`ITC_${business.gstin}_${month}.csv`, toCsv([['Seller GSTIN', 'Seller', 'Invoice', 'Total', 'GST', 'IMS action', 'On GST portal', 'Net payable'], ...invs.map(i => [party(i.seller_id)?.gstin, party(i.seller_id)?.name, i.invoice_no, i.total, i.gst_amount, i.status, i.gst_reported_total != null ? 'yes' : 'no', netPayable(i, d.creditNotes)])]), 'text/csv')}
      stats={[['ITC available (3B 4A)', inr(itc)], ['Deferred (pending / disputed)', inr(itcOf(pending))], ['Rejected', inr(itcOf(rejected))], ['Not on GST yet', missing.length]]}>
      <ReturnTable head={['Supplier', 'Invoice', 'GST', 'IMS action', 'ITC']}
        rows={invs.map(i => [party(i.seller_id)?.name, i.invoice_no, inr(i.gst_amount), i.gst_reported_total == null ? 'Not on GST' : i.status,
          i.gst_reported_total == null ? '—' : i.status === 'accepted' ? '✅ Available' : i.status === 'rejected' ? '❌ No' : '⏳ Deferred'])} />
      <p className="mt-3 text-xs text-muted">Accepted → ITC flows to GSTR-2B and GSTR-3B. Pending / disputed → carried to next period. Credit notes on accepted invoices reduce ITC.</p>
    </ReturnShell>
  )
}

function ReturnShell({ title, month, months, setMonth, stats, onJson, onCsv, children }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 font-bold"><FileText size={18} />{title}</div>
        <select value={month} onChange={e => setMonth(e.target.value)} className="input !w-auto !py-2">
          {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={onCsv} className="btn-ghost !py-2"><Download size={16} />CSV</button>
          <button onClick={onJson} className="btn-primary !py-2"><Download size={16} />JSON (portal format)</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="rounded-2xl bg-brand-soft p-4"><div className="text-xs font-semibold text-brand/80">{l}</div><div className="mt-1 font-display text-xl font-bold text-brand">{v}</div></div>)}
      </div>
      {children}
    </div>
  )
}

function ReturnTable({ head, rows }) {
  if (!rows.length) return <div className="card p-8 text-center text-sm text-muted">No documents in this period.</div>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-canvas text-left text-xs text-muted"><tr>{head.map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={`px-4 py-2.5 ${j === 1 ? 'font-semibold' : ''}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
