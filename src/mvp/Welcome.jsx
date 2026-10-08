import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Store, Factory, Check, ArrowLeft, ArrowRight, Loader2, BadgeCheck } from 'lucide-react'
import { useData } from '../lib/data'
import { LangSwitch, useLang } from '../i18n'
import { Logo } from '../components/ui'
import { stateOf } from '../lib/format'
import { DEFAULT_BIZ, readBiz, writeBiz } from './ctx'

const ROLES = {
  buyer: { icon: Store, grad: 'from-accent to-[#f6a14d]', ring: 'ring-accent' },
  seller: { icon: Factory, grad: 'from-brand to-[#3b5be0]', ring: 'ring-brand' },
}

export default function Welcome() {
  const { t } = useLang()
  const d = useData()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const legacy = params.get('role')
  const [role, setRole] = useState(params.get('pick') || null)
  const [biz, setBiz] = useState(null)

  const list = role ? d.businesses.filter(b => (role === 'buyer' ? b.kind !== 'seller' : b.kind !== 'buyer')) : []
  useEffect(() => {
    if (!role || !list.length) return
    const saved = readBiz(role)
    setBiz(list.find(b => b.id === saved)?.id ?? list.find(b => b.gstin === DEFAULT_BIZ[role])?.id ?? list[0].id)
  }, [role, list.length]) // eslint-disable-line

  // old links like /app?role=buyer go straight in
  if ((legacy === 'buyer' || legacy === 'seller') && !params.get('pick')) return <Navigate to={`/app/${legacy}`} replace />

  function go() {
    writeBiz(role, biz)
    nav(`/app/${role}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-canvas via-white to-brand-soft/60">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link to="/" className="btn-ghost !py-2"><ArrowLeft size={16} /><span className="hidden sm:inline">{t('app.nav.website')}</span></Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <div className="mb-8 flex items-center justify-center gap-3 text-xs font-bold">
          {[t('app.welcome.step1'), t('app.welcome.step2')].map((s, i) => {
            const active = (i === 0 && !role) || (i === 1 && role)
            const done = i === 0 && role
            return (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <span className="h-px w-8 bg-line sm:w-16" />}
                <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? 'bg-ink text-white' : done ? 'bg-ok-soft text-ok' : 'bg-white text-muted'}`}>
                  {done ? <Check size={14} /> : <span>{i + 1}</span>}<span className="hidden sm:inline">{s.split('·')[1]?.trim() ?? s}</span>
                </span>
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {!role ? (
            <motion.section key="roles" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold sm:text-4xl">{t('app.welcome.title')}</h1>
                <p className="mt-2 text-muted">{t('app.welcome.sub')}</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {['buyer', 'seller'].map((r, i) => {
                  const R = ROLES[r]
                  return (
                    <motion.button key={r} onClick={() => setRole(r)} whileHover={{ y: -4 }}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="group card overflow-hidden text-left shadow-sm transition hover:shadow-xl cursor-pointer">
                      <div className={`bg-gradient-to-br ${R.grad} p-6 text-white`}>
                        <span className="inline-flex rounded-2xl bg-white/20 p-3"><R.icon size={30} /></span>
                        <div className="mt-4 font-display text-2xl font-bold">{t(`app.welcome.${r}`)}</div>
                        <div className="text-white/85">{t(`app.welcome.${r}Sub`)}</div>
                      </div>
                      <ul className="space-y-2.5 p-6">
                        {t(`app.welcome.${r}Pts`).map(p => (
                          <li key={p} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 flex-none text-ok" />{p}</li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-end gap-1 border-t border-line px-6 py-3 text-sm font-semibold text-brand">
                        {t('app.welcome.continue')}<ArrowRight size={16} className="transition group-hover:translate-x-1" />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.section>
          ) : (
            <motion.section key="biz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mx-auto max-w-2xl">
              <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold">{t('app.welcome.pickBiz')}</h1>
                <p className="mt-2 text-muted">{t('app.welcome.demoNote')}</p>
              </div>
              {d.loading ? <div className="flex justify-center py-12 text-muted"><Loader2 className="animate-spin" /></div> : (
                <div className="space-y-3">
                  {list.map(b => {
                    const n = d.invoices.filter(i => (role === 'buyer' ? i.buyer_id : i.seller_id) === b.id).length
                    const sel = biz === b.id
                    return (
                      <button key={b.id} onClick={() => setBiz(b.id)}
                        className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition cursor-pointer ${sel ? `border-transparent ring-2 ${ROLES[role].ring} shadow-md` : 'border-line hover:border-brand/40'}`}>
                        <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-xl font-display text-lg font-bold text-white bg-gradient-to-br ${ROLES[role].grad}`}>
                          {b.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{b.name}</span>
                          <span className="block text-xs text-muted">{b.gstin} · {stateOf(b.gstin)}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-ok"><BadgeCheck size={13} />{t('app.profile.verified')}</span>
                        </span>
                        <span className="flex-none text-right text-xs text-muted">{t('app.welcome.invoices', { n })}<br />{b.city}</span>
                        <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${sel ? 'border-brand bg-brand text-white' : 'border-line'}`}>{sel && <Check size={14} />}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => setRole(null)} className="btn-ghost"><ArrowLeft size={16} />{t('app.welcome.back')}</button>
                <button onClick={go} disabled={!biz} className={role === 'buyer' ? 'btn-accent !px-6' : 'btn-primary !px-6'}>{t('app.welcome.continue')}<ArrowRight size={16} /></button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
