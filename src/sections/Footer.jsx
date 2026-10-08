import { Logo } from '../components/ui'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted">Receive, verify, dispute, approve and track B2B GST invoices — ek hi jagah. A PBL project.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-semibold text-muted">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#demo" className="hover:text-ink">Live demo</a>
          <a href="#contact" className="hover:text-ink">Contact</a>
          <a href="https://github.com/yatish0777/GIVA" target="_blank" rel="noreferrer" className="hover:text-ink">GitHub</a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl text-xs text-muted">Demo data is fictional. GST portal actions are simulated for the project.</div>
    </footer>
  )
}
