import { useState } from 'react'
import { motion } from 'framer-motion'
import { inrShort } from '../lib/format'

// Single-series monthly column chart. Brand hue only; values labelled in text ink; hover tooltip.
export function MonthBars({ data, tone = 'brand', tooltip }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map(d => d.value))
  const nice = niceMax(max)
  const ticks = [0, nice / 2, nice]
  const fill = tone === 'accent' ? 'bg-accent' : 'bg-brand'
  return (
    <div className="relative pt-4">
      <div className="relative h-48">
        {ticks.map(v => (
          <div key={v} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(v / nice) * 100}%` }}>
            <span className="w-10 -translate-y-1/2 text-right text-[10px] text-muted">{v ? inrShort(v) : '0'}</span>
            <span className="h-px flex-1 -translate-y-1/2 bg-line" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <div key={d.key} className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              <motion.div className={`w-full max-w-[34px] rounded-t-[4px] ${fill} ${hover === null || hover === i ? 'opacity-100' : 'opacity-40'} transition-opacity`}
                initial={{ height: 0 }} animate={{ height: `${(d.value / nice) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                style={{ minHeight: d.value ? 3 : 0 }} />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                  <div className="font-semibold">{d.label}</div>
                  <div>{tooltip(d)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="ml-12 mt-1 flex gap-[2px]">
        {data.map(d => <div key={d.key} className="flex-1 text-center text-[11px] text-muted">{d.label}</div>)}
      </div>
    </div>
  )
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

// Horizontal bars for ranking (top suppliers / customers). One hue; labels and values in ink.
export function HBars({ rows, tone = 'brand', format = inrShort }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  const fill = tone === 'accent' ? 'bg-accent' : 'bg-brand'
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.label} className="group" title={`${r.label}: ${format(r.value)}`}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="truncate font-medium">{r.label}</span>
            <span className="flex-none font-semibold">{format(r.value)}{r.sub != null && r.sub !== '' && <span className="ml-1 font-normal text-muted">· {r.sub}</span>}</span>
          </div>
          <div className="h-2 rounded-full bg-canvas">
            <motion.div className={`h-2 rounded-full ${fill}`} initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Stacked part-to-whole bar using reserved status colours, always paired with a labelled legend + counts.
const TONE = { ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-[#d99a06]', brand: 'bg-brand', accent: 'bg-accent', muted: 'bg-[#a6adbb]' }
export function StatusBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1
  const shown = segments.filter(s => s.count > 0)
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-canvas">
        {shown.map((s, i) => (
          <motion.div key={s.key} title={`${s.label}: ${s.count}`} className={`${TONE[s.tone]} ${i === 0 ? 'rounded-l-full' : ''} ${i === shown.length - 1 ? 'rounded-r-full' : ''}`}
            initial={{ width: 0 }} animate={{ width: `${(s.count / total) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 flex-none rounded-sm ${TONE[s.tone]}`} />
            <span className="flex-1 truncate text-ink/80">{s.label}</span>
            <span className="font-semibold">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ring meter for a single headline percentage
export function Ring({ pct, size = 112, tone = 'ok', children }) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const color = { ok: '#1f9d55', warn: '#d99a06', bad: '#d6453d' }[tone]
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e3e7ef" strokeWidth="10" fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 0.9 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
