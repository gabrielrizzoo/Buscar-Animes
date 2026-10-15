import { useCallback, useEffect, useReducer, useRef } from 'react'
import { searchAnime } from '../services/anilist.ts'
import type { Anime } from '../types/anime.ts'
import type { AniListMedia } from '../types/anilist.ts'
import { normalizeAnime } from '../utils/normalizeAnime.ts'

export type SearchStatus =
  'idle' | 'invalid' | 'loading' | 'success' | 'empty' | 'error'

export type LoadMoreStatus = 'idle' | 'loading' | 'error'

export interface AnimeSearchState {
  status: SearchStatus
  query: string
  results: Anime[]
  page: number
  hasNextPage: boolean
  total: number | null
  error: unknown
  loadMoreStatus: LoadMoreStatus
  loadMoreError: unknown
}

type SearchAction =
  | { type: 'reset' }
  | { type: 'invalid' }
  | { type: 'search/start'; query: string }
  | {
      type: 'search/success'
      results: Anime[]
      hasNextPage: boolean
      total: number | null
    }
  | { type: 'search/error'; error: unknown }
  | { type: 'more/start' }
  | {
      type: 'more/success'
      results: Anime[]
      page: number
      hasNextPage: boolean
      total: number | null
    }
  | { type: 'more/error'; error: unknown }

export const initialSearchState: AnimeSearchState = {
  status: 'idle',
  query: '',
  results: [],
  page: 0,
  hasNextPage: false,
  total: null,
  error: null,
  loadMoreStatus: 'idle',
  loadMoreError: null,
}

export function searchReducer(
  state: AnimeSearchState,
  action: SearchAction,
): AnimeSearchState {
  switch (action.type) {
    case 'reset':
      return initialSearchState
    case 'invalid':
      return { ...initialSearchState, status: 'invalid' }
    case 'search/start':
      return { ...initialSearchState, status: 'loading', query: action.query }
    case 'search/success': {
      const found = action.results.length > 0
      return {
        ...state,
        status: found ? 'success' : 'empty',
        results: action.results,
        page: 1,
        hasNextPage: found && action.hasNextPage,
        total: action.total,
      }
    }
    case 'search/error':
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
        total: action.total ?? state.total,
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
 * Estado e ações da busca de animes.
 * Só existe uma requisição ativa por vez: buscar de novo, carregar mais ou
 * desmontar o componente cancela a anterior, e respostas antigas são ignoradas.
 */
export function useAnimeSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState)
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

  const search = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim()
      if (!query) {
        cancelRequest()
        dispatch({ type: 'invalid' })
        return
      }

      const controller = startRequest()
      dispatch({ type: 'search/start', query })

      try {
        const result = await searchAnime({
          query,
          page: 1,
          signal: controller.signal,
        })
        if (controllerRef.current !== controller) return
        dispatch({
          type: 'search/success',
          results: normalizePage(result.items, 1),
          hasNextPage: result.hasNextPage,
          total: result.total,
        })
      } catch (error) {
        // Requisição substituída ou cancelada: quem a substituiu já cuida da tela.
        if (controllerRef.current !== controller) return
        dispatch({ type: 'search/error', error })
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [cancelRequest, startRequest],
  )

  const { status, hasNextPage, loadMoreStatus, page, query } = state

  const loadMore = useCallback(async () => {
    if (status !== 'success' || !hasNextPage || loadMoreStatus === 'loading')
      return

    const nextPage = page + 1
    const controller = startRequest()
    dispatch({ type: 'more/start' })

    try {
      const result = await searchAnime({
        query,
        page: nextPage,
        signal: controller.signal,
      })
      if (controllerRef.current !== controller) return
      dispatch({
        type: 'more/success',
        results: normalizePage(result.items, nextPage),
        page: nextPage,
        hasNextPage: result.hasNextPage,
        total: result.total,
      })
    } catch (error) {
      if (controllerRef.current !== controller) return
      dispatch({ type: 'more/error', error })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [status, hasNextPage, loadMoreStatus, page, query, startRequest])

  const retry = useCallback(() => {
    if (status === 'error') void search(query)
    else if (loadMoreStatus === 'error') void loadMore()
  }, [status, loadMoreStatus, query, search, loadMore])

  const reset = useCallback(() => {
    cancelRequest()
    dispatch({ type: 'reset' })
  }, [cancelRequest])

  return { state, search, loadMore, retry, reset }
}
