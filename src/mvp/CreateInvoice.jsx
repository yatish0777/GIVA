import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { friendlyError, inr, taxSplit } from '../lib/format'
import { useLang } from '../i18n'

export const PRODUCTS = [
  { description: 'PVC Pipe 4" · 6 kg/cm² · 6 m', hsn: '3917', unit: 'pcs', rate: 1000 },
  { description: 'PVC Pipe 2" · 6 kg/cm² · 6 m', hsn: '3917', unit: 'pcs', rate: 300 },
  { description: 'PVC Pipe 1" · 10 kg/cm² · 6 m', hsn: '3917', unit: 'pcs', rate: 180 },
  { description: 'PVC Elbow 4" 90°', hsn: '3917', unit: 'pcs', rate: 45 },
  { description: 'PVC Tee 4"', hsn: '3917', unit: 'pcs', rate: 60 },
  { description: 'PVC Solvent Cement 500 ml', hsn: '3506', unit: 'pcs', rate: 120 },
  { description: 'GI Pipe Clamp 4"', hsn: '7326', unit: 'pcs', rate: 180 },
]

const blankRow = () => ({ ...PRODUCTS[0], qty: 100 })

export default function CreateInvoice({ seller, buyers, request, onDone, onCancel, onDraft }) {
  const { t } = useLang()
  const [buyerId, setBuyerId] = useState(request?.buyer_id ?? buyers[0]?.id ?? '')
  const [rows, setRows] = useState(() => request
    ? [{ description: t('create.goodsAsPer', { ref: request.reference }).slice(0, 120), hsn: '3917', unit: 'lot', qty: 1, rate: Math.round(Number(request.approx_amount || 11800) / 1.18) }]
    : [blankRow()])
  const [gstRate, setGstRate] = useState(18)
  const [upload, setUpload] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!buyerId && buyers[0]) setBuyerId(buyers[0].id) }, [buyers, buyerId])

  const buyer = buyers.find(b => b.id === buyerId)
  const taxable = rows.reduce((s, r) => s + Number(r.qty || 0) * Number(r.rate || 0), 0)
  const gst = Math.round(taxable * gstRate) / 100
  const split = useMemo(() => taxSplit(seller.gstin, buyer?.gstin, gst), [seller.gstin, buyer?.gstin, gst])

  useEffect(() => { onDraft?.({ buyerId, rows, gstRate, taxable, gst }) }, [buyerId, rows, gstRate, taxable, gst]) // eslint-disable-line

  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => j === i ? { ...r, ...patch } : r))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const id = await api.createInvoice({
        sellerId: seller.id, buyerId, gstRate, uploadToGst: upload, requestId: request?.id ?? null,
        items: rows.map(r => ({ description: r.description, hsn: r.hsn, unit: r.unit, qty: Number(r.qty), rate: Number(r.rate) })),
      })
      toast.success(t('create.toastSent', { name: buyer?.name }), { description: upload ? t('create.toastReported') : t('create.toastNotReported') })
      onDone?.(id)
    } catch (err) { toast.error(friendlyError(err)) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div><label className="label">{t('create.billTo')}</label>
          <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className="input" disabled={!!request}>
            {buyers.map(b => <option key={b.id} value={b.id}>{b.name} · {b.gstin}</option>)}
          </select></div>
        <div><label className="label">{t('create.gstRate')}</label>
          <select value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className="input">
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select></div>
      </div>
      {request && <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm">{t('create.againstReq')} <b>{request.reference}</b></div>}

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 rounded-xl border border-line bg-canvas/40 p-3">
            <div className="col-span-4">
              <label className="label">{t('create.item')} {i + 1}</label>
              <input list="giva-products" value={r.description} className="input" required maxLength={120} aria-label={t('create.item')}
                onChange={e => {
                  const p = PRODUCTS.find(x => x.description === e.target.value)
                  setRow(i, p ? { ...p } : { description: e.target.value })
                }} />
            </div>
            <div><label className="label">{t('create.qty')}</label><input type="number" min="1" step="1" value={r.qty} onChange={e => setRow(i, { qty: e.target.value })} className="input" required /></div>
            <div><label className="label">{t('create.rate')}</label><input type="number" min="0" step="0.01" value={r.rate} onChange={e => setRow(i, { rate: e.target.value })} className="input" required /></div>
            <div><label className="label text-right">{t('create.amount')}</label><div className="flex h-[42px] items-center justify-end text-sm font-semibold">{inr(Number(r.qty || 0) * Number(r.rate || 0))}</div></div>
            <button type="button" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} disabled={rows.length === 1}
              className="mt-5 flex h-[42px] items-center justify-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad disabled:opacity-30 cursor-pointer" aria-label={t('create.remove')}><Trash2 size={16} /></button>
          </div>
        ))}
        <datalist id="giva-products">{PRODUCTS.map(p => <option key={p.description} value={p.description} />)}</datalist>
        {rows.length < 20 && <button type="button" onClick={() => setRows(rs => [...rs, { ...PRODUCTS[3], qty: 50 }])} className="btn-ghost !py-2"><Plus size={16} />{t('create.addItem')}</button>}
      </div>

      <div className="rounded-2xl bg-canvas p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted">{t('create.taxable')}</span><span>{inr(taxable, { decimals: true })}</span></div>
        {split.igst > 0
          ? <div className="flex justify-between"><span className="text-muted">{t('create.igst', { r: gstRate })}</span><span>{inr(split.igst, { decimals: true })}</span></div>
          : <>
            <div className="flex justify-between"><span className="text-muted">{t('create.cgst', { r: gstRate / 2 })}</span><span>{inr(split.cgst, { decimals: true })}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t('create.sgst', { r: gstRate / 2 })}</span><span>{inr(split.sgst, { decimals: true })}</span></div>
          </>}
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold"><span>{t('create.total')}</span><span className="text-brand">{inr(taxable + gst, { decimals: true })}</span></div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
        <input type="checkbox" checked={upload} onChange={e => setUpload(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
        <span><b>{t('create.report')}</b> {t('create.reportSub')}<br /><span className="text-muted">{t('create.reportHint')}</span></span>
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>}
        <button disabled={busy || !buyerId} className="btn-primary">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{t('create.submit')}</button>
      </div>
    </form>
  )
}
