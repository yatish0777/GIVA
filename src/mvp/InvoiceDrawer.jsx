import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Upload, IndianRupee, PackageCheck, FileMinus, FilePlus } from 'lucide-react'
import { Drawer, GstCheckCard, ItemsTable, StatusChip, Timeline, Chip } from '../components/ui'
import { useData } from '../lib/data'
import { api } from '../lib/api'
import { friendlyError, gstCheck, inr, netPayable, taxSplit } from '../lib/format'
import { useLang } from '../i18n'

export default function InvoiceDrawer({ invoiceId, role, onClose }) {
  const { t, fdate } = useLang()
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
      subtitle={role === 'buyer' ? t('drawer.from', { name: seller?.name }) : t('drawer.to', { name: buyer?.name })}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={inv.status} />
        <Chip tone={inv.payment_status === 'paid' ? 'ok' : 'muted'}>{inv.payment_status === 'paid' ? `💰 ${t('common.paid')}` : t('drawer.due', { date: fdate(inv.due_date || inv.created_at) })}</Chip>
        <Chip tone={inv.gst_sync_status === 'synced' ? 'ok' : 'muted'}>{inv.gst_sync_status === 'synced' ? t('drawer.imsSynced') : t('drawer.imsNone')}</Chip>
        {inv.goods_status !== 'not_checked' && <Chip tone={inv.goods_status === 'received_full' ? 'ok' : 'bad'}>📦 {t(`drawer.goods.${inv.goods_status}`)}</Chip>}
      </div>

      <div className="card grid grid-cols-2 gap-3 p-4 text-sm">
        <div><div className="text-xs text-muted">{t('drawer.seller')}</div><div className="font-semibold">{seller?.name}</div><div className="text-xs text-muted">{seller?.gstin}</div></div>
        <div><div className="text-xs text-muted">{t('drawer.buyer')}</div><div className="font-semibold">{buyer?.name}</div><div className="text-xs text-muted">{buyer?.gstin}</div></div>
        <div><div className="text-xs text-muted">{t('drawer.date')}</div><div className="font-semibold">{fdate(inv.invoice_date)}</div></div>
        <div><div className="text-xs text-muted">{t('drawer.taxType')}</div><div className="font-semibold">{split.igst ? t('drawer.igst') : t('drawer.cgstSgst')}</div></div>
      </div>

      <GstCheckCard invoice={inv}>
        {role === 'seller' && check !== 'match' && (
          <button onClick={() => run('upload', () => api.uploadToGst(inv.id), t('drawer.t.reported'))} disabled={!!busy} className="btn-primary mt-3">
            {busy === 'upload' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{check === 'missing' ? t('drawer.upload') : t('drawer.amend')}</button>
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
                <div className="text-xs text-muted">{n.kind === 'debit' ? t('drawer.debitNote') : t('drawer.creditNote')} · {fdate(n.created_at)}</div></div>
              <div className={`font-bold ${n.kind === 'debit' ? 'text-brand' : 'text-ok'}`}>{n.kind === 'debit' ? '+' : '−'}{inr(n.total)}</div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-bold"><span>{t('drawer.net')}</span><span>{inr(net)}</span></div>
        </div>
      )}

      {open && (
        <div className={`rounded-2xl border-2 p-4 ${role === 'seller' ? 'border-accent bg-white' : 'border-accent/30 bg-accent-soft'}`}>
          <div className="font-bold text-accent">⚠️ {t(`dispute.${open.type}`)} — {role === 'seller' ? t('drawer.corrSeller') : t('drawer.corrBuyer')}</div>
          <DisputeText dispute={open} items={items} />
          {role === 'seller' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {['gst', 'other'].includes(open.type) ? (
                <button onClick={() => run('fix', async () => { if (check !== 'match') await api.uploadToGst(inv.id); await api.resolveDispute(open.id, true, 'GSTR-1A') }, t('drawer.t.corrDone'))} disabled={!!busy} className="btn-primary">{t('drawer.fixConfirm')}</button>
              ) : (
                <button onClick={() => run('approve', () => api.resolveDispute(open.id, true, 'OK'), t('drawer.t.cnIssued'))} disabled={!!busy} className="btn-ok">
                  {busy === 'approve' && <Loader2 size={14} className="animate-spin" />}{t('drawer.approveAuto')}</button>
              )}
              <button onClick={() => run('rej', () => api.resolveDispute(open.id, false, t('drawer.sellerDisagrees')), t('drawer.t.corrRejected'))} disabled={!!busy} className="btn-ghost">{t('drawer.reject')}</button>
            </div>
          )}
        </div>
      )}

      {/* BUYER ACTIONS */}
      {buyerCanAct && (
        <div className="card space-y-3 p-4">
          <div className="font-bold">{t('drawer.yourAction')}</div>
          <AnimatePresence mode="wait">
            {!mode && (
              <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {inv.goods_status === 'not_checked' && (
                  <button onClick={() => run('goods', () => api.recordGoods(inv.id, 'received_full'), t('drawer.t.goods'))} disabled={!!busy} className="btn-ghost w-full">
                    <PackageCheck size={16} />{t('drawer.goodsFull')}</button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => run('accept', () => api.buyerAction(inv.id, 'accept'), t('drawer.t.accepted'))} disabled={!!busy} className="btn-ok">
                    {busy === 'accept' && <Loader2 size={14} className="animate-spin" />}{t('drawer.accept')}</button>
                  <button onClick={() => run('pending', () => api.buyerAction(inv.id, 'pending', t('drawer.pendingNote')), t('drawer.t.pending'))} disabled={!!busy || inv.status === 'pending'} className="btn-ghost">{t('drawer.keepPending')}</button>
                </div>
                {inv.status !== 'corrected' && <button onClick={() => setMode('dispute')} className="btn-accent w-full">{t('drawer.modify')}</button>}
                <button onClick={() => setMode('reject')} className="btn-bad w-full">{t('drawer.rejectWhole')}</button>
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
          <div className="font-bold">{t('drawer.sellerActions')}</div>
          {inv.status === 'accepted' && inv.payment_status === 'unpaid' && (
            <button onClick={() => run('paid', () => api.markPaid(inv.id), t('drawer.t.paid'))} disabled={!!busy} className="btn-ok w-full"><IndianRupee size={16} />{t('drawer.markPaid', { amt: inr(net) })}</button>
          )}
          {mode === 'note' ? <NoteForm inv={inv} busy={busy} run={run} onCancel={() => setMode(null)} />
            : <button onClick={() => setMode('note')} className="btn-ghost w-full"><FileMinus size={16} />{t('drawer.issueNote')}</button>}
        </div>
      )}

      <div className="card p-4">
        <div className="mb-3 font-bold">{t('drawer.timeline')}</div>
        <Timeline events={[...history].reverse()} />
      </div>
    </Drawer>
  )
}

function DisputeText({ dispute: x, items }) {
  const { t } = useLang()
  const it = items.find(i => i.id === x.item_id)
  return (
    <div className="mt-1 text-sm">
      {['quantity', 'damaged'].includes(x.type) && t('drawer.disputeQty', { item: it?.description, a: Number(x.expected_qty), b: Number(x.received_qty), c: Number(x.expected_qty - x.received_qty), word: x.type === 'damaged' ? t('drawer.damagedWord') : t('drawer.missingWord') })}
      {x.type === 'rate' && t('drawer.disputeRate', { item: it?.description, a: inr(x.billed_rate), b: inr(x.claimed_rate) })}
      {x.note && <div className="text-muted">"{x.note}"</div>}
    </div>
  )
}

function DisputeForm({ inv, items, busy, run, onCancel }) {
  const { t } = useLang()
  const [type, setType] = useState(gstCheck(inv) === 'mismatch' ? 'gst' : 'quantity')
  const [itemId, setItemId] = useState(items[0]?.id)
  const it = items.find(i => i.id === itemId)
  const [qty, setQty] = useState(it ? Math.max(0, Number(it.qty) - 10) : 0)
  const [rate, setRate] = useState(it ? Math.round(Number(it.rate) * 0.95) : 0)
  const [note, setNote] = useState(gstCheck(inv) === 'mismatch' ? t('drawer.mismatchNote') : '')
  useEffect(() => { if (it) { setQty(Math.max(0, Number(it.qty) - Math.max(1, Math.round(Number(it.qty) * 0.1)))); setRate(Math.round(Number(it.rate) * 0.95)) } }, [itemId]) // eslint-disable-line
  const f = 1 + Number(inv.gst_rate) / 100
  const preview = !it ? 0 : ['quantity', 'damaged'].includes(type) ? (it.qty - qty) * it.rate * f : type === 'rate' ? (it.rate - rate) * it.qty * f : 0

  return (
    <motion.form key="df" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3"
      onSubmit={e => { e.preventDefault(); run('dispute', () => api.raiseDispute({
        invoiceId: inv.id, type, itemId: ['quantity', 'damaged', 'rate'].includes(type) ? itemId : null,
        receivedQty: ['quantity', 'damaged'].includes(type) ? Number(qty) : null, claimedRate: type === 'rate' ? Number(rate) : null, note,
      }), t('drawer.t.sent')) }}>
      <div className="flex flex-wrap gap-1.5">
        {['quantity', 'damaged', 'rate', 'gst', 'other'].map(k => (
          <button type="button" key={k} onClick={() => setType(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${type === k ? 'bg-accent text-white' : 'bg-canvas'}`}>{t(`dispute.${k}`)}</button>
        ))}
      </div>
      {['quantity', 'damaged', 'rate'].includes(type) && (
        <div><label className="label">{t('drawer.which')}</label>
          <select value={itemId} onChange={e => setItemId(e.target.value)} className="input">{items.map(i => <option key={i.id} value={i.id}>{i.description} ({Number(i.qty)} × {inr(i.rate)})</option>)}</select></div>
      )}
      {it && ['quantity', 'damaged'].includes(type) && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{t('drawer.billedQty')}</label><div className="input bg-canvas">{Number(it.qty)}</div></div>
          <div><label className="label">{type === 'damaged' ? t('drawer.goodCond') : t('drawer.actually')}</label><input type="number" min="0" max={Number(it.qty) - 1} value={qty} onChange={e => setQty(e.target.value)} className="input" required /></div>
        </div>
      )}
      {it && type === 'rate' && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{t('drawer.billedRate')}</label><div className="input bg-canvas">{inr(it.rate)}</div></div>
          <div><label className="label">{t('drawer.agreedRate')}</label><input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} className="input" required /></div>
        </div>
      )}
      <div><label className="label">{t('common.note')} {['gst', 'other'].includes(type) ? t('common.required') : t('common.optional')}</label>
        <input value={note} onChange={e => setNote(e.target.value)} className="input" maxLength={200} placeholder={t('drawer.notePh')} required={['gst', 'other'].includes(type)} /></div>
      {preview > 0 && <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm">{t('drawer.preview', { amt: inr(preview) })}</div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
        <button disabled={busy === 'dispute'} className="btn-accent">{busy === 'dispute' && <Loader2 size={14} className="animate-spin" />}{t('drawer.sendSeller')}</button></div>
    </motion.form>
  )
}

function RejectForm({ inv, busy, run, onCancel }) {
  const { t } = useLang()
  const [reason, setReason] = useState('')
  return (
    <motion.form key="rf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3"
      onSubmit={e => { e.preventDefault(); run('reject', () => api.buyerAction(inv.id, 'reject', reason), t('drawer.t.rejected')) }}>
      <p className="text-sm text-muted">{t('drawer.rejectHint')}</p>
      <input value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder={t('drawer.rejectPh')} required minLength={3} maxLength={200} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
        <button disabled={busy === 'reject'} className="btn !bg-bad !text-white">{t('drawer.reject')}</button></div>
    </motion.form>
  )
}

function NoteForm({ inv, busy, run, onCancel }) {
  const { t } = useLang()
  const [kind, setKind] = useState('credit')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const gst = Number(amount || 0) * Number(inv.gst_rate) / 100
  return (
    <form className="space-y-3 rounded-xl bg-canvas p-3" onSubmit={e => { e.preventDefault(); run('note', () => api.issueNote(inv.id, kind, Number(amount), reason), t('drawer.t.note', { kind: kind === 'credit' ? t('notes.credit') : t('notes.debit') })) }}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 text-sm font-semibold">
        {[['credit', t('drawer.creditKind')], ['debit', t('drawer.debitKind')]].map(([k, l]) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-lg py-1.5 cursor-pointer ${kind === k ? 'bg-brand text-white' : 'text-muted'}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">{t('drawer.taxableAmt')}</label><input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="input" required /></div>
        <div><label className="label">{t('common.reason')}</label>
          <input list="note-reasons" value={reason} onChange={e => setReason(e.target.value)} className="input" required minLength={3} maxLength={120} />
          <datalist id="note-reasons">{t('drawer.reasons').map(r => <option key={r} value={r} />)}</datalist></div>
      </div>
      {amount > 0 && <div className="text-sm text-muted">{t('drawer.noteTotal', { gst: inr(gst, { decimals: true }), total: inr(Number(amount) + gst, { decimals: true }) })}</div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
        <button disabled={busy === 'note'} className="btn-primary">{busy === 'note' && <Loader2 size={14} className="animate-spin" />}{t('drawer.issue')}</button></div>
    </form>
  )
}
