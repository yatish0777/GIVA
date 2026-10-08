import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useData } from '../lib/data'
import { supabase } from '../lib/supabase'
import { useLang } from '../i18n'

// Pops a notification when the OTHER party does something on one of my invoices
export function useLiveToasts(role, businessId) {
  const { onEvent, invoices, businesses } = useData()
  const lang = useLang()
  const ref = useRef({ invoices, businesses, lang })
  ref.current = { invoices, businesses, lang }

  useEffect(() => {
    if (!businessId) return
    return onEvent(async ({ table, payload }) => {
      const { t, ev } = ref.current.lang
      if (table === 'invoice_requests' && payload.eventType === 'INSERT' && role === 'seller' && payload.new.seller_id === businessId) {
        const buyer = ref.current.businesses.find(b => b.id === payload.new.buyer_id)
        toast.warning(t('toast.billRequested'), { description: t('toast.billRequestedText', { name: buyer?.name ?? t('mvp.buyer'), ref: payload.new.reference }) })
        return
      }
      if (table !== 'status_history') return
      const e = payload.new
      if (e.actor === role) return
      let inv = ref.current.invoices.find(i => i.id === e.invoice_id)
      if (!inv) {
        const { data } = await supabase.from('invoices').select('id, invoice_no, buyer_id, seller_id').eq('id', e.invoice_id).maybeSingle()
        inv = data
      }
      if (!inv) return
      const mine = role === 'buyer' ? inv.buyer_id === businessId : inv.seller_id === businessId
      if (!mine) return
      const title = `${inv.invoice_no}: ${ev(e.event)}`
      const opts = { description: e.detail ? ev(e.detail) : undefined }
      if (e.event.startsWith('Dispute') || /reject/i.test(e.event)) toast.error('⚠️ ' + title, opts)
      else if (/accept|approved|payment|correction done/i.test(e.event)) toast.success('✅ ' + title, opts)
      else toast.info(title, opts)
    })
  }, [onEvent, role, businessId])
}
