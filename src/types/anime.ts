/** Site para onde o card leva: o MyAnimeList quando o AniList informa o ID de lá. */
export type AnimeLinkSite = 'MyAnimeList' | 'AniList'

/** Anime já normalizado e pronto para exibição. */
export interface Anime {
  id: string
  title: string
  /** URL https da capa em tamanho grande, ou `null` quando não há imagem segura. */
  imageUrl: string | null
  /** Versão menor da capa, usada em telas pequenas (`srcset`). */
  thumbnailUrl: string | null
  /** Página do anime no MyAnimeList ou no AniList. */
  url: string
  linkSite: AnimeLinkSite
  /** Formato já traduzido para exibição (TV, Filme, OVA...). */
  type: string | null
  year: number | null
  /** Nota de 0 a 10, com uma casa decimal. */
  score: number | null
  synopsis: string | null
}
