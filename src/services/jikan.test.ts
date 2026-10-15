import { afterEach, describe, expect, it, vi } from 'vitest'
import { hangingFetch, jsonResponse } from '../test/fixtures.ts'
import {
  JikanHttpError,
  JikanResponseError,
  PAGE_SIZE,
  REQUEST_TIMEOUT_MS,
  RequestTimeoutError,
  buildSearchUrl,
  searchAnime,
} from './jikan.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('buildSearchUrl', () => {
  it('codifica o termo e envia os parâmetros da busca', () => {
    const url = new URL(buildSearchUrl('one piece & <b>', 2))

    expect(`${url.origin}${url.pathname}`).toBe(
      'https://api.jikan.moe/v4/anime',
    )
    expect(url.searchParams.get('q')).toBe('one piece & <b>')
    expect(url.searchParams.get('sfw')).toBe('true')
    expect(url.searchParams.get('limit')).toBe(String(PAGE_SIZE))
    expect(url.searchParams.get('page')).toBe('2')
  })
})

describe('searchAnime', () => {
  it('retorna os itens e as informações de paginação', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [{ mal_id: 1, title: 'Bleach' }],
        pagination: { has_next_page: true, items: { total: 30 } },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchAnime({ query: 'bleach' })).resolves.toEqual({
      items: [{ mal_id: 1, title: 'Bleach' }],
      page: 1,
      hasNextPage: true,
      total: 30,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      buildSearchUrl('bleach', 1),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('assume que não há próxima página quando a paginação não vem', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ data: [] })),
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
        .mockResolvedValue(jsonResponse({ data: [null, 'x', { mal_id: 5 }] })),
    )

    const result = await searchAnime({ query: 'x' })
    expect(result.items).toEqual([{ mal_id: 5 }])
  })

  it.each([400, 429, 500, 503])(
    'lança JikanHttpError com o status %i',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({}, status)),
      )

      const error = await searchAnime({ query: 'x' }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(JikanHttpError)
      expect(error).toMatchObject({ status })
    },
  )

  it('lança JikanResponseError quando o corpo não é JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Bad gateway</html>', { status: 200 }),
        ),
    )

    await expect(searchAnime({ query: 'x' })).rejects.toBeInstanceOf(
      JikanResponseError,
    )
  })

  it('lança JikanResponseError quando falta a lista de resultados', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 500 })),
    )

    await expect(searchAnime({ query: 'x' })).rejects.toBeInstanceOf(
      JikanResponseError,
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
