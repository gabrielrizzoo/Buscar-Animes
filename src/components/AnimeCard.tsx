import type { ReactNode } from 'react'
import type { Anime } from '../types/anime.ts'
import { formatScore } from '../utils/format.ts'
import { CoverImage } from './CoverImage.tsx'
import { cardSurface } from './styles.ts'

export const MISSING_SYNOPSIS =
  'Sem informações catalogadas de enredo até o momento.'

interface AnimeCardProps {
  anime: Anime
  /** Atraso da animação de entrada, em segundos, para os cards surgirem em sequência. */
  animationDelay?: number
}

export function AnimeCard({ anime, animationDelay = 0 }: AnimeCardProps) {
  return (
    <article
      style={{ animationDelay: `${animationDelay}s` }}
      className={`${cardSurface} group transition-[translate,scale,box-shadow,border-color] duration-400 ease-smooth hover:border-t-white/30 hover:shadow-[0_20px_40px_rgb(0_0_0/0.5)] motion-safe:animate-fade-in motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.01]`}
    >
      <CoverImage src={anime.imageUrl} title={anime.title} />

      <div className="flex flex-1 flex-col p-7">
        <h3 className="mb-2.5 text-xl leading-[1.3] font-semibold">
          {anime.title}
        </h3>

        <div className="mb-5 flex flex-wrap gap-2 text-[0.8rem] font-medium">
          {anime.type && <Badge label="Tipo">{anime.type}</Badge>}
          <Badge label="Ano">{anime.year ?? 'TBA'}</Badge>
          {anime.score !== null ? (
            <Badge label="Nota" highlight>
              <span aria-hidden="true">⭐ </span>
              {formatScore(anime.score)}
            </Badge>
          ) : (
            <Badge label="Nota" highlight>
              <span aria-hidden="true">S/ Nota</span>
              <span className="sr-only">sem nota</span>
            </Badge>
          )}
        </div>

        <p className="mb-8 line-clamp-4 text-[0.95rem] leading-[1.7] text-muted">
          {anime.synopsis ?? MISSING_SYNOPSIS}
        </p>

        <a
          href={anime.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 py-[0.9rem] font-semibold text-ink transition-[color,background-color,border-color] duration-300 hover:border-ink hover:bg-ink hover:text-night"
        >
          Saber Mais{' '}
          <span className="sr-only">
            sobre {anime.title} no MyAnimeList (abre em nova aba)
          </span>
        </a>
      </div>
    </article>
  )
}

interface BadgeProps {
  /** Rótulo lido apenas por leitores de tela (ex.: "Ano: 2002"). */
  label: string
  highlight?: boolean
  children: ReactNode
}

function Badge({ label, highlight = false, children }: BadgeProps) {
  const colors = highlight
    ? 'border-accent/20 bg-accent/5 text-accent'
    : 'border-white/8 bg-white/5 text-ink'

  return (
    <span className={`rounded-full border px-[0.8rem] py-[0.3rem] ${colors}`}>
      <span className="sr-only">{label}:</span> {children}
    </span>
  )
}
