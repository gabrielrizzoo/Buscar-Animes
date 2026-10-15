import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  hangingFetch,
  jsonResponse,
  makeMedia,
  makePageResponse,
} from '../test/fixtures.ts'
import {
  ANILIST_API_URL,
  ApiHttpError,
  ApiResponseError,
  DISCOVER_QUERIES,
  PAGE_SIZE,
  RANDOM_POOL_SIZE,
  RANDOM_QUERY,
  REQUEST_TIMEOUT_MS,
  RequestTimeoutError,
  SEARCH_QUERY,
  buildDiscoverBody,
  buildSearchBody,
  discoverAnime,
  fetchRandomAnime,
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
        jsonResponse(makePageResponse([makeMedia()], { hasNextPage: true })),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchAnime({ query: 'naruto' })).resolves.toEqual({
      items: [makeMedia()],
      page: 1,
      hasNextPage: true,
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

describe('buildDiscoverBody', () => {
  it.each([
    ['trending', 'sort: TRENDING_DESC'],
    ['top-rated', 'sort: SCORE_DESC'],
  ] as const)('monta a lista %s só com página e tamanho', (list, sort) => {
    const body = JSON.parse(buildDiscoverBody(list, 3))

    expect(body.query).toBe(DISCOVER_QUERIES[list])
    expect(body.query).toContain(sort)
    expect(body.variables).toEqual({ page: 3, perPage: PAGE_SIZE })
  })

  it('envia a temporada atual na lista da temporada', () => {
    const body = JSON.parse(
      buildDiscoverBody('season', 1, new Date(2026, 9, 15)),
    )

    expect(body.query).toContain('season: $season, seasonYear: $seasonYear')
    expect(body.variables).toEqual({
      page: 1,
      perPage: PAGE_SIZE,
      season: 'FALL',
      seasonYear: 2026,
    })
  })

  it('filtra as sugestões: só animes, sem conteúdo adulto nem ecchi', () => {
    for (const query of [...Object.values(DISCOVER_QUERIES), RANDOM_QUERY]) {
      expect(query).toContain('type: ANIME')
      expect(query).toContain('isAdult: false')
      expect(query).toContain('genre_not_in: ["Ecchi"]')
    }
  })
})

describe('discoverAnime', () => {
  it('faz um POST com a consulta da lista e retorna a página', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(makePageResponse([makeMedia()], { hasNextPage: true })),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(discoverAnime({ list: 'trending', page: 2 })).resolves.toEqual(
      { items: [makeMedia()], page: 2, hasNextPage: true },
    )
    expect(fetchMock).toHaveBeenCalledWith(
      ANILIST_API_URL,
      expect.objectContaining({ body: buildDiscoverBody('trending', 2) }),
    )
  })
})

describe('fetchRandomAnime', () => {
  it.each([
    [0, 1],
    [0.5, RANDOM_POOL_SIZE / 2 + 1],
    [0.9999, RANDOM_POOL_SIZE],
  ])(
    'com o número aleatório %d, pede a página %d da lista',
    async (random, page) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(jsonResponse(makePageResponse([makeMedia()])))
      vi.stubGlobal('fetch', fetchMock)

      await expect(fetchRandomAnime({ random: () => random })).resolves.toEqual(
        makeMedia(),
      )
      expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
        query: RANDOM_QUERY,
        variables: { page },
      })
    },
  )

  it('lança ApiResponseError quando a página sorteada vem vazia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(makePageResponse([]))),
    )

    await expect(fetchRandomAnime()).rejects.toBeInstanceOf(ApiResponseError)
  })
})
