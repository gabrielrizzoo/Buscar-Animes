import type { Anime } from '../types/anime.ts'
import { formatScore } from '../utils/format.ts'
import { CoverImage } from './CoverImage.tsx'
import { StarIcon } from './Icon.tsx'
import { coverColorStyle } from './styles.ts'

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
      style={{
        ...coverColorStyle(anime.color),
        animationDelay: `${animationDelay}s`,
      }}
      className="group relative flex h-full gap-4 rounded-2xl has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent motion-safe:animate-rise-in sm:flex-col sm:gap-3.5"
    >
      <div className="relative w-24 shrink-0 self-start overflow-hidden rounded-xl ring-1 ring-white/10 transition-[translate,box-shadow] duration-300 ease-smooth group-hover:shadow-cover motion-safe:group-hover:-translate-y-1 sm:w-full">
        <CoverImage
          src={anime.imageUrl}
          thumbnailSrc={anime.thumbnailUrl}
          title={anime.title}
        />
        <ScoreBadge score={anime.score} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-0.5 sm:py-0">
        <h3 className="line-clamp-2 text-[0.95rem] leading-snug font-semibold text-ink transition-colors duration-200 group-hover:text-accent-soft">
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

        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-muted">
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

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted/90">
          {anime.synopsis ?? MISSING_SYNOPSIS}
        </p>
      </div>
    </article>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-canvas/80 px-2 py-0.5 text-[0.7rem] font-semibold text-accent-soft ring-1 ring-white/10 backdrop-blur-sm">
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
