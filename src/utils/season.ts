import type { AniListSeason } from '../types/anilist.ts'

export interface AnimeSeason {
  season: AniListSeason
  year: number
  /** Nome usado na interface, ex.: "temporada de outubro de 2026". */
  label: string
}

// As temporadas de anime começam em janeiro, abril, julho e outubro. A interface
// usa o mês de início porque "outono" e "primavera" se invertem no Brasil.
const SEASONS: { season: AniListSeason; month: string }[] = [
  { season: 'WINTER', month: 'janeiro' },
  { season: 'SPRING', month: 'abril' },
  { season: 'SUMMER', month: 'julho' },
  { season: 'FALL', month: 'outubro' },
]

/** Temporada de anime em exibição na data informada. */
export function currentSeason(date = new Date()): AnimeSeason {
  const { season, month } = SEASONS[Math.floor(date.getMonth() / 3)]!
  const year = date.getFullYear()
  return { season, year, label: `temporada de ${month} de ${year}` }
}
