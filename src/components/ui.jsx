import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, XCircle, AlertTriangle, Building2, User, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME, STATUS, gstCheck, inr } from '../lib/format'
import { useLang } from '../i18n'

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>{APP_NAME}</span>
    </Link>
  )
}

const tones = {
  brand: 'bg-brand-soft text-brand',
  ok: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
  warn: 'bg-warn-soft text-warn',
  accent: 'bg-accent-soft text-accent',
  muted: 'bg-canvas text-muted',
}

export function Chip({ tone = 'muted', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}

export function StatusChip({ status }) {
  const { t } = useLang()
  const s = STATUS[status] ? { ...STATUS[status], label: t(`status.${status}`) } : { label: status, tone: 'muted' }
  const dot = { ok: '🟢', bad: '🔴', warn: '🟡', accent: '🟠', brand: '🔵', muted: '⚪' }[s.tone]
  return <Chip tone={s.tone}><span className="text-[9px]">{dot}</span>{s.label}</Chip>
}

export function GstChip({ invoice }) {
  const { t } = useLang()
  const c = gstCheck(invoice)
  if (c === 'match') return <Chip tone="ok"><CheckCircle2 size={12} />{t('gst.match')}</Chip>
  if (c === 'mismatch') return <Chip tone="bad"><XCircle size={12} />{t('gst.mismatch')}</Chip>
  return <Chip tone="warn"><AlertTriangle size={12} />{t('gst.missing')}</Chip>
}

export function LiveDot({ live }) {
  const { t } = useLang()
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${live ? 'text-ok' : 'text-muted'}`} title={live ? t('common.liveTip') : t('common.connecting')}>
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-ok' : 'bg-muted'}`} />
      </span>
      {live ? t('common.live') : t('common.connecting')}
    </span>
  )
}

export function Stat({ label, value, tone = 'brand', icon }) {
  const t = { brand: 'bg-brand-soft text-brand', ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn', accent: 'bg-accent-soft text-accent' }[tone]
  return (
    <div className={`rounded-2xl p-4 ${t}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90">{icon}{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-xl' }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={`absolute right-0 top-0 h-full w-full ${width} overflow-y-auto bg-canvas shadow-2xl`}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="space-y-4 p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div className="absolute inset-0 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={`relative max-h-[92vh] w-full ${width} overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl`}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-canvas" aria-label="Close"><X size={20} /></button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const actorIcon = { seller: Building2, buyer: User, system: Cpu }
const actorTone = { seller: 'bg-brand text-white', buyer: 'bg-accent text-white', system: 'bg-ink text-white' }

export function Timeline({ events }) {
  const { t, ev, ago } = useLang()
  if (!events.length) return <p className="text-sm text-muted">{t('timeline.empty')}</p>
  return (
    <ol className="relative space-y-4 pl-1">
      {events.map((e, idx) => {
        const Icon = actorIcon[e.actor] || Cpu
        return (
          <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.3) }} className="relative flex gap-3">
            {idx < events.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%+4px)] w-0.5 bg-line" />}
            <span className={`relative z-[1] flex h-7 w-7 flex-none items-center justify-center rounded-full ${actorTone[e.actor]}`}><Icon size={14} /></span>
            <div className="min-w-0 pt-0.5">
              <div className="text-sm font-semibold">{ev(e.event)}</div>
              {e.detail && <div className="text-sm text-muted">{ev(e.detail)}</div>}
              <div className="mt-0.5 text-xs text-muted">{t(`actor.${e.actor}`)} · {ago(e.created_at)}</div>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

export function ItemsTable({ items, invoice }) {
  const { t } = useLang()
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-canvas text-left text-xs text-muted">
          <tr><th className="px-3 py-2 font-semibold">{t('items.item')}</th><th className="px-3 py-2 text-right font-semibold">{t('items.qty')}</th><th className="px-3 py-2 text-right font-semibold">{t('items.rate')}</th><th className="px-3 py-2 text-right font-semibold">{t('items.amount')}</th></tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} className="border-t border-line">
              <td className="px-3 py-2"><div className="font-medium">{it.description}</div><div className="text-xs text-muted">{t('items.hsn')} {it.hsn}</div></td>
              <td className="px-3 py-2 text-right">{Number(it.qty)} {it.unit}</td>
              <td className="px-3 py-2 text-right">{inr(it.rate)}</td>
              <td className="px-3 py-2 text-right font-semibold">{inr(it.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-line bg-canvas/60 text-sm">
          <tr><td colSpan={3} className="px-3 py-1.5 text-right text-muted">{t('items.taxable')}</td><td className="px-3 py-1.5 text-right">{inr(invoice.taxable_value)}</td></tr>
          <tr><td colSpan={3} className="px-3 py-1.5 text-right text-muted">{t('items.gstAt', { r: Number(invoice.gst_rate) })}</td><td className="px-3 py-1.5 text-right">{inr(invoice.gst_amount)}</td></tr>
          <tr><td colSpan={3} className="px-3 py-2 text-right font-bold">{t('items.total')}</td><td className="px-3 py-2 text-right font-bold text-brand">{inr(invoice.total)}</td></tr>
        </tfoot>
      </table>
    </div>
  )
}

export function GstCheckCard({ invoice, children }) {
  const { t } = useLang()
  const c = gstCheck(invoice)
  const cfg = {
    match: { cls: 'border-ok/30 bg-ok-soft', icon: <CheckCircle2 className="text-ok" />, title: t('gst.matchTitle'), text: t('gst.matchText') },
    mismatch: { cls: 'border-bad/30 bg-bad-soft', icon: <XCircle className="text-bad" />, title: t('gst.mismatchTitle'), text: t('gst.mismatchText', { bill: inr(invoice.total), portal: inr(invoice.gst_reported_total) }) },
    missing: { cls: 'border-warn/30 bg-warn-soft', icon: <AlertTriangle className="text-warn" />, title: t('gst.missingTitle'), text: t('gst.missingText') },
  }[c]
  return (
    <div className={`rounded-2xl border p-4 ${cfg.cls}`}>
      <div className="flex gap-3">
        <div className="pt-0.5">{cfg.icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{cfg.title}</div>
          <div className="text-sm text-ink/75">{cfg.text}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white/70 px-2.5 py-1.5"><div className="text-muted">{t('gst.billTotal')}</div><div className="font-bold">{inr(invoice.total)}</div></div>
            <div className="rounded-lg bg-white/70 px-2.5 py-1.5"><div className="text-muted">{t('gst.onPortal')}</div><div className="font-bold">{invoice.gst_reported_total == null ? '—' : inr(invoice.gst_reported_total)}</div></div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Empty({ icon, title, text }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <div className="font-semibold">{title}</div>
      {text && <div className="mt-1 max-w-sm text-sm text-muted">{text}</div>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-canvas p-1">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`relative flex flex-none items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${value === t.id ? 'text-ink' : 'text-muted hover:text-ink'}`}>
          {value === t.id && <motion.span layoutId="tab-bg" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
          <span className="relative">{t.label}</span>
          {t.count > 0 && <span className="relative rounded-full bg-accent px-1.5 text-[11px] text-white">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
