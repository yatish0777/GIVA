import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { friendlyError, inr, taxSplit } from '../lib/format'

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

export default function CreateInvoice({ seller, buyers, request, onDone, onCancel }) {
  const [buyerId, setBuyerId] = useState(request?.buyer_id ?? buyers[0]?.id ?? '')
  const [rows, setRows] = useState(() => request
    ? [{ description: `Goods as per ${request.reference}`.slice(0, 120), hsn: '3917', unit: 'lot', qty: 1, rate: Math.round(Number(request.approx_amount || 11800) / 1.18) }]
    : [blankRow()])
  const [gstRate, setGstRate] = useState(18)
  const [upload, setUpload] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!buyerId && buyers[0]) setBuyerId(buyers[0].id) }, [buyers, buyerId])

  const buyer = buyers.find(b => b.id === buyerId)
  const taxable = rows.reduce((s, r) => s + Number(r.qty || 0) * Number(r.rate || 0), 0)
  const gst = Math.round(taxable * gstRate) / 100
  const split = useMemo(() => taxSplit(seller.gstin, buyer?.gstin, gst), [seller.gstin, buyer?.gstin, gst])

  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => j === i ? { ...r, ...patch } : r))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const id = await api.createInvoice({
        sellerId: seller.id, buyerId, gstRate, uploadToGst: upload, requestId: request?.id ?? null,
        items: rows.map(r => ({ description: r.description, hsn: r.hsn, unit: r.unit, qty: Number(r.qty), rate: Number(r.rate) })),
      })
      toast.success(`Invoice sent to ${buyer?.name} 📤`, { description: upload ? 'Reported on GST portal (GSTR-1 / IRN)' : 'Not uploaded on GST yet' })
      onDone?.(id)
    } catch (err) { toast.error(friendlyError(err)) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div><label className="label">Bill to (buyer)</label>
          <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className="input" disabled={!!request}>
            {buyers.map(b => <option key={b.id} value={b.id}>{b.name} · {b.gstin}</option>)}
          </select></div>
        <div><label className="label">GST rate</label>
          <select value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className="input">
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </select></div>
      </div>
      {request && <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm">Raising bill against buyer request <b>{request.reference}</b></div>}

      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_90px_110px_110px_36px] gap-2 px-1 text-xs font-semibold text-muted sm:grid">
          <span>Item</span><span>Qty</span><span>Rate (₹)</span><span className="text-right">Amount</span><span />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-2 sm:grid-cols-[1fr_90px_110px_110px_36px] sm:border-0 sm:p-0">
            <div className="col-span-2 sm:col-span-1">
              <input list="giva-products" value={r.description} className="input" required maxLength={120}
                onChange={e => {
                  const p = PRODUCTS.find(x => x.description === e.target.value)
                  setRow(i, p ? { ...p } : { description: e.target.value })
                }} />
            </div>
            <input type="number" min="1" step="1" value={r.qty} onChange={e => setRow(i, { qty: e.target.value })} className="input" required aria-label="Quantity" />
            <input type="number" min="0" step="0.01" value={r.rate} onChange={e => setRow(i, { rate: e.target.value })} className="input" required aria-label="Rate" />
            <div className="flex items-center justify-end text-sm font-semibold">{inr(Number(r.qty || 0) * Number(r.rate || 0))}</div>
            <button type="button" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} disabled={rows.length === 1}
              className="flex items-center justify-center rounded-lg text-muted hover:bg-bad-soft hover:text-bad disabled:opacity-30 cursor-pointer" aria-label="Remove item"><Trash2 size={16} /></button>
          </div>
        ))}
        <datalist id="giva-products">{PRODUCTS.map(p => <option key={p.description} value={p.description} />)}</datalist>
        {rows.length < 20 && <button type="button" onClick={() => setRows(rs => [...rs, { ...PRODUCTS[3], qty: 50 }])} className="btn-ghost !py-2"><Plus size={16} />Add item</button>}
      </div>

      <div className="rounded-2xl bg-canvas p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted">Taxable value</span><span>{inr(taxable, { decimals: true })}</span></div>
        {split.igst > 0
          ? <div className="flex justify-between"><span className="text-muted">IGST @ {gstRate}% (inter-state)</span><span>{inr(split.igst, { decimals: true })}</span></div>
          : <>
            <div className="flex justify-between"><span className="text-muted">CGST @ {gstRate / 2}%</span><span>{inr(split.cgst, { decimals: true })}</span></div>
            <div className="flex justify-between"><span className="text-muted">SGST @ {gstRate / 2}%</span><span>{inr(split.sgst, { decimals: true })}</span></div>
          </>}
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span className="text-brand">{inr(taxable + gst, { decimals: true })}</span></div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
        <input type="checkbox" checked={upload} onChange={e => setUpload(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
        <span><b>Report on GST portal now</b> (e-invoice IRN + GSTR-1).<br /><span className="text-muted">Untick to simulate a seller who forgot — buyer will see "Not on GST".</span></span>
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>}
        <button disabled={busy || !buyerId} className="btn-primary">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Create & send to buyer</button>
      </div>
    </form>
  )
}
