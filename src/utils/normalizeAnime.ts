import type { AniListMedia, AniListMediaFormat } from '../types/anilist.ts'
import type { Anime, AnimeLinkSite } from '../types/anime.ts'
import { toPlainText } from './plainText.ts'

const MAL_URL = 'https://myanimelist.net/'
const ANILIST_URL = 'https://anilist.co/'
export const MISSING_TITLE = 'Título indisponível'

const FORMAT_LABELS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV curta',
  MOVIE: 'Filme',
  SPECIAL: 'Especial',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Clipe musical',
}

/**
 * Converte um item do AniList no formato usado pela interface.
 * `fallbackKey` garante uma chave única quando a API não envia `id`.
 */
export function normalizeAnime(raw: AniListMedia, fallbackKey: string): Anime {
  const apiTitle =
    nonEmptyString(raw.title?.romaji) ?? nonEmptyString(raw.title?.english)
  const title = apiTitle ?? MISSING_TITLE
  const large = httpsUrl(raw.coverImage?.extraLarge)
  const small = httpsUrl(raw.coverImage?.large)
  const synopsis = nonEmptyString(raw.description)

  return {
    id: positiveInteger(raw.id) ? String(raw.id) : `sem-id-${fallbackKey}`,
    title,
    imageUrl: large ?? small,
    thumbnailUrl: small ?? large,
    ...pickLink(raw, apiTitle),
    type: formatLabel(raw.format),
    year: positiveNumber(raw.seasonYear) ?? positiveNumber(raw.startDate?.year),
    score: scoreOutOfTen(raw.averageScore),
    synopsis: synopsis ? nonEmptyString(toPlainText(synopsis)) : null,
  }
}

// O MyAnimeList continua sendo o destino preferido, como na versão original;
// sem o ID de lá, o card leva à página do próprio AniList.
function pickLink(
  raw: AniListMedia,
  apiTitle: string | null,
): { url: string; linkSite: AnimeLinkSite } {
  if (positiveInteger(raw.idMal)) {
    return { url: `${MAL_URL}anime/${raw.idMal}`, linkSite: 'MyAnimeList' }
  }
  if (typeof raw.siteUrl === 'string' && raw.siteUrl.startsWith(ANILIST_URL)) {
    return { url: raw.siteUrl, linkSite: 'AniList' }
  }
  return {
    url: apiTitle
      ? `${ANILIST_URL}search/anime?search=${encodeURIComponent(apiTitle)}`
      : ANILIST_URL,
    linkSite: 'AniList',
  }
}

function formatLabel(
  format: AniListMediaFormat | null | undefined,
): string | null {
  if (!format) return null
  return FORMAT_LABELS[format] ?? null
}

/** O AniList usa notas de 0 a 100; a interface mostra de 0 a 10. */
function scoreOutOfTen(value: unknown): number | null {
  const score = positiveNumber(value)
  return score === null ? null : Math.round(score) / 10
}

// Aceita só capas https, bloqueando esquemas como `javascript:` ou `data:`.
function httpsUrl(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('https://')
    ? value
    : null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}
