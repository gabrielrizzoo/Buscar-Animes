import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiHttpError, fetchRandomAnime } from '../services/anilist.ts'
import type { AniListMedia } from '../types/anilist.ts'
import { deferred, makeMedia } from '../test/fixtures.ts'
import { useRandomAnime } from './useRandomAnime.ts'

vi.mock('../services/anilist.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/anilist.ts')>()),
  fetchRandomAnime: vi.fn(),
}))

const fetchRandomMock = vi.mocked(fetchRandomAnime)

beforeEach(() => {
  fetchRandomMock.mockReset()
})

describe('useRandomAnime', () => {
  it('sorteia, passa por "loading" e guarda o anime normalizado', async () => {
    const response = deferred<AniListMedia>()
    fetchRandomMock.mockReturnValueOnce(response.promise)
    const { result } = renderHook(() => useRandomAnime())

    act(() => {
      void result.current.pick()
    })
    expect(result.current.state).toMatchObject({
      status: 'loading',
      anime: null,
    })

    await act(async () => response.resolve(makeMedia()))

    expect(result.current.state.status).toBe('success')
    expect(result.current.state.anime?.title).toBe('NARUTO')
  })

  it('mantém o anime anterior na tela durante um novo sorteio', async () => {
    const second = deferred<AniListMedia>()
    fetchRandomMock
      .mockResolvedValueOnce(makeMedia())
      .mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useRandomAnime())

    await act(() => result.current.pick())
    act(() => {
      void result.current.pick()
    })

    expect(result.current.state.status).toBe('loading')
    expect(result.current.state.anime?.title).toBe('NARUTO')

    await act(async () =>
      second.resolve(makeMedia({ id: 1, title: { romaji: 'Bleach' } })),
    )
    expect(result.current.state.anime?.title).toBe('Bleach')
  })

  it('guarda o erro quando o sorteio falha', async () => {
    fetchRandomMock.mockRejectedValueOnce(new ApiHttpError(429, 30))
    const { result } = renderHook(() => useRandomAnime())

    await act(() => result.current.pick())

    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeInstanceOf(ApiHttpError)
  })

  it('cancela o sorteio pendente ao fechar', () => {
    fetchRandomMock.mockReturnValueOnce(deferred<AniListMedia>().promise)
    const { result } = renderHook(() => useRandomAnime())

    act(() => {
      void result.current.pick()
    })
    act(() => result.current.close())

    expect(fetchRandomMock.mock.calls[0]?.[0]?.signal?.aborted).toBe(true)
    expect(result.current.state.status).toBe('idle')
  })
})
