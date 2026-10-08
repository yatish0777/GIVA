import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Factory, Store, Plus, Loader2, LayoutDashboard, Inbox } from 'lucide-react'
import { useData } from '../lib/data'
import { inr, gstCheck, netPayable } from '../lib/format'
import { LiveDot, Modal, Stat, Tabs } from '../components/ui'
import { useLang } from '../i18n'
import CreateInvoice from './CreateInvoice'
import InvoiceDrawer from './InvoiceDrawer'
import { InvoiceList, Requests, Notes, Inventory, Returns } from './Panels'
import { useLiveToasts } from './useLiveToasts'

const LS = 'giva-mvp'
function load() { try { return JSON.parse(localStorage.getItem(LS)) || {} } catch { return {} } }
function save(v) { try { localStorage.setItem(LS, JSON.stringify(v)) } catch { /* ignore */ } }

export default function Mvp() {
  const d = useData()
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const saved = useMemo(load, [])
  // the URL decides the role, so a "Buyer" tab and a "Seller" tab can stay open side by side
  const urlRole = params.get('role')
  const [role, setRoleState] = useState(urlRole === 'seller' || urlRole === 'buyer' ? urlRole : (saved.role || 'buyer'))
  const [ids, setIds] = useState({ buyer: params.get('role') === 'buyer' && params.get('biz') || saved.buyer, seller: params.get('role') === 'seller' && params.get('biz') || saved.seller })
  const [tab, setTab] = useState('invoices')
  const [openId, setOpenId] = useState(null)
  const [creating, setCreating] = useState(null)

  const buyers = d.businesses.filter(b => b.kind !== 'seller')
  const sellers = d.businesses.filter(b => b.kind !== 'buyer')
  const list = role === 'buyer' ? buyers : sellers
  const business = list.find(b => b.id === ids[role]) || (role === 'buyer' ? buyers.find(b => b.gstin === '27ABMPS9876Q1Z3') : sellers.find(b => b.gstin === '27AABCA1234F1Z5')) || list[0]

  function setRole(r) {
    setRoleState(r); setTab('invoices')
    setParams(p => { const n = new URLSearchParams(p); n.set('role', r); n.delete('biz'); return n }, { replace: true })
  }
  function setBusiness(id) {
    setIds(s => ({ ...s, [role]: id }))
    setParams(p => { const n = new URLSearchParams(p); n.set('role', role); n.set('biz', id); return n }, { replace: true })
  }

  useEffect(() => { save({ role, ...ids }) }, [role, ids])
  useEffect(() => { setOpenId(null) }, [role, business?.id])
  useEffect(() => { document.title = t('mvp.pageTitle', { role: t(`mvp.${role}`) }) + (business ? ` · ${business.name}` : '') }, [role, business, t])
  useLiveToasts(role, business?.id)

  if (d.loading) return <div className="flex items-center justify-center gap-2 py-24 text-muted"><Loader2 className="animate-spin" />{t('common.loading')}</div>
  if (d.error || !business) return <div className="card p-6 text-bad">{t('common.dbError')}{d.error ? `: ${d.error}` : ''}</div>

  const mine = d.invoices.filter(i => role === 'buyer' ? i.buyer_id === business.id : i.seller_id === business.id)
  const myReq = d.requests.filter(r => (role === 'buyer' ? r.buyer_id : r.seller_id) === business.id && r.status === 'open')
  const openDisputes = d.disputes.filter(x => x.status === 'open' && mine.some(i => i.id === x.invoice_id))
  const needAction = mine.filter(i => ['sent', 'viewed', 'corrected'].includes(i.status)).length
  const outstanding = mine.filter(i => i.status === 'accepted' && i.payment_status === 'unpaid').reduce((s, i) => s + netPayable(i, d.creditNotes), 0)
  const itc = mine.filter(i => i.status === 'accepted').reduce((s, i) => s + Number(i.gst_amount), 0)

  const tabs = [
    { id: 'invoices', label: role === 'buyer' ? t('mvp.tabs.received') : t('mvp.tabs.issued'), count: role === 'buyer' ? needAction : openDisputes.length },
    { id: 'requests', label: role === 'buyer' ? t('mvp.tabs.ask') : t('mvp.tabs.requests'), count: role === 'seller' ? myReq.length : 0 },
    { id: 'notes', label: t('mvp.tabs.notes') },
    { id: 'inventory', label: t('mvp.tabs.inventory') },
    { id: 'returns', label: t('mvp.tabs.returns') },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-canvas shadow-xl">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex rounded-xl bg-canvas p-1">
          {[['buyer', Store], ['seller', Factory]].map(([r, Icon]) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer ${role === r ? (r === 'buyer' ? 'bg-accent text-white' : 'bg-brand text-white') : 'text-muted'}`}>
              <Icon size={15} />{t(`mvp.${r}`)}</button>
          ))}
        </div>
        <select value={business.id} onChange={e => setBusiness(e.target.value)} className="input !w-auto !py-2 font-semibold" aria-label={t('mvp.business')}>
          {list.map(b => <option key={b.id} value={b.id}>{b.name} · {b.city}</option>)}
        </select>
        <span className="hidden text-xs text-muted md:inline">GSTIN {business.gstin}</span>
        <div className="ml-auto flex items-center gap-3">
          <LiveDot live={d.live} />
          {role === 'seller' && <button onClick={() => setCreating({})} className="btn-primary !py-2"><Plus size={16} />{t('mvp.newInvoice')}</button>}
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {role === 'buyer' ? <>
            <Stat label={t('mvp.st.action')} value={needAction} tone="brand" icon={<Inbox size={14} />} />
            <Stat label={t('mvp.st.disputed')} value={mine.filter(i => i.status === 'disputed').length} tone="bad" />
            <Stat label={t('mvp.st.itc')} value={inr(itc)} tone="ok" />
            <Stat label={t('mvp.st.toPay')} value={inr(outstanding)} tone="warn" />
          </> : <>
            <Stat label={t('mvp.st.issued')} value={mine.length} tone="brand" icon={<LayoutDashboard size={14} />} />
            <Stat label={t('mvp.st.review')} value={openDisputes.length} tone="accent" />
            <Stat label={t('mvp.st.notGst')} value={mine.filter(i => gstCheck(i) !== 'match').length} tone="bad" />
            <Stat label={t('mvp.st.toReceive')} value={inr(outstanding)} tone="ok" />
          </>}
        </div>

        {role === 'seller' && openDisputes.length > 0 && tab === 'invoices' && (
          <button onClick={() => setOpenId(openDisputes[0].invoice_id)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-accent bg-white p-4 text-left cursor-pointer">
            <span className="text-2xl">⚠️</span>
            <span className="flex-1 font-medium">{t('mvp.banner', { n: openDisputes.length })}</span>
            <span className="font-semibold text-accent">{t('mvp.review')}</span>
          </button>
        )}

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === 'invoices' && <InvoiceList role={role} business={business} onOpen={setOpenId} />}
        {tab === 'requests' && <Requests role={role} business={business} onCreateFromRequest={r => setCreating({ request: r })} />}
        {tab === 'notes' && <Notes role={role} business={business} onOpen={setOpenId} />}
        {tab === 'inventory' && <Inventory role={role} business={business} />}
        {tab === 'returns' && <Returns role={role} business={business} />}
      </div>

      <InvoiceDrawer invoiceId={openId} role={role} onClose={() => setOpenId(null)} />

      <Modal open={!!creating} onClose={() => setCreating(null)} title={creating?.request ? t('mvp.createForReq') : t('mvp.createTitle')} width="max-w-2xl">
        {creating && role === 'seller' && (
          <CreateInvoice seller={business} buyers={d.businesses.filter(b => b.id !== business.id && b.kind !== 'seller')} request={creating.request}
            onCancel={() => setCreating(null)} onDone={id => { setCreating(null); setTab('invoices'); setOpenId(id); d.refresh() }} />
        )}
      </Modal>
    </div>
  )
}
