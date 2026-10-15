import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { DISCOVER_QUERIES } from './services/anilist.ts'
import { jsonResponse, makeMedia, makePageResponse } from './test/fixtures.ts'
import type { AniListMedia } from './types/anilist.ts'

interface Variables {
  search?: string
  page: number
  season?: string
  seasonYear?: number
}

type Operation = 'SearchAnime' | 'DiscoverAnime' | 'RandomAnime'
type Route = (variables: Variables) => Response | Promise<Response>

/** Complemento lido por leitores de tela no link de cada card. */
const LINK_HINT = ' (abre no MyAnimeList em nova aba)'

/** Texto visível na tela, ignorando a região de status lida só por leitores de tela. */
const VISIBLE_TEXT = { selector: 'p', ignore: 'script, style, [role="status"]' }

const emptyPage: Route = () => jsonResponse(makePageResponse([]))

/**
 * Substitui o fetch global por uma API GraphQL do AniList simulada, com uma rota
 * para cada consulta. As sugestões respondem com uma lista vazia por padrão.
 */
function mockAniList(routes: Partial<Record<Operation, Route>> = {}) {
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, init?: RequestInit) => {
      const { query, variables } = JSON.parse(String(init?.body))
      const route = routes[operationOf(query)] ?? emptyPage
      return route(variables)
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function operationOf(query: string): Operation {
  const match = /query (\w+)/.exec(query)?.[1]
  if (
    match === 'SearchAnime' ||
    match === 'DiscoverAnime' ||
    match === 'RandomAnime'
  )
    return match
  throw new Error(`Consulta inesperada: ${query}`)
}

/** Variáveis e lista (no caso das sugestões) de cada chamada a uma consulta. */
function callsTo(fetchMock: ReturnType<typeof mockAniList>, name: Operation) {
  return fetchMock.mock.calls
    .map(([, init]) => JSON.parse(String(init?.body)))
    .filter(({ query }) => operationOf(query) === name)
    .map(({ query, variables }) => ({
      ...(variables as Variables),
      list: Object.entries(DISCOVER_QUERIES).find(([, q]) => q === query)?.[0],
    }))
}

function animesFor(title: string, count: number, startId = 1): AniListMedia[] {
  return Array.from({ length: count }, (_, index) =>
    makeMedia({
      id: startId + index,
      idMal: startId + index,
      title: { romaji: `${title} ${startId + index}` },
    }),
  )
}

const pageOf = (media: AniListMedia[], hasNextPage = false) =>
  jsonResponse(makePageResponse(media, { hasNextPage }))

async function searchFor(term: string) {
  const user = userEvent.setup()
  const input = screen.getByRole('searchbox', {
    name: 'Digite o título de um anime',
  })
  await user.clear(input)
  await user.type(input, `${term}{Enter}`)
  return user
}

function region(name: string) {
  return screen.getByRole('region', { name })
}

/** Títulos dos cards de uma seção ("Resultados da busca" ou "Descubra"). */
function cardTitles(name = 'Resultados da busca') {
  const section = screen.queryByRole('region', { name })
  if (!section) return []
  return within(section)
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent?.replace(LINK_HINT, ''))
}

describe('App: busca', () => {
  it('busca ao pressionar Enter, mostra skeletons e depois os resultados', async () => {
    let respond!: (response: Response) => void
    const fetchMock = mockAniList({
      SearchAnime: () => new Promise((resolve) => (respond = resolve)),
    })
    render(<App />)

    await searchFor('naruto')

    const results = region('Resultados da busca')
    expect(results).toHaveAttribute('aria-busy', 'true')
    expect(within(results).getByRole('status')).toHaveTextContent(
      'Buscando animes para “naruto”…',
    )
    expect(callsTo(fetchMock, 'SearchAnime')[0]).toMatchObject({
      search: 'naruto',
      page: 1,
    })

    await act(async () => respond(pageOf(animesFor('Naruto', 2))))

    expect(cardTitles()).toEqual(['Naruto 1', 'Naruto 2'])
    expect(results).toHaveAttribute('aria-busy', 'false')
    expect(within(results).getByRole('status')).toHaveTextContent(
      '2 resultados para “naruto”.',
    )
  })

  it('guarda o termo na URL e no título da página', async () => {
    mockAniList({ SearchAnime: () => pageOf(animesFor('Bleach', 1)) })
    render(<App />)

    await searchFor('bleach')

    await waitFor(() => expect(cardTitles()).toEqual(['Bleach 1']))
    expect(window.location.search).toBe('?q=bleach')
    expect(document.title).toBe('bleach · Buscar Animes')
  })

  it('refaz a busca que está na URL ao abrir a página, sem carregar sugestões', async () => {
    window.history.replaceState(null, '', '/?q=one%20piece')
    const fetchMock = mockAniList({
      SearchAnime: () => pageOf(animesFor('One Piece', 1)),
    })
    render(<App />)

    expect(screen.getByRole('searchbox')).toHaveValue('one piece')
    await waitFor(() => expect(cardTitles()).toEqual(['One Piece 1']))
    expect(callsTo(fetchMock, 'SearchAnime')[0]?.search).toBe('one piece')
    expect(callsTo(fetchMock, 'DiscoverAnime')).toHaveLength(0)
  })

  it('volta para a busca anterior com o botão voltar do navegador', async () => {
    mockAniList({
      SearchAnime: ({ search }) => pageOf(animesFor(String(search), 1)),
    })
    render(<App />)

    await searchFor('naruto')
    await waitFor(() => expect(cardTitles()).toEqual(['naruto 1']))
    await searchFor('bleach')
    await waitFor(() => expect(cardTitles()).toEqual(['bleach 1']))

    await act(async () => {
      window.history.back()
      await new Promise((resolve) =>
        window.addEventListener('popstate', resolve, { once: true }),
      )
    })

    await waitFor(() => expect(cardTitles()).toEqual(['naruto 1']))
    expect(screen.getByRole('searchbox')).toHaveValue('naruto')
  })

  it('pede um termo quando só há espaços e não chama a busca', async () => {
    const fetchMock = mockAniList()
    render(<App />)

    await searchFor('   ')

    expect(
      screen.getByText(
        'Por favor, digite o nome de uma obra para procurar.',
        VISIBLE_TEXT,
      ),
    ).toBeInTheDocument()
    expect(callsTo(fetchMock, 'SearchAnime')).toHaveLength(0)
    expect(window.location.search).toBe('')
  })

  it('informa quando nada é encontrado, exibindo o termo como texto', async () => {
    mockAniList()
    render(<App />)

    await searchFor('<img src=x onerror=alert(1)>')

    const message = await screen.findByText(
      /Nenhuma obra encontrada para/,
      VISIBLE_TEXT,
    )
    expect(
      within(message).getByText('<img src=x onerror=alert(1)>'),
    ).toBeInTheDocument()
    expect(document.querySelector('main img')).toBeNull()
  })

  it('mostra o erro e permite tentar novamente', async () => {
    let failing = true
    mockAniList({
      SearchAnime: () =>
        failing ? jsonResponse({}, 503) : pageOf(animesFor('Naruto', 1)),
    })
    render(<App />)

    const user = await searchFor('naruto')
    expect(
      await screen.findByText(/instável no momento/, VISIBLE_TEXT),
    ).toBeInTheDocument()

    failing = false
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(cardTitles()).toEqual(['Naruto 1']))
  })

  it('carrega a próxima página e esconde o botão quando acabam os resultados', async () => {
    const fetchMock = mockAniList({
      SearchAnime: ({ page }) =>
        page === 2
          ? pageOf(animesFor('Naruto', 1, 13))
          : pageOf(animesFor('Naruto', 12), true),
    })
    render(<App />)

    const user = await searchFor('naruto')
    await waitFor(() => expect(cardTitles()).toHaveLength(12))
    expect(
      screen.getByText('12 resultados para “naruto”', VISIBLE_TEXT),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }))

    await waitFor(() => expect(cardTitles()).toHaveLength(13))
    expect(cardTitles().at(-1)).toBe('Naruto 13')
    // O foco vai para o primeiro card novo, já que o botão some na última página
    expect(
      screen.getByRole('link', { name: `Naruto 13${LINK_HINT}` }),
    ).toHaveFocus()
    expect(callsTo(fetchMock, 'SearchAnime')[1]).toMatchObject({
      search: 'naruto',
      page: 2,
    })
    expect(
      screen.queryByRole('button', { name: 'Carregar mais' }),
    ).not.toBeInTheDocument()
  })

  it('limpa a busca e volta às sugestões sem recarregar a lista', async () => {
    const fetchMock = mockAniList({
      SearchAnime: () => pageOf(animesFor('Naruto', 1)),
      DiscoverAnime: () => pageOf(animesFor('Em alta', 2)),
    })
    render(<App />)
    await waitFor(() =>
      expect(cardTitles('Descubra')).toEqual(['Em alta 1', 'Em alta 2']),
    )

    const user = await searchFor('naruto')
    await waitFor(() => expect(cardTitles()).toEqual(['Naruto 1']))
    expect(screen.queryByRole('region', { name: 'Descubra' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(cardTitles('Descubra')).toEqual(['Em alta 1', 'Em alta 2'])
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(window.location.search).toBe('')
    expect(callsTo(fetchMock, 'DiscoverAnime')).toHaveLength(1)
  })
})

describe('App: sugestões', () => {
  it('mostra a lista "Em alta" ao abrir a página', async () => {
    const fetchMock = mockAniList({
      DiscoverAnime: () => pageOf(animesFor('Em alta', 3)),
    })
    render(<App />)

    expect(
      screen.getByRole('button', { name: 'Em alta', pressed: true }),
    ).toBeInTheDocument()
    await waitFor(() => expect(cardTitles('Descubra')).toHaveLength(3))
    expect(within(region('Descubra')).getByRole('status')).toHaveTextContent(
      '3 animes na lista “Em alta”.',
    )
    expect(callsTo(fetchMock, 'DiscoverAnime')).toEqual([
      { page: 1, perPage: 12, list: 'trending' },
    ])
  })

  it('troca de lista pelas abas e carrega a temporada atual', async () => {
    const fetchMock = mockAniList({
      DiscoverAnime: ({ season }) =>
        pageOf(animesFor(season ? 'Temporada' : 'Em alta', 2)),
    })
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(cardTitles('Descubra')).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Nesta temporada' }))

    await waitFor(() =>
      expect(cardTitles('Descubra')).toEqual(['Temporada 1', 'Temporada 2']),
    )
    expect(
      screen.getByRole('button', { name: 'Nesta temporada', pressed: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Em alta', pressed: false }),
    ).toBeInTheDocument()
    expect(callsTo(fetchMock, 'DiscoverAnime').at(-1)).toMatchObject({
      list: 'season',
      season: expect.any(String),
      seasonYear: expect.any(Number),
    })
  })

  it('carrega mais animes da lista escolhida', async () => {
    const fetchMock = mockAniList({
      DiscoverAnime: ({ page }) =>
        page === 2
          ? pageOf(animesFor('Em alta', 2, 13))
          : pageOf(animesFor('Em alta', 12), true),
    })
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(cardTitles('Descubra')).toHaveLength(12))

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }))

    await waitFor(() => expect(cardTitles('Descubra')).toHaveLength(14))
    expect(callsTo(fetchMock, 'DiscoverAnime').at(-1)).toMatchObject({
      list: 'trending',
      page: 2,
    })
  })

  it('mostra o erro da lista e permite tentar novamente', async () => {
    let failing = true
    mockAniList({
      DiscoverAnime: () =>
        failing ? jsonResponse({}, 503) : pageOf(animesFor('Em alta', 1)),
    })
    const user = userEvent.setup()
    render(<App />)

    expect(
      await screen.findByText(/instável no momento/, VISIBLE_TEXT),
    ).toBeInTheDocument()

    failing = false
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(cardTitles('Descubra')).toEqual(['Em alta 1']))
  })
})

describe('App: sorteio', () => {
  it('sorteia um anime, mostra os detalhes e sorteia outro', async () => {
    const picks = [
      makeMedia({
        title: { romaji: 'Sousou no Frieren', english: 'Frieren' },
        idMal: 52991,
        genres: ['Adventure', 'Drama', 'Fantasy'],
        episodes: 28,
        averageScore: 91,
      }),
      makeMedia({ id: 2, title: { romaji: 'Mushishi' } }),
    ]
    let respond!: (response: Response) => void
    const fetchMock = mockAniList({
      RandomAnime: () => new Promise((resolve) => (respond = resolve)),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Sortear um anime' }))

    const spotlight = region('Sorteado para você')
    expect(spotlight).toHaveFocus()
    expect(within(spotlight).getByRole('status')).toHaveTextContent(
      'Sorteando um anime…',
    )
    expect(callsTo(fetchMock, 'RandomAnime')[0]?.page).toBeGreaterThan(0)

    await act(async () => respond(pageOf([picks[0]!])))

    expect(
      within(spotlight).getByRole('heading', { name: 'Sousou no Frieren' }),
    ).toBeInTheDocument()
    expect(within(spotlight).getByText('Frieren')).toBeInTheDocument()
    expect(within(spotlight).getByText('28 episódios')).toBeInTheDocument()
    expect(within(spotlight).getByText('9.1')).toBeInTheDocument()
    expect(
      within(within(spotlight).getByRole('list', { name: 'Gêneros' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Aventura', 'Drama', 'Fantasia'])
    expect(
      within(spotlight).getByRole('link', {
        name: 'Ver no MyAnimeList (abre em nova aba)',
      }),
    ).toHaveAttribute('href', 'https://myanimelist.net/anime/52991')

    const again = within(spotlight).getByRole('button', {
      name: 'Sortear outro',
    })
    await user.click(again)
    expect(again).toHaveTextContent('Sorteando…')
    expect(again).toHaveFocus()

    await act(async () => respond(pageOf([picks[1]!])))

    expect(
      within(spotlight).getByRole('heading', { name: 'Mushishi' }),
    ).toBeInTheDocument()
    expect(again).toHaveFocus()
    expect(callsTo(fetchMock, 'RandomAnime')).toHaveLength(2)
  })

  it('fecha o sorteio e devolve o foco ao botão de sortear', async () => {
    mockAniList({ RandomAnime: () => pageOf([makeMedia()]) })
    const user = userEvent.setup()
    render(<App />)

    const pickButton = screen.getByRole('button', { name: 'Sortear um anime' })
    await user.click(pickButton)
    await screen.findByRole('heading', { name: 'NARUTO' })

    await user.click(screen.getByRole('button', { name: 'Fechar sorteio' }))

    expect(
      screen.queryByRole('region', { name: 'Sorteado para você' }),
    ).toBeNull()
    expect(pickButton).toHaveFocus()
  })

  it('avisa quando o sorteio falha e permite tentar de novo', async () => {
    let failing = true
    mockAniList({
      RandomAnime: () =>
        failing
          ? jsonResponse({}, 429, { 'Retry-After': '20' })
          : pageOf([makeMedia()]),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Sortear um anime' }))

    const spotlight = region('Sorteado para você')
    expect(
      await within(spotlight).findByText(/Aguarde cerca de 20 segundos/, {
        selector: 'p:not([role="status"])',
      }),
    ).toBeInTheDocument()

    failing = false
    await user.click(
      within(spotlight).getByRole('button', { name: 'Tentar de novo' }),
    )

    expect(
      await within(spotlight).findByRole('heading', { name: 'NARUTO' }),
    ).toBeInTheDocument()
  })
})
