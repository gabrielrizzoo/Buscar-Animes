const FIRST_YEAR = 2024
const CURRENT_YEAR = new Date().getFullYear()
const YEARS =
  CURRENT_YEAR > FIRST_YEAR
    ? `${FIRST_YEAR}–${CURRENT_YEAR}`
    : String(FIRST_YEAR)

const linkClass =
  'underline decoration-white/20 underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-ink hover:decoration-accent'

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-night-deep/60">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-8 text-center text-sm text-muted sm:flex-row sm:text-left">
        <p>© {YEARS} Buscar Animes. Todos os direitos reservados.</p>
        <p>
          Dados fornecidos pelo{' '}
          <a
            className={linkClass}
            href="https://anilist.co/"
            target="_blank"
            rel="noopener noreferrer"
          >
            AniList
          </a>
        </p>
      </div>
    </footer>
  )
}
