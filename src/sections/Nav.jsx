import { useEffect, useState } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'
import { Logo } from '../components/ui'
import { LangSwitch, useLang } from '../i18n'

export default function Nav() {
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const links = [['#problem', t('nav.problem')], ['#how', t('nav.how')], ['#demo', t('nav.mvp')], ['#idea', t('nav.why')], ['#contact', t('nav.contact')]]
  const solid = scrolled || open
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition ${solid ? 'bg-white/90 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo light={!solid} />
        <div className="hidden items-center gap-5 lg:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className={`text-sm font-semibold transition ${scrolled ? 'text-muted hover:text-ink' : 'text-white/80 hover:text-white'}`}>{label}</a>
          ))}
          <LangSwitch dark={!scrolled} />
          <a href="/app" target="_blank" rel="noopener" className="btn-accent">{t('nav.cta')}<ExternalLink size={14} /></a>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LangSwitch dark={!solid} />
          <button className={solid ? 'text-ink' : 'text-white'} onClick={() => setOpen(o => !o)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 lg:hidden">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block py-3 font-semibold text-ink">{label}</a>
          ))}
          <a href="/app" target="_blank" rel="noopener" className="btn-accent mt-2 w-full">{t('nav.cta')}<ExternalLink size={14} /></a>
        </div>
      )}
    </header>
  )
}
