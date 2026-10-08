import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Upload, IndianRupee, PackageCheck, FileMinus, FilePlus } from 'lucide-react'
import { Drawer, GstCheckCard, ItemsTable, StatusChip, Timeline, Chip } from '../components/ui'
import { useData } from '../lib/data'
import { api } from '../lib/api'
import { DISPUTE_TYPES, fmtDate, friendlyError, gstCheck, inr, netPayable, taxSplit } from '../lib/format'

export default function InvoiceDrawer({ invoiceId, role, onClose }) {
  const d = useData()
  const inv = d.invoices.find(i => i.id === invoiceId)
  const [busy, setBusy] = useState(null)
  const [mode, setMode] = useState(null) // dispute | reject | note
  const viewed = useRef(null)

  useEffect(() => { setMode(null) }, [invoiceId, inv?.status])
  useEffect(() => {
    if (inv && role === 'buyer' && inv.status === 'sent' && viewed.current !== inv.id) {
      viewed.current = inv.id
      api.markViewed(inv.id).then(d.refresh).catch(() => {})
    }
  }, [inv, role, d.refresh])

  async function run(key, fn, msg) {
    setBusy(key)
    try { const r = await fn(); if (msg) toast.success(msg); await d.refresh(); setMode(null); return r ?? true }
    catch (e) { toast.error(friendlyError(e)) }
    finally { setBusy(null) }
  }

  if (!inv) return <Drawer open={!!invoiceId} onClose={onClose} title="Invoice">{null}</Drawer>

  const seller = d.businesses.find(b => b.id === inv.seller_id)
  const buyer = d.businesses.find(b => b.id === inv.buyer_id)
  const items = d.items.filter(i => i.invoice_id === inv.id)
  const notes = d.creditNotes.filter(n => n.invoice_id === inv.id)
  const disputes = d.disputes.filter(x => x.invoice_id === inv.id)
  const open = disputes.find(x => x.status === 'open')
  const history = d.history.filter(h => h.invoice_id === inv.id)
  const split = taxSplit(seller?.gstin, buyer?.gstin, inv.gst_amount)
  const net = netPayable(inv, d.creditNotes)
  const check = gstCheck(inv)
  const buyerCanAct = role === 'buyer' && ['viewed', 'pending', 'corrected', 'sent'].includes(inv.status) && !open

  return (
    <Drawer open={!!invoiceId} onClose={onClose} title={`${inv.invoice_no} · ${inr(inv.total)}`}
      subtitle={role === 'buyer' ? `From ${seller?.name}` : `To ${buyer?.name}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={inv.status} />
        <Chip tone={inv.payment_status === 'paid' ? 'ok' : 'muted'}>{inv.payment_status === 'paid' ? '💰 Paid' : `Due ${fmtDate(inv.due_date || inv.created_at)}`}</Chip>
        <Chip tone={inv.gst_sync_status === 'synced' ? 'ok' : 'muted'}>{inv.gst_sync_status === 'synced' ? 'IMS synced' : 'IMS: no action yet'}</Chip>
        {inv.goods_status !== 'not_checked' && <Chip tone={inv.goods_status === 'received_full' ? 'ok' : 'bad'}>📦 {inv.goods_status.replace('_', ' ')}</Chip>}
      </div>

      <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
        <div><div className="text-xs text-muted">Seller</div><div className="font-semibold">{seller?.name}</div><div className="text-xs text-muted">{seller?.gstin}</div></div>
        <div><div className="text-xs text-muted">Buyer</div><div className="font-semibold">{buyer?.name}</div><div className="text-xs text-muted">{buyer?.gstin}</div></div>
        <div><div className="text-xs text-muted">Invoice date</div><div className="font-semibold">{fmtDate(inv.invoice_date)}</div></div>
        <div><div className="text-xs text-muted">Tax type</div><div className="font-semibold">{split.igst ? 'IGST (inter-state)' : 'CGST + SGST'}</div></div>
      </div>

      <GstCheckCard invoice={inv}>
        {role === 'seller' && check !== 'match' && (
          <button onClick={() => run('upload', () => api.uploadToGst(inv.id), 'Reported on GST portal')} disabled={!!busy} className="btn-primary mt-3">
            {busy === 'upload' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{check === 'missing' ? 'Upload on GST portal' : 'Amend on GST (GSTR-1A)'}</button>
        )}
      </GstCheckCard>

      <ItemsTable items={items} invoice={inv} />
      <div className="-mt-2 text-right text-xs text-muted">
        {split.igst ? `IGST ${inr(split.igst, { decimals: true })}` : `CGST ${inr(split.cgst, { decimals: true })} + SGST ${inr(split.sgst, { decimals: true })}`}
      </div>

      {notes.length > 0 && (
        <div className="card divide-y divide-line">
          {notes.map(n => (
            <div key={n.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div><div className="font-semibold">{n.kind === 'debit' ? <FilePlus size={14} className="mr-1 inline text-brand" /> : <FileMinus size={14} className="mr-1 inline text-ok" />}{n.cn_no} · {n.reason}</div>
                <div className="text-xs text-muted">{n.kind === 'debit' ? 'Debit' : 'Credit'} note · {fmtDate(n.created_at)}</div></div>
              <div className={`font-bold ${n.kind === 'debit' ? 'text-brand' : 'text-ok'}`}>{n.kind === 'debit' ? '+' : '−'}{inr(n.total)}</div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-bold"><span>Net payable</span><span>{inr(net)}</span></div>
        </div>
      )}

      {open && (
        <div className={`rounded-2xl border-2 p-4 ${role === 'seller' ? 'border-accent bg-white' : 'border-accent/30 bg-accent-soft'}`}>
          <div className="font-bold text-accent">⚠️ {DISPUTE_TYPES[open.type]} — {role === 'seller' ? 'buyer is asking for a correction' : 'waiting for seller'}</div>
          <DisputeText dispute={open} items={items} />
          {role === 'seller' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {['gst', 'other'].includes(open.type) ? (
                <button onClick={() => run('fix', async () => { if (check !== 'match') await api.uploadToGst(inv.id); await api.resolveDispute(open.id, true, 'Corrected on GST portal (GSTR-1A)') }, 'Correction done ✅')} disabled={!!busy} className="btn-primary">Fix & confirm</button>
              ) : (
                <button onClick={() => run('approve', () => api.resolveDispute(open.id, true, 'Approved'), 'Credit note issued 🧾')} disabled={!!busy} className="btn-ok">
                  {busy === 'approve' && <Loader2 size={14} className="animate-spin" />}Approve → auto credit note</button>
              )}
              <button onClick={() => run('rej', () => api.resolveDispute(open.id, false, 'Seller disagrees — full quantity was dispatched'), 'Correction rejected')} disabled={!!busy} className="btn-ghost">Reject</button>
            </div>
          )}
        </div>
      )}

      {/* BUYER ACTIONS */}
      {buyerCanAct && (
        <div className="card space-y-3 p-4">
          <div className="font-bold">Your action</div>
          <AnimatePresence mode="wait">
            {!mode && (
              <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {inv.goods_status === 'not_checked' && (
                  <button onClick={() => run('goods', () => api.recordGoods(inv.id, 'received_full'), 'Goods marked received')} disabled={!!busy} className="btn-ghost w-full">
                    <PackageCheck size={16} />Goods received in full</button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => run('accept', () => api.buyerAction(inv.id, 'accept'), 'Accepted · synced to GST IMS ✅')} disabled={!!busy} className="btn-ok">
                    {busy === 'accept' && <Loader2 size={14} className="animate-spin" />}Accept</button>
                  <button onClick={() => run('pending', () => api.buyerAction(inv.id, 'pending', 'Will check later'), 'Kept pending')} disabled={!!busy || inv.status === 'pending'} className="btn-ghost">Keep pending</button>
                </div>
                {inv.status !== 'corrected' && <button onClick={() => setMode('dispute')} className="btn-accent w-full">✍️ Modify — ask seller to correct</button>}
                <button onClick={() => setMode('reject')} className="btn-bad w-full">Reject whole invoice</button>
              </motion.div>
            )}
            {mode === 'dispute' && <DisputeForm key="d" inv={inv} items={items} busy={busy} run={run} onCancel={() => setMode(null)} />}
            {mode === 'reject' && <RejectForm key="r" inv={inv} busy={busy} run={run} onCancel={() => setMode(null)} />}
          </AnimatePresence>
        </div>
      )}

      {/* SELLER ACTIONS */}
      {role === 'seller' && (
        <div className="card space-y-2 p-4">
          <div className="font-bold">Seller actions</div>
          {inv.status === 'accepted' && inv.payment_status === 'unpaid' && (
            <button onClick={() => run('paid', () => api.markPaid(inv.id), 'Payment recorded 💰')} disabled={!!busy} className="btn-ok w-full"><IndianRupee size={16} />Mark payment received ({inr(net)})</button>
          )}
          {mode === 'note' ? <NoteForm inv={inv} busy={busy} run={run} onCancel={() => setMode(null)} />
            : <button onClick={() => setMode('note')} className="btn-ghost w-full"><FileMinus size={16} />Issue credit / debit note</button>}
        </div>
      )}

      <div className="card p-4">
        <div className="mb-3 font-bold">Status timeline</div>
        <Timeline events={[...history].reverse()} />
      </div>
    </Drawer>
  )
}

function DisputeText({ dispute: x, items }) {
  const it = items.find(i => i.id === x.item_id)
  return (
    <div className="mt-1 text-sm">
      {['quantity', 'damaged'].includes(x.type) && <><b>{it?.description}</b>: {Number(x.expected_qty)} billed, {Number(x.received_qty)} OK → <b>{Number(x.expected_qty - x.received_qty)} {x.type === 'damaged' ? 'damaged' : 'missing'}</b></>}
      {x.type === 'rate' && <><b>{it?.description}</b>: billed {inr(x.billed_rate)}, agreed {inr(x.claimed_rate)}</>}
      {x.note && <div className="text-muted">"{x.note}"</div>}
    </div>
  )
}

function DisputeForm({ inv, items, busy, run, onCancel }) {
  const [type, setType] = useState(gstCheck(inv) === 'mismatch' ? 'gst' : 'quantity')
  const [itemId, setItemId] = useState(items[0]?.id)
  const it = items.find(i => i.id === itemId)
  const [qty, setQty] = useState(it ? Math.max(0, Number(it.qty) - 10) : 0)
  const [rate, setRate] = useState(it ? Math.round(Number(it.rate) * 0.95) : 0)
  const [note, setNote] = useState(gstCheck(inv) === 'mismatch' ? 'Amount on GST portal does not match the bill' : '')
  useEffect(() => { if (it) { setQty(Math.max(0, Number(it.qty) - Math.max(1, Math.round(Number(it.qty) * 0.1)))); setRate(Math.round(Number(it.rate) * 0.95)) } }, [itemId]) // eslint-disable-line
  const f = 1 + Number(inv.gst_rate) / 100
  const preview = !it ? 0 : ['quantity', 'damaged'].includes(type) ? (it.qty - qty) * it.rate * f : type === 'rate' ? (it.rate - rate) * it.qty * f : 0

  return (
    <motion.form key="df" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3"
      onSubmit={e => { e.preventDefault(); run('dispute', () => api.raiseDispute({
        invoiceId: inv.id, type, itemId: ['quantity', 'damaged', 'rate'].includes(type) ? itemId : null,
        receivedQty: ['quantity', 'damaged'].includes(type) ? Number(qty) : null, claimedRate: type === 'rate' ? Number(rate) : null, note,
      }), 'Correction request sent 📤') }}>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(DISPUTE_TYPES).map(([k, l]) => (
          <button type="button" key={k} onClick={() => setType(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${type === k ? 'bg-accent text-white' : 'bg-canvas'}`}>{l}</button>
        ))}
      </div>
      {['quantity', 'damaged', 'rate'].includes(type) && (
        <div><label className="label">Which item?</label>
          <select value={itemId} onChange={e => setItemId(e.target.value)} className="input">{items.map(i => <option key={i.id} value={i.id}>{i.description} ({Number(i.qty)} × {inr(i.rate)})</option>)}</select></div>
      )}
      {it && ['quantity', 'damaged'].includes(type) && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Billed qty</label><div className="input bg-canvas">{Number(it.qty)}</div></div>
          <div><label className="label">{type === 'damaged' ? 'Good condition' : 'Actually received'}</label><input type="number" min="0" max={Number(it.qty) - 1} value={qty} onChange={e => setQty(e.target.value)} className="input" required /></div>
        </div>
      )}
      {it && type === 'rate' && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Billed rate</label><div className="input bg-canvas">{inr(it.rate)}</div></div>
          <div><label className="label">Agreed rate</label><input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} className="input" required /></div>
        </div>
      )}
      <div><label className="label">Note {['gst', 'other'].includes(type) ? '(required)' : '(optional)'}</label>
        <input value={note} onChange={e => setNote(e.target.value)} className="input" maxLength={200} placeholder="Explain the problem in one line" required={['gst', 'other'].includes(type)} /></div>
      {preview > 0 && <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Credit note of <b>{inr(preview)}</b> will be requested — rest of the bill stays as it is.</div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button disabled={busy === 'dispute'} className="btn-accent">{busy === 'dispute' && <Loader2 size={14} className="animate-spin" />}Send to seller</button></div>
    </motion.form>
  )
}

function RejectForm({ inv, busy, run, onCancel }) {
  const [reason, setReason] = useState('')
  return (
    <motion.form key="rf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3"
      onSubmit={e => { e.preventDefault(); run('reject', () => api.buyerAction(inv.id, 'reject', reason), 'Rejected · synced to GST IMS') }}>
      <p className="text-sm text-muted">Only one thing wrong? Use <b>Modify</b> instead — rejecting forces the seller to redo the whole invoice.</p>
      <input value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder="Reason, e.g. We never placed this order" required minLength={3} maxLength={200} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button disabled={busy === 'reject'} className="btn !bg-bad !text-white">Reject</button></div>
    </motion.form>
  )
}

function NoteForm({ inv, busy, run, onCancel }) {
  const [kind, setKind] = useState('credit')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const gst = Number(amount || 0) * Number(inv.gst_rate) / 100
  return (
    <form className="space-y-3 rounded-xl bg-canvas p-3" onSubmit={e => { e.preventDefault(); run('note', () => api.issueNote(inv.id, kind, Number(amount), reason), `${kind === 'credit' ? 'Credit' : 'Debit'} note issued`) }}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 text-sm font-semibold">
        {[['credit', 'Credit note (reduce)'], ['debit', 'Debit note (increase)']].map(([k, l]) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-lg py-1.5 cursor-pointer ${kind === k ? 'bg-brand text-white' : 'text-muted'}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Taxable amount ₹</label><input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="input" required /></div>
        <div><label className="label">Reason</label>
          <input list="note-reasons" value={reason} onChange={e => setReason(e.target.value)} className="input" required minLength={3} maxLength={120} />
          <datalist id="note-reasons">{['Sales return', 'Breakage in transit', 'Discount', 'Freight charges', 'Rate revision', 'Short billing'].map(r => <option key={r} value={r} />)}</datalist></div>
      </div>
      {amount > 0 && <div className="text-sm text-muted">GST {inr(gst, { decimals: true })} · Note total <b className="text-ink">{inr(Number(amount) + gst, { decimals: true })}</b></div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button disabled={busy === 'note'} className="btn-primary">{busy === 'note' && <Loader2 size={14} className="animate-spin" />}Issue note</button></div>
    </form>
  )
}
