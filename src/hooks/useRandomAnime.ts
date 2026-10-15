import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRandomAnime } from '../services/anilist.ts'
import type { Anime } from '../types/anime.ts'
import { normalizeAnime } from '../utils/normalizeAnime.ts'

export type RandomStatus = 'idle' | 'loading' | 'success' | 'error'

export interface RandomAnimeState {
  status: RandomStatus
  anime: Anime | null
  error: unknown
}

const initialRandomState: RandomAnimeState = {
  status: 'idle',
  anime: null,
  error: null,
}

/** Sorteio de um anime. Um novo sorteio ou o fechamento cancelam o anterior. */
export function useRandomAnime() {
  const [state, setState] = useState(initialRandomState)
  const controllerRef = useRef<AbortController | null>(null)

  const cancelRequest = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  useEffect(() => cancelRequest, [cancelRequest])

  const pick = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    // O anime anterior fica na tela durante o novo sorteio, para a troca não piscar.
    setState((previous) => ({
      status: 'loading',
      anime: previous.anime,
      error: null,
    }))

    try {
      const raw = await fetchRandomAnime({ signal: controller.signal })
      if (controllerRef.current !== controller) return
      setState({
        status: 'success',
        anime: normalizeAnime(raw, 'sorteio'),
        error: null,
      })
    } catch (error) {
      if (controllerRef.current !== controller) return
      setState({ status: 'error', anime: null, error })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [])

  const close = useCallback(() => {
    cancelRequest()
    setState(initialRandomState)
  }, [cancelRequest])

  return { state, pick, close }
}
