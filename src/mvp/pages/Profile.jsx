import { useState } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Building2, MapPin, Phone, Mail, Factory, Hash, Info } from 'lucide-react'
import { useData } from '../../lib/data'
import { LangSwitch, useLang } from '../../i18n'
import { gstCheck, inr, stateOf } from '../../lib/format'
import { useApp, isMine } from '../ctx'
import { Card } from './Dashboard'

const PREF_KEY = 'giva-prefs'
function readPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || { whatsapp: true, sms: false, emailSum: true } } catch { return { whatsapp: true, sms: false, emailSum: true } } }

export default function Profile() {
  const d = useData()
  const { t } = useLang()
  const { role, business, setBusiness } = useApp()
  const [prefs, setPrefs] = useState(readPrefs)
  const list = d.businesses.filter(b => (role === 'buyer' ? b.kind !== 'seller' : b.kind !== 'buyer'))
  const mine = d.invoices.filter(i => isMine(i, role, business.id))

  function toggle(k) {
    const next = { ...prefs, [k]: !prefs[k] }
    setPrefs(next)
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    toast.success(t('app.profile.saved'))
  }

  const fields = [
    [Hash, t('app.profile.gstin'), <span className="flex items-center gap-2 font-mono">{business.gstin}<BadgeCheck size={16} className="text-ok" /></span>],
    [MapPin, t('app.profile.state'), stateOf(business.gstin)],
    [Building2, t('app.profile.address'), business.address || '—'],
    [Phone, t('app.profile.phone'), business.phone || '—'],
    [Mail, t('app.profile.email'), business.email || '—'],
    [Factory, t('app.profile.udyam'), business.udyam || '—'],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('app.profile.title')}</h1>
        <p className="text-muted">{t('app.profile.sub')}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl font-display text-2xl font-bold text-white ${role === 'buyer' ? 'bg-accent' : 'bg-brand'}`}>{business.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>
            <div>
              <div className="font-display text-xl font-bold">{business.name}</div>
              <div className="text-sm text-muted">{t(`app.profile.kinds.${business.kind}`)} · {business.city}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok"><BadgeCheck size={13} />{t('app.profile.verified')}</div>
            </div>
          </div>
          <dl className="divide-y divide-line">
            {fields.map(([Icon, k, v]) => (
              <div key={k} className="flex items-start gap-3 py-3 text-sm">
                <Icon size={17} className="mt-0.5 flex-none text-muted" />
                <dt className="w-36 flex-none text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-5">
          <Card title={t('app.profile.stats')}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Box k={t('app.welcome.invoices', { n: '' }).trim()} v={mine.length} />
              <Box k={t('items.total')} v={inr(mine.reduce((s, i) => s + Number(i.total), 0))} />
              <Box k={t('gst.match')} v={`${mine.length ? Math.round(mine.filter(i => gstCheck(i) === 'match').length / mine.length * 100) : 100}%`} />
              <Box k={t('app.dash.disputed')} v={d.disputes.filter(x => mine.some(i => i.id === x.invoice_id)).length} />
            </div>
          </Card>
          <Card title={t('app.profile.prefs')}>
            {['whatsapp', 'sms', 'emailSum'].map(k => (
              <label key={k} className="flex cursor-pointer items-center justify-between py-2 text-sm">
                <span>{t(`app.profile.${k}`)}</span>
                <button type="button" role="switch" aria-checked={prefs[k]} onClick={() => toggle(k)} className={`relative h-6 w-11 rounded-full transition cursor-pointer ${prefs[k] ? 'bg-ok' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${prefs[k] ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </label>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm"><span>{t('app.profile.lang')}</span><LangSwitch /></div>
          </Card>
          <Card title={t('app.profile.switch')}>
            <select value={business.id} onChange={e => setBusiness(e.target.value)} className="input">
              {list.map(b => <option key={b.id} value={b.id}>{b.name} · {b.gstin}</option>)}
            </select>
          </Card>
          <div className="flex gap-2 rounded-2xl bg-warn-soft p-4 text-xs text-warn"><Info size={16} className="flex-none" />{t('app.profile.demoNote')}</div>
        </div>
      </div>
    </div>
  )
}

function Box({ k, v }) {
  return <div className="rounded-xl bg-canvas p-3"><div className="text-xs text-muted">{k}</div><div className="font-display text-lg font-bold">{v}</div></div>
}
