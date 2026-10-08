import { motion } from 'framer-motion'
import { Section, fadeUp } from '../components/Section'
import { useLang } from '../i18n'

const pos = [{ x: 60, y: 60 }, { x: 250, y: 30 }, { x: 420, y: 90 }, { x: 600, y: 40 }, { x: 760, y: 95 }, { x: 410, y: 200, bad: true }]
const links = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [4, 5], [1, 5], [3, 5], [0, 2], [2, 4]]

export default function Problem() {
  const { t } = useLang()
  const nodes = pos.map((p, i) => ({ ...p, l: t('problem.nodes')[i] }))
  return (
    <Section id="problem" kicker={t('problem.kicker')} title={t('problem.title')} lead={t('problem.lead')}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t('problem.steps').map(([icon, title, sub], i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="card flex items-start gap-3 p-4">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-canvas text-xl">{icon}</span>
            <div><div className="text-xs font-bold text-muted">{t('problem.step', { n: i + 1 })}</div><div className="font-semibold">{title}</div><div className="text-sm text-muted">{sub}</div></div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}
          className="flex items-start gap-3 rounded-2xl border border-bad/30 bg-bad-soft p-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-xl">📞</span>
          <div><div className="text-xs font-bold text-bad">{t('problem.mistakeLabel')}</div><div className="font-semibold">{t('problem.mistakeTitle')}</div><div className="text-sm text-muted">{t('problem.mistakeSub')}</div></div>
        </motion.div>
      </div>

      <motion.div {...fadeUp} className="mt-12 overflow-x-auto rounded-3xl bg-canvas p-6">
        <svg viewBox="0 0 860 250" className="mx-auto w-full min-w-[640px] max-w-4xl" role="img" aria-label={t('problem.chaos')}>
          {links.map(([a, b], i) => (
            <motion.line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
              stroke="#d6453d" strokeWidth="1.8" strokeDasharray="5 6" fill="none"
              initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.7 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.3 + i * 0.12 }} />
          ))}
          {nodes.map((n, i) => (
            <motion.g key={i} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
              <rect x={n.x - 75} y={n.y - 20} width="150" height="40" rx="12" fill={n.bad ? '#fde9e7' : '#e8ecfb'} />
              <text x={n.x} y={n.y + 5} textAnchor="middle" fontFamily="Inter, 'Noto Sans Devanagari', sans-serif" fontWeight="700" fontSize="14" fill={n.bad ? '#d6453d' : '#2742b8'}>{n.l}</text>
            </motion.g>
          ))}
        </svg>
        <div className="mt-4 text-center">
          <div className="font-display text-2xl font-bold text-bad">{t('problem.chaos')}</div>
          <p className="mt-1 text-muted">{t('problem.chaosSub')}</p>
        </div>
      </motion.div>
    </Section>
  )
}
