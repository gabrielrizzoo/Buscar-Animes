import type { AnimeListState } from '../hooks/useAnimeList.ts'
import type { DiscoverListId } from '../services/anilist.ts'
import { describeSearchError } from '../utils/searchErrors.ts'
import { GridSkeleton } from './AnimeCardSkeleton.tsx'
import { AnimeGrid } from './AnimeGrid.tsx'
import { DISCOVER_LISTS, type DiscoverList } from './discoverLists.ts'
import { Icon } from './Icon.tsx'
import { StatusMessage } from './StatusMessage.tsx'
import { secondaryButton, sectionTitle } from './styles.ts'

interface DiscoverSectionProps {
  activeList: DiscoverListId
  onSelectList: (list: DiscoverListId) => void
  state: AnimeListState<DiscoverListId>
  onRetry: () => void
  onLoadMore: () => void
}

/** Listas de sugestões para quem quer explorar sem buscar um título. */
export function DiscoverSection({
  activeList,
  onSelectList,
  state,
  onRetry,
  onLoadMore,
}: DiscoverSectionProps) {
  const active =
    DISCOVER_LISTS.find((list) => list.id === activeList) ?? DISCOVER_LISTS[0]!
  const busy = state.status === 'loading' || state.loadMoreStatus === 'loading'

  return (
    <section
      aria-labelledby="titulo-descobrir"
      aria-busy={busy}
      className="w-full"
    >
      <div className="mb-8 flex flex-col gap-5 border-b border-white/[0.07] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="titulo-descobrir" className={sectionTitle}>
            Descubra
          </h2>
          <p className="mt-1 text-sm text-muted">{active.description}</p>
        </div>

        {/* No celular as abas rolam na horizontal em vez de quebrar linha */}
        <div
          role="group"
          aria-label="Listas de sugestões"
          className="-mx-4 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 md:pb-0"
        >
          {DISCOVER_LISTS.map((list) => (
            <ListButton
              key={list.id}
              list={list}
              pressed={list.id === activeList}
              onSelect={onSelectList}
            />
          ))}
        </div>
      </div>

      <p role="status" className="sr-only">
        {announcement(state, active)}
      </p>
      <DiscoverContent
        state={state}
        onRetry={onRetry}
        onLoadMore={onLoadMore}
      />
    </section>
  )
}

interface ListButtonProps {
  list: DiscoverList
  pressed: boolean
  onSelect: (list: DiscoverListId) => void
}

function ListButton({ list, pressed, onSelect }: ListButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onSelect(list.id)}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium whitespace-nowrap text-muted transition-[color,background-color,border-color] duration-200 hover:border-white/20 hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas"
    >
      <Icon name={list.icon} className="size-4" />
      {list.label}
    </button>
  )
}

function DiscoverContent({
  state,
  onRetry,
  onLoadMore,
}: Pick<DiscoverSectionProps, 'state' | 'onRetry' | 'onLoadMore'>) {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return <GridSkeleton />

    // As listas nunca ficam vazias na prática, mas a interface não deve quebrar se ficarem.
    case 'invalid':
    case 'empty':
      return (
        <StatusMessage icon="search-x">
          Nenhum anime nesta lista no momento.
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

function announcement(
  state: AnimeListState<DiscoverListId>,
  list: DiscoverList,
): string {
  switch (state.status) {
    case 'idle':
    case 'invalid':
      return ''
    case 'loading':
      return `Carregando a lista “${list.label}”…`
    case 'empty':
      return 'Nenhum anime nesta lista no momento.'
    case 'error':
      return describeSearchError(state.error).message
    case 'success':
      if (state.loadMoreStatus === 'loading') return 'Carregando mais animes…'
      if (state.loadMoreStatus === 'error')
        return describeSearchError(state.loadMoreError).message
      return `${state.results.length} animes na lista “${list.label}”.`
  }
}
