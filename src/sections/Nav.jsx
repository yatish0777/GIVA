import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from '../components/ui'

const links = [
  ['#problem', 'Problem'],
  ['#how', 'How it works'],
  ['#demo', 'Live MVP'],
  ['#idea', 'Why GIVA'],
  ['#contact', 'Contact'],
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition ${scrolled || open ? 'bg-white/90 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo light={!scrolled && !open} />
        <div className="hidden items-center gap-7 md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className={`text-sm font-semibold transition ${scrolled ? 'text-muted hover:text-ink' : 'text-white/80 hover:text-white'}`}>{label}</a>
          ))}
          <a href="#demo" className="btn-accent">Try the MVP</a>
        </div>
        <button className={`md:hidden ${scrolled || open ? 'text-ink' : 'text-white'}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 md:hidden">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block py-3 font-semibold text-ink">{label}</a>
          ))}
        </div>
      )}
    </header>
  )
}
