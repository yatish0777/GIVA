import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Section, fadeUp } from '../components/Section'
import { useLang } from '../i18n'

const flowColors = ['bg-brand', 'bg-brand', 'bg-brand', 'bg-accent', 'bg-ok', 'bg-ink']

export default function MainIdea() {
  const { t } = useLang()
  const [lit, setLit] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setLit(l => (l + 1) % (flowColors.length + 2)), 700)
    return () => clearInterval(id)
  }, [])
  const oldFlow = t('idea.oldFlow')
  const newFlow = t('idea.newFlow')

  return (
    <Section id="idea" kicker={t('idea.kicker')} title={t('idea.title')} lead={t('idea.lead')}>
      <div className="space-y-5">
        <motion.div {...fadeUp} className="rounded-3xl bg-bad-soft p-6">
          <div className="mb-4 font-bold text-bad">{t('idea.today')}</div>
          <div className="flex flex-wrap items-center gap-2">
            {oldFlow.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <motion.span animate={{ rotate: [0, -2, 2, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm">{label}</motion.span>
                {i < oldFlow.length - 1 && <span className="font-bold text-bad">→</span>}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="rounded-3xl bg-ok-soft p-6">
          <div className="mb-4 font-bold text-ok">{t('idea.giva')}</div>
          <div className="flex flex-wrap items-center gap-2">
            {newFlow.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <motion.span animate={{ scale: lit === i ? 1.12 : 1, opacity: lit >= i || lit === 0 ? 1 : 0.55 }}
                  className={`rounded-full px-4 py-2 text-sm font-bold text-white shadow ${flowColors[i]}`}>{label}</motion.span>
                {i < newFlow.length - 1 && <span className="font-bold text-ok">→</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <motion.blockquote {...fadeUp} className="rounded-3xl border-l-[6px] border-brand bg-canvas p-7">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-brand">{t('idea.oneLine')}</div>
          <p className="text-xl font-semibold leading-relaxed">{t('idea.oneLineText')}</p>
        </motion.blockquote>

        <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.5 }} className="relative overflow-hidden rounded-3xl border-2 border-accent bg-gradient-to-br from-accent-soft to-[#ffe2c2] p-7">
          <motion.div className="absolute -right-6 -top-6 text-8xl opacity-20" animate={{ rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4 }}>⭐</motion.div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">{t('idea.usp')}</div>
          <p className="relative text-xl font-semibold leading-relaxed">{t('idea.uspText')}</p>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <motion.div {...fadeUp} className="rounded-2xl bg-bad-soft p-5">
          <div className="font-bold">{t('idea.portal')}</div>
          <p className="mt-1 text-sm text-ink/80">{t('idea.portalText')}</p>
        </motion.div>
        <motion.div {...fadeUp} className="rounded-2xl bg-ok-soft p-5">
          <div className="font-bold">✅ GIVA</div>
          <p className="mt-1 text-sm text-ink/80">{t('idea.givaText')}</p>
        </motion.div>
      </div>
    </Section>
  )
}
