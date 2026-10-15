import { Icon, LogoMark } from './Icon.tsx'

export function Header() {
  return (
    <header className="px-4 sm:px-6">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-[1200px] items-center justify-between"
      >
        <a
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-display text-lg font-bold tracking-wide uppercase"
        >
          <LogoMark className="size-8" />
          Buscar Animes
        </a>
        <a
          href="https://github.com/gabrielrizzoo/Buscar-Animes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-muted transition-[color,background-color,border-color] duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-ink"
        >
          <Icon name="code" className="size-4" />
          Código-fonte
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </nav>

      <div className="mx-auto max-w-3xl pt-14 pb-10 text-center sm:pt-20 sm:pb-12">
        <h1 className="font-display text-[2.4rem] leading-[1.05] font-bold tracking-wide text-balance uppercase sm:text-6xl">
          Encontre seu próximo{' '}
          <span className="bg-linear-to-r from-accent-soft via-accent to-accent-strong bg-clip-text text-transparent">
            anime
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted sm:text-lg">
          Busque pelo título e veja capa, nota, ano e sinopse de cada resultado.
        </p>
      </div>
    </header>
  )
}
