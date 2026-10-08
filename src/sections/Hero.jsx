import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, MessageCircle, Landmark, BookOpen, Sheet, Banknote, PhoneCall, ExternalLink } from 'lucide-react'
import { useLang } from '../i18n'

const toolPos = [
  { icon: MessageCircle, x: '-8%', y: '6%' },
  { icon: Landmark, x: '2%', y: '30%' },
  { icon: BookOpen, x: '-10%', y: '54%' },
  { icon: Sheet, x: '4%', y: '78%' },
  { icon: Banknote, x: '74%', y: '14%' },
  { icon: PhoneCall, x: '66%', y: '70%' },
]

const rows = [
  { no: 'INV-101', who: 'ABC Pipes', amt: '₹1.18L', s: 'accepted', c: 'bg-ok-soft text-ok' },
  { no: 'INV-102', who: 'XYZ Steel', amt: '₹85K', s: 'disputed', c: 'bg-bad-soft text-bad' },
  { no: 'INV-103', who: 'PQR Ltd', amt: '₹42K', s: 'pending', c: 'bg-warn-soft text-warn' },
]

export default function Hero() {
  const { t } = useLang()
  const tools = toolPos.map((p, i) => ({ ...p, label: t('hero.tools')[i] }))
  const [phase, setPhase] = useState(0) // 0 scattered, 1 merging, 2 app
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400)
    const t2 = setTimeout(() => setPhase(2), 2600)
    const t3 = setTimeout(() => { setPhase(0); setCycle(c => c + 1) }, 9000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [cycle])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-[#3b5be0] px-4 pb-20 pt-28 text-white sm:pt-32">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-white/5 blur-2xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">{t('hero.badge')}</span>
          <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.15] [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
            {t('hero.title1')}<br /><span className="text-[#ffc27a]">{t('hero.title2')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">
            {t('hero.sub')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/app" target="_blank" rel="noopener" className="btn-accent !px-5 !py-3 !text-base">{t('hero.ctaMvp')}<ExternalLink size={18} /></a>
            <a href="#problem" className="btn !border !border-white/30 !bg-white/10 !px-5 !py-3 !text-base text-white hover:!bg-white/20">{t('hero.ctaHow')} <ArrowDown size={18} /></a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
            {t('hero.points').map(p => <span key={p}>✓ {p}</span>)}
          </div>
        </motion.div>

        <div className="relative mx-auto h-[440px] w-full max-w-[520px]" aria-hidden>
          {tools.map((tool, i) => (
            <motion.div key={i + '-' + cycle}
              className="absolute flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur"
              style={{ left: tool.x, top: tool.y }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase === 0
                ? { opacity: 1, scale: 1, x: 0, y: [0, -6, 0], transition: { delay: i * 0.12, y: { repeat: Infinity, duration: 2.4, delay: i * 0.2 } } }
                : { opacity: 0, scale: 0.4, left: '42%', top: '45%', transition: { duration: 0.7, delay: i * 0.08, ease: 'easeIn' } }}
            >
              <tool.icon size={16} />{tool.label}
            </motion.div>
          ))}

          {/* phone */}
          <motion.div className="absolute left-1/2 top-1/2 w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-3 text-ink shadow-2xl"
            animate={{ scale: phase === 1 ? 1.06 : 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-line" />
            <div className="rounded-2xl bg-canvas p-3">
              <div className="mb-3 rounded-lg bg-brand py-1.5 text-center font-display text-sm font-bold text-white">{t('hero.oneApp')}</div>
              <AnimatePresence mode="wait">
                {phase < 2 ? (
                  <motion.div key="wait" exit={{ opacity: 0 }} className="flex h-[186px] flex-col items-center justify-center text-center text-xs text-muted">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="mb-2 h-6 w-6 rounded-full border-2 border-brand border-t-transparent" />
                    {t('hero.merging')}
                  </motion.div>
                ) : (
                  <motion.div key="rows" className="space-y-2">
                    {rows.map((r, i) => (
                      <motion.div key={r.no} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.25 }}
                        className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 text-[11px] shadow-sm">
                        <div><div className="font-bold">{r.no}</div><div className="text-muted">{r.who} · {r.amt}</div></div>
                        <span className={`rounded-full px-2 py-0.5 font-bold ${r.c}`}>{t(`status.${r.s}`)}</span>
                      </motion.div>
                    ))}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold text-white">
                      <span className="rounded-full bg-ok py-1.5 text-center">{t('hero.accept')}</span>
                      <span className="rounded-full bg-accent py-1.5 text-center">{t('hero.askChange')}</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* outcome chips */}
          {t('hero.outcomes').map((l, i) => (
            <motion.div key={l + cycle} className="absolute right-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand shadow-lg"
              style={{ top: `${18 + i * 26}%` }}
              initial={{ opacity: 0, x: -30 }} animate={phase === 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }} transition={{ delay: phase === 2 ? 1.1 + i * 0.25 : 0 }}>
              ✓ {l}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
