import { createClient } from '@supabase/supabase-js'

// Public project URL + publishable (browser) key. These are meant to be public;
// the database is protected by Row Level Security and validated RPC functions.
// Vercel env vars VITE_SUPABASE_URL / VITE_SUPABASE_KEY override them if set.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://nyqumzfmumqccdyvrybn.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_gbKWks-y7UIZ1YnNBYTjQg_DTXAfq9r'

export const supabaseConfigured = Boolean(url && key)

export const supabase = createClient(url, key, { auth: { persistSession: false } })
