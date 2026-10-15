import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  hangingFetch,
  jsonResponse,
  makeMedia,
  makeSearchResponse,
} from '../test/fixtures.ts'
import {
  ANILIST_API_URL,
  ApiHttpError,
  ApiResponseError,
  PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  RequestTimeoutError,
  SEARCH_QUERY,
  buildSearchBody,
  searchAnime,
} from './anilist.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('buildSearchBody', () => {
  it('envia o termo, a página e o tamanho da página como variáveis', () => {
    const body = JSON.parse(buildSearchBody('one piece & <b>', 2))

    expect(body.query).toBe(SEARCH_QUERY)
    expect(body.variables).toEqual({
      search: 'one piece & <b>',
      page: 2,
      perPage: PAGE_SIZE,
    })
  })

  it('busca só animes, sem conteúdo adulto', () => {
    expect(SEARCH_QUERY).toContain('type: ANIME')
    expect(SEARCH_QUERY).toContain('isAdult: false')
  })
})

describe('searchAnime', () => {
  it('faz um POST para a API e retorna os itens e a paginação', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(makeSearchResponse([makeMedia()], { hasNextPage: true })),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchAnime({ query: 'naruto' })).resolves.toEqual({
      items: [makeMedia()],
      page: 1,
      hasNextPage: true,
      total: null,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      ANILIST_API_URL,
      expect.objectContaining({
        method: 'POST',
        body: buildSearchBody('naruto', 1),
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('assume que não há próxima página quando pageInfo não vem', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ data: { Page: { media: [] } } })),
    )

    await expect(searchAnime({ query: 'x', page: 3 })).resolves.toEqual({
      items: [],
      page: 3,
      hasNextPage: false,
      total: null,
    })
  })

  it('ignora itens da lista que não são objetos', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ data: { Page: { media: [null, 'x', { id: 5 }] } } }),
        ),
    )

    const result = await searchAnime({ query: 'x' })
    expect(result.items).toEqual([{ id: 5 }])
  })

  it.each([400, 404, 500, 503])(
    'lança ApiHttpError com o status %i',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ errors: [] }, status)),
      )

      const error = await searchAnime({ query: 'x' }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ApiHttpError)
      expect(error).toMatchObject({ status })
    },
  )

  it('informa quantos segundos esperar quando o limite de requisições estoura', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    const resetAt = Date.now() / 1000 + 42
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ errors: [{ message: 'Too Many Requests.' }] }, 429, {
          'X-RateLimit-Reset': String(resetAt),
        }),
      ),
    )

    const error = await searchAnime({ query: 'x' }).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 429, retryAfterSeconds: 42 })
  })

  it('lança ApiResponseError quando o corpo não é JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Bad gateway</html>', { status: 200 }),
        ),
    )

    await expect(searchAnime({ query: 'x' })).rejects.toBeInstanceOf(
      ApiResponseError,
    )
  })

  it('lança ApiResponseError quando a API devolve só erros do GraphQL', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ data: null, errors: [{ message: 'Erro' }] }),
        ),
    )

    await expect(searchAnime({ query: 'x' })).rejects.toBeInstanceOf(
      ApiResponseError,
    )
  })

  it('propaga a falha de rede do fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    await expect(searchAnime({ query: 'x' })).rejects.toBeInstanceOf(TypeError)
  })

  it('lança RequestTimeoutError quando a API não responde a tempo', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(hangingFetch))

    const result = searchAnime({ query: 'x' })
    const assertion = expect(result).rejects.toBeInstanceOf(RequestTimeoutError)
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)
    await assertion
  })

  it('repassa o cancelamento de quem chamou sem tratá-lo como timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(hangingFetch))
    const controller = new AbortController()

    const result = searchAnime({ query: 'x', signal: controller.signal })
    controller.abort()

    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })
})
