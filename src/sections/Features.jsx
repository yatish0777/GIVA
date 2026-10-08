import { motion } from 'framer-motion'
import { Section } from '../components/Section'
import { useLang } from '../i18n'

export default function Features() {
  const { t } = useLang()
  return (
    <Section id="features" tone="ink" kicker={t('features.kicker')} title={t('features.title')} lead={t('features.lead')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {t('features.list').map(([e, title, sub], i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.08 }}
            whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-3xl">{e}</div>
            <div className="mt-3 font-display font-bold">{title}</div>
            <div className="mt-1 text-sm text-white/65">{sub}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-sm text-white/50">{t('features.note')}</p>
    </Section>
  )
}
