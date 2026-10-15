import type { AniListMedia, AniListPageResponse } from '../types/anilist.ts'
import type { Anime } from '../types/anime.ts'

export function makeMedia(overrides: Partial<AniListMedia> = {}): AniListMedia {
  return {
    id: 20,
    idMal: 20,
    siteUrl: 'https://anilist.co/anime/20',
    title: { romaji: 'NARUTO', english: 'Naruto' },
    format: 'TV',
    seasonYear: 2002,
    startDate: { year: 2002 },
    episodes: 220,
    genres: ['Action', 'Adventure', 'Comedy'],
    averageScore: 80,
    description:
      'Naruto Uzumaki quer se tornar <i>Hokage</i>.<br><br>(Source: MAL Rewrite)',
    coverImage: {
      extraLarge:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20.jpg',
      large:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20.jpg',
      color: '#e4a15d',
    },
    ...overrides,
  }
}

/** Anime já normalizado, para testar componentes sem passar pela API. */
export function makeAnime(overrides: Partial<Anime> = {}): Anime {
  return {
    id: '20',
    title: 'Naruto',
    englishTitle: null,
    imageUrl: 'https://s4.anilist.co/capa-grande.jpg',
    thumbnailUrl: 'https://s4.anilist.co/capa-media.jpg',
    bannerUrl: null,
    color: '#e4a15d',
    url: 'https://myanimelist.net/anime/20',
    linkSite: 'MyAnimeList',
    type: 'TV',
    year: 2002,
    episodes: 220,
    genres: ['Ação', 'Aventura'],
    score: 8,
    synopsis: 'Naruto Uzumaki quer se tornar Hokage.',
    ...overrides,
  }
}

export function makePageResponse(
  media: AniListMedia[],
  { hasNextPage = false }: { hasNextPage?: boolean } = {},
): AniListPageResponse {
  return { data: { Page: { pageInfo: { hasNextPage }, media } } }
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

/** Promise controlada manualmente, para simular respostas lentas ou fora de ordem. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** fetch que só termina quando o sinal é abortado, como uma API que não responde. */
export function hangingFetch(
  _input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise((_, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    })
  })
}
