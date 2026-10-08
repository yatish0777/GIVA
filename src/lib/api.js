import { supabase } from './supabase'

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw error
  return data
}

export const api = {
  createInvoice: (p) => rpc('create_invoice', {
    p_seller: p.sellerId, p_buyer: p.buyerId, p_items: p.items, p_gst_rate: p.gstRate,
    p_request_id: p.requestId ?? null, p_upload_to_gst: p.uploadToGst ?? true,
  }),
  markViewed: (id) => rpc('mark_viewed', { p_invoice: id }),
  recordGoods: (id, status) => rpc('record_goods', { p_invoice: id, p_status: status }),
  buyerAction: (id, action, note) => rpc('buyer_action', { p_invoice: id, p_action: action, p_note: note ?? null }),
  raiseDispute: (p) => rpc('raise_dispute', {
    p_invoice: p.invoiceId, p_type: p.type, p_item: p.itemId ?? null,
    p_received_qty: p.receivedQty ?? null, p_claimed_rate: p.claimedRate ?? null, p_note: p.note ?? null,
  }),
  resolveDispute: (id, accept, note, amount) => rpc('resolve_dispute', {
    p_dispute: id, p_accept: accept, p_note: note ?? null, p_amount: amount ?? null,
  }),
  uploadToGst: (id) => rpc('upload_to_gst', { p_invoice: id }),
  requestInvoice: (p) => rpc('request_invoice', {
    p_buyer: p.buyerId, p_seller: p.sellerId, p_reference: p.reference, p_amount: p.amount ?? null, p_note: p.note ?? null,
  }),
  declineRequest: (id, note) => rpc('decline_request', { p_request: id, p_note: note ?? null }),
  markPaid: (id) => rpc('mark_paid', { p_invoice: id }),
  submitFeedback: (p) => rpc('submit_feedback', {
    p_name: p.name, p_contact: p.contact, p_message: p.message, p_organisation: p.organisation || null, p_role: p.role,
  }),
}
