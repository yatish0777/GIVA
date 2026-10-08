import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'
import { useLang } from '../../i18n'
import { InvoiceList, Requests, Notes, Inventory, Returns } from '../Panels'
import { useApp } from '../ctx'

function Head({ title, sub, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold">{title}</h1>{sub && <p className="text-muted">{sub}</p>}</div>
      {right}
    </div>
  )
}

export function InvoicesPage() {
  const { t } = useLang()
  const { role, business, base } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  return (
    <>
      <Head title={role === 'buyer' ? t('app.nav.received') : t('app.nav.issued')}
        right={role === 'seller' && <Link to={`${base}/new`} className="btn-primary"><FilePlus2 size={16} />{t('app.nav.newInvoice')}</Link>} />
      <InvoiceList role={role} business={business} onOpen={id => nav(`${base}/invoices/${id}`)} initialQ={params.get('q') ?? ''} initialFilter={params.get('f') ?? 'all'} />
    </>
  )
}

export function RequestsPage() {
  const { t } = useLang()
  const { role, business, base } = useApp()
  const nav = useNavigate()
  return (
    <>
      <Head title={role === 'buyer' ? t('app.nav.ask') : t('app.nav.requests')} sub={role === 'buyer' ? t('req.sub') : t('req.sellerSub')} />
      <Requests role={role} business={business} onCreateFromRequest={r => nav(`${base}/new`, { state: { request: r } })} />
    </>
  )
}

export function NotesPage() {
  const { t } = useLang()
  const { role, business, base } = useApp()
  const nav = useNavigate()
  return (<><Head title={t('app.nav.notes')} /><Notes role={role} business={business} onOpen={id => nav(`${base}/invoices/${id}`)} /></>)
}

export function InventoryPage() {
  const { t } = useLang()
  const { role, business } = useApp()
  return (<><Head title={t('app.nav.inventory')} sub={role === 'buyer' ? t('inv.emptyBuyer') : t('inv.emptySeller')} /><Inventory role={role} business={business} /></>)
}

export function ReturnsPage() {
  const { t } = useLang()
  const { role, business } = useApp()
  return (<><Head title={t('app.nav.returns')} sub={t('ret.hint')} /><Returns role={role} business={business} /></>)
}
