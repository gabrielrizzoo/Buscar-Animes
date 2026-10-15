import { useEffect, useState } from 'react'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { SearchForm } from './components/SearchForm.tsx'
import { SearchResults } from './components/SearchResults.tsx'
import { SearchSuggestions } from './components/SearchSuggestions.tsx'
import { useAnimeSearch } from './hooks/useAnimeSearch.ts'
import { pushQueryToUrl, readQueryFromUrl } from './utils/urlQuery.ts'

const SITE_TITLE = 'Buscar Animes'

export default function App() {
  const [inputValue, setInputValue] = useState(readQueryFromUrl)
  const { state, search, loadMore, retry, reset } = useAnimeSearch()

  // Busca vinda da URL ao abrir a página e ao navegar com voltar/avançar.
  useEffect(() => {
    const initialQuery = readQueryFromUrl()
    if (initialQuery) void search(initialQuery)

    function handlePopState() {
      const query = readQueryFromUrl()
      setInputValue(query)
      if (query) void search(query)
      else reset()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [search, reset])

  useEffect(() => {
    document.title = state.query ? `${state.query} · ${SITE_TITLE}` : SITE_TITLE
  }, [state.query])

  function handleSearch(value: string) {
    const query = value.trim()
    if (query && query !== readQueryFromUrl()) pushQueryToUrl(query)
    void search(query)
  }

  function handleSuggestion(title: string) {
    setInputValue(title)
    handleSearch(title)
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip">
      {/* Fundo decorativo: brilhos e malha de pontos no topo da página */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[48rem] bg-aurora"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-dots"
      />

      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl">
          <SearchForm
            value={inputValue}
            onValueChange={setInputValue}
            onSearch={handleSearch}
          />
          <SearchSuggestions onSelect={handleSuggestion} />
        </div>
        <SearchResults state={state} onRetry={retry} onLoadMore={loadMore} />
      </main>
      <Footer />
    </div>
  )
}
