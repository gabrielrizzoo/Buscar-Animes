import { useEffect, useState } from 'react'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { SearchForm } from './components/SearchForm.tsx'
import { SearchResults } from './components/SearchResults.tsx'
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-6 pb-20">
        <div className="mb-12 w-full max-w-[650px]">
          <SearchForm
            value={inputValue}
            onValueChange={setInputValue}
            onSearch={handleSearch}
          />
        </div>
        <SearchResults state={state} onRetry={retry} onLoadMore={loadMore} />
      </main>
      <Footer />
    </div>
  )
}
