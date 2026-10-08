import { motion } from 'framer-motion'

export function Section({ id, kicker, title, lead, children, className = '', tone = 'white' }) {
  const bg = tone === 'canvas' ? 'bg-canvas' : tone === 'ink' ? 'bg-ink text-white' : 'bg-white'
  return (
    <section id={id} className={`scroll-mt-16 px-4 py-20 sm:py-24 ${bg} ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(kicker || title) && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="mb-12 max-w-3xl">
            {kicker && <div className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-accent">{kicker}</div>}
            {title && <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>}
            {lead && <p className={`mt-3 text-lg ${tone === 'ink' ? 'text-white/70' : 'text-muted'}`}>{lead}</p>}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}

export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}
