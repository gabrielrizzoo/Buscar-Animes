import { useEffect, useRef } from 'react'
import type { AnimeListState } from '../hooks/useAnimeList.ts'
import { PAGE_SIZE } from '../services/anilist.ts'
import { AnimeCard } from './AnimeCard.tsx'
import { AnimeCardSkeleton } from './AnimeCardSkeleton.tsx'
import { LoadMore } from './LoadMore.tsx'
import { resultsGrid } from './styles.ts'

/** Quantos cards de carregamento aparecem no fim da lista durante o "Carregar mais". */
const LOAD_MORE_SKELETONS = 4

interface AnimeGridProps {
  state: AnimeListState
  onLoadMore: () => void
  onRetry: () => void
}

/** Cards de uma lista já carregada, com o botão "Carregar mais". */
export function AnimeGrid({ state, onLoadMore, onRetry }: AnimeGridProps) {
  const listRef = useRef<HTMLUListElement>(null)
  // Posição do primeiro card da próxima página, que recebe o foco quando ela chega.
  const firstNewIndexRef = useRef<number | null>(null)

  function handleLoadMore() {
    firstNewIndexRef.current = state.results.length
    onLoadMore()
  }

  function handleRetry() {
    firstNewIndexRef.current = state.results.length
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
    <>
      <ul ref={listRef} className={resultsGrid}>
        {state.results.map((anime, index) => (
          <li key={anime.id}>
            {/* O atraso reinicia a cada página para os cards novos não demorarem a aparecer */}
            <AnimeCard
              anime={anime}
              animationDelay={(index % PAGE_SIZE) * 0.04}
            />
          </li>
        ))}
        {state.loadMoreStatus === 'loading' &&
          Array.from({ length: LOAD_MORE_SKELETONS }, (_, index) => (
            <li key={`carregando-${index}`} aria-hidden="true">
              <AnimeCardSkeleton />
            </li>
          ))}
      </ul>
      {(state.hasNextPage || state.loadMoreStatus === 'error') && (
        <LoadMore
          status={state.loadMoreStatus}
          error={state.loadMoreError}
          onLoadMore={handleLoadMore}
          onRetry={handleRetry}
        />
      )}
    </>
  )
}
