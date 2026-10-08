import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Languages } from 'lucide-react'
import en from './en'
import hi from './hi'
import mr from './mr'

const DICTS = { en, hi, mr }
export const LANGS = [
  { code: 'en', short: 'EN', name: 'English', locale: 'en-IN' },
  { code: 'hi', short: 'हिं', name: 'हिंदी', locale: 'hi-IN' },
  { code: 'mr', short: 'मरा', name: 'मराठी', locale: 'mr-IN' },
]
const KEY = 'giva-lang'

function readLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl && DICTS[fromUrl]) return fromUrl
    const s = localStorage.getItem(KEY)
    if (s && DICTS[s]) return s
  } catch { /* ignore */ }
  return 'en'
}

function lookup(dict, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
}

function fill(s, vars) {
  if (typeof s !== 'string' || !vars) return s
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m))
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readLang)

  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }, [])

  // keep every open tab (website + MVP) in the same language
  useEffect(() => {
    const on = (e) => { if (e.key === KEY && DICTS[e.newValue]) setLangState(e.newValue) }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const value = useMemo(() => {
    const dict = DICTS[lang]
    const meta = LANGS.find(l => l.code === lang)
    const t = (path, vars) => {
      const v = lookup(dict, path)
      return fill(v === undefined ? lookup(en, path) ?? path : v, vars)
    }
    // translate text that comes from the database (status history events / fixed details)
    const ev = (text) => (text && dict.events[text]) || text
    const ago = (d) => {
      const s = (Date.now() - new Date(d).getTime()) / 1000
      if (s < 60) return t('ago.now')
      if (s < 3600) return t('ago.min', { n: Math.floor(s / 60) })
      if (s < 86400) return t('ago.hr', { n: Math.floor(s / 3600) })
      const n = Math.floor(s / 86400)
      return n === 1 ? t('ago.yesterday') : t('ago.days', { n })
    }
    const fdate = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
      new Date(d).toLocaleDateString(`${meta.locale}-u-nu-latn`, opts)
    return { lang, setLang, t, ev, ago, fdate, locale: meta.locale }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}

export function LangSwitch({ dark = false, className = '' }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className={`flex items-center gap-1 rounded-xl p-1 ${dark ? 'bg-white/10' : 'bg-canvas'} ${className}`} role="group" aria-label={t('common.language')}>
      <Languages size={15} className={`mx-1 ${dark ? 'text-white/80' : 'text-muted'}`} aria-hidden />
      {LANGS.map(l => (
        <button key={l.code} onClick={() => setLang(l.code)} title={l.name} aria-pressed={lang === l.code}
          className={`rounded-lg px-2 py-1 text-xs font-bold transition cursor-pointer ${lang === l.code
            ? (dark ? 'bg-white text-brand' : 'bg-white text-ink shadow-sm')
            : (dark ? 'text-white/80 hover:text-white' : 'text-muted hover:text-ink')}`}>
          {l.short}
        </button>
      ))}
    </div>
  )
}
