import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, Printer, Share2, Loader2, Upload, IndianRupee, PackageCheck, FileMinus, FilePlus, Check } from 'lucide-react'
import { useData } from '../../lib/data'
import { api } from '../../lib/api'
import { useLang } from '../../i18n'
import { friendlyError, gstCheck, inr, netPayable, taxSplit, stateOf } from '../../lib/format'
import { Chip, GstCheckCard, ItemsTable, StatusChip, Timeline, Tabs } from '../../components/ui'
import { DisputeForm, DisputeText, NoteForm, RejectForm } from '../InvoiceDrawer'
import TaxInvoice from '../TaxInvoice'
import { useApp } from '../ctx'
import { Card } from './Dashboard'

export default function InvoicePage() {
  const { id } = useParams()
  const d = useData()
  const { t, fdate } = useLang()
  const { role, base } = useApp()
  const [tab, setTab] = useState('details')
  const [busy, setBusy] = useState(null)
  const [mode, setMode] = useState(null)
  const viewed = useRef(null)
  const inv = d.invoices.find(i => i.id === id)

  useEffect(() => { setMode(null) }, [id, inv?.status])
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

  if (!inv) return (
    <div className="card p-10 text-center">
      <div className="text-lg font-bold">{t('app.invoice.notFound')}</div>
      <Link to={`${base}/invoices`} className="btn-ghost mt-4"><ArrowLeft size={16} />{t('app.invoice.back')}</Link>
    </div>
  )

  const seller = d.businesses.find(b => b.id === inv.seller_id)
  const buyer = d.businesses.find(b => b.id === inv.buyer_id)
  const other = role === 'buyer' ? seller : buyer
  const items = d.items.filter(i => i.invoice_id === inv.id)
  const notes = d.creditNotes.filter(n => n.invoice_id === inv.id)
  const open = d.disputes.find(x => x.invoice_id === inv.id && x.status === 'open')
  const history = d.history.filter(h => h.invoice_id === inv.id)
  const net = netPayable(inv, d.creditNotes)
  const check = gstCheck(inv)
  const split = taxSplit(seller?.gstin, buyer?.gstin, inv.gst_amount)
  const buyerCanAct = role === 'buyer' && ['viewed', 'pending', 'corrected', 'sent'].includes(inv.status) && !open

  const reached = [
    true,
    inv.status !== 'sent',
    check === 'match',
    inv.status === 'accepted',
    inv.payment_status === 'paid',
  ]

  function share() {
    const url = `${window.location.origin}/app/${role === 'buyer' ? 'seller' : 'buyer'}/invoices/${inv.id}`
    try { navigator.clipboard?.writeText(url) } catch { /* ignore */ }
    toast.success(t('app.invoice.shared'))
  }

  const actionPanel = (
    <div className="space-y-4">
      {open && (
        <div className={`rounded-2xl border-2 p-4 ${role === 'seller' ? 'border-accent bg-white shadow-lg' : 'border-accent/30 bg-accent-soft'}`}>
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

      {buyerCanAct && (
        <Card title={t('drawer.yourAction')}>
          <AnimatePresence mode="wait">
            {!mode && (
              <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {inv.status === 'corrected' && <div className="rounded-xl bg-ok-soft px-3 py-2 text-sm font-semibold text-ok">{t('quick.correctedHint')}</div>}
                {inv.goods_status === 'not_checked' && (
                  <button onClick={() => run('goods', () => api.recordGoods(inv.id, 'received_full'), t('drawer.t.goods'))} disabled={!!busy} className="btn-ghost w-full"><PackageCheck size={16} />{t('drawer.goodsFull')}</button>
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
        </Card>
      )}

      {role === 'seller' && (
        <Card title={t('drawer.sellerActions')}>
          <div className="space-y-2">
            {check !== 'match' && (
              <button onClick={() => run('upload', () => api.uploadToGst(inv.id), t('drawer.t.reported'))} disabled={!!busy} className="btn-primary w-full">
                {busy === 'upload' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{check === 'missing' ? t('drawer.upload') : t('drawer.amend')}</button>
            )}
            {inv.status === 'accepted' && inv.payment_status === 'unpaid' && (
              <button onClick={() => run('paid', () => api.markPaid(inv.id), t('drawer.t.paid'))} disabled={!!busy} className="btn-ok w-full"><IndianRupee size={16} />{t('drawer.markPaid', { amt: inr(net) })}</button>
            )}
            {mode === 'note' ? <NoteForm inv={inv} busy={busy} run={run} onCancel={() => setMode(null)} />
              : <button onClick={() => setMode('note')} className="btn-ghost w-full"><FileMinus size={16} />{t('drawer.issueNote')}</button>}
          </div>
        </Card>
      )}

      <Card title={t('app.invoice.summary')}>
        <div className="space-y-1.5 text-sm">
          <Line k={t('items.taxable')} v={inr(inv.taxable_value)} />
          {split.igst ? <Line k={`IGST ${Number(inv.gst_rate)}%`} v={inr(split.igst)} /> : <>
            <Line k={`CGST ${Number(inv.gst_rate) / 2}%`} v={inr(split.cgst)} />
            <Line k={`SGST ${Number(inv.gst_rate) / 2}%`} v={inr(split.sgst)} />
          </>}
          <Line k={t('items.total')} v={<b>{inr(inv.total)}</b>} />
          {notes.map(n => <Line key={n.id} k={<>{n.kind === 'debit' ? <FilePlus size={13} className="mr-1 inline text-brand" /> : <FileMinus size={13} className="mr-1 inline text-ok" />}{n.cn_no} · {n.reason}</>}
            v={<span className={n.kind === 'debit' ? 'text-brand' : 'text-ok'}>{n.kind === 'debit' ? '+' : '−'}{inr(n.total)}</span>} />)}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold"><span>{t('app.invoice.net')}</span><span className="text-brand">{inr(net)}</span></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Mini label={t('app.invoice.goods')} value={inv.goods_status === 'not_checked' ? '—' : t(`drawer.goods.${inv.goods_status}`)} ok={inv.goods_status === 'received_full'} />
          <Mini label={t('app.invoice.payment')} value={inv.payment_status === 'paid' ? t('common.paid') : t('common.unpaid')} ok={inv.payment_status === 'paid'} />
          <Mini label={t('app.invoice.gstSync')} value={inv.gst_sync_status === 'synced' ? '✓' : '—'} ok={inv.gst_sync_status === 'synced'} />
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-5">
      <Link to={`${base}/invoices`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} />{t('app.invoice.back')}</Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{inv.invoice_no}</h1>
              <StatusChip status={inv.status} />
              <Chip tone={check === 'match' ? 'ok' : check === 'mismatch' ? 'bad' : 'warn'}>{t(`gst.${check}`)}</Chip>
            </div>
            <div className="mt-1 text-sm text-muted">
              {role === 'buyer' ? t('drawer.from', { name: other?.name }) : t('drawer.to', { name: other?.name })} · {other?.gstin} · {stateOf(other?.gstin)}
            </div>
            <div className="mt-1 text-sm text-muted">{fdate(inv.invoice_date)} · {t('drawer.due', { date: fdate(inv.due_date || inv.created_at) })}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold">{inr(net)}</div>
            {net !== Number(inv.total) && <div className="text-xs text-muted line-through">{inr(inv.total)}</div>}
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={share} className="btn-ghost !py-2"><Share2 size={15} />{t('app.invoice.share')}</button>
              <button onClick={() => { setTab('document'); setTimeout(() => window.print(), 350) }} className="btn-ghost !py-2"><Printer size={15} />{t('app.invoice.print')}</button>
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="mt-5 flex items-center">
          {t('app.invoice.steps').map((s, i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${reached[i] ? 'bg-ok text-white' : 'border-2 border-line bg-white text-muted'}`}>{reached[i] ? <Check size={14} /> : i + 1}</span>
                <span className={`whitespace-nowrap text-[11px] ${reached[i] ? 'font-semibold text-ink' : 'text-muted'}`}>{s}</span>
              </div>
              {i < 4 && <div className={`mx-1 mb-4 h-0.5 flex-1 ${reached[i + 1] ? 'bg-ok' : 'bg-line'}`} />}
            </div>
          ))}
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'details', label: t('app.invoice.tabs.details') }, { id: 'document', label: t('app.invoice.tabs.document') }, { id: 'timeline', label: t('app.invoice.tabs.timeline'), count: history.length }]} />

      {tab === 'details' && (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="order-2 space-y-5 lg:order-1">
            <GstCheckCard invoice={inv} />
            <Card title={t('app.invoice.parties')}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[[t('drawer.seller'), seller], [t('drawer.buyer'), buyer]].map(([label, b]) => (
                  <div key={label} className="rounded-xl bg-canvas p-3 text-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
                    <div className="font-semibold">{b?.name}</div>
                    <div className="text-xs text-muted">{b?.address}</div>
                    <div className="mt-1 text-xs"><b>GSTIN</b> {b?.gstin} · {stateOf(b?.gstin)}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card title={t('app.invoice.items')}><ItemsTable items={items} invoice={inv} /></Card>
          </div>
          <div className="order-1 lg:order-2"><div className="lg:sticky lg:top-20">{actionPanel}</div></div>
        </div>
      )}

      {tab === 'document' && (
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex justify-end"><button onClick={() => window.print()} className="btn-primary"><Printer size={16} />{t('app.invoice.print')}</button></div>
          <TaxInvoice invoice={inv} items={items} seller={seller} buyer={buyer} notes={notes} />
        </div>
      )}

      {tab === 'timeline' && <Card><Timeline events={[...history].reverse()} /></Card>}
    </div>
  )
}

function Line({ k, v }) {
  return <div className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>
}
function Mini({ label, value, ok }) {
  return <div className={`rounded-xl px-2 py-2 ${ok ? 'bg-ok-soft text-ok' : 'bg-canvas text-ink/70'}`}><div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div><div className="font-semibold">{value}</div></div>
}
