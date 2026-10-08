import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/ui'
import Mvp from '../mvp/Mvp'

export default function AppPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Logo />
        <Link to="/#demo" className="btn-ghost !py-2"><ArrowLeft size={16} />Back to website</Link>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-12"><Mvp /></main>
    </div>
  )
}
