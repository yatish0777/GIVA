import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, RotateCcw, Smartphone, Store, Factory, Send, Inbox, Bell, Upload, IndianRupee, Database } from 'lucide-react'
import { Chip, GstChip, LiveDot, StatusChip, Timeline } from '../components/ui'
import { useData } from '../lib/data'
import { api } from '../lib/api'
import { netPayable, friendlyError, gstCheck, inr, inrShort } from '../lib/format'
import { useLang } from '../i18n'

const SELLER_GSTIN = '27AABCA1234F1Z5' // ABC Pipes
const BUYER_GSTIN = '27ABMPS9876Q1Z3' // Shree Sai Hardware
const LS_KEY = 'giva-demo-invoice'

function readLS() { try { return localStorage.getItem(LS_KEY) } catch { return null } }
function writeLS(v) { try { localStorage.setItem(LS_KEY, v) } catch { /* ignore */ } }

export function QuickDemo() {
  const { t } = useLang()
  const d = useData()
  const seller = d.businesses.find(b => b.gstin === SELLER_GSTIN)
  const buyer = d.businesses.find(b => b.gstin === BUYER_GSTIN)
  const [selectedId, setSelectedId] = useState(readLS)
  const [busy, setBusy] = useState(null)

  const inv = d.invoices.find(i => i.id === selectedId) || null
  const items = useMemo(() => inv ? d.items.filter(i => i.invoice_id === inv.id) : [], [d.items, inv])
  const openDispute = inv ? d.disputes.find(x => x.invoice_id === inv.id && x.status === 'open') : null
  const notes = inv ? d.creditNotes.filter(c => c.invoice_id === inv.id) : []
  const net = inv ? netPayable(inv, d.creditNotes) : 0
  const history = inv ? d.history.filter(h => h.invoice_id === inv.id) : []
  const sellerOfInv = inv ? d.businesses.find(b => b.id === inv.seller_id) : null
  const buyerInvoices = buyer ? d.invoices.filter(i => i.buyer_id === buyer.id).slice(0, 7) : []
  const requests = seller ? d.requests.filter(r => r.seller_id === seller.id && r.status === 'open') : []

  async function run(key, fn, success) {
    setBusy(key)
    try { const r = await fn(); if (success) toast.success(success); await d.refresh(); return r }
    catch (e) { toast.error(friendlyError(e)) }
    finally { setBusy(null) }
  }

  async function startDemo() {
    if (!seller || !buyer) return
    const id = await run('start', () => api.createInvoice({
      sellerId: seller.id, buyerId: buyer.id, gstRate: 18, uploadToGst: true,
      items: [{ description: 'PVC Pipe 4" · 6 kg/cm² · 6 m', hsn: '3917', qty: 100, unit: 'pcs', rate: 1000 }],
    }), t('quick.t.newBill'))
    if (id) { setSelectedId(id); writeLS(id) }
  }

  function pick(id) {
    setSelectedId(id)
    document.getElementById('demo-phones')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {!d.loading && d.error && <div className="card mb-6 p-4 text-bad">{t('common.dbError')}: {d.error}</div>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <LiveDot live={d.live} />
        <span className="text-sm text-muted">{t('quick.tip')}</span>
        <button onClick={startDemo} disabled={busy === 'start' || !seller} className="btn-ghost ml-auto">
          {busy === 'start' ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}{t('quick.fresh')}
        </button>
      </div>

      <div id="demo-phones" className="grid scroll-mt-24 gap-8 lg:grid-cols-2">
        <Phone title={buyer?.name ?? t('mvp.buyer')} role={t('quick.buyerRole')} icon={<Store size={18} />} tone="accent">
          {d.loading ? <PhoneLoading /> : (
            <BuyerScreen inv={inv} items={items} sellerName={sellerOfInv?.name} openDispute={openDispute} notes={notes} net={net}
              busy={busy} run={run} onStart={startDemo} canStart={!!seller} />
          )}
        </Phone>
        <Phone title={seller?.name ?? t('mvp.seller')} role={t('quick.sellerRole')} icon={<Factory size={18} />} tone="brand">
          {d.loading ? <PhoneLoading /> : (
            <SellerScreen inv={inv} isMine={inv?.seller_id === seller?.id} openDispute={openDispute} history={history}
              requests={requests} businesses={d.businesses} seller={seller} busy={busy} run={run} onStart={startDemo} onPick={pick} />
          )}
        </Phone>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div><div className="font-bold">{t('quick.dashTitle', { name: buyer?.name ?? t('mvp.buyer') })}</div><div className="text-xs text-muted">{t('quick.dashHint')}</div></div>
            <Database size={18} className="text-muted" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-canvas text-left text-xs text-muted">
                <tr>{t('quick.heads').map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {buyerInvoices.map(i => (
                    <motion.tr key={i.id} layout initial={{ opacity: 0, backgroundColor: '#fff1e3' }} animate={{ opacity: 1, backgroundColor: i.id === inv?.id ? '#e8ecfb' : '#ffffff' }}
                      onClick={() => pick(i.id)} className="cursor-pointer border-t border-line hover:bg-canvas">
                      <td className="px-4 py-3 font-bold">{i.invoice_no}{i.id === inv?.id && <span className="ml-1 text-xs text-brand">◀</span>}</td>
                      <td className="px-4 py-3">{d.businesses.find(b => b.id === i.seller_id)?.name.split(' ').slice(0, 2).join(' ')}</td>
                      <td className="px-4 py-3">{inrShort(i.total)}</td>
                      <td className="px-4 py-3"><GstChip invoice={i} /></td>
                      <td className="px-4 py-3"><StatusChip status={i.status} /></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <AskForBill buyer={buyer} businesses={d.businesses} run={run} busy={busy} requests={d.requests.filter(r => r.buyer_id === buyer?.id)} />
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-bold">{inv ? t('quick.journey', { no: inv.invoice_no }) : t('quick.journeyEmpty')}</div>
            {inv && <StatusChip status={inv.status} />}
          </div>
          {inv ? <div className="max-h-[440px] overflow-y-auto pr-1"><Timeline events={[...history].reverse()} /></div>
            : <p className="text-sm text-muted">{t('quick.journeyHint')}</p>}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */

function Phone({ title, role, icon, tone, children }) {
  const head = tone === 'accent' ? 'bg-accent' : 'bg-brand'
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="mx-auto w-full max-w-[400px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl">
      <div className="overflow-hidden rounded-[1.9rem] bg-canvas">
        <div className={`${head} px-5 pb-4 pt-3 text-white`}>
          <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-white/40" />
          <div className="flex items-center gap-2 text-xs font-semibold opacity-90">{icon}{role}</div>
          <div className="truncate font-display text-lg font-bold">{title}</div>
        </div>
        <div className="h-[520px] overflow-y-auto p-4">{children}</div>
      </div>
    </motion.div>
  )
}

function PhoneLoading() {
  return <div className="flex h-full items-center justify-center text-muted"><Loader2 className="animate-spin" /></div>
}

/* ---------------- BUYER ---------------- */
function BuyerScreen({ inv, items, sellerName, openDispute, notes, net, busy, run, onStart, canStart }) {
  const { t } = useLang()
  const [mode, setMode] = useState(null) // 'dispute' | 'reject'
  useEffect(() => { setMode(null) }, [inv?.id, inv?.status])

  if (!inv) return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <Smartphone size={44} className="mb-3 text-muted" />
      <div className="font-semibold">{t('quick.noBill')}</div>
      <p className="mb-5 mt-1 text-sm text-muted">{t('quick.noBillSub')}</p>
      <button onClick={onStart} disabled={!canStart || busy === 'start'} className="btn-accent">
        {busy === 'start' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{t('quick.start')}
      </button>
    </div>
  )

  if (inv.status === 'sent') return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted"><Bell size={14} className="text-accent" />{t('quick.justNow')}</div>
        <div className="mt-1 font-bold">{t('quick.newBill', { name: sellerName })}</div>
        <div className="text-sm text-muted">{inv.invoice_no} · {inr(inv.total)}</div>
        <button onClick={() => run('view', () => api.markViewed(inv.id))} disabled={busy === 'view'} className="btn-primary mt-3 w-full">
          {busy === 'view' && <Loader2 size={16} className="animate-spin" />}{t('quick.openBill')}
        </button>
      </div>
      <p className="text-center text-xs text-muted">{t('quick.autoImported')}</p>
    </motion.div>
  )

  const check = gstCheck(inv)
  const canAct = ['viewed', 'pending', 'corrected'].includes(inv.status)

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div><div className="text-xs text-muted">{inv.invoice_no} · {sellerName}</div><div className="font-display text-2xl font-bold">{inr(inv.total)}</div></div>
          <StatusChip status={inv.status} />
        </div>
        <div className="mt-2 space-y-1 border-t border-line pt-2 text-sm">
          {items.map(it => <div key={it.id} className="flex justify-between gap-2"><span className="truncate">{it.description}</span><span className="flex-none font-semibold">{Number(it.qty)} × {inr(it.rate)}</span></div>)}
          <div className="flex justify-between text-muted"><span>GST @ {Number(inv.gst_rate)}%</span><span>{inr(inv.gst_amount)}</span></div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-xs">
          <span className="font-semibold text-muted">{t('quick.portalCheck')}</span><GstChip invoice={inv} />
        </div>
        {check === 'mismatch' && <p className="mt-2 text-xs text-bad">{t('quick.mismatchHint', { amt: inr(inv.gst_reported_total) })}</p>}
        {check === 'missing' && <p className="mt-2 text-xs text-warn">{t('quick.missingHint')}</p>}
      </div>

      {notes.map(c => (
        <motion.div key={c.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-ok/30 bg-ok-soft p-3 text-sm">
          <div className="font-bold text-ok">{t('quick.noteGot', { kind: c.kind === 'debit' ? t('quick.debit') : t('quick.credit'), no: c.cn_no })}</div>
          <div>{c.reason}: {c.kind === 'debit' ? '+' : '−'}{inr(c.total)}</div>
          <div className="mt-1 font-bold">{t('quick.nowPayable', { amt: inr(net) })}</div>
        </motion.div>
      ))}

      {openDispute && (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-3 text-sm">
          <div className="flex items-center gap-2 font-bold text-accent"><Loader2 size={14} className="animate-spin" />{t('quick.sentReq')}</div>
          <div>{t('quick.waiting', { type: t(`dispute.${openDispute.type}`) })}</div>
        </div>
      )}

      {inv.status === 'accepted' && (
        <div className="rounded-2xl border border-ok/30 bg-ok-soft p-3 text-sm">
          <div className="font-bold text-ok">{t('quick.acceptedSync')}</div>
          <div>{t('quick.itcFlow')} <b>{inv.payment_status === 'paid' ? t('common.paid') : t('quick.due', { amt: inr(net) })}</b></div>
        </div>
      )}
      {inv.status === 'rejected' && (
        <div className="rounded-2xl border border-bad/30 bg-bad-soft p-3 text-sm"><div className="font-bold text-bad">{t('quick.rejected')}</div><div>{inv.action_note}</div></div>
      )}

      <AnimatePresence mode="wait">
        {canAct && !mode && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {inv.status === 'corrected' && <div className="text-center text-xs font-semibold text-ok">{t('quick.correctedHint')}</div>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => run('accept', () => api.buyerAction(inv.id, 'accept'), t('quick.t.accepted'))} disabled={!!busy} className="btn-ok">
                {busy === 'accept' && <Loader2 size={14} className="animate-spin" />}{t('quick.accept')}</button>
              <button onClick={() => run('pending', () => api.buyerAction(inv.id, 'pending', t('drawer.pendingNote')), t('quick.t.pending'))} disabled={!!busy || inv.status === 'pending'} className="btn-ghost">{t('quick.pending')}</button>
            </div>
            {inv.status !== 'corrected' && (
              <button onClick={() => setMode('dispute')} className="btn-accent w-full">{t('quick.askChange')}</button>
            )}
            <button onClick={() => setMode('reject')} className="btn-bad w-full">{t('quick.rejectWhole')}</button>
          </motion.div>
        )}
        {canAct && mode === 'dispute' && <DisputeForm key="d" inv={inv} items={items} busy={busy} run={run} onCancel={() => setMode(null)} />}
        {canAct && mode === 'reject' && <RejectForm key="r" inv={inv} busy={busy} run={run} onCancel={() => setMode(null)} />}
      </AnimatePresence>
    </div>
  )
}

function DisputeForm({ inv, items, busy, run, onCancel }) {
  const { t } = useLang()
  const it = items[0]
  const [type, setType] = useState(gstCheck(inv) === 'mismatch' ? 'gst' : 'quantity')
  const [qty, setQty] = useState(it ? Math.max(0, Number(it.qty) - 10) : 0)
  const [rate, setRate] = useState(it ? Math.round(Number(it.rate) * 0.95) : 0)
  const [note, setNote] = useState(gstCheck(inv) === 'mismatch' ? t('drawer.mismatchNote') : '')
  const rateFactor = 1 + Number(inv.gst_rate) / 100
  const preview = !it ? 0
    : type === 'quantity' || type === 'damaged' ? (Number(it.qty) - Number(qty)) * Number(it.rate) * rateFactor
    : type === 'rate' ? (Number(it.rate) - Number(rate)) * Number(it.qty) * rateFactor : 0

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      onSubmit={e => { e.preventDefault(); run('dispute', () => api.raiseDispute({
        invoiceId: inv.id, type, itemId: it?.id,
        receivedQty: ['quantity', 'damaged'].includes(type) ? Number(qty) : null,
        claimedRate: type === 'rate' ? Number(rate) : null, note,
      }), t('quick.t.sent')) }}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="font-bold">{t('quick.whatsWrong')}</div>
      <div className="flex flex-wrap gap-1.5">
        {['quantity', 'damaged', 'rate', 'gst'].map(k => (
          <button type="button" key={k} onClick={() => setType(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${type === k ? 'bg-accent text-white' : 'bg-canvas text-ink'}`}>{t(`dispute.${k}`)}</button>
        ))}
      </div>
      {it && ['quantity', 'damaged'].includes(type) && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{t('quick.onBill')}</label><div className="input bg-canvas">{Number(it.qty)}</div></div>
          <div><label className="label">{type === 'damaged' ? t('quick.goodCond') : t('quick.actualCame')}</label>
            <input type="number" min="0" max={Number(it.qty) - 1} value={qty} onChange={e => setQty(e.target.value)} className="input" required /></div>
        </div>
      )}
      {it && type === 'rate' && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{t('quick.billedRate')}</label><div className="input bg-canvas">{inr(it.rate)}</div></div>
          <div><label className="label">{t('quick.agreedRate')}</label><input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} className="input" required /></div>
        </div>
      )}
      <div><label className="label">{t('common.note')} {type === 'gst' ? t('common.required') : t('common.optional')}</label>
        <input value={note} onChange={e => setNote(e.target.value)} className="input" placeholder={t('quick.notePh')} maxLength={200} /></div>
      {preview > 0 && <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm">{t('quick.creditAsk', { amt: inr(preview) })}</div>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
        <button disabled={busy === 'dispute'} className="btn-accent">{busy === 'dispute' && <Loader2 size={14} className="animate-spin" />}{t('common.send')}</button>
      </div>
    </motion.form>
  )
}

function RejectForm({ inv, busy, run, onCancel }) {
  const { t } = useLang()
  const [reason, setReason] = useState('')
  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      onSubmit={e => { e.preventDefault(); run('reject', () => api.buyerAction(inv.id, 'reject', reason), t('quick.t.rejected')) }}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="font-bold">{t('quick.whyReject')}</div>
      <p className="text-xs text-muted">{t('quick.rejectTip')}</p>
      <input value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder={t('quick.rejectPh')} required minLength={3} maxLength={200} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
        <button disabled={busy === 'reject'} className="btn btn-bad !bg-bad !text-white">{t('quick.reject')}</button>
      </div>
    </motion.form>
  )
}

/* ---------------- SELLER ---------------- */
function SellerScreen({ inv, isMine, openDispute, history, requests, businesses, seller, busy, run, onStart, onPick }) {
  const { t, ev, ago } = useLang()
  const [tab, setTab] = useState('alerts')
  const alerts = [...history].filter(h => h.actor !== 'seller').reverse().slice(0, 6)
  const check = inv ? gstCheck(inv) : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 text-sm font-semibold">
        <button onClick={() => setTab('alerts')} className={`rounded-lg py-1.5 cursor-pointer ${tab === 'alerts' ? 'bg-brand text-white' : 'text-muted'}`}><Bell size={14} className="mr-1 inline" />{t('quick.alerts')}</button>
        <button onClick={() => setTab('requests')} className={`rounded-lg py-1.5 cursor-pointer ${tab === 'requests' ? 'bg-brand text-white' : 'text-muted'}`}>
          <Inbox size={14} className="mr-1 inline" />{t('quick.requests')} {requests.length > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-xs text-white">{requests.length}</span>}</button>
      </div>

      {tab === 'requests' ? (
        <SellerRequests requests={requests} businesses={businesses} seller={seller} busy={busy} run={run} onPick={onPick} />
      ) : !inv ? (
        <div className="py-10 text-center">
          <p className="mb-4 text-sm text-muted">{t('quick.sendNew')}</p>
          <button onClick={onStart} disabled={busy === 'start'} className="btn-primary"><Send size={16} />{t('quick.createSend')}</button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between"><span className="font-bold">{inv.invoice_no} · {inr(inv.total)}</span><StatusChip status={inv.status} /></div>
            {!isMine && <div className="mt-1 text-xs text-warn">{t('quick.notMine')}</div>}
          </div>

          <AnimatePresence>
            {openDispute && isMine && (
              <motion.div key={openDispute.id} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-2xl border-2 border-accent bg-white p-4 shadow-lg">
                <div className="flex items-center gap-2 font-bold text-accent">⚠️ {t(`dispute.${openDispute.type}`)}</div>
                <div className="mt-1 text-sm">
                  {['quantity', 'damaged'].includes(openDispute.type) && <><b>{t(openDispute.type === 'damaged' ? 'quick.damagedN' : 'quick.missingN', { n: Number(openDispute.expected_qty - openDispute.received_qty) })}</b> {t('quick.billedOk', { a: Number(openDispute.expected_qty), b: Number(openDispute.received_qty) })}</>}
                  {openDispute.type === 'rate' && <>{t('quick.rateSays', { a: inr(openDispute.billed_rate), b: inr(openDispute.claimed_rate) })}</>}
                  {['gst', 'other'].includes(openDispute.type) && openDispute.note}
                </div>
                {openDispute.note && openDispute.type !== 'gst' && <div className="mt-1 text-xs text-muted">"{openDispute.note}"</div>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => run('reject-d', () => api.resolveDispute(openDispute.id, false, t('drawer.sellerDisagrees')), t('quick.t.corrRejected'))} disabled={!!busy} className="btn-ghost">{t('quick.reject')}</button>
                  {['gst', 'other'].includes(openDispute.type) ? (
                    <button onClick={() => run('fix-gst', async () => { if (check !== 'match') await api.uploadToGst(inv.id); await api.resolveDispute(openDispute.id, true, 'GSTR-1A') }, t('quick.t.gstAmended'))} disabled={!!busy} className="btn-primary">{t('quick.fixGst')}</button>
                  ) : (
                    <button onClick={() => run('approve', () => api.resolveDispute(openDispute.id, true, 'OK'), t('quick.t.cnIssued'))} disabled={!!busy} className="btn-ok">
                      {busy === 'approve' && <Loader2 size={14} className="animate-spin" />}{t('quick.approve')}</button>
                  )}
                </div>
                {!['gst', 'other'].includes(openDispute.type) && <div className="mt-2 text-center text-xs text-muted">{t('quick.approveHint')}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          {isMine && check !== 'match' && !openDispute && (
            <button onClick={() => run('upload', () => api.uploadToGst(inv.id), t('quick.t.uploaded'))} disabled={!!busy} className="btn-primary w-full">
              <Upload size={16} />{check === 'missing' ? t('quick.upload') : t('quick.amend')}</button>
          )}
          {isMine && inv.status === 'accepted' && inv.payment_status === 'unpaid' && (
            <button onClick={() => run('paid', () => api.markPaid(inv.id), t('quick.t.paid'))} disabled={!!busy} className="btn-ok w-full"><IndianRupee size={16} />{t('quick.markPaid')}</button>
          )}

          <div className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">{t('quick.activity')}</div>
          <AnimatePresence initial={false}>
            {alerts.length === 0 && <p className="text-sm text-muted">{t('quick.noActivity')}</p>}
            {alerts.map(a => (
              <motion.div key={a.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-white p-3 text-sm shadow-sm">
                <div className="flex justify-between gap-2"><span className="font-semibold">{ev(a.event)}</span><span className="flex-none text-xs text-muted">{ago(a.created_at)}</span></div>
                {a.detail && <div className="text-xs text-muted">{ev(a.detail)}</div>}
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

function SellerRequests({ requests, businesses, seller, busy, run, onPick }) {
  const { t } = useLang()
  if (!requests.length) return <p className="py-8 text-center text-sm text-muted">{t('quick.noRequests')}<br />{t('quick.noRequests2')}</p>
  return (
    <div className="space-y-2">
      {requests.map(r => {
        const buyer = businesses.find(b => b.id === r.buyer_id)
        const amount = Number(r.approx_amount || 11800)
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
            <div className="font-bold">📩 {buyer?.name}</div>
            <div>{t('quick.ref')}: {r.reference}{r.approx_amount ? ` · ~${inr(r.approx_amount)}` : ''}</div>
            {r.note && <div className="text-xs text-muted">"{r.note}"</div>}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => run('decline-' + r.id, () => api.declineRequest(r.id, t('req.alreadyBilled')), t('quick.t.declined'))} disabled={!!busy} className="btn-ghost !py-2">{t('quick.decline')}</button>
              <button disabled={!!busy} className="btn-primary !py-2" onClick={async () => {
                const id = await run('bill-' + r.id, () => api.createInvoice({
                  sellerId: seller.id, buyerId: r.buyer_id, gstRate: 18, requestId: r.id, uploadToGst: true,
                  items: [{ description: t('create.goodsAsPer', { ref: r.reference }).slice(0, 120), hsn: '3917', qty: 1, unit: 'lot', rate: Math.round(amount / 1.18) }],
                }), t('quick.t.billCreated'))
                if (id) onPick(id)
              }}>{t('quick.createBill')}</button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ---------------- ASK FOR BILL (buyer) ---------------- */
function AskForBill({ buyer, businesses, run, busy, requests }) {
  const { t } = useLang()
  const sellers = businesses.filter(b => b.kind !== 'buyer')
  const [sellerId, setSellerId] = useState('')
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  useEffect(() => { if (!sellerId && sellers[0]) setSellerId(sellers.find(s => s.gstin === SELLER_GSTIN)?.id ?? sellers[0].id) }, [sellers, sellerId])
  if (!buyer) return null
  return (
    <div className="border-t border-line bg-canvas/60 p-5">
      <div className="font-bold">{t('quick.askTitle')} <span className="text-accent">{t('quick.askWord')}</span></div>
      <p className="mb-3 text-xs text-muted">{t('quick.askSub')}</p>
      <form className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]" onSubmit={async e => {
        e.preventDefault()
        const ok = await run('ask', () => api.requestInvoice({ buyerId: buyer.id, sellerId, reference, amount: amount ? Number(amount) : null, note: t('req.messagePh') }), t('quick.t.reqSent'))
        if (ok !== undefined) { setReference(''); setAmount('') }
      }}>
        <select value={sellerId} onChange={e => setSellerId(e.target.value)} className="input">
          {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={reference} onChange={e => setReference(e.target.value)} className="input" placeholder={t('quick.refPh')} required minLength={2} maxLength={80} />
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" className="input" placeholder={t('quick.amtPh')} />
        <button disabled={busy === 'ask'} className="btn-accent">{busy === 'ask' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('common.send')}</button>
      </form>
      {requests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {requests.slice(0, 4).map(r => (
            <Chip key={r.id} tone={r.status === 'open' ? 'warn' : r.status === 'fulfilled' ? 'ok' : 'muted'}>
              {r.reference} · {businesses.find(b => b.id === r.seller_id)?.name.split(' ')[0]} · {r.status === 'open' ? t('quick.waitingChip') : r.status === 'fulfilled' ? t('req.billed', { no: '' }).replace(/[·\s]+$/, '') : t('req.declined')}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
