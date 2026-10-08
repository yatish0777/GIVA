import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useInView, animate } from 'framer-motion'
import { useRef } from 'react'
import { RotateCcw, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react'
import { Section, fadeUp } from '../components/Section'

function StepHead({ n, title, sub }) {
  return (
    <motion.div {...fadeUp} className="mb-6 flex items-start gap-4">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-white shadow-lg shadow-accent/30">{n}</span>
      <div><h3 className="text-2xl font-bold">{title}</h3>{sub && <p className="mt-1 text-muted">{sub}</p>}</div>
    </motion.div>
  )
}

/* ---------- STEP 1: invoice arrives + app reads it ---------- */
const fields = [['Supplier', 'ABC Pipes'], ['Amount', '₹1,00,000'], ['GST (18%)', '₹18,000'], ['Quantity', '100 pipes'], ['Total', '₹1,18,000']]

function StepOne() {
  const [run, setRun] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const go = inView
  return (
    <div ref={ref} className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
      <div className="card overflow-hidden" key={'chat' + run}>
        <div className="flex items-center gap-2 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">AP</div>
          <div><div className="text-sm font-semibold">ABC Pipes</div><div className="text-xs opacity-75">WhatsApp</div></div>
        </div>
        <div className="min-h-[200px] space-y-2 bg-[#ece5dd] p-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            className="max-w-[85%] rounded-xl rounded-tl-none bg-white p-3 text-sm shadow-sm">Namaste ji 🙏 maal dispatch ho gaya. Bill attach kar raha hoon.</motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7 }}
            className="relative max-w-[85%] overflow-hidden rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3"><FileText className="text-bad" /><div><div className="text-sm font-semibold">Invoice_INV-101.pdf</div><div className="text-xs text-muted">1 page · 84 KB</div></div></div>
            <motion.div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-brand/30 to-transparent"
              initial={{ top: '-30%' }} animate={go ? { top: ['-30%', '110%'] } : {}} transition={{ delay: 1.4, duration: 1.1, repeat: 1 }} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.3 }} className="pt-1 text-center text-xs font-semibold text-brand">
            📲 Import to GIVA
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={go ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.6 }} className="mx-auto hidden lg:block">
        <ArrowRight size={36} className="text-accent" />
      </motion.div>

      <div className="card overflow-hidden" key={'read' + run}>
        <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
          <span className="font-semibold">App ne bill padha</span><span className="text-sm opacity-80">INV-101</span>
        </div>
        <div className="divide-y divide-line">
          {fields.map(([k, v], i) => (
            <motion.div key={k} initial={{ opacity: 0, x: 16 }} animate={go ? { opacity: 1, x: 0 } : {}} transition={{ delay: 2 + i * 0.25 }}
              className={`flex justify-between px-4 py-2.5 text-sm ${k === 'Total' ? 'bg-brand-soft font-bold text-brand' : ''}`}>
              <span className="text-muted">{k}</span><span className="font-semibold">{v}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="text-xs text-muted">Kuch type karne ki zarurat nahi ✨</span>
          <button onClick={() => setRun(r => r + 1)} className="flex items-center gap-1 text-xs font-semibold text-brand cursor-pointer"><RotateCcw size={13} />Replay</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- STEP 2: GST match ---------- */
const outcomes = {
  match: { label: '✅ Match', portal: '₹1,18,000', cls: 'border-ok/40 bg-ok-soft', icon: <CheckCircle2 className="text-ok" size={28} />, title: 'Bill aur GST data same hai', text: 'Seller ne GST system mein ₹1,18,000 report kiya. Accept karne ke liye ready.', action: 'Accept karo' },
  mismatch: { label: '❌ Amount mismatch', portal: '₹1,22,720', cls: 'border-bad/40 bg-bad-soft', icon: <XCircle className="text-bad" size={28} />, title: 'GST portal par amount alag hai', text: 'Bill ₹1,18,000 ka, lekin GST mein ₹1,22,720. Seller ko correction bhejo.', action: 'Dispute karo' },
  missing: { label: '⚠️ Invoice missing', portal: '—', cls: 'border-warn/40 bg-warn-soft', icon: <AlertTriangle className="text-warn" size={28} />, title: 'Seller ne upload hi nahi kiya', text: 'Bina upload ke GST credit nahi milega. Ek tap mein seller ko reminder bhejo.', action: '"Ask for bill" bhejo' },
}

function StepTwo() {
  const [k, setK] = useState('match')
  const o = outcomes[k]
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
        {Object.entries(outcomes).map(([key, v]) => (
          <button key={key} onClick={() => setK(key)}
            className={`flex-none rounded-2xl border px-4 py-3 text-left font-semibold transition cursor-pointer ${k === key ? 'border-brand bg-brand text-white shadow-lg' : 'border-line bg-white hover:border-brand/40'}`}>
            {v.label}
          </button>
        ))}
        <p className="hidden pt-2 text-sm text-muted lg:block">👆 Click karke teeno cases dekho</p>
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
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs font-semibold text-muted">Bill (WhatsApp)</div><div className="font-display text-2xl font-bold">₹1,18,000</div></div>
                <div className="rounded-2xl bg-white/80 p-4"><div className="text-xs font-semibold text-muted">GST portal (GSTR-1)</div>
                  <motion.div key={o.portal} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-2xl font-bold">{o.portal}</motion.div></div>
              </div>
              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">Next step → {o.action}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ---------- STEP 3: maal check / dispute ---------- */
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
  const ref = useRef(null)
  const go = useInView(ref, { once: true, margin: '-100px' })
  const oldWay = ['📞 Phone uthao, seller ko call', '💬 WhatsApp par photo bhejo', '⏳ Correction ke liye follow-up', '🔁 Phir se call… phir se message…', '❓ Pata nahi kab theek hoga']
  const newWay = ['📄 Invoice kholo', '⚠️ "Ask to change" dabao', '📦 Quantity mismatch choose karo', '✍️ 100 expected / 90 received', '✅ Done!']
  return (
    <div ref={ref}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="rounded-3xl bg-brand-soft p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-brand">Bill mein likha</div>
          <div className="font-display text-5xl font-extrabold text-brand sm:text-6xl"><Counter to={100} go={go} /></div>
          <div className="text-sm font-semibold text-brand/80">pipes</div>
        </div>
        <motion.div initial={{ scale: 0 }} animate={go ? { scale: 1, rotate: [0, -10, 10, 0] } : {}} transition={{ delay: 1.3 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">≠</motion.div>
        <div className="rounded-3xl bg-bad-soft p-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-bad">Actual mein aaya</div>
          <div className="font-display text-5xl font-extrabold text-bad sm:text-6xl"><Counter to={90} go={go} /></div>
          <div className="text-sm font-semibold text-bad/80">pipes</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-bad/20 bg-white p-5">
          <div className="mb-3 font-bold text-bad">😓 Normal system mein</div>
          <div className="space-y-2">
            {oldWay.map((t, i) => (
              <motion.div key={t} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-xl bg-bad-soft px-3 py-2 text-sm">{t}</motion.div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-ok/20 bg-white p-5">
          <div className="mb-3 font-bold text-ok">😎 GIVA mein</div>
          <div className="space-y-2">
            {newWay.map((t, i) => (
              <motion.div key={t} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
                className={`rounded-xl px-3 py-2 text-sm ${i === 4 ? 'bg-ok font-bold text-white' : 'bg-ok-soft'}`}>{t}</motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2, type: 'spring' }}
        className="mx-auto mt-8 flex max-w-xl items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-xl">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-soft text-xl">⚠️</span>
        <div className="flex-1"><div className="text-xs font-semibold text-muted">Seller ko turant notification</div><div className="font-bold">Quantity mismatch: 10 pipes missing</div></div>
        <span className="hidden rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white sm:inline">Credit note</span>
      </motion.div>
    </div>
  )
}

/* ---------- STEP 4: dashboard ---------- */
const dash = [
  ['INV-101', 'ABC Pipes', '₹1.18L', '🟢 Accepted', 'bg-ok-soft text-ok'],
  ['INV-102', 'XYZ Steel', '₹85K', '🔴 Disputed', 'bg-bad-soft text-bad'],
  ['INV-103', 'PQR Ltd', '₹42K', '🟡 Pending', 'bg-warn-soft text-warn'],
]
function StepFour() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <motion.div {...fadeUp} className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs text-muted"><tr>{['Invoice', 'Supplier', 'Amount', 'Status'].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {dash.map(([n, s, a, st, c], i) => (
              <motion.tr key={n} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.2 }} className="border-t border-line">
                <td className="px-4 py-3 font-bold">{n}</td><td className="px-4 py-3">{s}</td><td className="px-4 py-3">{a}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c}`}>{st}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      <div className="space-y-3">
        <div className="font-semibold">Ab owner ko turant pata hai:</div>
        {[['✅', 'Kaunsa bill approve hua?'], ['⚠️', 'Kaunsa problem mein hai?'], ['💰', 'Kaunsa payment ke liye pending hai?']].map(([e, t], i) => (
          <motion.div key={t} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3 font-semibold"><span className="text-xl">{e}</span>{t}</motion.div>
        ))}
        <a href="#demo" className="btn-primary mt-2 w-full">See it live with real data ↓</a>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <Section id="how" tone="canvas" kicker="💡 Our solution" title="Ek simple GST Invoice Management website"
      lead="Business owner ko ek hi jagah par pura invoice process milega. Wahi ABC Pipes wala example — step by step.">
      <div className="space-y-20">
        <div><StepHead n="1" title="Invoice app mein aayega" sub="Invoice upload karo ya WhatsApp se import karo — app khud padh lega." /><StepOne /></div>
        <div><StepHead n="2" title="App bill ko GST data se match karega" sub="Kya seller ne GST system mein ₹1,18,000 ka invoice report kiya?" /><StepTwo /></div>
        <div><StepHead n="3" title="Maal bhi check kar sakte ho" sub="Bill mein 100 pipes, lekin actual mein sirf 90 aaye. Ab kya?" /><StepThree /></div>
        <div><StepHead n="4" title="Saare bills ka status ek nazar mein" sub="Jaise courier parcel track karte ho." /><StepFour /></div>
      </div>
    </Section>
  )
}
