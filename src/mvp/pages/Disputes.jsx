import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useData } from '../../lib/data'
import { useLang } from '../../i18n'
import { inr } from '../../lib/format'
import { Chip, Stat } from '../../components/ui'
import { useApp, isMine, otherParty } from '../ctx'
import { Card } from './Dashboard'

export default function Disputes() {
  const d = useData()
  const { t, ago } = useLang()
  const { role, business, base } = useApp()
  const [filter, setFilter] = useState('all')
  const mine = new Map(d.invoices.filter(i => isMine(i, role, business.id)).map(i => [i.id, i]))
  const all = d.disputes.filter(x => mine.has(x.invoice_id))
  const list = all.filter(x => filter === 'all' || x.status === filter)
  const name = id => d.businesses.find(b => b.id === id)?.name ?? '—'

  function details(x) {
    const it = d.items.find(i => i.id === x.item_id)
    if (['quantity', 'damaged'].includes(x.type)) return t('drawer.disputeQty', { item: it?.description ?? '', a: Number(x.expected_qty), b: Number(x.received_qty), c: Number(x.expected_qty - x.received_qty), word: x.type === 'damaged' ? t('drawer.damagedWord') : t('drawer.missingWord') })
    if (x.type === 'rate') return t('drawer.disputeRate', { item: it?.description ?? '', a: inr(x.billed_rate), b: inr(x.claimed_rate) })
    return x.note ?? ''
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{role === 'buyer' ? t('app.disputes.titleBuyer') : t('app.disputes.titleSeller')}</h1>
        <p className="text-muted">{role === 'buyer' ? t('app.disputes.subBuyer') : t('app.disputes.subSeller')}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('app.disputes.st.open')} value={all.filter(x => x.status === 'open').length} tone="accent" />
        <Stat label={t('app.disputes.st.accepted')} value={all.filter(x => x.status === 'accepted').length} tone="ok" />
        <Stat label={t('app.disputes.st.rejected')} value={all.filter(x => x.status === 'rejected').length} tone="bad" />
      </div>
      <div className="flex gap-1">
        {['all', 'open', 'accepted', 'rejected'].map(k => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${filter === k ? 'bg-ink text-white' : 'bg-white text-muted'}`}>
            {k === 'all' ? t('app.common.all') : t(`app.disputes.st.${k}`)}</button>
        ))}
      </div>
      <Card>
        {list.length === 0 ? <p className="py-8 text-center text-muted">{t('app.disputes.none')}</p> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-canvas text-left text-xs text-muted"><tr>{t('app.disputes.heads').map(h => <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>)}<th /></tr></thead>
              <tbody>
                {list.map(x => {
                  const inv = mine.get(x.invoice_id)
                  return (
                    <tr key={x.id} className={`border-t border-line ${x.status === 'open' && role === 'seller' ? 'bg-accent-soft/50' : ''}`}>
                      <td className="px-5 py-3 font-bold">{inv.invoice_no}</td>
                      <td className="px-5 py-3">{name(otherParty(inv, role))}</td>
                      <td className="px-5 py-3"><Chip tone="accent">{t(`dispute.${x.type}`)}</Chip></td>
                      <td className="max-w-xs px-5 py-3 text-xs">{details(x)}{x.resolution_note && <div className="text-muted">↳ {x.resolution_note}</div>}</td>
                      <td className="px-5 py-3"><Chip tone={x.status === 'open' ? 'warn' : x.status === 'accepted' ? 'ok' : 'bad'}>{t(`app.disputes.st.${x.status}`)}</Chip></td>
                      <td className="px-5 py-3 text-xs text-muted">{ago(x.created_at)}</td>
                      <td className="px-5 py-3 text-right"><Link to={`${base}/invoices/${inv.id}`} className={x.status === 'open' && role === 'seller' ? 'btn-primary !py-1.5' : 'btn-ghost !py-1.5'}>{t('app.disputes.open')}<ArrowRight size={14} /></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
