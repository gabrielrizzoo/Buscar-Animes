import type { DiscoverListId } from '../services/anilist.ts'
import { currentSeason } from '../utils/season.ts'
import type { IconName } from './Icon.tsx'

export interface DiscoverList {
  id: DiscoverListId
  label: string
  icon: IconName
  description: string
}

/** Listas de sugestões da página inicial, na ordem das abas. */
export const DISCOVER_LISTS: DiscoverList[] = [
  {
    id: 'trending',
    label: 'Em alta',
    icon: 'flame',
    description: 'Os animes mais assistidos e comentados no AniList agora.',
  },
  {
    id: 'season',
    label: 'Nesta temporada',
    icon: 'calendar',
    description: `Os mais populares da ${currentSeason().label}.`,
  },
  {
    id: 'top-rated',
    label: 'Mais bem avaliados',
    icon: 'trophy',
    description: 'As maiores notas do AniList entre animes com público grande.',
  },
]
