import type { JikanAnime, JikanSearchResponse } from '../types/jikan.ts'

export function makeJikanAnime(
  overrides: Partial<JikanAnime> = {},
): JikanAnime {
  return {
    mal_id: 20,
    url: 'https://myanimelist.net/anime/20/Naruto',
    title: 'Naruto',
    type: 'TV',
    year: 2002,
    score: 8.01,
    synopsis: 'Naruto Uzumaki quer se tornar Hokage.',
    images: {
      webp: {
        large_image_url:
          'https://cdn.myanimelist.net/images/anime/13/17405l.webp',
      },
      jpg: {
        large_image_url:
          'https://cdn.myanimelist.net/images/anime/13/17405l.jpg',
        image_url: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
      },
    },
    aired: { prop: { from: { year: 2002 } } },
    ...overrides,
  }
}

export function makeSearchResponse(
  data: JikanAnime[],
  pagination: { hasNextPage?: boolean; total?: number } = {},
): JikanSearchResponse {
  return {
    data,
    pagination: {
      current_page: 1,
      has_next_page: pagination.hasNextPage ?? false,
      items: {
        count: data.length,
        total: pagination.total ?? data.length,
        per_page: 12,
      },
    },
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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
