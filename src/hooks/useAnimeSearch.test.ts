import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiHttpError,
  type SearchAnimePage,
  searchAnime,
} from '../services/anilist.ts'
import { deferred, makeMedia } from '../test/fixtures.ts'
import { useAnimeSearch } from './useAnimeSearch.ts'

vi.mock('../services/anilist.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/anilist.ts')>()),
  searchAnime: vi.fn(),
}))

const searchAnimeMock = vi.mocked(searchAnime)

function page(
  items: SearchAnimePage['items'],
  overrides: Partial<SearchAnimePage> = {},
): SearchAnimePage {
  return {
    items,
    page: 1,
    hasNextPage: false,
    total: items.length,
    ...overrides,
  }
}

beforeEach(() => {
  searchAnimeMock.mockReset()
})

describe('useAnimeSearch', () => {
  it('busca, passa por "loading" e guarda os resultados normalizados', async () => {
    const response = deferred<SearchAnimePage>()
    searchAnimeMock.mockReturnValueOnce(response.promise)
    const { result } = renderHook(() => useAnimeSearch())

    act(() => {
      void result.current.search('  naruto  ')
    })
    expect(result.current.state.status).toBe('loading')
    expect(result.current.state.query).toBe('naruto')
    expect(searchAnimeMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'naruto', page: 1 }),
    )

    await act(async () => {
      response.resolve(page([makeMedia()], { hasNextPage: true, total: 40 }))
    })

    expect(result.current.state).toMatchObject({
      status: 'success',
      page: 1,
      hasNextPage: true,
      total: 40,
    })
    expect(result.current.state.results.map((anime) => anime.title)).toEqual([
      'NARUTO',
    ])
  })

  it('indica "empty" quando a API não encontra nada', async () => {
    searchAnimeMock.mockResolvedValueOnce(page([]))
    const { result } = renderHook(() => useAnimeSearch())

    await act(() => result.current.search('xyz'))

    expect(result.current.state.status).toBe('empty')
    expect(result.current.state.hasNextPage).toBe(false)
  })

  it('não chama a API quando o termo só tem espaços', async () => {
    const { result } = renderHook(() => useAnimeSearch())

    await act(() => result.current.search('   '))

    expect(result.current.state.status).toBe('invalid')
    expect(searchAnimeMock).not.toHaveBeenCalled()
  })

  it('guarda o erro e permite tentar de novo', async () => {
    searchAnimeMock
      .mockRejectedValueOnce(new ApiHttpError(503))
      .mockResolvedValueOnce(page([makeMedia()]))
    const { result } = renderHook(() => useAnimeSearch())

    await act(() => result.current.search('naruto'))
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeInstanceOf(ApiHttpError)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(searchAnimeMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'naruto', page: 1 }),
    )
  })

  it('mostra sempre a busca mais recente, mesmo se a anterior responder depois', async () => {
    const slow = deferred<SearchAnimePage>()
    const fast = deferred<SearchAnimePage>()
    searchAnimeMock
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise)
    const { result } = renderHook(() => useAnimeSearch())

    act(() => {
      void result.current.search('naruto')
    })
    const firstSignal = searchAnimeMock.mock.calls[0]?.[0].signal
    act(() => {
      void result.current.search('bleach')
    })
    expect(firstSignal?.aborted).toBe(true)

    await act(async () => {
      fast.resolve(page([makeMedia({ id: 269, title: { romaji: 'Bleach' } })]))
    })
    await act(async () => {
      slow.resolve(page([makeMedia({ title: { romaji: 'Naruto' } })]))
    })

    expect(result.current.state.query).toBe('bleach')
    expect(result.current.state.results.map((anime) => anime.title)).toEqual([
      'Bleach',
    ])
  })

  it('carrega a próxima página e ignora itens repetidos', async () => {
    searchAnimeMock
      .mockResolvedValueOnce(
        page([makeMedia({ id: 1, title: { romaji: 'A' } })], {
          hasNextPage: true,
          total: 3,
        }),
      )
      .mockResolvedValueOnce(
        page(
          [
            makeMedia({ id: 1, title: { romaji: 'A' } }),
            makeMedia({ id: 2, title: { romaji: 'B' } }),
          ],
          { page: 2, hasNextPage: false, total: 3 },
        ),
      )
    const { result } = renderHook(() => useAnimeSearch())

    await act(() => result.current.search('a'))
    await act(() => result.current.loadMore())

    expect(searchAnimeMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'a', page: 2 }),
    )
    expect(result.current.state.results.map((anime) => anime.title)).toEqual([
      'A',
      'B',
    ])
    expect(result.current.state).toMatchObject({
      page: 2,
      hasNextPage: false,
      loadMoreStatus: 'idle',
    })
  })

  it('mantém os resultados quando "carregar mais" falha e permite tentar de novo', async () => {
    searchAnimeMock
      .mockResolvedValueOnce(
        page([makeMedia({ id: 1 })], { hasNextPage: true }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(page([makeMedia({ id: 2 })], { page: 2 }))
    const { result } = renderHook(() => useAnimeSearch())

    await act(() => result.current.search('a'))
    await act(() => result.current.loadMore())

    expect(result.current.state.status).toBe('success')
    expect(result.current.state.loadMoreStatus).toBe('error')
    expect(result.current.state.results).toHaveLength(1)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.results).toHaveLength(2))
  })

  it('volta ao estado inicial e cancela a requisição ao resetar', async () => {
    searchAnimeMock.mockReturnValueOnce(deferred<SearchAnimePage>().promise)
    const { result } = renderHook(() => useAnimeSearch())

    act(() => {
      void result.current.search('naruto')
    })
    act(() => result.current.reset())

    expect(searchAnimeMock.mock.calls[0]?.[0].signal?.aborted).toBe(true)
    expect(result.current.state.status).toBe('idle')
  })

  it('cancela a requisição pendente ao desmontar', () => {
    searchAnimeMock.mockReturnValueOnce(deferred<SearchAnimePage>().promise)
    const { result, unmount } = renderHook(() => useAnimeSearch())

    act(() => {
      void result.current.search('naruto')
    })
    unmount()

    expect(searchAnimeMock.mock.calls[0]?.[0].signal?.aborted).toBe(true)
  })
})
