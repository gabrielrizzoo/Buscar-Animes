const FIRST_YEAR = 2024
const CURRENT_YEAR = new Date().getFullYear()
const YEARS =
  CURRENT_YEAR > FIRST_YEAR
    ? `${FIRST_YEAR}–${CURRENT_YEAR}`
    : String(FIRST_YEAR)

const linkClass =
  'underline decoration-white/20 underline-offset-4 transition-[color,background-color,border-color] hover:text-ink'

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 px-6 py-10 text-center text-[0.9rem] text-muted">
      <p>© {YEARS} Buscar Animes. Todos os direitos reservados.</p>
      <p>
        Desenvolvido usando a{' '}
        <a
          className={linkClass}
          href="https://jikan.moe/"
          target="_blank"
          rel="noopener noreferrer"
        >
          API Jikan
        </a>{' '}
        (
        <a
          className={linkClass}
          href="https://myanimelist.net/"
          target="_blank"
          rel="noopener noreferrer"
        >
          MyAnimeList
        </a>
        ) ·{' '}
        <a
          className={linkClass}
          href="https://github.com/gabrielrizzoo/Buscar-Animes"
          target="_blank"
          rel="noopener noreferrer"
        >
          Código-fonte
        </a>
      </p>
    </footer>
  )
}
