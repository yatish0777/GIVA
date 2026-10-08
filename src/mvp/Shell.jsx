import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, FilePlus2, MailQuestion, AlertTriangle, Wallet, Users, FileMinus, Package, Landmark,
  Building2, Bell, Search, Menu, X, ArrowLeftRight, Globe, Loader2, Store, Factory, ChevronDown, Repeat,
} from 'lucide-react'
import { useData } from '../lib/data'
import { LangSwitch, useLang } from '../i18n'
import { LiveDot, Logo } from '../components/ui'
import { AppCtx, DEFAULT_BIZ, isMine, readBiz, writeBiz } from './ctx'
import { useLiveToasts } from './useLiveToasts'

function navItems(role, t, counts) {
  const b = role === 'buyer'
  return [
    { group: t('app.nav.groups.main') },
    { to: '', icon: LayoutDashboard, label: t('app.nav.dashboard'), end: true },
    !b && { to: 'new', icon: FilePlus2, label: t('app.nav.newInvoice'), cta: true },
    { to: 'invoices', icon: FileText, label: b ? t('app.nav.received') : t('app.nav.issued'), badge: counts.invoices },
    { to: 'requests', icon: MailQuestion, label: b ? t('app.nav.ask') : t('app.nav.requests'), badge: counts.requests },
    { to: 'disputes', icon: AlertTriangle, label: b ? t('app.nav.disputes') : t('app.nav.corrections'), badge: counts.disputes },
    { group: t('app.nav.groups.money') },
    { to: 'payments', icon: Wallet, label: b ? t('app.nav.payments') : t('app.nav.receivables'), badge: counts.payments },
    { to: 'notes', icon: FileMinus, label: t('app.nav.notes') },
    { to: 'returns', icon: Landmark, label: t('app.nav.returns') },
    { group: t('app.nav.groups.more') },
    { to: 'parties', icon: Users, label: b ? t('app.nav.suppliers') : t('app.nav.customers') },
    { to: 'inventory', icon: Package, label: t('app.nav.inventory') },
    { to: 'profile', icon: Building2, label: t('app.nav.profile') },
  ].filter(Boolean)
}

export default function Shell() {
  const { role } = useParams()
  const d = useData()
  const { t, ev, ago } = useLang()
  const nav = useNavigate()
  const loc = useLocation()
  const [bizId, setBizId] = useState(() => readBiz(role))
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => { setBizId(readBiz(role)) }, [role])
  useEffect(() => { setMobileOpen(false) }, [loc.pathname])

  const valid = role === 'buyer' || role === 'seller'
  const list = d.businesses.filter(b => (role === 'buyer' ? b.kind !== 'seller' : b.kind !== 'buyer'))
  const business = list.find(b => b.id === bizId) || list.find(b => b.gstin === DEFAULT_BIZ[role]) || list[0]
  useLiveToasts(valid ? role : null, business?.id)

  const ctx = useMemo(() => ({
    role, business,
    base: `/app/${role}`,
    setBusiness: (id) => { writeBiz(role, id); setBizId(id) },
  }), [role, business])

  useEffect(() => {
    if (business) document.title = `GIVA · ${business.name} (${t(`mvp.${role}`)})`
  }, [business, role, t])

  if (!valid) return <Navigate to="/app" replace />
  if (d.loading) return <div className="flex min-h-screen items-center justify-center gap-2 text-muted"><Loader2 className="animate-spin" />{t('common.loading')}</div>
  if (d.error || !business) return <div className="m-6 card p-6 text-bad">{t('common.dbError')}{d.error ? `: ${d.error}` : ''}</div>

  const mine = d.invoices.filter(i => isMine(i, role, business.id))
  const counts = {
    invoices: role === 'buyer' ? mine.filter(i => ['sent', 'viewed', 'corrected'].includes(i.status)).length : 0,
    requests: role === 'seller' ? d.requests.filter(r => r.seller_id === business.id && r.status === 'open').length : 0,
    disputes: d.disputes.filter(x => x.status === 'open' && mine.some(i => i.id === x.invoice_id)).length,
    payments: mine.filter(i => i.status === 'accepted' && i.payment_status === 'unpaid').length,
  }
  const items = navItems(role, t, counts)
  const accent = role === 'buyer' ? 'bg-accent' : 'bg-brand'

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-4"><Logo /><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${accent}`}>{t(`mvp.${role}`)}</span></div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((it, i) => it.group ? (
          <div key={i} className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted">{it.group}</div>
        ) : (
          <NavLink key={it.to} to={it.to} end={it.end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${it.cta && !isActive ? 'mb-1 bg-brand-soft text-brand' : ''} ${isActive ? `${accent} text-white shadow-sm` : 'text-ink/75 hover:bg-canvas hover:text-ink'}`}>
            {({ isActive }) => <>
              <it.icon size={18} />
              <span className="flex-1 truncate">{it.label}</span>
              {it.badge > 0 && <span className={`rounded-full px-1.5 text-[11px] font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-accent text-white'}`}>{it.badge}</span>}
            </>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        <button onClick={() => nav(`/app/${role === 'buyer' ? 'seller' : 'buyer'}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-canvas cursor-pointer">
          <ArrowLeftRight size={18} />{t('app.nav.switchTo', { role: t(`mvp.${role === 'buyer' ? 'seller' : 'buyer'}`) })}
        </button>
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-canvas"><Globe size={18} />{t('app.nav.website')}</Link>
      </div>
    </div>
  )

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-screen bg-canvas lg:pl-64">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
              <motion.aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-1 text-muted" aria-label="Close"><X size={20} /></button>
                {sidebar}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <TopBar role={role} business={business} list={list} onMenu={() => setMobileOpen(true)} mine={mine} accent={accent} setBusiness={ctx.setBusiness} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </AppCtx.Provider>
  )

}

function TopBar({ role, business, list, onMenu, mine, accent, setBusiness }) {
  const { t, ev, ago } = useLang()
  const d = useData()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
        <button onClick={onMenu} className="rounded-lg p-1.5 text-ink lg:hidden" aria-label={t('app.nav.menu')}><Menu size={22} /></button>
        <SearchBox role={role} />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden md:block"><LiveDot live={d.live} /></span>
          <span className="hidden sm:block"><LangSwitch /></span>
          <Notifications role={role} business={business} mine={mine} ev={ev} ago={ago} t={t} />
          <BizMenu role={role} business={business} list={list} accent={accent} setBusiness={setBusiness} />
        </div>
      </div>
    </header>
  )
}

function BizMenu({ role, business, list, accent, setBusiness }) {
  const { t } = useLang()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const Icon = role === 'buyer' ? Store : Factory
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-2 hover:bg-canvas cursor-pointer">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${accent}`}><Icon size={16} /></span>
        <span className="hidden max-w-[160px] text-left md:block">
          <span className="block truncate text-sm font-semibold leading-tight">{business.name}</span>
          <span className="block text-[11px] text-muted">{business.gstin}</span>
        </span>
        <ChevronDown size={16} className="text-muted" />
      </button>
      <AnimatePresence>
        {open && <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted">{t('app.nav.changeBiz')}</div>
            {list.map(b => (
              <button key={b.id} onClick={() => { setBusiness(b.id); setOpen(false); nav(`/app/${role}`) }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-canvas cursor-pointer ${b.id === business.id ? 'font-bold text-brand' : ''}`}>
                <span className="truncate">{b.name}<span className="block text-[11px] font-normal text-muted">{b.gstin}</span></span>
                {b.id === business.id && <span>✓</span>}
              </button>
            ))}
            <div className="border-t border-line p-2">
              <button onClick={() => nav(`/app/${role === 'buyer' ? 'seller' : 'buyer'}`)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-canvas cursor-pointer">
                <Repeat size={16} />{t('app.nav.switchTo', { role: t(`mvp.${role === 'buyer' ? 'seller' : 'buyer'}`) })}</button>
              <div className="px-3 py-2 sm:hidden"><LangSwitch /></div>
            </div>
          </motion.div>
        </>}
      </AnimatePresence>
    </div>
  )
}

function SearchBox({ role }) {
  const { t } = useLang()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); nav(`/app/${role}/invoices?q=${encodeURIComponent(q)}`) }} className="relative hidden w-full max-w-xs sm:block">
      <Search size={15} className="absolute left-3 top-2.5 text-muted" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('app.top.search')} className="input !rounded-full !py-2 !pl-9" />
    </form>
  )
}

function Notifications({ role, business, mine, ev, ago, t }) {
  const d = useData()
  const nav = useNavigate()
  const key = `giva-seen-${role}-${business.id}`
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem(key) || '1970' } catch { return '1970' } })
  const [open, setOpen] = useState(false)
  const btn = useRef(null)
  useEffect(() => { try { setSeen(localStorage.getItem(key) || '1970') } catch { /* ignore */ } }, [key])

  const ids = new Set(mine.map(i => i.id))
  const events = d.history.filter(h => ids.has(h.invoice_id) && h.actor !== role).slice(-25).reverse()
  const unread = events.filter(e => e.created_at > seen).length
  const markRead = () => { const now = new Date().toISOString(); setSeen(now); try { localStorage.setItem(key, now) } catch { /* ignore */ } }

  return (
    <div className="relative">
      <button ref={btn} onClick={() => setOpen(o => !o)} className="relative rounded-xl border border-line bg-white p-2 hover:bg-canvas cursor-pointer" aria-label={t('app.top.notif')}>
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-bad px-1 text-center text-[11px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="fixed left-3 right-3 top-14 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-bold">{t('app.top.notif')}</span>
              {unread > 0 && <button onClick={markRead} className="text-xs font-semibold text-brand cursor-pointer">{t('app.top.markRead')}</button>}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {events.length === 0 && <div className="p-8 text-center text-sm text-muted">{t('app.top.noNotif')}</div>}
              {events.map(e => {
                const inv = mine.find(i => i.id === e.invoice_id)
                const isNew = e.created_at > seen
                return (
                  <button key={e.id} onClick={() => { setOpen(false); nav(`/app/${role}/invoices/${e.invoice_id}`) }}
                    className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-canvas cursor-pointer ${isNew ? 'bg-brand-soft/40' : ''}`}>
                    <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${isNew ? 'bg-brand' : 'bg-transparent'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{inv?.invoice_no} · {ev(e.event)}</span>
                      {e.detail && <span className="block truncate text-xs text-muted">{ev(e.detail)}</span>}
                      <span className="block text-[11px] text-muted">{t(`actor.${e.actor}`)} · {ago(e.created_at)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>}
      </AnimatePresence>
    </div>
  )
}
