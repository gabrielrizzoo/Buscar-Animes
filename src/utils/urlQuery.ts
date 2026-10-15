// Mantém o termo pesquisado no parâmetro `?q=` da URL, para links compartilháveis
// e para o botão "voltar" do navegador refazer a busca anterior.

const QUERY_PARAM = 'q'

export function readQueryFromUrl(): string {
  return (
    new URLSearchParams(window.location.search).get(QUERY_PARAM)?.trim() ?? ''
  )
}

export function pushQueryToUrl(query: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set(QUERY_PARAM, query)
  window.history.pushState(null, '', url)
}
