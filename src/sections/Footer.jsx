import { Logo } from '../components/ui'
import { LangSwitch, useLang } from '../i18n'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="border-t border-line bg-white px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted">{t('footer.blurb')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm font-semibold text-muted">
          <a href="#how" className="hover:text-ink">{t('nav.how')}</a>
          <a href="/app" target="_blank" rel="noopener" className="hover:text-ink">{t('nav.mvp')} ↗</a>
          <a href="#contact" className="hover:text-ink">{t('nav.contact')}</a>
          <a href="https://github.com/yatish0777/GIVA" target="_blank" rel="noreferrer" className="hover:text-ink">{t('footer.github')}</a>
          <LangSwitch />
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl text-xs text-muted">{t('footer.disclaimer')}</div>
    </footer>
  )
}
