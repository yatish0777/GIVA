import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useData } from '../lib/data'
import { supabase } from '../lib/supabase'

// Pops a notification when the OTHER party does something on one of my invoices
export function useLiveToasts(role, businessId) {
  const { onEvent, invoices, businesses } = useData()
  const ref = useRef({ invoices, businesses })
  ref.current = { invoices, businesses }

  useEffect(() => {
    if (!businessId) return
    return onEvent(async ({ table, payload }) => {
      if (table === 'invoice_requests' && payload.eventType === 'INSERT' && role === 'seller' && payload.new.seller_id === businessId) {
        const buyer = ref.current.businesses.find(b => b.id === payload.new.buyer_id)
        toast.warning('📩 Bill requested', { description: `${buyer?.name ?? 'Buyer'} is asking for a bill: ${payload.new.reference}` })
        return
      }
      if (table !== 'status_history') return
      const ev = payload.new
      if (ev.actor === role) return
      let inv = ref.current.invoices.find(i => i.id === ev.invoice_id)
      if (!inv) {
        const { data } = await supabase.from('invoices').select('id, invoice_no, buyer_id, seller_id').eq('id', ev.invoice_id).maybeSingle()
        inv = data
      }
      if (!inv) return
      const mine = role === 'buyer' ? inv.buyer_id === businessId : inv.seller_id === businessId
      if (!mine) return
      const title = `${inv.invoice_no}: ${ev.event}`
      const opts = { description: ev.detail || undefined }
      if (ev.event.startsWith('Dispute') || /reject/i.test(ev.event)) toast.error('⚠️ ' + title, opts)
      else if (/accept|approved|payment|correction done/i.test(ev.event)) toast.success('✅ ' + title, opts)
      else toast.info(title, opts)
    })
  }, [onEvent, role, businessId])
}
