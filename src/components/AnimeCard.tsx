import type { Anime } from '../types/anime.ts'
import { formatScore } from '../utils/format.ts'
import { CoverImage } from './CoverImage.tsx'
import { Icon, StarIcon } from './Icon.tsx'
import { cardSurface } from './styles.ts'

export const MISSING_SYNOPSIS =
  'Sem informações catalogadas de enredo até o momento.'

interface AnimeCardProps {
  anime: Anime
  /** Atraso da animação de entrada, em segundos, para os cards surgirem em sequência. */
  animationDelay?: number
}

/**
 * Card do resultado. O link do título se estende sobre o card inteiro, então
 * qualquer clique abre a página do anime, mas leitores de tela ouvem um único link.
 */
export function AnimeCard({ anime, animationDelay = 0 }: AnimeCardProps) {
  return (
    <article
      style={{ animationDelay: `${animationDelay}s` }}
      className={`${cardSurface} group transition-[translate,border-color,background-color,box-shadow] duration-300 ease-smooth hover:border-accent/40 hover:bg-night/80 hover:shadow-[0_24px_48px_-24px_rgb(245_158_11/0.4)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent motion-safe:animate-rise-in motion-safe:hover:-translate-y-1`}
    >
      <div className="relative w-24 shrink-0 self-start overflow-hidden rounded-xl sm:w-full sm:rounded-none">
        <CoverImage
          src={anime.imageUrl}
          thumbnailSrc={anime.thumbnailUrl}
          title={anime.title}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/3 bg-linear-to-t from-night/90 to-transparent sm:block"
        />
        <ScoreBadge score={anime.score} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-0.5 sm:p-4 sm:pt-3.5">
        <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-ink sm:text-base">
          <a
            href={anime.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-hidden"
          >
            {anime.title}{' '}
            <span className="sr-only">
              (abre no {anime.linkSite} em nova aba)
            </span>
          </a>
        </h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium tracking-wide text-muted uppercase">
          {anime.type && (
            <>
              <span>
                <span className="sr-only">Tipo:</span> {anime.type}
              </span>
              <span aria-hidden="true" className="text-white/25">
                •
              </span>
            </>
          )}
          <span>
            <span className="sr-only">Ano:</span> {anime.year ?? 'TBA'}
          </span>
        </p>

        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
          {anime.synopsis ?? MISSING_SYNOPSIS}
        </p>

        <span
          aria-hidden="true"
          className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-accent/80 transition-colors duration-200 group-hover:text-accent-soft"
        >
          {anime.linkSite}
          <Icon name="arrow-up-right" className="size-3.5" />
        </span>
      </div>
    </article>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-night-deep/85 px-2 py-0.5 text-[0.7rem] font-semibold text-accent-soft ring-1 ring-white/10 backdrop-blur-sm">
      <span className="sr-only">Nota:</span>
      {score !== null ? (
        <>
          <StarIcon className="size-3 text-accent" />
          {formatScore(score)}
        </>
      ) : (
        'Sem nota'
      )}
    </span>
  )
}
