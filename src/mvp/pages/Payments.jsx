import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Info, Loader2, QrCode, BellRing, IndianRupee } from 'lucide-react'
import { useData } from '../../lib/data'
import { api } from '../../lib/api'
import { useLang } from '../../i18n'
import { daysBetween, friendlyError, inr, netPayable } from '../../lib/format'
import { Chip, Modal, Stat } from '../../components/ui'
import { useApp, isMine, otherParty } from '../ctx'
import { Card } from './Dashboard'

export default function Payments() {
  const d = useData()
  const { t, fdate } = useLang()
  const { role, business, base } = useApp()
  const buyer = role === 'buyer'
  const [busy, setBusy] = useState(null)
  const [upi, setUpi] = useState(null)
  const mine = d.invoices.filter(i => isMine(i, role, business.id))
  const unpaid = mine.filter(i => i.status === 'accepted' && i.payment_status === 'unpaid').sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
  const paid = mine.filter(i => i.payment_status === 'paid')
  const name = id => d.businesses.find(b => b.id === id)?.name ?? '—'
  const net = i => netPayable(i, d.creditNotes)
  const sum = l => l.reduce((s, i) => s + net(i), 0)
  const overdue = unpaid.filter(i => daysBetween(i.due_date) < 0)
  const soon = unpaid.filter(i => { const n = daysBetween(i.due_date); return n >= 0 && n <= 7 })

  async function received(i) {
    setBusy(i.id)
    try { await api.markPaid(i.id); toast.success(t('drawer.t.paid')); await d.refresh() }
    catch (e) { toast.error(friendlyError(e)) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{buyer ? t('app.payments.titleBuyer') : t('app.payments.titleSeller')}</h1>
        <p className="text-muted">{buyer ? t('app.payments.subBuyer') : t('app.payments.subSeller')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('app.payments.totalDue')} value={inr(sum(unpaid))} tone="brand" />
        <Stat label={t('app.payments.overdue')} value={inr(sum(overdue))} tone="bad" />
        <Stat label={t('app.payments.dueSoon')} value={inr(sum(soon))} tone="warn" />
        <Stat label={t('app.payments.paid')} value={inr(sum(paid))} tone="ok" />
      </div>

      <div className="flex gap-3 rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm">
        <Info size={18} className="mt-0.5 flex-none text-brand" />
        <div><b>{t('app.payments.msme')}:</b> {t('app.payments.msmeHint')}</div>
      </div>

      <Card>
        {unpaid.length === 0 ? <div className="py-8 text-center text-muted">{buyer ? t('app.payments.noneDue') : t('app.payments.noneRecv')}</div> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-canvas text-left text-xs text-muted"><tr>{t('app.payments.heads').map((h, i) => <th key={i} className="px-5 py-2.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {unpaid.map(i => {
                  const n = daysBetween(i.due_date)
                  const tone = n < 0 ? 'bad' : n <= 7 ? 'warn' : 'muted'
                  const pct = Math.min(100, Math.max(0, ((45 - Math.max(n, 0)) / 45) * 100))
                  return (
                    <tr key={i.id} className="border-t border-line">
                      <td className="px-5 py-3"><Link to={`${base}/invoices/${i.id}`} className="font-bold text-brand hover:underline">{i.invoice_no}</Link></td>
                      <td className="px-5 py-3">{name(otherParty(i, role))}</td>
                      <td className="px-5 py-3 font-semibold">{inr(net(i))}</td>
                      <td className="px-5 py-3">
                        <div>{fdate(i.due_date)}</div>
                        <div className="mt-1 h-1.5 w-28 rounded-full bg-canvas"><div className={`h-1.5 rounded-full ${n < 0 ? 'bg-bad' : n <= 7 ? 'bg-[#d99a06]' : 'bg-ok'}`} style={{ width: `${pct}%` }} /></div>
                      </td>
                      <td className="px-5 py-3"><Chip tone={tone}>{n < 0 ? t('app.payments.overdueBy', { n: -n }) : n === 0 ? t('app.payments.today') : t('app.payments.daysLeft', { n })}</Chip></td>
                      <td className="px-5 py-3 text-right">
                        {buyer ? (
                          <button onClick={() => setUpi(i)} className="btn-accent !py-1.5"><QrCode size={15} />{t('app.payments.payUpi')}</button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => toast.success(t('app.payments.reminded', { name: name(i.buyer_id) }))} className="btn-ghost !py-1.5"><BellRing size={15} /><span className="hidden xl:inline">{t('app.payments.remind')}</span></button>
                            <button onClick={() => received(i)} disabled={busy === i.id} className="btn-ok !py-1.5">{busy === i.id ? <Loader2 size={15} className="animate-spin" /> : <IndianRupee size={15} />}{t('app.payments.markReceived')}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={t('app.payments.history')}>
        {paid.length === 0 ? <p className="text-sm text-muted">{t('app.payments.noHistory')}</p> : (
          <div className="divide-y divide-line">
            {paid.map(i => {
              const ev = d.history.filter(h => h.invoice_id === i.id && h.event === 'Payment received').pop()
              return (
                <Link key={i.id} to={`${base}/invoices/${i.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-canvas/60">
                  <span><b>{i.invoice_no}</b> · {name(otherParty(i, role))}<span className="block text-xs text-muted">{ev ? fdate(ev.created_at) : ''} · UPI</span></span>
                  <span className="font-semibold text-ok">{inr(net(i))}</span>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <UpiModal inv={upi} seller={upi && d.businesses.find(b => b.id === upi.seller_id)} amount={upi && net(upi)} onClose={() => setUpi(null)} />
    </div>
  )
}

function UpiModal({ inv, seller, amount, onClose }) {
  const { t } = useLang()
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!inv || !seller) return
    const vpa = `${(seller.name.split(' ')[0] || 'giva').toLowerCase()}.demo@giva`
    QRCode.toDataURL(`upi://pay?pa=${vpa}&pn=${encodeURIComponent(seller.name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${inv.invoice_no}`, { width: 220, margin: 1 }).then(setSrc)
  }, [inv, seller, amount])
  return (
    <Modal open={!!inv} onClose={onClose} title={inv ? t('app.payments.upiTitle', { amt: inr(amount) }) : ''} width="max-w-sm">
      {inv && (
        <div className="text-center">
          {src && <img src={src} alt="UPI QR (demo)" className="mx-auto h-56 w-56 rounded-xl border border-line" />}
          <div className="mt-3 font-semibold">{seller?.name}</div>
          <div className="text-sm text-muted">{inv.invoice_no} · {inr(amount)}</div>
          <div className="mt-4 rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">{t('app.payments.upiNote')}</div>
          <p className="mt-3 text-xs text-muted">{t('app.payments.upiAfter')}</p>
        </div>
      )}
    </Modal>
  )
}
