import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Section } from '../components/Section'
import { api } from '../lib/api'
import { friendlyError } from '../lib/format'

const blank = { name: '', contact: '', organisation: '', role: 'business', message: '' }

export default function Contact() {
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try { await api.submitFeedback(f); setDone(true); setF(blank) }
    catch (err) { toast.error(friendlyError(err)) }
    finally { setBusy(false) }
  }

  return (
    <Section id="contact" tone="canvas" kicker="Feedback" title="Aapka business bhi aise hi bills handle karta hai?"
      lead="Feedback do, problem batao, ya demo maango. Har message hamare database mein save hota hai aur team padhti hai.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {[['🏭', 'Manufacturers & traders', 'Kitne bills mein galti / dispute aata hai? Batao.'],
            ['🎓', 'Students & faculty', 'Project par suggestions welcome hain.'],
            ['🧮', 'CAs & accountants', 'GST reconciliation ke real pain points share karo.']].map(([e, t, s]) => (
            <div key={t} className="flex gap-4 rounded-2xl bg-white p-5">
              <span className="text-3xl">{e}</span>
              <div><div className="font-bold">{t}</div><div className="text-sm text-muted">{s}</div></div>
            </div>
          ))}
        </div>

        <div className="card relative p-6">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, 0] }} transition={{ type: 'spring' }}><CheckCircle2 size={56} className="text-ok" /></motion.div>
                <div className="mt-4 text-xl font-bold">Dhanyavaad! 🙏</div>
                <p className="mt-1 text-muted">Aapka message save ho gaya.</p>
                <button onClick={() => setDone(false)} className="btn-ghost mt-6">Send another</button>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="c-name">Name *</label><input id="c-name" value={f.name} onChange={set('name')} className="input" required minLength={2} maxLength={80} /></div>
                  <div><label className="label" htmlFor="c-contact">Email or phone *</label><input id="c-contact" value={f.contact} onChange={set('contact')} className="input" required minLength={5} maxLength={120} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="c-org">Business / college</label><input id="c-org" value={f.organisation} onChange={set('organisation')} className="input" maxLength={120} /></div>
                  <div><label className="label" htmlFor="c-role">I am a</label>
                    <select id="c-role" value={f.role} onChange={set('role')} className="input">
                      <option value="business">Business owner</option><option value="student">Student</option><option value="faculty">Faculty / guide</option><option value="other">Other</option>
                    </select></div>
                </div>
                <div><label className="label" htmlFor="c-msg">Message *</label>
                  <textarea id="c-msg" value={f.message} onChange={set('message')} className="input min-h-[120px]" required minLength={5} maxLength={1000}
                    placeholder="e.g. Hamare yahan har mahine 10–15 bills mein quantity ka issue aata hai…" /></div>
                <button disabled={busy} className="btn-primary w-full !py-3">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Send message</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  )
}
