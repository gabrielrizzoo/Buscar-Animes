import type { AnimeListState } from '../hooks/useAnimeList.ts'
import { formatResultSummary } from '../utils/format.ts'
import { describeSearchError } from '../utils/searchErrors.ts'
import { GridSkeleton } from './AnimeCardSkeleton.tsx'
import { AnimeGrid } from './AnimeGrid.tsx'
import { Icon } from './Icon.tsx'
import { StatusMessage } from './StatusMessage.tsx'
import { secondaryButton, sectionTitle } from './styles.ts'

export const EMPTY_QUERY_MESSAGE =
  'Por favor, digite o nome de uma obra para procurar.'

interface SearchResultsProps {
  state: AnimeListState
  onRetry: () => void
  onLoadMore: () => void
  /** Limpa a busca e volta para as sugestões. */
  onClear: () => void
}

export function SearchResults({
  state,
  onRetry,
  onLoadMore,
  onClear,
}: SearchResultsProps) {
  const busy = state.status === 'loading' || state.loadMoreStatus === 'loading'

  return (
    <section
      aria-labelledby="titulo-resultados"
      aria-busy={busy}
      className="w-full motion-safe:animate-fade-in"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-white/[0.07] pb-5">
        <div className="min-w-0">
          <h2 id="titulo-resultados" className={sectionTitle}>
            Resultados da busca
          </h2>
          {state.status === 'success' && (
            <p className="mt-1 text-sm break-words text-muted">
              {formatResultSummary(state.results.length, state.query)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className={`${secondaryButton} px-4 py-2`}
        >
          <Icon name="x" className="size-4" />
          Limpar busca
        </button>
      </div>

      {/* Região sempre presente para leitores de tela anunciarem cada mudança de estado */}
      <p role="status" className="sr-only">
        {announcement(state)}
      </p>
      <ResultsContent state={state} onRetry={onRetry} onLoadMore={onLoadMore} />
    </section>
  )
}

function ResultsContent({
  state,
  onRetry,
  onLoadMore,
}: Omit<SearchResultsProps, 'onClear'>) {
  switch (state.status) {
    case 'idle':
      return null

    case 'invalid':
      return <StatusMessage icon="search">{EMPTY_QUERY_MESSAGE}</StatusMessage>

    case 'loading':
      return <GridSkeleton />

    case 'empty':
      return (
        <StatusMessage icon="search-x">
          Nenhuma obra encontrada para “
          <b className="font-semibold text-ink">{state.query}</b>”.
        </StatusMessage>
      )

    case 'error': {
      const { icon, message } = describeSearchError(state.error)
      return (
        <StatusMessage
          icon={icon}
          action={
            <button type="button" className={secondaryButton} onClick={onRetry}>
              Tentar novamente
            </button>
          }
        >
          {message}
        </StatusMessage>
      )
    }

    case 'success':
      return (
        <AnimeGrid state={state} onLoadMore={onLoadMore} onRetry={onRetry} />
      )
  }
}

function announcement(state: AnimeListState): string {
  switch (state.status) {
    case 'idle':
      return ''
    case 'invalid':
      return EMPTY_QUERY_MESSAGE
    case 'loading':
      return `Buscando animes para “${state.query}”…`
    case 'empty':
      return `Nenhuma obra encontrada para “${state.query}”.`
    case 'error':
      return describeSearchError(state.error).message
    case 'success':
      if (state.loadMoreStatus === 'loading')
        return 'Carregando mais resultados…'
      if (state.loadMoreStatus === 'error')
        return describeSearchError(state.loadMoreError).message
      return `${formatResultSummary(state.results.length, state.query)}.`
  }
}
