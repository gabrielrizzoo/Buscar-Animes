import { Icon, LogoMark } from './Icon.tsx'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <a
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-display text-[1.05rem] font-semibold tracking-tight"
        >
          <LogoMark className="size-8" />
          Buscar Animes
        </a>
        <a
          href="https://github.com/gabrielrizzoo/Buscar-Animes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted transition-[color,background-color] duration-200 hover:bg-white/[0.06] hover:text-ink"
        >
          <Icon name="code" className="size-4.5" />
          {/* No celular só o ícone aparece; o nome continua para leitores de tela */}
          <span className="sr-only sm:not-sr-only">Código-fonte</span>{' '}
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </nav>
    </header>
  )
}
