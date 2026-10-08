import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'

const DataCtx = createContext(null)

const empty = { businesses: [], invoices: [], items: [], disputes: [], creditNotes: [], requests: [], history: [], stock: [] }

export function DataProvider({ children }) {
  const [data, setData] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [live, setLive] = useState(false)
  const listeners = useRef(new Set())
  const timer = useRef(null)

  const load = useCallback(async () => {
    if (!supabaseConfigured) { setError('Supabase is not configured'); setLoading(false); return }
    const q = (t, order = 'created_at') => supabase.from(t).select('*').order(order, { ascending: false })
    const [b, i, it, d, c, r, h, s] = await Promise.all([
      supabase.from('businesses').select('*').order('name'),
      q('invoices'),
      supabase.from('invoice_items').select('*'),
      q('disputes'),
      q('credit_notes'),
      q('invoice_requests'),
      supabase.from('status_history').select('*').order('created_at', { ascending: true }),
      q('stock_movements'),
    ])
    const err = [b, i, it, d, c, r, h, s].find(x => x.error)
    if (err) { setError(err.error.message); setLoading(false); return }
    setData({
      businesses: b.data, invoices: i.data, items: it.data, disputes: d.data,
      creditNotes: c.data, requests: r.data, history: h.data, stock: s.data,
    })
    setError(null)
    setLoading(false)
  }, [])

  const refresh = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(load, 150)
  }, [load])

  useEffect(() => {
    load()
    if (!supabaseConfigured) return
    const ch = supabase.channel('giva-live')
    for (const table of ['invoices', 'disputes', 'credit_notes', 'invoice_requests', 'stock_movements', 'businesses']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        refresh()
        listeners.current.forEach(fn => fn({ table, payload }))
      })
    }
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_history' }, (payload) => {
      refresh()
      listeners.current.forEach(fn => fn({ table: 'status_history', payload }))
    })
    ch.subscribe(status => setLive(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [load, refresh])

  const onEvent = useCallback((fn) => {
    listeners.current.add(fn)
    return () => listeners.current.delete(fn)
  }, [])

  return (
    <DataCtx.Provider value={{ ...data, loading, error, live, refresh: load, onEvent }}>
      {children}
    </DataCtx.Provider>
  )
}

export function useData() {
  return useContext(DataCtx)
}

export function useBusiness(id) {
  const { businesses } = useData()
  return businesses.find(b => b.id === id)
}
