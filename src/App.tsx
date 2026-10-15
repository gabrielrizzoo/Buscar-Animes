import { useEffect, useRef, useState } from 'react'
import { DiscoverSection } from './components/DiscoverSection.tsx'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { Hero } from './components/Hero.tsx'
import { RandomSpotlight } from './components/RandomSpotlight.tsx'
import { SearchForm } from './components/SearchForm.tsx'
import { SearchResults } from './components/SearchResults.tsx'
import { type PageFetcher, useAnimeList } from './hooks/useAnimeList.ts'
import { useRandomAnime } from './hooks/useRandomAnime.ts'
import {
  type DiscoverListId,
  discoverAnime,
  searchAnime,
} from './services/anilist.ts'
import {
  pushHomeToUrl,
  pushQueryToUrl,
  readQueryFromUrl,
} from './utils/urlQuery.ts'

const SITE_TITLE = 'Buscar Animes'

const fetchSearchPage: PageFetcher<string> = (query, page, signal) =>
  searchAnime({ query, page, signal })

const fetchDiscoverPage: PageFetcher<DiscoverListId> = (list, page, signal) =>
  discoverAnime({ list, page, signal })

export default function App() {
  const [inputValue, setInputValue] = useState(readQueryFromUrl)
  const [activeList, setActiveList] = useState<DiscoverListId>('trending')
  const search = useAnimeList(fetchSearchPage)
  const discover = useAnimeList(fetchDiscoverPage)
  const random = useRandomAnime()
  const inputRef = useRef<HTMLInputElement>(null)
  const randomButtonRef = useRef<HTMLButtonElement>(null)

  const searching = search.state.status !== 'idle'
  const { load: loadSearch, reset: resetSearch } = search
  const { load: loadDiscover } = discover
  const loadedList = discover.state.query

  // Busca vinda da URL ao abrir a página e ao navegar com voltar/avançar.
  useEffect(() => {
    const initialQuery = readQueryFromUrl()
    if (initialQuery) void loadSearch(initialQuery)

    function handlePopState() {
      const query = readQueryFromUrl()
      setInputValue(query)
      if (query) void loadSearch(query)
      else resetSearch()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [loadSearch, resetSearch])

  // As sugestões só carregam quando aparecem: sem busca ativa (nem na URL, no
  // primeiro render) e quando a lista escolhida ainda não foi carregada.
  useEffect(() => {
    if (searching || readQueryFromUrl() || loadedList === activeList) return
    void loadDiscover(activeList)
  }, [searching, loadedList, activeList, loadDiscover])

  useEffect(() => {
    document.title = search.state.query
      ? `${search.state.query} · ${SITE_TITLE}`
      : SITE_TITLE
  }, [search.state.query])

  function handleSearch(value: string) {
    const query = value.trim()
    if (query && query !== readQueryFromUrl()) pushQueryToUrl(query)
    void search.load(query)
  }

  function handleClearSearch() {
    setInputValue('')
    if (readQueryFromUrl()) pushHomeToUrl()
    search.reset()
    inputRef.current?.focus()
  }

  function handleSelectList(list: DiscoverListId) {
    setActiveList(list)
    if (list !== loadedList) void discover.load(list)
  }

  function handleCloseRandom() {
    random.close()
    randomButtonRef.current?.focus()
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip">
      {/* Fundo decorativo: brilho suave atrás do título */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-glow"
      />

      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6">
        <Hero
          onRandom={() => void random.pick()}
          randomBusy={random.state.status === 'loading'}
          randomButtonRef={randomButtonRef}
          compact={searching}
        >
          <SearchForm
            value={inputValue}
            onValueChange={setInputValue}
            onSearch={handleSearch}
            inputRef={inputRef}
          />
        </Hero>

        {random.state.status !== 'idle' && (
          <RandomSpotlight
            state={random.state}
            onPickAgain={() => void random.pick()}
            onClose={handleCloseRandom}
          />
        )}

        {searching ? (
          <SearchResults
            state={search.state}
            onRetry={search.retry}
            onLoadMore={search.loadMore}
            onClear={handleClearSearch}
          />
        ) : (
          <DiscoverSection
            activeList={activeList}
            onSelectList={handleSelectList}
            state={discover.state}
            onRetry={discover.retry}
            onLoadMore={discover.loadMore}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
