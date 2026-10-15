import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import {
  jsonResponse,
  makeJikanAnime,
  makeSearchResponse,
} from './test/fixtures.ts'
import type { JikanAnime } from './types/jikan.ts'

type Route = (params: URLSearchParams) => Response | Promise<Response>

/** Texto visível na tela, ignorando a região de status lida só por leitores de tela. */
const VISIBLE_TEXT = { selector: 'p', ignore: 'script, style, [role="status"]' }

/** Substitui o fetch global por uma API Jikan simulada. */
function mockJikan(route: Route) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    return route(url.searchParams)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function animesFor(query: string, count: number, startId = 1): JikanAnime[] {
  return Array.from({ length: count }, (_, index) =>
    makeJikanAnime({
      mal_id: startId + index,
      title: `${query} ${startId + index}`,
    }),
  )
}

async function searchFor(term: string) {
  const user = userEvent.setup()
  const input = screen.getByRole('searchbox', {
    name: 'Digite o título de um anime',
  })
  await user.clear(input)
  await user.type(input, `${term}{Enter}`)
  return user
}

function cardTitles() {
  return screen
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
}

describe('App', () => {
  it('busca ao pressionar Enter, mostra skeletons e depois os resultados', async () => {
    let respond!: (response: Response) => void
    const fetchMock = mockJikan(
      () => new Promise((resolve) => (respond = resolve)),
    )
    render(<App />)

    await searchFor('naruto')

    const results = screen.getByRole('region', { name: 'Resultados da busca' })
    expect(results).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Buscando animes para “naruto”…',
    )
    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(requested.searchParams.get('q')).toBe('naruto')
    expect(requested.searchParams.get('sfw')).toBe('true')

    await act(async () =>
      respond(jsonResponse(makeSearchResponse(animesFor('Naruto', 2)))),
    )

    expect(cardTitles()).toEqual(['Naruto 1', 'Naruto 2'])
    expect(results).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 resultados para “naruto”.',
    )
  })

  it('guarda o termo na URL e no título da página', async () => {
    mockJikan(() => jsonResponse(makeSearchResponse(animesFor('Bleach', 1))))
    render(<App />)

    await searchFor('bleach')

    await waitFor(() => expect(cardTitles()).toEqual(['Bleach 1']))
    expect(window.location.search).toBe('?q=bleach')
    expect(document.title).toBe('bleach · Buscar Animes')
  })

  it('refaz a busca que está na URL ao abrir a página', async () => {
    window.history.replaceState(null, '', '/?q=one%20piece')
    const fetchMock = mockJikan(() =>
      jsonResponse(makeSearchResponse(animesFor('One Piece', 1))),
    )
    render(<App />)

    expect(screen.getByRole('searchbox')).toHaveValue('one piece')
    await waitFor(() => expect(cardTitles()).toEqual(['One Piece 1']))
    expect(
      new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get('q'),
    ).toBe('one piece')
  })

  it('volta para a busca anterior com o botão voltar do navegador', async () => {
    mockJikan((params) => {
      const query = params.get('q') ?? ''
      return jsonResponse(makeSearchResponse(animesFor(query, 1)))
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

  it('pede um termo quando só há espaços e não chama a API', async () => {
    const fetchMock = mockJikan(() => jsonResponse(makeSearchResponse([])))
    render(<App />)

    await searchFor('   ')

    expect(
      screen.getByText(
        'Por favor, digite o nome de uma obra para procurar.',
        VISIBLE_TEXT,
      ),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(window.location.search).toBe('')
  })

  it('informa quando nada é encontrado, exibindo o termo como texto', async () => {
    mockJikan(() => jsonResponse(makeSearchResponse([])))
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
    const fetchMock = mockJikan(() => jsonResponse({}, 503))
    render(<App />)

    const user = await searchFor('naruto')
    expect(
      await screen.findByText(/instável no momento/, VISIBLE_TEXT),
    ).toBeInTheDocument()

    fetchMock.mockImplementation(async () =>
      jsonResponse(makeSearchResponse(animesFor('Naruto', 1))),
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(cardTitles()).toEqual(['Naruto 1']))
  })

  it('carrega a próxima página e esconde o botão quando acabam os resultados', async () => {
    const fetchMock = mockJikan((params) =>
      params.get('page') === '2'
        ? jsonResponse(
            makeSearchResponse(animesFor('Naruto', 1, 13), { total: 13 }),
          )
        : jsonResponse(
            makeSearchResponse(animesFor('Naruto', 12), {
              hasNextPage: true,
              total: 13,
            }),
          ),
    )
    render(<App />)

    const user = await searchFor('naruto')
    await waitFor(() => expect(cardTitles()).toHaveLength(12))
    expect(
      screen.getByText('Exibindo 12 de 13 resultados para “naruto”'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }))

    await waitFor(() => expect(cardTitles()).toHaveLength(13))
    expect(cardTitles().at(-1)).toBe('Naruto 13')
    // O foco vai para o primeiro card novo, já que o botão some na última página
    expect(
      screen.getByRole('link', { name: /Saber Mais sobre Naruto 13 / }),
    ).toHaveFocus()
    expect(
      new URL(String(fetchMock.mock.calls[1]?.[0])).searchParams.get('page'),
    ).toBe('2')
    expect(
      screen.queryByRole('button', { name: 'Carregar mais' }),
    ).not.toBeInTheDocument()
  })
})
