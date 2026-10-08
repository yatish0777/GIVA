import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Section } from '../components/Section'
import { api } from '../lib/api'
import { friendlyError } from '../lib/format'
import { useLang } from '../i18n'

const blank = { name: '', contact: '', organisation: '', role: 'business', message: '' }

export default function Contact() {
  const { t } = useLang()
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
    <Section id="contact" tone="canvas" kicker={t('contact.kicker')} title={t('contact.title')} lead={t('contact.lead')}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {t('contact.who').map(([e, title, sub], i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-white p-5">
              <span className="text-3xl">{e}</span>
              <div><div className="font-bold">{title}</div><div className="text-sm text-muted">{sub}</div></div>
            </div>
          ))}
        </div>

        <div className="card relative p-6">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, 0] }} transition={{ type: 'spring' }}><CheckCircle2 size={56} className="text-ok" /></motion.div>
                <div className="mt-4 text-xl font-bold">{t('contact.thanks')}</div>
                <p className="mt-1 text-muted">{t('contact.saved')}</p>
                <button onClick={() => setDone(false)} className="btn-ghost mt-6">{t('contact.another')}</button>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="c-name">{t('contact.name')}</label><input id="c-name" value={f.name} onChange={set('name')} className="input" required minLength={2} maxLength={80} /></div>
                  <div><label className="label" htmlFor="c-contact">{t('contact.contact')}</label><input id="c-contact" value={f.contact} onChange={set('contact')} className="input" required minLength={5} maxLength={120} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="c-org">{t('contact.org')}</label><input id="c-org" value={f.organisation} onChange={set('organisation')} className="input" maxLength={120} /></div>
                  <div><label className="label" htmlFor="c-role">{t('contact.iam')}</label>
                    <select id="c-role" value={f.role} onChange={set('role')} className="input">
                      {['business', 'student', 'faculty', 'other'].map(r => <option key={r} value={r}>{t(`contact.roles.${r}`)}</option>)}
                    </select></div>
                </div>
                <div><label className="label" htmlFor="c-msg">{t('contact.message')}</label>
                  <textarea id="c-msg" value={f.message} onChange={set('message')} className="input min-h-[120px]" required minLength={5} maxLength={1000}
                    placeholder={t('contact.messagePh')} /></div>
                <button disabled={busy} className="btn-primary w-full !py-3">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{t('contact.submit')}</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  )
}
