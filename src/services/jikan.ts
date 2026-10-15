import type { JikanAnime, JikanSearchResponse } from '../types/jikan.ts'

export const JIKAN_API_URL = 'https://api.jikan.moe/v4'
export const PAGE_SIZE = 12
export const REQUEST_TIMEOUT_MS = 10_000

/** A API respondeu, mas com status HTTP de erro (429, 500, 503...). */
export class JikanHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`A API Jikan respondeu com HTTP ${status}.`)
    this.name = 'JikanHttpError'
    this.status = status
  }
}

/** A API respondeu 200, mas o corpo não é o JSON esperado. */
export class JikanResponseError extends Error {
  constructor() {
    super('A API Jikan retornou uma resposta em formato inesperado.')
    this.name = 'JikanResponseError'
  }
}

/** A API não respondeu dentro de REQUEST_TIMEOUT_MS. */
export class RequestTimeoutError extends Error {
  constructor() {
    super(`A API Jikan não respondeu em ${REQUEST_TIMEOUT_MS / 1000} segundos.`)
    this.name = 'RequestTimeoutError'
  }
}

export interface SearchAnimeParams {
  query: string
  page?: number
  /** Permite cancelar a requisição (nova busca, componente desmontado). */
  signal?: AbortSignal
}

export interface SearchAnimePage {
  items: JikanAnime[]
  page: number
  hasNextPage: boolean
  /** Total de resultados informado pela API, quando disponível. */
  total: number | null
}

export function buildSearchUrl(query: string, page = 1): string {
  const params = new URLSearchParams({
    q: query,
    sfw: 'true',
    limit: String(PAGE_SIZE),
    page: String(page),
  })
  return `${JIKAN_API_URL}/anime?${params.toString()}`
}

export async function searchAnime({
  query,
  page = 1,
  signal,
}: SearchAnimeParams): Promise<SearchAnimePage> {
  // Um único controller recebe tanto o cancelamento de quem chamou quanto o timeout.
  // (AbortSignal.any resolveria isso, mas não existe no Safari anterior ao 17.4.)
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  if (signal?.aborted) abortFromCaller()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildSearchUrl(query, page), {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new JikanHttpError(response.status)
    }

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new JikanResponseError()
    }

    if (!isSearchResponse(body)) {
      throw new JikanResponseError()
    }

    const total = body.pagination?.items?.total
    return {
      items: body.data.filter(isRecord),
      page,
      hasNextPage: body.pagination?.has_next_page === true,
      total: typeof total === 'number' ? total : null,
    }
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError()
    throw error
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSearchResponse(body: unknown): body is JikanSearchResponse {
  return isRecord(body) && Array.isArray(body.data)
}
