import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/ui'
import { LangSwitch, useLang } from '../i18n'
import Mvp from '../mvp/Mvp'

export default function AppPage() {
  const { t } = useLang()
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link to="/#demo" className="btn-ghost !py-2"><ArrowLeft size={16} /><span className="hidden sm:inline">{t('common.backToSite')}</span></Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-12"><Mvp /></main>
    </div>
  )
}
