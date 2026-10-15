import type { AniListMedia, AniListPageResponse } from '../types/anilist.ts'
import { currentSeason } from '../utils/season.ts'

export const ANILIST_API_URL = 'https://graphql.anilist.co'
export const PAGE_SIZE = 12
export const REQUEST_TIMEOUT_MS = 10_000
/** O sorteio escolhe entre os N animes mais populares que passam pelos filtros. */
export const RANDOM_POOL_SIZE = 1000

/** Listas de sugestões exibidas na página inicial. */
export type DiscoverListId = 'trending' | 'season' | 'top-rated'

const MEDIA_FIELDS = `
  id
  idMal
  siteUrl
  title { romaji english }
  format
  seasonYear
  startDate { year }
  episodes
  genres
  averageScore
  description(asHtml: false)
  coverImage { extraLarge large color }
`

// As sugestões e o sorteio aparecem sem a pessoa ter pedido nada, então ficam só
// com séries, filmes e ONAs, sem o gênero ecchi. A busca por título não tem esse filtro.
const CURATED_FILTERS =
  'type: ANIME, isAdult: false, format_in: [TV, MOVIE, ONA], genre_not_in: ["Ecchi"]'

/** Busca por título, só animes e sem conteúdo adulto, na ordem de relevância do AniList. */
export const SEARCH_QUERY = `
  query SearchAnime($search: String!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {${MEDIA_FIELDS}}
    }
  }
`

// O AniList trata variáveis nulas como filtro ("sem temporada"), em vez de ignorá-las,
// por isso cada lista tem a própria consulta.
function discoverQuery(variables: string, filters: string): string {
  return `
  query DiscoverAnime($page: Int!, $perPage: Int!${variables}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(${CURATED_FILTERS}, ${filters}) {${MEDIA_FIELDS}}
    }
  }
`
}

export const DISCOVER_QUERIES: Record<DiscoverListId, string> = {
  trending: discoverQuery('', 'sort: TRENDING_DESC'),
  season: discoverQuery(
    ', $season: MediaSeason!, $seasonYear: Int!',
    'season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC',
  ),
  // O mínimo de popularidade evita títulos com nota alta, mas quase nenhum voto.
  'top-rated': discoverQuery('', 'sort: SCORE_DESC, popularity_greater: 10000'),
}

/** Um anime por página: sortear a página é sortear o anime. */
export const RANDOM_QUERY = `
  query RandomAnime($page: Int!) {
    Page(page: $page, perPage: 1) {
      media(${CURATED_FILTERS}, status_in: [FINISHED, RELEASING], averageScore_greater: 70, sort: POPULARITY_DESC) {${MEDIA_FIELDS} bannerImage}
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

/** Uma página de resultados, no formato que o hook de listas espera. */
export interface MediaPage {
  items: AniListMedia[]
  page: number
  hasNextPage: boolean
}

interface RequestOptions {
  /** Permite cancelar a requisição (nova busca, componente desmontado). */
  signal?: AbortSignal
}

export function buildSearchBody(query: string, page = 1): string {
  return JSON.stringify({
    query: SEARCH_QUERY,
    variables: { search: query, page, perPage: PAGE_SIZE },
  })
}

export function buildDiscoverBody(
  list: DiscoverListId,
  page = 1,
  now = new Date(),
): string {
  const { season, year } = currentSeason(now)
  return JSON.stringify({
    query: DISCOVER_QUERIES[list],
    variables: {
      page,
      perPage: PAGE_SIZE,
      ...(list === 'season' && { season, seasonYear: year }),
    },
  })
}

export function buildRandomBody(page: number): string {
  return JSON.stringify({ query: RANDOM_QUERY, variables: { page } })
}

export async function searchAnime({
  query,
  page = 1,
  signal,
}: RequestOptions & { query: string; page?: number }): Promise<MediaPage> {
  return toMediaPage(
    await postQuery(buildSearchBody(query, page), signal),
    page,
  )
}

export async function discoverAnime({
  list,
  page = 1,
  signal,
}: RequestOptions & {
  list: DiscoverListId
  page?: number
}): Promise<MediaPage> {
  return toMediaPage(
    await postQuery(buildDiscoverBody(list, page), signal),
    page,
  )
}

/** Sorteia um anime entre os mais populares e bem avaliados. */
export async function fetchRandomAnime({
  signal,
  random = Math.random,
}: RequestOptions & {
  /** Gerador de números entre 0 e 1, substituível nos testes. */
  random?: () => number
} = {}): Promise<AniListMedia> {
  const page = 1 + Math.floor(random() * RANDOM_POOL_SIZE)
  const [anime] = (await postQuery(buildRandomBody(page), signal)).media.filter(
    isRecord,
  )
  // A lista sorteada sempre tem mais de RANDOM_POOL_SIZE animes; vir vazia é inesperado.
  if (!anime) throw new ApiResponseError()
  return anime
}

function toMediaPage(
  { pageInfo, media }: AniListPageResponse['data']['Page'],
  page: number,
): MediaPage {
  return {
    items: media.filter(isRecord),
    page,
    hasNextPage: pageInfo?.hasNextPage === true,
  }
}

/** Envia a consulta GraphQL e devolve o objeto `Page` da resposta. */
async function postQuery(
  body: string,
  signal: AbortSignal | undefined,
): Promise<AniListPageResponse['data']['Page']> {
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
      body,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiHttpError(response.status, readRetryAfter(response.headers))
    }

    let json: unknown
    try {
      json = await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new ApiResponseError()
    }

    if (!isPageResponse(json)) {
      throw new ApiResponseError()
    }
    return json.data.Page
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

function isPageResponse(body: unknown): body is AniListPageResponse {
  return (
    isRecord(body) &&
    isRecord(body.data) &&
    isRecord(body.data.Page) &&
    Array.isArray(body.data.Page.media)
  )
}
