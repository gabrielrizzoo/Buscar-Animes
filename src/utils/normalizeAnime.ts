import type { Anime } from '../types/anime.ts'
import type { JikanAnime, JikanImageSet } from '../types/jikan.ts'

const MAL_URL = 'https://myanimelist.net/'
export const MISSING_TITLE = 'Título indisponível'

/**
 * Converte um item da Jikan no formato usado pela interface.
 * `fallbackKey` garante uma chave única quando a API não envia `mal_id`.
 */
export function normalizeAnime(raw: JikanAnime, fallbackKey: string): Anime {
  const apiTitle = nonEmptyString(raw.title)
  const title = apiTitle ?? MISSING_TITLE

  return {
    id:
      typeof raw.mal_id === 'number'
        ? String(raw.mal_id)
        : `sem-id-${fallbackKey}`,
    title,
    imageUrl: pickCover(raw.images),
    url:
      safeMyAnimeListUrl(raw.url) ??
      (apiTitle
        ? `${MAL_URL}anime.php?q=${encodeURIComponent(apiTitle)}`
        : MAL_URL),
    type: nonEmptyString(raw.type),
    year:
      positiveNumber(raw.year) ?? positiveNumber(raw.aired?.prop?.from?.year),
    score: positiveNumber(raw.score),
    synopsis: nonEmptyString(raw.synopsis),
  }
}

// Mesma ordem de preferência da versão original: webp grande, jpg grande, jpg padrão.
function pickCover(images: JikanAnime['images']): string | null {
  const candidates: (JikanImageSet['image_url'] | undefined)[] = [
    images?.webp?.large_image_url,
    images?.jpg?.large_image_url,
    images?.jpg?.image_url,
  ]
  return candidates.find(isHttpsUrl) ?? null
}

function isHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('https://')
}

// Só aceita links para o MyAnimeList, bloqueando esquemas como `javascript:`.
function safeMyAnimeListUrl(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith(MAL_URL) ? value : null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}
