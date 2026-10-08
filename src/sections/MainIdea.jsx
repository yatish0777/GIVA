import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Section, fadeUp } from '../components/Section'

const oldFlow = ['WhatsApp', 'GST Portal', 'Tally', 'Excel', 'Bank', 'Seller ko call']
const newFlow = [['Invoice', 'bg-brand'], ['Verify', 'bg-brand'], ['Match', 'bg-brand'], ['Dispute', 'bg-accent'], ['Approve', 'bg-ok'], ['Payment', 'bg-ink']]

export default function MainIdea() {
  const [lit, setLit] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setLit(l => (l + 1) % (newFlow.length + 2)), 700)
    return () => clearInterval(t)
  }, [])

  return (
    <Section id="idea" kicker="🔥 Main idea" title="Hum GST portal ko replace nahi kar rahe"
      lead="Hum GST portal + invoice + stock + accounting + communication ko ek simple workflow mein connect kar rahe hain.">
      <div className="space-y-5">
        <motion.div {...fadeUp} className="rounded-3xl bg-bad-soft p-6">
          <div className="mb-4 font-bold text-bad">Abhi ki situation 😵</div>
          <div className="flex flex-wrap items-center gap-2">
            {oldFlow.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <motion.span animate={{ rotate: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm">{t}</motion.span>
                {i < oldFlow.length - 1 && <span className="font-bold text-bad">→</span>}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="rounded-3xl bg-ok-soft p-6">
          <div className="mb-4 font-bold text-ok">GIVA: 📱 ONE APP</div>
          <div className="flex flex-wrap items-center gap-2">
            {newFlow.map(([t, c], i) => (
              <div key={t} className="flex items-center gap-2">
                <motion.span animate={{ scale: lit === i ? 1.12 : 1, opacity: lit >= i || lit === 0 ? 1 : 0.55 }}
                  className={`rounded-full px-4 py-2 text-sm font-bold text-white shadow ${c}`}>{t}</motion.span>
                {i < newFlow.length - 1 && <span className="font-bold text-ok">→</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <motion.blockquote {...fadeUp} className="rounded-3xl border-l-[6px] border-brand bg-canvas p-7">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">🎯 In one line</div>
          <p className="text-xl font-semibold leading-relaxed">
            “Our solution is a single platform that helps businesses receive, verify, dispute, approve and track GST invoices without switching between WhatsApp, GST portal, Excel and accounting software.”
          </p>
        </motion.blockquote>

        <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.5 }} className="relative overflow-hidden rounded-3xl border-2 border-accent bg-gradient-to-br from-accent-soft to-[#ffe2c2] p-7">
          <motion.div className="absolute -right-6 -top-6 text-8xl opacity-20" animate={{ rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4 }}>⭐</motion.div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">⭐ Sabse important USP</div>
          <p className="relative text-xl font-semibold leading-relaxed">
            “Agar invoice mein sirf ek cheez galat hai, toh user poora invoice reject karne ke bajay directly problem ko highlight karke correction request bhej sakta hai.”
          </p>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <motion.div {...fadeUp} className="rounded-2xl bg-bad-soft p-5">
          <div className="font-bold">❌ GST portal</div>
          <p className="mt-1 text-sm text-ink/80">Sirf Accept / Reject / Pending. Ek galti = poora bill reject, phir naya bill, phir naya follow-up.</p>
        </motion.div>
        <motion.div {...fadeUp} className="rounded-2xl bg-ok-soft p-5">
          <div className="font-bold">✅ GIVA</div>
          <p className="mt-1 text-sm text-ink/80">Sirf galat cheez highlight karo (jaise 10 pipes kam). Baaki bill safe, credit note automatic, GST par sync.</p>
        </motion.div>
      </div>
    </Section>
  )
}
