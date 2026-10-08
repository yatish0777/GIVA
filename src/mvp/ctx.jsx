import { createContext, useContext } from 'react'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export const DEFAULT_BIZ = { buyer: '27ABMPS9876Q1Z3', seller: '27AABCA1234F1Z5' }
export const bizKey = role => `giva-biz-${role}`

export function readBiz(role) { try { return localStorage.getItem(bizKey(role)) } catch { return null } }
export function writeBiz(role, id) { try { localStorage.setItem(bizKey(role), id) } catch { /* ignore */ } }

// which invoices belong to me in this role
export const isMine = (inv, role, bizId) => (role === 'buyer' ? inv.buyer_id : inv.seller_id) === bizId
export const otherParty = (inv, role) => (role === 'buyer' ? inv.seller_id : inv.buyer_id)
