import type { AniListMedia, AniListSearchResponse } from '../types/anilist.ts'

export const ANILIST_API_URL = 'https://graphql.anilist.co'
export const PAGE_SIZE = 12
export const REQUEST_TIMEOUT_MS = 10_000

/** Busca por título, só animes e sem conteúdo adulto, na ordem de relevância do AniList. */
export const SEARCH_QUERY = `
  query SearchAnime($search: String!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
        id
        idMal
        siteUrl
        title { romaji english }
        format
        seasonYear
        startDate { year }
        averageScore
        description(asHtml: false)
        coverImage { extraLarge large }
      }
    }
  }
`

/** A API respondeu, mas com status HTTP de erro (429, 500, 503...). */
export class ApiHttpError extends Error {
  readonly status: number
  /** Segundos até a API aceitar novas requisições, quando ela informa (HTTP 429). */
  readonly retryAfterSeconds: number | null

  constructor(status: number, retryAfterSeconds: number | null = null) {
    super(`A API do AniList respondeu com HTTP ${status}.`)
    this.name = 'ApiHttpError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/** A API respondeu, mas o corpo não é o JSON esperado. */
export class ApiResponseError extends Error {
  constructor() {
    super('A API do AniList retornou uma resposta em formato inesperado.')
    this.name = 'ApiResponseError'
  }
}

/** A API não respondeu dentro de REQUEST_TIMEOUT_MS. */
export class RequestTimeoutError extends Error {
  constructor() {
    super(
      `A API do AniList não respondeu em ${REQUEST_TIMEOUT_MS / 1000} segundos.`,
    )
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
  items: AniListMedia[]
  page: number
  hasNextPage: boolean
  /** O AniList não informa um total confiável, então este campo fica sempre `null`. */
  total: number | null
}

export function buildSearchBody(query: string, page = 1): string {
  return JSON.stringify({
    query: SEARCH_QUERY,
    variables: { search: query, page, perPage: PAGE_SIZE },
  })
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
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: buildSearchBody(query, page),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiHttpError(response.status, readRetryAfter(response.headers))
    }

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiResponseError()
    }

    if (!isSearchResponse(body)) {
      throw new ApiResponseError()
    }

    const { pageInfo, media } = body.data.Page
    return {
      items: media.filter(isRecord),
      page,
      hasNextPage: pageInfo?.hasNextPage === true,
      total: null,
    }
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError()
    throw error
  } finally {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

/**
 * O navegador só expõe `X-RateLimit-Reset` (timestamp em segundos) na resposta
 * do AniList; `Retry-After` fica como alternativa para outros ambientes.
 */
function readRetryAfter(headers: Headers): number | null {
  const reset = Number(headers.get('X-RateLimit-Reset'))
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(1, Math.ceil(reset - Date.now() / 1000))
  }
  const retryAfter = Number(headers.get('Retry-After'))
  return Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.ceil(retryAfter)
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSearchResponse(body: unknown): body is AniListSearchResponse {
  return (
    isRecord(body) &&
    isRecord(body.data) &&
    isRecord(body.data.Page) &&
    Array.isArray(body.data.Page.media)
  )
}
