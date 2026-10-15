/** Anime já normalizado e pronto para exibição. */
export interface Anime {
  id: string
  title: string
  /** URL https da capa, ou `null` quando não há uma imagem segura disponível. */
  imageUrl: string | null
  /** Página do anime no MyAnimeList (ou uma busca por título quando a API não informa). */
  url: string
  type: string | null
  year: number | null
  score: number | null
  synopsis: string | null
}
