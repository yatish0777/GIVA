import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useData } from '../../lib/data'
import { useLang } from '../../i18n'
import { gstCheck, inr, inrShort, netPayable, stateOf } from '../../lib/format'
import { StatusChip } from '../../components/ui'
import { useApp, isMine, otherParty } from '../ctx'
import { Card } from './Dashboard'

export default function Parties() {
  const d = useData()
  const { t, fdate } = useLang()
  const { role, business, base } = useApp()
  const [open, setOpen] = useState(null)
  const mine = d.invoices.filter(i => isMine(i, role, business.id))

  const rows = useMemo(() => {
    const m = new Map()
    for (const i of mine) {
      const k = otherParty(i, role)
      const r = m.get(k) || { id: k, invs: [], value: 0, outstanding: 0, disputes: 0, matched: 0 }
      r.invs.push(i); r.value += Number(i.total)
      if (i.status === 'accepted' && i.payment_status === 'unpaid') r.outstanding += netPayable(i, d.creditNotes)
      if (gstCheck(i) === 'match') r.matched++
      r.disputes += d.disputes.filter(x => x.invoice_id === i.id).length
      m.set(k, r)
    }
    return [...m.values()].sort((a, b) => b.value - a.value)
  }, [mine, role, d.creditNotes, d.disputes])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{role === 'buyer' ? t('app.parties.suppliers') : t('app.parties.customers')}</h1>
        <p className="text-muted">{t('app.parties.sub')}</p>
      </div>
      <Card>
        {rows.length === 0 ? <p className="py-8 text-center text-muted">{t('app.parties.none')}</p> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-canvas text-left text-xs text-muted"><tr>{t('app.parties.heads').map(h => <th key={h} className="px-5 py-2.5 font-semibold">{h}</th>)}<th /></tr></thead>
              <tbody>
                {rows.map(r => {
                  const b = d.businesses.find(x => x.id === r.id)
                  const score = Math.round((r.matched / r.invs.length) * 100)
                  const isOpen = open === r.id
                  return (
                    <Fragment key={r.id}>
                      <tr onClick={() => setOpen(isOpen ? null : r.id)} className="cursor-pointer border-t border-line hover:bg-canvas">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-xs font-bold text-white ${role === 'buyer' ? 'bg-brand' : 'bg-accent'}`}>{b?.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>
                            <span><span className="block font-semibold">{b?.name}</span><span className="text-xs text-muted">{b?.city}</span></span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs"><div>{b?.gstin}</div><div className="text-muted">{stateOf(b?.gstin)}</div></td>
                        <td className="px-5 py-3">{r.invs.length}</td>
                        <td className="px-5 py-3 font-semibold">{inrShort(r.value)}</td>
                        <td className="px-5 py-3">{r.outstanding ? inr(r.outstanding) : '—'}</td>
                        <td className="px-5 py-3">{r.disputes || '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-canvas"><div className={`h-1.5 rounded-full ${score >= 90 ? 'bg-ok' : score >= 60 ? 'bg-[#d99a06]' : 'bg-bad'}`} style={{ width: `${score}%` }} /></div>
                            <span className="font-semibold">{score}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3"><ChevronDown size={16} className={`text-muted transition ${isOpen ? 'rotate-180' : ''}`} /></td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-canvas/60">
                          <td colSpan={8} className="px-5 py-3">
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{t('app.parties.recent')}</div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {r.invs.slice(0, 6).map(i => (
                                <Link key={i.id} to={`${base}/invoices/${i.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 hover:shadow-sm">
                                  <span><b>{i.invoice_no}</b><span className="block text-xs text-muted">{fdate(i.invoice_date)} · {inrShort(i.total)}</span></span>
                                  <StatusChip status={i.status} />
                                </Link>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
