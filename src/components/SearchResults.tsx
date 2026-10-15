import { type RefObject, useEffect, useRef } from 'react'
import type { AnimeSearchState } from '../hooks/useAnimeSearch.ts'
import { PAGE_SIZE } from '../services/jikan.ts'
import { formatResultSummary } from '../utils/format.ts'
import { describeSearchError } from '../utils/searchErrors.ts'
import { AnimeCard } from './AnimeCard.tsx'
import { AnimeCardSkeleton } from './AnimeCardSkeleton.tsx'
import { LoadMore } from './LoadMore.tsx'
import { StatusMessage } from './StatusMessage.tsx'
import { secondaryButton } from './styles.ts'

export const EMPTY_QUERY_MESSAGE =
  'Por favor, digite o nome de uma obra para procurar.'

const gridClass =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-10 md:grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))]'

interface SearchResultsProps {
  state: AnimeSearchState
  onRetry: () => void
  onLoadMore: () => void
}

interface ResultsContentProps extends SearchResultsProps {
  listRef: RefObject<HTMLUListElement | null>
}

export function SearchResults({
  state,
  onRetry,
  onLoadMore,
}: SearchResultsProps) {
  const busy = state.status === 'loading' || state.loadMoreStatus === 'loading'
  const listRef = useRef<HTMLUListElement>(null)
  // Posição do primeiro card da próxima página, que recebe o foco quando ela chega.
  const firstNewIndexRef = useRef<number | null>(null)

  function handleLoadMore() {
    firstNewIndexRef.current = state.results.length
    onLoadMore()
  }

  function handleRetry() {
    if (state.loadMoreStatus === 'error') {
      firstNewIndexRef.current = state.results.length
    }
    onRetry()
  }

  // Sem isso, o foco do teclado se perderia quando o botão "Carregar mais" some na última página.
  useEffect(() => {
    const index = firstNewIndexRef.current
    if (index === null || state.loadMoreStatus === 'loading') return
    firstNewIndexRef.current = null
    if (state.loadMoreStatus === 'idle') {
      listRef.current?.querySelectorAll('a')[index]?.focus()
    }
  }, [state.loadMoreStatus, state.results.length])

  return (
    <section
      aria-labelledby="titulo-resultados"
      aria-busy={busy}
      className="w-full"
    >
      <h2 id="titulo-resultados" className="sr-only">
        Resultados da busca
      </h2>
      {/* Região sempre presente para leitores de tela anunciarem cada mudança de estado */}
      <p role="status" className="sr-only">
        {announcement(state)}
      </p>
      <ResultsContent
        state={state}
        onRetry={handleRetry}
        onLoadMore={handleLoadMore}
        listRef={listRef}
      />
    </section>
  )
}

function ResultsContent({
  state,
  onRetry,
  onLoadMore,
  listRef,
}: ResultsContentProps) {
  switch (state.status) {
    case 'idle':
      return null

    case 'invalid':
      return <StatusMessage icon="🔍">{EMPTY_QUERY_MESSAGE}</StatusMessage>

    case 'loading':
      return (
        <div aria-hidden="true" className={gridClass}>
          {Array.from({ length: PAGE_SIZE }, (_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      )

    case 'empty':
      return (
        <StatusMessage icon="👻">
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
        <>
          <p className="mb-6 text-sm text-muted">
            {formatResultSummary(
              state.results.length,
              state.total,
              state.query,
            )}
          </p>
          <ul ref={listRef} className={gridClass}>
            {state.results.map((anime, index) => (
              <li key={anime.id}>
                {/* O atraso reinicia a cada página para os cards novos não demorarem a aparecer */}
                <AnimeCard
                  anime={anime}
                  animationDelay={(index % PAGE_SIZE) * 0.05}
                />
              </li>
            ))}
          </ul>
          {(state.hasNextPage || state.loadMoreStatus === 'error') && (
            <LoadMore
              status={state.loadMoreStatus}
              error={state.loadMoreError}
              onLoadMore={onLoadMore}
              onRetry={onRetry}
            />
          )}
        </>
      )
  }
}

function announcement(state: AnimeSearchState): string {
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
      return `${formatResultSummary(state.results.length, state.total, state.query)}.`
  }
}
