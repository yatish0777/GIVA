import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, animate } from 'framer-motion'
import { RotateCcw, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react'
import { Section, fadeUp } from '../components/Section'
import { useLang } from '../i18n'

function StepHead({ n, title, sub }) {
  return (
    <motion.div {...fadeUp} className="mb-6 flex items-start gap-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-white shadow-lg shadow-accent/30">{n}</span>
      <div><h3 className="text-2xl font-bold">{title}</h3>{sub && <p className="mt-1 text-muted">{sub}</p>}</div>
    </motion.div>
  )
}

/* ---------- STEP 1: invoice arrives + app reads it ---------- */
function StepOne() {
  const { t } = useLang()
  const [run, setRun] = useState(0)
  const ref = useRef(null)
  const go = useInView(ref, { once: true, margin: '-100px' })
  const labels = t('how.fields')
  const fields = [[labels[0], 'ABC Pipes'], [labels[1], '₹1,00,000'], [labels[2], '₹18,000'], [labels[3], t('how.qtyVal')], [labels[4], '₹1,18,000']]
  return (
    <div ref={ref} className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
      <div className="card overflow-hidden" key={'chat' + run}>
        <div className="flex items-center gap-2 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">AP</div>
          <div><div className="text-sm font-semibold">ABC Pipes</div><div className="text-xs opacity-75">WhatsApp</div></div>
        </div>
        <div className="min-h-[200px] space-y-2 bg-[#ece5dd] p-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            className="max-w-[85%] rounded-xl rounded-tl-none bg-white p-3 text-sm shadow-sm">{t('how.chatMsg')}</motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7 }}
            className="relative max-w-[85%] overflow-hidden rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3"><FileText className="text-bad" /><div><div className="text-sm font-semibold">Invoice_INV-101.pdf</div><div className="text-xs text-muted">1 page · 84 KB</div></div></div>
            <motion.div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-brand/30 to-transparent"
              initial={{ top: '-30%' }} animate={go ? { top: ['-30%', '110%'] } : {}} transition={{ delay: 1.4, duration: 1.1, repeat: 1 }} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.3 }} className="pt-1 text-center text-xs font-semibold text-brand">
            {t('how.importTo')}
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={go ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.6 }} className="mx-auto hidden lg:block">
        <ArrowRight size={36} className="text-accent" />
      </motion.div>

      <div className="card overflow-hidden" key={'read' + run}>
        <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
          <span className="font-semibold">{t('how.readTitle')}</span><span className="text-sm opacity-80">INV-101</span>
        </div>
        <div className="divide-y divide-line">
          {fields.map(([k, v], i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={go ? { opacity: 1, x: 0 } : {}} transition={{ delay: 2 + i * 0.25 }}
              className={`flex justify-between px-4 py-2.5 text-sm ${i === 4 ? 'bg-brand-soft font-bold text-brand' : ''}`}>
              <span className="text-muted">{k}</span><span className="font-semibold">{v}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="text-xs text-muted">{t('how.noTyping')}</span>
          <button onClick={() => setRun(r => r + 1)} className="flex items-center gap-1 text-xs font-semibold text-brand cursor-pointer"><RotateCcw size={13} />{t('how.replay')}</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- STEP 2: GST match ---------- */
const outcomeStyle = {
  match: { portal: '₹1,18,000', cls: 'border-ok/40 bg-ok-soft', icon: <CheckCircle2 className="text-ok" size={28} /> },
  mismatch: { portal: '₹1,22,720', cls: 'border-bad/40 bg-bad-soft', icon: <XCircle className="text-bad" size={28} /> },
  missing: { portal: '—', cls: 'border-warn/40 bg-warn-soft', icon: <AlertTriangle className="text-warn" size={28} /> },
}

function StepTwo() {
  const { t } = useLang()
  const [k, setK] = useState('match')
  const o = { ...outcomeStyle[k], ...t(`how.out.${k}`) }
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
        {Object.keys(outcomeStyle).map(key => (
          <button key={key} onClick={() => setK(key)}
            className={`flex-none rounded-2xl border px-4 py-3 text-left font-semibold transition cursor-pointer ${k === key ? 'border-brand bg-brand text-white shadow-lg' : 'border-line bg-white hover:border-brand/40'}`}>
            {t(`how.out.${key}.label`)}
          </button>
        ))}
        <p className="hidden pt-2 text-sm text-muted lg:block">{t('how.clickHint')}</p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
          className={`rounded-3xl border p-6 ${o.cls}`}>
          <div className="flex items-start gap-4">
            {o.icon}
            <div className="flex-1">
              <div className="text-xl font-bold">{o.title}</div>
              <p className="mt-1 text-ink/75">{o.text}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs font-semibold text-muted">{t('how.billLabel')}</div><div className="font-display text-2xl font-bold">₹1,18,000</div></div>
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs font-semibold text-muted">{t('how.portalLabel')}</div>
                  <motion.div key={o.portal} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-2xl font-bold">{o.portal}</motion.div></div>
              </div>
              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">{t('how.next')} {o.action}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------- STEP 3: goods check / dispute ---------- */
function Counter({ to, from = 0, go }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    if (!go) return
    const c = animate(from, to, { duration: 1.2, onUpdate: x => setV(Math.round(x)) })
    return () => c.stop()
  }, [go, from, to])
  return <>{v}</>
}

function StepThree() {
  const { t } = useLang()
  const ref = useRef(null)
  const go = useInView(ref, { once: true, margin: '-100px' })
  return (
    <div ref={ref}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="rounded-3xl bg-brand-soft p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-brand">{t('how.onBill')}</div>
          <div className="font-display text-5xl font-extrabold text-brand sm:text-6xl"><Counter to={100} go={go} /></div>
          <div className="text-sm font-semibold text-brand/80">{t('how.pipes')}</div>
        </div>
        <motion.div initial={{ scale: 0 }} animate={go ? { scale: 1, rotate: [0, -10, 10, 0] } : {}} transition={{ delay: 1.3 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">≠</motion.div>
        <div className="rounded-3xl bg-bad-soft p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-bad">{t('how.received')}</div>
          <div className="font-display text-5xl font-extrabold text-bad sm:text-6xl"><Counter to={90} go={go} /></div>
          <div className="text-sm font-semibold text-bad/80">{t('how.pipes')}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-bad/20 bg-white p-5">
          <div className="mb-3 font-bold text-bad">{t('how.oldTitle')}</div>
          <div className="space-y-2">
            {t('how.oldWay').map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-xl bg-bad-soft px-3 py-2 text-sm">{line}</motion.div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-ok/20 bg-white p-5">
          <div className="mb-3 font-bold text-ok">{t('how.newTitle')}</div>
          <div className="space-y-2">
            {t('how.newWay').map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
                className={`rounded-xl px-3 py-2 text-sm ${i === 4 ? 'bg-ok font-bold text-white' : 'bg-ok-soft'}`}>{line}</motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2, type: 'spring' }}
        className="mx-auto mt-8 flex max-w-xl items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-xl">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-soft text-xl">⚠️</span>
        <div className="flex-1"><div className="text-xs font-semibold text-muted">{t('how.notifLabel')}</div><div className="font-bold">{t('how.notifText')}</div></div>
        <span className="hidden rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white sm:inline">{t('how.creditNote')}</span>
      </motion.div>
    </div>
  )
}

/* ---------- STEP 4: dashboard ---------- */
const dash = [
  ['INV-101', 'ABC Pipes', '₹1.18L', 'accepted', '🟢', 'bg-ok-soft text-ok'],
  ['INV-102', 'XYZ Steel', '₹85K', 'disputed', '🔴', 'bg-bad-soft text-bad'],
  ['INV-103', 'PQR Ltd', '₹42K', 'pending', '🟡', 'bg-warn-soft text-warn'],
]
function StepFour() {
  const { t } = useLang()
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <motion.div {...fadeUp} className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs text-muted"><tr>{t('how.heads').map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {dash.map(([n, s, a, st, dot, c], i) => (
              <motion.tr key={n} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.2 }} className="border-t border-line">
                <td className="px-4 py-3 font-bold">{n}</td><td className="px-4 py-3">{s}</td><td className="px-4 py-3">{a}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c}`}>{dot} {t(`status.${st}`)}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      <div className="space-y-3">
        <div className="font-semibold">{t('how.ownerKnows')}</div>
        {['✅', '⚠️', '💰'].map((e, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3 font-semibold"><span className="text-xl">{e}</span>{t('how.knows')[i]}</motion.div>
        ))}
        <a href="#demo" className="btn-primary mt-2 w-full">{t('how.seeLive')}</a>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const { t } = useLang()
  return (
    <Section id="how" tone="canvas" kicker={t('how.kicker')} title={t('how.title')} lead={t('how.lead')}>
      <div className="space-y-20">
        <div><StepHead n="1" title={t('how.s1')} sub={t('how.s1sub')} /><StepOne /></div>
        <div><StepHead n="2" title={t('how.s2')} sub={t('how.s2sub')} /><StepTwo /></div>
        <div><StepHead n="3" title={t('how.s3')} sub={t('how.s3sub')} /><StepThree /></div>
        <div><StepHead n="4" title={t('how.s4')} sub={t('how.s4sub')} /><StepFour /></div>
      </div>
    </Section>
  )
}
