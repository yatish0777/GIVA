import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useLang } from '../i18n'
import { amountInWords, fakeAck, fakeIrn, inr, stateOf, taxSplit } from '../lib/format'

function useQr(text, size = 120) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    if (!text) { setSrc(null); return }
    QRCode.toDataURL(text, { margin: 1, width: size, color: { dark: '#14213d', light: '#ffffff' } }).then(u => alive && setSrc(u)).catch(() => {})
    return () => { alive = false }
  }, [text, size])
  return src
}

// A GST "Tax Invoice" laid out like a real e-invoice print. `draft` = live preview while creating.
export default function TaxInvoice({ invoice, items, seller, buyer, notes = [], draft = false }) {
  const { t, fdate } = useLang()
  const onGst = !draft && invoice.gst_reported_total != null
  const irn = onGst ? fakeIrn(invoice, seller?.gstin) : null
  const qr = useQr(irn ? `GIVA-DEMO|IRN:${irn}|${seller?.gstin}|${buyer?.gstin}|${invoice.invoice_no}|${invoice.total}` : null, 110)
  const upiAmt = Number(invoice.total).toFixed(2)
  const upi = useQr(seller ? `upi://pay?pa=${(seller.name.split(' ')[0] || 'giva').toLowerCase()}.demo@giva&pn=${encodeURIComponent(seller.name)}&am=${upiAmt}&cu=INR&tn=${invoice.invoice_no}` : null, 96)
  const rate = Number(invoice.gst_rate)
  const inter = seller && buyer && seller.gstin?.slice(0, 2) !== buyer.gstin?.slice(0, 2)
  const split = taxSplit(seller?.gstin, buyer?.gstin, invoice.gst_amount)
  const hsnRows = Object.values(items.reduce((m, it) => {
    const r = m[it.hsn] || { hsn: it.hsn, taxable: 0 }; r.taxable += Number(it.amount ?? it.qty * it.rate); m[it.hsn] = r; return m
  }, {}))

  return (
    <div className="print-area relative overflow-hidden rounded-2xl border border-line bg-white text-[12px] leading-snug text-ink shadow-sm">
      {draft && <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"><span className="-rotate-12 select-none text-6xl font-black tracking-widest text-ink/[0.06]">{t('app.doc.draft')}</span></div>}

      {/* header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-ink px-5 py-4">
        <div className="min-w-0">
          <div className="font-display text-lg font-bold">{seller?.name ?? '—'}</div>
          <div className="text-muted">{seller?.address}</div>
          <div className="mt-1"><b>GSTIN:</b> {seller?.gstin} · {stateOf(seller?.gstin)}</div>
          <div className="text-muted">{seller?.udyam && <>{t('app.doc.udyam')}: {seller.udyam} · </>}{t('app.doc.phone')}: {seller?.phone}</div>
        </div>
        <div className="flex-none text-right">
          <div className="font-display text-base font-extrabold tracking-wider">{t('app.doc.title')}</div>
          <div className="text-[11px] text-muted">{t('app.doc.original')}</div>
          <div className="mt-1 inline-block rounded bg-canvas px-2 py-0.5 text-[11px] font-semibold">{t('app.doc.einv')}</div>
        </div>
      </div>

      {/* IRN strip */}
      <div className="flex items-center gap-4 border-b border-line bg-canvas/60 px-5 py-3">
        <div className="min-w-0 flex-1">
          {irn ? <>
            <div className="break-all font-mono text-[10.5px]"><b className="font-sans">{t('app.doc.irn')}:</b> {irn}</div>
            <div className="mt-0.5 text-[11px]"><b>{t('app.doc.ack')}:</b> {fakeAck(invoice)} · <b>{t('app.doc.ackDate')}:</b> {fdate(invoice.created_at)}</div>
          </> : <div className="text-[11px] text-muted">{t('app.doc.notRegistered')}</div>}
        </div>
        {qr ? <img src={qr} alt="e-invoice QR" className="h-[84px] w-[84px] flex-none rounded border border-line" /> : <div className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded border border-dashed border-line text-[10px] text-muted">QR</div>}
      </div>

      {/* meta + parties */}
      <div className="grid gap-px bg-line sm:grid-cols-2">
        <div className="space-y-0.5 bg-white px-5 py-3">
          <Row k={t('app.doc.invNo')} v={<b>{draft ? t('app.create.draftNo') : invoice.invoice_no}</b>} />
          <Row k={t('app.doc.date')} v={fdate(invoice.invoice_date)} />
          <Row k={t('app.doc.due')} v={invoice.due_date ? fdate(invoice.due_date) : '—'} />
          <Row k={t('app.doc.place')} v={stateOf(buyer?.gstin)} />
          <Row k="" v={<span className="text-muted">{t('app.doc.reverse')}</span>} />
        </div>
        <div className="bg-white px-5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('app.doc.billTo')}</div>
          <div className="font-semibold">{buyer?.name ?? '—'}</div>
          <div className="text-muted">{buyer?.address}</div>
          <div><b>GSTIN:</b> {buyer?.gstin} · {stateOf(buyer?.gstin)}</div>
        </div>
      </div>

      {/* items */}
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[560px]">
          <thead className="bg-ink text-left text-[10.5px] text-white">
            <tr>
              <th className="px-2 py-1.5 pl-5">{t('app.doc.sr')}</th><th className="min-w-[150px] px-2 py-1.5">{t('app.doc.desc')}</th><th className="px-2 py-1.5">{t('app.doc.hsn')}</th>
              <th className="px-2 py-1.5 text-right">{t('app.doc.qty')}</th><th className="px-2 py-1.5 text-right">{t('app.doc.rate')}</th><th className="px-2 py-1.5 text-right">{t('app.doc.taxable')}</th>
              {inter ? <th className="px-2 py-1.5 text-right">{t('app.doc.igst')} {rate}%</th> : <><th className="px-2 py-1.5 text-right">{t('app.doc.cgst')} {rate / 2}%</th><th className="px-2 py-1.5 text-right">{t('app.doc.sgst')} {rate / 2}%</th></>}
              <th className="px-2 py-1.5 pr-5 text-right">{t('app.doc.total')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const amt = Number(it.amount ?? Number(it.qty) * Number(it.rate))
              const g = amt * rate / 100
              return (
                <tr key={it.id ?? i} className="border-b border-line">
                  <td className="px-2 py-1.5 pl-5">{i + 1}</td><td className="px-2 py-1.5 font-medium">{it.description}</td><td className="px-2 py-1.5">{it.hsn}</td>
                  <td className="px-2 py-1.5 text-right">{Number(it.qty)} {it.unit}</td><td className="px-2 py-1.5 text-right">{inr(it.rate, { decimals: true })}</td><td className="px-2 py-1.5 text-right">{inr(amt, { decimals: true })}</td>
                  {inter ? <td className="px-2 py-1.5 text-right">{inr(g, { decimals: true })}</td> : <><td className="px-2 py-1.5 text-right">{inr(g / 2, { decimals: true })}</td><td className="px-2 py-1.5 text-right">{inr(g / 2, { decimals: true })}</td></>}
                  <td className="px-2 py-1.5 pr-5 text-right font-semibold">{inr(amt + g, { decimals: true })}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* totals */}
      <div className="grid gap-px bg-line sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-2 bg-white px-5 py-3">
          <div><div className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('app.doc.words')}</div><div className="font-semibold">{amountInWords(invoice.total)}</div></div>
          <table className="w-full text-[11px]">
            <thead className="text-muted"><tr><th className="text-left font-semibold">{t('app.doc.hsn')}</th><th className="text-right font-semibold">{t('app.doc.taxable')}</th><th className="text-right font-semibold">{inter ? 'IGST' : 'CGST + SGST'}</th></tr></thead>
            <tbody>{hsnRows.map(h => <tr key={h.hsn}><td>{h.hsn}</td><td className="text-right">{inr(h.taxable, { decimals: true })}</td><td className="text-right">{inr(h.taxable * rate / 100, { decimals: true })}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="space-y-1 bg-white px-5 py-3">
          <Row k={t('app.doc.taxable')} v={inr(invoice.taxable_value, { decimals: true })} />
          {inter ? <Row k={`IGST @ ${rate}%`} v={inr(split.igst, { decimals: true })} /> : <>
            <Row k={`CGST @ ${rate / 2}%`} v={inr(split.cgst, { decimals: true })} />
            <Row k={`SGST @ ${rate / 2}%`} v={inr(split.sgst, { decimals: true })} />
          </>}
          <div className="mt-1 flex justify-between border-t-2 border-ink pt-1.5 text-sm font-bold"><span>{t('app.doc.grand')}</span><span>{inr(invoice.total, { decimals: true })}</span></div>
          {notes.map(n => <Row key={n.id} k={`${n.cn_no} · ${n.reason}`} v={<span className={n.kind === 'debit' ? 'text-brand' : 'text-ok'}>{n.kind === 'debit' ? '+' : '−'}{inr(n.total, { decimals: true })}</span>} />)}
        </div>
      </div>

      {/* footer */}
      <div className="grid items-end gap-4 border-t border-line px-5 py-4 sm:grid-cols-[auto_1fr_auto]">
        <div className="flex items-center gap-3">
          {upi && <img src={upi} alt="UPI QR (demo)" className="h-20 w-20 rounded border border-line" />}
          <div className="text-[11px]"><b>{t('app.doc.pay')}</b><br /><span className="text-muted">demo · {inr(invoice.total)}</span></div>
        </div>
        <div className="text-[11px] text-muted"><b className="text-ink">{t('app.doc.terms')}:</b> {t('app.doc.termsText')}</div>
        <div className="text-right text-[11px]">
          <div className="font-semibold">{t('app.doc.for', { name: seller?.name ?? '' })}</div>
          <div className="mt-8 border-t border-ink pt-1 text-muted">{t('app.doc.sign')}</div>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return <div className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>
}
