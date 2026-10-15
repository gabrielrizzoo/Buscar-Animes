import { useEffect, useRef } from 'react'
import type { RandomAnimeState } from '../hooks/useRandomAnime.ts'
import type { Anime } from '../types/anime.ts'
import { formatEpisodes, formatScore } from '../utils/format.ts'
import { describeSearchError } from '../utils/searchErrors.ts'
import { MISSING_SYNOPSIS } from './AnimeCard.tsx'
import { CoverImage } from './CoverImage.tsx'
import { Icon, StarIcon } from './Icon.tsx'
import { coverColorStyle, primaryButton, secondaryButton } from './styles.ts'

interface RandomSpotlightProps {
  state: RandomAnimeState
  onPickAgain: () => void
  onClose: () => void
}

/** Destaque do anime sorteado, com atalho para sortear outro. */
export function RandomSpotlight({
  state,
  onPickAgain,
  onClose,
}: RandomSpotlightProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { status, anime } = state
  const loading = status === 'loading'

  // Ao aparecer, o destaque recebe o foco e rola até o topo da tela, para quem usa
  // teclado ou leitor de tela saber que o sorteio começou.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    section.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches
    // scrollIntoView não existe no jsdom dos testes.
    section.scrollIntoView?.({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  // Se o botão focado sumir na troca de estado (ex.: erro), o foco volta ao destaque.
  useEffect(() => {
    if (document.activeElement === document.body) sectionRef.current?.focus()
  }, [status])

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="titulo-sorteio"
      aria-busy={loading}
      style={coverColorStyle(anime?.color ?? null)}
      className="relative isolate mb-16 scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-surface outline-none motion-safe:animate-rise-in"
    >
      <SpotlightBackdrop anime={anime} />

      <div className="p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2
            id="titulo-sorteio"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-accent-soft uppercase"
          >
            <Icon name="dice" className="size-4" />
            Sorteado para você
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-1.5 grid size-9 place-items-center rounded-full text-muted transition-[color,background-color] duration-200 hover:bg-white/10 hover:text-ink"
          >
            <Icon name="x" className="size-5" />
            <span className="sr-only">Fechar sorteio</span>
          </button>
        </div>

        <p role="status" className="sr-only">
          {announcement(state)}
        </p>

        {status === 'error' ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-ink/90">
              {describeSearchError(state.error).message}
            </p>
            <button
              type="button"
              className={secondaryButton}
              onClick={onPickAgain}
            >
              <Icon name="dice" className="size-4" />
              Tentar de novo
            </button>
          </div>
        ) : anime ? (
          // Durante um novo sorteio, o anime anterior continua na tela, esmaecido.
          <div
            className={`transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}
          >
            <SpotlightDetails
              anime={anime}
              loading={loading}
              onPickAgain={onPickAgain}
            />
          </div>
        ) : (
          <SpotlightSkeleton />
        )}
      </div>
    </section>
  )
}

interface SpotlightDetailsProps {
  anime: Anime
  loading: boolean
  onPickAgain: () => void
}

function SpotlightDetails({
  anime,
  loading,
  onPickAgain,
}: SpotlightDetailsProps) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-5 sm:grid-cols-[11rem_1fr] sm:gap-x-8 md:grid-cols-[13rem_1fr]">
      <div className="self-start overflow-hidden rounded-xl ring-1 shadow-cover ring-white/10 sm:row-span-2 sm:rounded-2xl">
        <CoverImage
          src={anime.imageUrl}
          thumbnailSrc={anime.thumbnailUrl}
          title={anime.title}
          sizes="(min-width: 768px) 208px, (min-width: 640px) 176px, 104px"
        />
      </div>

      <div className="min-w-0 self-center sm:self-start">
        <h3 className="font-display text-xl leading-tight font-bold tracking-tight text-balance break-words sm:text-3xl">
          {anime.title}
        </h3>
        {anime.englishTitle && (
          <p className="mt-1 text-sm break-words text-muted sm:text-base">
            {anime.englishTitle}
          </p>
        )}
        <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <li className="inline-flex items-center gap-1 font-semibold text-accent-soft">
            <span className="sr-only">Nota:</span>
            {anime.score !== null ? (
              <>
                <StarIcon className="size-4 text-accent" />
                {formatScore(anime.score)}
              </>
            ) : (
              'Sem nota'
            )}
          </li>
          {anime.type && (
            <li>
              <span className="sr-only">Tipo:</span> {anime.type}
            </li>
          )}
          {anime.year !== null && (
            <li>
              <span className="sr-only">Ano:</span> {anime.year}
            </li>
          )}
          {anime.episodes !== null && <li>{formatEpisodes(anime.episodes)}</li>}
        </ul>
      </div>

      <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">
        {anime.genres.length > 0 && (
          <ul aria-label="Gêneros" className="flex flex-wrap gap-1.5">
            {anime.genres.map((genre) => (
              <li
                key={genre}
                className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-ink/85"
              >
                {genre}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 line-clamp-5 max-w-prose text-[0.95rem] leading-relaxed text-ink/80">
          {anime.synopsis ?? MISSING_SYNOPSIS}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={anime.url}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryButton}
          >
            Ver no {anime.linkSite}
            <Icon name="arrow-up-right" className="size-4" />{' '}
            <span className="sr-only">(abre em nova aba)</span>
          </a>
          {/* aria-disabled em vez de disabled: o botão continua focado durante o sorteio */}
          <button
            type="button"
            className={secondaryButton}
            aria-disabled={loading}
            onClick={loading ? undefined : onPickAgain}
          >
            <Icon name="dice" className="size-4" />
            {loading ? 'Sorteando…' : 'Sortear outro'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Fundo do destaque: o banner do anime bem escurecido e um brilho na cor da capa. */
function SpotlightBackdrop({ anime }: { anime: Anime | null }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      {anime?.bannerUrl && (
        <img
          key={anime.bannerUrl}
          src={anime.bannerUrl}
          alt=""
          decoding="async"
          className="size-full object-cover opacity-30 motion-safe:animate-fade-in"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/85 to-surface/40 sm:bg-linear-to-r sm:via-surface/90 sm:to-surface/20" />
      <div className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_0%_0%,color-mix(in_srgb,var(--cover-color,var(--color-accent))_22%,transparent),transparent_70%)]" />
    </div>
  )
}

function SpotlightSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-5 sm:grid-cols-[11rem_1fr] sm:gap-x-8 md:grid-cols-[13rem_1fr]"
    >
      <div className="aspect-[5/7] skeleton rounded-xl sm:row-span-2 sm:rounded-2xl" />
      <div className="flex flex-col justify-center gap-3 sm:justify-start">
        <div className="h-7 w-4/5 skeleton rounded-lg" />
        <div className="h-4 w-1/2 skeleton rounded" />
      </div>
      <div className="col-span-2 flex flex-col gap-2.5 sm:col-span-1 sm:col-start-2">
        <div className="h-3.5 w-full skeleton rounded" />
        <div className="h-3.5 w-full skeleton rounded" />
        <div className="h-3.5 w-2/3 skeleton rounded" />
      </div>
    </div>
  )
}

function announcement({ status, anime, error }: RandomAnimeState): string {
  switch (status) {
    case 'idle':
      return ''
    case 'loading':
      return 'Sorteando um anime…'
    case 'error':
      return describeSearchError(error).message
    case 'success':
      return anime ? `Anime sorteado: ${anime.title}.` : ''
  }
}
