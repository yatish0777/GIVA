import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useData } from '../../lib/data'
import { useLang } from '../../i18n'
import CreateInvoice from '../CreateInvoice'
import TaxInvoice from '../TaxInvoice'
import { useApp } from '../ctx'
import { Card } from './Dashboard'

export default function CreatePage() {
  const d = useData()
  const { t } = useLang()
  const { role, business, base } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const request = loc.state?.request ?? null
  const [draft, setDraft] = useState(null)
  if (role !== 'seller') return <Navigate to={base} replace />

  const buyers = d.businesses.filter(b => b.id !== business.id && b.kind !== 'seller')
  const buyer = buyers.find(b => b.id === draft?.buyerId)
  const today = new Date()
  const due = new Date(today.getTime() + 45 * 86400000)
  const previewInv = draft && {
    id: 'draft', invoice_no: 'DRAFT', invoice_date: today.toISOString().slice(0, 10), due_date: due.toISOString().slice(0, 10),
    gst_rate: draft.gstRate, taxable_value: draft.taxable, gst_amount: draft.gst, total: draft.taxable + draft.gst, created_at: today.toISOString(),
  }
  const previewItems = (draft?.rows ?? []).map((r, i) => ({ id: i, ...r, amount: Number(r.qty || 0) * Number(r.rate || 0) }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{request ? t('mvp.createForReq') : t('app.create.pageTitle')}</h1>
        <p className="text-muted">{t('app.create.pageSub')}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CreateInvoice seller={business} buyers={buyers} request={request} onDraft={setDraft}
            onCancel={() => nav(-1)} onDone={id => { d.refresh(); nav(`${base}/invoices/${id}`) }} />
        </Card>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted"><Eye size={16} />{t('app.create.preview')}</div>
          {previewInv && <TaxInvoice draft invoice={previewInv} items={previewItems} seller={business} buyer={buyer} />}
        </div>
      </div>
    </div>
  )
}
