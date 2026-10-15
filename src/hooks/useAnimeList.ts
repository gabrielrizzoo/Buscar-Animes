import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { MediaPage } from '../services/anilist.ts'
import type { AniListMedia } from '../types/anilist.ts'
import type { Anime } from '../types/anime.ts'
import { normalizeAnime } from '../utils/normalizeAnime.ts'

export type ListStatus =
  'idle' | 'invalid' | 'loading' | 'success' | 'empty' | 'error'

export type LoadMoreStatus = 'idle' | 'loading' | 'error'

/** Busca uma página da lista identificada por `key` (termo buscado ou ID da lista). */
export type PageFetcher<Key extends string> = (
  key: Key,
  page: number,
  signal: AbortSignal,
) => Promise<MediaPage>

export interface AnimeListState<Key extends string = string> {
  status: ListStatus
  /** Termo buscado ou ID da lista de sugestões; vazio antes da primeira carga. */
  query: Key | ''
  results: Anime[]
  page: number
  hasNextPage: boolean
  error: unknown
  loadMoreStatus: LoadMoreStatus
  loadMoreError: unknown
}

type ListAction<Key extends string> =
  | { type: 'reset' }
  | { type: 'invalid' }
  | { type: 'load/start'; query: Key }
  | { type: 'load/success'; results: Anime[]; hasNextPage: boolean }
  | { type: 'load/error'; error: unknown }
  | { type: 'more/start' }
  | {
      type: 'more/success'
      results: Anime[]
      page: number
      hasNextPage: boolean
    }
  | { type: 'more/error'; error: unknown }

export const initialListState: AnimeListState<never> = {
  status: 'idle',
  query: '',
  results: [],
  page: 0,
  hasNextPage: false,
  error: null,
  loadMoreStatus: 'idle',
  loadMoreError: null,
}

export function listReducer<Key extends string>(
  state: AnimeListState<Key>,
  action: ListAction<Key>,
): AnimeListState<Key> {
  switch (action.type) {
    case 'reset':
      return initialListState
    case 'invalid':
      return { ...initialListState, status: 'invalid' }
    case 'load/start':
      return { ...initialListState, status: 'loading', query: action.query }
    case 'load/success': {
      const found = action.results.length > 0
      return {
        ...state,
        status: found ? 'success' : 'empty',
        results: action.results,
        page: 1,
        hasNextPage: found && action.hasNextPage,
      }
    }
    case 'load/error':
      return { ...state, status: 'error', error: action.error }
    case 'more/start':
      return { ...state, loadMoreStatus: 'loading', loadMoreError: null }
    case 'more/success': {
      // A paginação da API pode repetir itens entre páginas; chaves do React precisam ser únicas.
      const knownIds = new Set(state.results.map((anime) => anime.id))
      const newResults = action.results.filter(
        (anime) => !knownIds.has(anime.id),
      )
      return {
        ...state,
        results: [...state.results, ...newResults],
        page: action.page,
        hasNextPage: action.hasNextPage,
        loadMoreStatus: 'idle',
      }
    }
    case 'more/error':
      return { ...state, loadMoreStatus: 'error', loadMoreError: action.error }
  }
}

function normalizePage(items: AniListMedia[], page: number): Anime[] {
  return items.map((item, index) => normalizeAnime(item, `${page}-${index}`))
}

/**
 * Estado e ações de uma lista paginada de animes: a busca por título ou uma
 * lista de sugestões. Só existe uma requisição ativa por vez: carregar outra
 * lista, carregar mais ou desmontar o componente cancela a anterior, e
 * respostas antigas são ignoradas.
 *
 * `fetchPage` deve ser estável (definido fora do componente).
 */
export function useAnimeList<Key extends string>(fetchPage: PageFetcher<Key>) {
  const [state, dispatch] = useReducer(listReducer<Key>, initialListState)
  const controllerRef = useRef<AbortController | null>(null)

  const cancelRequest = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  const startRequest = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    return controller
  }, [])

  useEffect(() => cancelRequest, [cancelRequest])

  const load = useCallback(
    async (key: Key) => {
      if (key.trim() === '') {
        cancelRequest()
        dispatch({ type: 'invalid' })
        return
      }

      const controller = startRequest()
      dispatch({ type: 'load/start', query: key })

      try {
        const result = await fetchPage(key, 1, controller.signal)
        if (controllerRef.current !== controller) return
        dispatch({
          type: 'load/success',
          results: normalizePage(result.items, 1),
          hasNextPage: result.hasNextPage,
        })
      } catch (error) {
        // Requisição substituída ou cancelada: quem a substituiu já cuida da tela.
        if (controllerRef.current !== controller) return
        dispatch({ type: 'load/error', error })
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [fetchPage, cancelRequest, startRequest],
  )

  const { status, hasNextPage, loadMoreStatus, page, query } = state

  const loadMore = useCallback(async () => {
    if (
      query === '' ||
      status !== 'success' ||
      !hasNextPage ||
      loadMoreStatus === 'loading'
    )
      return

    const nextPage = page + 1
    const controller = startRequest()
    dispatch({ type: 'more/start' })

    try {
      const result = await fetchPage(query, nextPage, controller.signal)
      if (controllerRef.current !== controller) return
      dispatch({
        type: 'more/success',
        results: normalizePage(result.items, nextPage),
        page: nextPage,
        hasNextPage: result.hasNextPage,
      })
    } catch (error) {
      if (controllerRef.current !== controller) return
      dispatch({ type: 'more/error', error })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [
    fetchPage,
    status,
    hasNextPage,
    loadMoreStatus,
    page,
    query,
    startRequest,
  ])

  const retry = useCallback(() => {
    if (status === 'error' && query !== '') void load(query)
    else if (loadMoreStatus === 'error') void loadMore()
  }, [status, loadMoreStatus, query, load, loadMore])

  const reset = useCallback(() => {
    cancelRequest()
    dispatch({ type: 'reset' })
  }, [cancelRequest])

  return { state, load, loadMore, retry, reset }
}
