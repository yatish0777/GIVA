import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Inbox, AlertTriangle, Landmark, Wallet, TrendingUp, ArrowRight, FilePlus2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useData } from '../../lib/data'
import { useLang } from '../../i18n'
import { gstCheck, inr, inrShort, netPayable, lastMonths, daysBetween } from '../../lib/format'
import { Stat } from '../../components/ui'
import { MonthBars, HBars, StatusBar, Ring } from '../charts'
import { useApp, isMine, otherParty } from '../ctx'

const ROUTE = { invoices: 'invoices', returns: 'returns', new: 'new', corrections: 'disputes', receivables: 'payments' }

export default function Dashboard() {
  const d = useData()
  const { t, ev, ago, fdate, locale } = useLang()
  const { role, business, base } = useApp()
  const buyer = role === 'buyer'
  const mine = d.invoices.filter(i => isMine(i, role, business.id))
  const name = id => d.businesses.find(b => b.id === id)?.name ?? '—'
  const short = id => name(id).split(' ').slice(0, 2).join(' ')

  const months = lastMonths(6)
  const monthly = months.map(m => {
    const list = mine.filter(i => String(i.invoice_date).slice(0, 7) === m)
    return { key: m, label: new Date(m + '-01').toLocaleDateString(`${locale}-u-nu-latn`, { month: 'short' }), value: list.reduce((s, i) => s + Number(i.total), 0), count: list.length }
  })
  const thisMonth = monthly[monthly.length - 1]

  const unpaid = mine.filter(i => i.status === 'accepted' && i.payment_status === 'unpaid')
  const outstanding = unpaid.reduce((s, i) => s + netPayable(i, d.creditNotes), 0)
  const overdue = unpaid.filter(i => daysBetween(i.due_date) < 0).length
  const openDisputes = d.disputes.filter(x => x.status === 'open' && mine.some(i => i.id === x.invoice_id))
  const matched = mine.filter(i => gstCheck(i) === 'match').length
  const compliance = mine.length ? Math.round((matched / mine.length) * 100) : 100
  const itc = mine.filter(i => i.status === 'accepted').reduce((s, i) => s + Number(i.gst_amount), 0)

  const parties = useMemo(() => {
    const m = new Map()
    for (const i of mine) { const k = otherParty(i, role); const r = m.get(k) || { value: 0, n: 0 }; r.value += Number(i.total); r.n++; m.set(k, r) }
    return [...m.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5)
  }, [mine, role])

  const statusSeg = [
    { key: 'accepted', tone: 'ok' }, { key: 'viewed', tone: 'brand', match: ['sent', 'viewed', 'corrected'] }, { key: 'pending', tone: 'warn' },
    { key: 'disputed', tone: 'bad' }, { key: 'rejected', tone: 'muted' },
  ].map(s => ({ ...s, label: t(`status.${s.key}`), count: mine.filter(i => (s.match ?? [s.key]).includes(i.status)).length }))

  // ACTION CENTER
  const actions = []
  if (buyer) {
    for (const i of mine) {
      const p = short(i.seller_id)
      if (i.status === 'sent') actions.push({ id: i.id, tone: 'brand', text: t('app.dash.act.newBill', { no: i.invoice_no, name: p }), cta: t('app.dash.act.review') })
      else if (i.status === 'corrected') actions.push({ id: i.id, tone: 'ok', text: t('app.dash.act.corrected', { no: i.invoice_no }), cta: t('app.dash.act.accept') })
      else if (i.status === 'viewed' && gstCheck(i) === 'missing') actions.push({ id: i.id, tone: 'warn', text: t('app.dash.act.gstMissing', { no: i.invoice_no }), cta: t('app.dash.act.check') })
      else if (i.status === 'viewed' && gstCheck(i) === 'mismatch') actions.push({ id: i.id, tone: 'bad', text: t('app.dash.act.gstMismatch', { no: i.invoice_no }), cta: t('app.dash.act.check') })
      else if (i.status === 'viewed') actions.push({ id: i.id, tone: 'brand', text: t('app.dash.act.newBill', { no: i.invoice_no, name: p }), cta: t('app.dash.act.review') })
      else if (i.status === 'pending') actions.push({ id: i.id, tone: 'warn', text: t('app.dash.act.pending', { no: i.invoice_no }), cta: t('app.dash.act.decide') })
    }
    for (const i of unpaid) actions.push({ to: 'payments', tone: daysBetween(i.due_date) < 0 ? 'bad' : 'muted', text: t('app.dash.act.due', { amt: inr(netPayable(i, d.creditNotes)), name: short(i.seller_id), date: fdate(i.due_date, { day: '2-digit', month: 'short' }) }), cta: t('app.dash.act.pay') })
  } else {
    for (const x of openDisputes) { const i = mine.find(v => v.id === x.invoice_id); actions.push({ id: i.id, tone: 'bad', text: t('app.dash.act.dispute', { no: i.invoice_no, type: t(`dispute.${x.type}`) }), cta: t('app.dash.act.resolve') }) }
    for (const r of d.requests.filter(r => r.seller_id === business.id && r.status === 'open')) actions.push({ to: 'requests', tone: 'accent', text: t('app.dash.act.request', { name: short(r.buyer_id), ref: r.reference }), cta: t('app.dash.act.create') })
    for (const i of mine.filter(i => gstCheck(i) !== 'match' && i.status !== 'rejected')) actions.push({ id: i.id, tone: 'warn', text: t('app.dash.act.upload', { no: i.invoice_no }), cta: t('app.dash.act.uploadBtn') })
    for (const i of unpaid) actions.push({ to: 'payments', tone: daysBetween(i.due_date) < 0 ? 'bad' : 'ok', text: t('app.dash.act.collect', { amt: inr(netPayable(i, d.creditNotes)), name: short(i.buyer_id) }), cta: t('app.dash.act.collectBtn') })
  }

  const ids = new Set(mine.map(i => i.id))
  const activity = d.history.filter(h => ids.has(h.invoice_id)).slice(-8).reverse()
  const dot = { brand: 'bg-brand', ok: 'bg-ok', warn: 'bg-[#d99a06]', bad: 'bg-bad', accent: 'bg-accent', muted: 'bg-[#a6adbb]' }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">{fdate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t('app.dash.hello', { name: business.name })}</h1>
          <p className="text-muted">{t('app.dash.today')}</p>
        </div>
        {!buyer && <Link to={`${base}/new`} className="btn-primary"><FilePlus2 size={16} />{t('app.nav.newInvoice')}</Link>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {buyer ? <>
          <Stat label={t('app.dash.needAction')} value={mine.filter(i => ['sent', 'viewed', 'corrected'].includes(i.status)).length} tone="brand" icon={<Inbox size={14} />} />
          <Stat label={t('app.dash.disputed')} value={openDisputes.length} tone="bad" icon={<AlertTriangle size={14} />} />
          <Stat label={t('app.dash.itcMonth')} value={inr(itc)} tone="ok" icon={<Landmark size={14} />} />
          <Stat label={t('app.dash.toPay') + (overdue ? ` · ${t('app.dash.overdueN', { n: overdue })}` : '')} value={inr(outstanding)} tone="warn" icon={<Wallet size={14} />} />
        </> : <>
          <Stat label={t('app.dash.salesMonth')} value={inr(thisMonth.value)} tone="brand" icon={<TrendingUp size={14} />} />
          <Stat label={t('app.dash.toReceive') + (overdue ? ` · ${t('app.dash.overdueN', { n: overdue })}` : '')} value={inr(outstanding)} tone="ok" icon={<Wallet size={14} />} />
          <Stat label={t('app.dash.corrections')} value={openDisputes.length} tone="accent" icon={<AlertTriangle size={14} />} />
          <Stat label={t('app.dash.notOnGst')} value={mine.filter(i => gstCheck(i) !== 'match').length} tone="bad" icon={<Landmark size={14} />} />
        </>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title={t('app.dash.actionCenter')} right={actions.length > 0 && <span className="rounded-full bg-accent px-2 text-xs font-bold text-white">{actions.length}</span>}>
          {actions.length === 0 ? <div className="flex items-center gap-2 py-6 text-sm text-ok"><CheckCircle2 size={18} />{t('app.dash.allClear')}</div> : (
            <div className="-mx-1 max-h-[340px] space-y-1 overflow-y-auto px-1">
              {actions.slice(0, 12).map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={a.id ? `${base}/invoices/${a.id}` : `${base}/${a.to}`} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-canvas">
                    <span className={`h-2.5 w-2.5 flex-none rounded-full ${dot[a.tone]}`} />
                    <span className="flex-1 text-sm">{a.text}</span>
                    <span className="flex flex-none items-center gap-1 text-xs font-semibold text-brand">{a.cta}<ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card title={<span className="flex items-center gap-2"><Sparkles size={16} className="text-accent" />{t('app.dash.tour')}</span>} sub={t('app.dash.tourSub')}>
          <ol className="space-y-2">
            {t(buyer ? 'app.dash.tourBuyer' : 'app.dash.tourSeller').map(([text, to], i) => (
              <li key={i}>
                <Link to={`${base}/${ROUTE[to]}`} className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 text-sm hover:bg-brand-soft">
                  <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${buyer ? 'bg-accent' : 'bg-brand'}`}>{i + 1}</span>
                  <span className="flex-1">{text}</span><ArrowRight size={14} className="text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={buyer ? t('app.dash.purchases') : t('app.dash.sales')} sub={t('app.dash.lastMonths')}>
          <MonthBars data={monthly} tone={buyer ? 'accent' : 'brand'} tooltip={m => t('app.dash.tooltip', { amt: inr(m.value), n: m.count })} />
        </Card>
        <Card title={t('app.dash.statusMix')} sub={t('app.dash.invoicesN', { n: mine.length })}>
          <StatusBar segments={statusSeg} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={buyer ? t('app.dash.topSuppliers') : t('app.dash.topCustomers')} sub={t('app.dash.byValue')}>
          {parties.length ? <HBars tone={buyer ? 'accent' : 'brand'} rows={parties.map(([id, r]) => ({ label: short(id), value: r.value, sub: t('app.dash.invoicesN', { n: r.n }) }))} />
            : <p className="text-sm text-muted">{t('app.parties.none')}</p>}
        </Card>

        {buyer ? (
          <Card title={t('app.dash.itcMonth')} sub="GSTR-2B">
            <div className="flex items-center gap-5">
              <Ring pct={mine.length ? Math.round(mine.filter(i => i.status === 'accepted').length / mine.length * 100) : 0} tone="ok">
                <span className="font-display text-xl font-bold">{inrShort(itc)}</span>
              </Ring>
              <div className="space-y-1.5 text-sm">
                {statusSeg.slice(0, 4).map(s => <div key={s.key} className="flex gap-2"><span className="w-20 text-muted">{s.label}</span><b>{s.count}</b></div>)}
                <Link to={`${base}/returns`} className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-brand">{t('app.nav.returns')}<ArrowRight size={12} /></Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card title={t('app.dash.ageing')} sub={t('app.dash.ageingSub')}>
            <HBars tone="brand" format={inr} rows={[[0, 30], [31, 45], [46, 9999]].map(([a, b], i) => {
              const list = unpaid.filter(x => { const age = -daysBetween(x.invoice_date); return age >= a && age <= b })
              return { label: t('app.dash.buckets')[i], value: list.reduce((s, x) => s + netPayable(x, d.creditNotes), 0), sub: list.length }
            })} />
          </Card>
        )}

        <Card title={buyer ? t('app.parties.score') : t('app.dash.compliance')} sub={t('app.dash.complianceSub', { a: matched, b: mine.length })}>
          <div className="flex items-center gap-5">
            <Ring pct={compliance} tone={compliance >= 90 ? 'ok' : compliance >= 70 ? 'warn' : 'bad'}>
              <span className="font-display text-2xl font-bold">{compliance}%</span>
            </Ring>
            <div className="space-y-1.5 text-sm">
              <div className="flex gap-2"><span className="w-24 text-muted">{t('gst.match')}</span><b>{matched}</b></div>
              <div className="flex gap-2"><span className="w-24 text-muted">{t('gst.mismatch')}</span><b>{mine.filter(i => gstCheck(i) === 'mismatch').length}</b></div>
              <div className="flex gap-2"><span className="w-24 text-muted">{t('gst.missing')}</span><b>{mine.filter(i => gstCheck(i) === 'missing').length}</b></div>
            </div>
          </div>
        </Card>
      </div>

      <Card title={t('app.dash.activity')} right={<Link to={`${base}/invoices`} className="text-xs font-semibold text-brand">{t('app.dash.viewAll')}</Link>}>
        {activity.length === 0 ? <p className="text-sm text-muted">{t('app.dash.noActivity')}</p> : (
          <div className="divide-y divide-line">
            {activity.map(e => {
              const inv = mine.find(i => i.id === e.invoice_id)
              return (
                <Link key={e.id} to={`${base}/invoices/${e.invoice_id}`} className="flex items-center gap-3 py-2.5 text-sm hover:bg-canvas/60">
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${e.actor === 'seller' ? 'bg-brand' : e.actor === 'buyer' ? 'bg-accent' : 'bg-ink'}`}>{t(`actor.${e.actor}`).slice(0, 1)}</span>
                  <span className="min-w-0 flex-1"><b>{inv?.invoice_no}</b> · {ev(e.event)}{e.detail && <span className="block truncate text-xs text-muted">{ev(e.detail)}</span>}</span>
                  <span className="flex-none text-xs text-muted">{ago(e.created_at)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export function Card({ title, sub, right, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><h2 className="font-display text-base font-bold">{title}</h2>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}
