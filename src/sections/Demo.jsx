import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Maximize2 } from 'lucide-react'
import { Section } from '../components/Section'
import { Tabs } from '../components/ui'
import Mvp from '../mvp/Mvp'
import { QuickDemo } from './LiveDemo'

export default function Demo() {
  const [mode, setMode] = useState('mvp')
  return (
    <Section id="demo" kicker="🔴 Live MVP · real database" title="Khud try karo — working MVP"
      lead="Buyer ya Seller bano. Invoice banao, accept / reject / modify karo, bill maango, stock aur GST returns dekho. Sab Supabase mein save hota hai aur real-time update hota hai.">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={mode} onChange={setMode} tabs={[{ id: 'mvp', label: '🧩 Full MVP' }, { id: 'quick', label: '⚡ 2-phone quick demo' }]} />
        <Link to="/app" className="btn-ghost ml-auto"><Maximize2 size={16} />Open full screen</Link>
      </div>
      {mode === 'mvp' ? (
        <>
          <Mvp />
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            {[['1', 'Seller → New invoice', 'Bill turant buyer ke inbox mein + GST portal par (simulated)'],
              ['2', 'Buyer → open bill → Modify', '10 pipes kam? Sirf woh galti bhejo, poora bill reject nahi'],
              ['3', 'Seller → Approve', 'Credit note auto, stock update, GSTR-1 / 2B ready']].map(([n, t, s]) => (
              <div key={n} className="flex gap-3 rounded-2xl bg-canvas p-4">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{n}</span>
                <div><div className="font-semibold">{t}</div><div className="text-muted">{s}</div></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Tip: page ko do tabs (ya phone + laptop) mein kholo — ek mein Buyer, doosre mein Seller. Actions turant dono taraf dikhenge.</p>
        </>
      ) : <QuickDemo />}
    </Section>
  )
}
