import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiHttpError, type MediaPage } from '../services/anilist.ts'
import { deferred, makeMedia } from '../test/fixtures.ts'
import { type PageFetcher, useAnimeList } from './useAnimeList.ts'

function page(
  items: MediaPage['items'],
  overrides: Partial<MediaPage> = {},
): MediaPage {
  return { items, page: 1, hasNextPage: false, ...overrides }
}

function setup() {
  const fetchPage = vi.fn<PageFetcher<string>>()
  const hook = renderHook(() => useAnimeList(fetchPage))
  return { fetchPage, ...hook }
}

describe('useAnimeList', () => {
  it('carrega, passa por "loading" e guarda os resultados normalizados', async () => {
    const { fetchPage, result } = setup()
    const response = deferred<MediaPage>()
    fetchPage.mockReturnValueOnce(response.promise)

    act(() => {
      void result.current.load('naruto')
    })
    expect(result.current.state.status).toBe('loading')
    expect(result.current.state.query).toBe('naruto')
    expect(fetchPage).toHaveBeenCalledWith('naruto', 1, expect.any(AbortSignal))

    await act(async () => {
      response.resolve(page([makeMedia()], { hasNextPage: true }))
    })

    expect(result.current.state).toMatchObject({
      status: 'success',
      page: 1,
      hasNextPage: true,
    })
    expect(result.current.state.results.map((anime) => anime.title)).toEqual([
      'NARUTO',
    ])
  })

  it('indica "empty" quando a API não encontra nada', async () => {
    const { fetchPage, result } = setup()
    fetchPage.mockResolvedValueOnce(page([]))

    await act(() => result.current.load('xyz'))

    expect(result.current.state.status).toBe('empty')
    expect(result.current.state.hasNextPage).toBe(false)
  })

  it('não chama a API quando o termo só tem espaços', async () => {
    const { fetchPage, result } = setup()

    await act(() => result.current.load('   '))

    expect(result.current.state.status).toBe('invalid')
    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('guarda o erro e permite tentar de novo', async () => {
    const { fetchPage, result } = setup()
    fetchPage
      .mockRejectedValueOnce(new ApiHttpError(503))
      .mockResolvedValueOnce(page([makeMedia()]))

    await act(() => result.current.load('naruto'))
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeInstanceOf(ApiHttpError)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(fetchPage).toHaveBeenLastCalledWith(
      'naruto',
      1,
      expect.any(AbortSignal),
    )
  })

  it('mostra sempre a lista mais recente, mesmo se a anterior responder depois', async () => {
    const { fetchPage, result } = setup()
    const slow = deferred<MediaPage>()
    const fast = deferred<MediaPage>()
    fetchPage
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise)

    act(() => {
      void result.current.load('naruto')
    })
    const firstSignal = fetchPage.mock.calls[0]?.[2]
    act(() => {
      void result.current.load('bleach')
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
    const { fetchPage, result } = setup()
    fetchPage
      .mockResolvedValueOnce(
        page([makeMedia({ id: 1, title: { romaji: 'A' } })], {
          hasNextPage: true,
        }),
      )
      .mockResolvedValueOnce(
        page(
          [
            makeMedia({ id: 1, title: { romaji: 'A' } }),
            makeMedia({ id: 2, title: { romaji: 'B' } }),
          ],
          { page: 2 },
        ),
      )

    await act(() => result.current.load('a'))
    await act(() => result.current.loadMore())

    expect(fetchPage).toHaveBeenLastCalledWith('a', 2, expect.any(AbortSignal))
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
    const { fetchPage, result } = setup()
    fetchPage
      .mockResolvedValueOnce(
        page([makeMedia({ id: 1 })], { hasNextPage: true }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(page([makeMedia({ id: 2 })], { page: 2 }))

    await act(() => result.current.load('a'))
    await act(() => result.current.loadMore())

    expect(result.current.state.status).toBe('success')
    expect(result.current.state.loadMoreStatus).toBe('error')
    expect(result.current.state.results).toHaveLength(1)

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.results).toHaveLength(2))
  })

  it('volta ao estado inicial e cancela a requisição ao resetar', () => {
    const { fetchPage, result } = setup()
    fetchPage.mockReturnValueOnce(deferred<MediaPage>().promise)

    act(() => {
      void result.current.load('naruto')
    })
    act(() => result.current.reset())

    expect(fetchPage.mock.calls[0]?.[2].aborted).toBe(true)
    expect(result.current.state.status).toBe('idle')
  })

  it('cancela a requisição pendente ao desmontar', () => {
    const { fetchPage, result, unmount } = setup()
    fetchPage.mockReturnValueOnce(deferred<MediaPage>().promise)

    act(() => {
      void result.current.load('naruto')
    })
    unmount()

    expect(fetchPage.mock.calls[0]?.[2].aborted).toBe(true)
  })
})
