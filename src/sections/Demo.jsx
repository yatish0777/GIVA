import { motion } from 'framer-motion'
import { ExternalLink, Store, Factory, MonitorSmartphone } from 'lucide-react'
import { Section } from '../components/Section'
import { useLang } from '../i18n'
import { QuickDemo } from './LiveDemo'

export default function Demo() {
  const { t, lang } = useLang()
  const href = role => `/app?role=${role}&lang=${lang}`
  return (
    <Section id="demo" kicker={t('demo.kicker')} title={t('demo.title')} lead={t('demo.lead')}>
      <div className="grid gap-5 md:grid-cols-2">
        {[['buyer', Store, 'from-accent to-[#f6a14d]'], ['seller', Factory, 'from-brand to-[#3b5be0]']].map(([role, Icon, grad], i) => (
          <motion.a key={role} href={href(role)} target="_blank" rel="noopener"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${grad} p-6 text-white shadow-xl`}>
            <div className="flex items-start justify-between">
              <span className="rounded-2xl bg-white/20 p-3"><Icon size={26} /></span>
              <ExternalLink size={20} className="opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="mt-5 font-display text-2xl font-bold">{t(`demo.${role}Title`)}</div>
            <div className="mt-1 text-white/85">{t(`demo.${role}Sub`)}</div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/70">{t('common.newTab')} ↗</div>
          </motion.a>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm">
        <MonitorSmartphone className="mt-0.5 flex-none text-brand" size={20} />
        <div>{t('demo.bothTip')}</div>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        {t('demo.steps').map(([title, sub], i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-canvas p-4">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
            <div><div className="font-semibold">{title}</div><div className="text-muted">{sub}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-16 mb-6">
        <h3 className="text-2xl font-bold">{t('demo.quickTitle')}</h3>
        <p className="mt-1 text-muted">{t('demo.quickSub')}</p>
      </div>
      <QuickDemo />
    </Section>
  )
}
