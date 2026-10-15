// Subconjunto da resposta da API GraphQL do AniList usado pela aplicação.
// Campos que a API pode não ter (nota, capa, ano, ID do MyAnimeList...) chegam
// como `null`, por isso quase tudo aqui é opcional ou anulável.
// Referência: https://docs.anilist.co/reference/object/media

export type AniListMediaFormat =
  | 'TV'
  | 'TV_SHORT'
  | 'MOVIE'
  | 'SPECIAL'
  | 'OVA'
  | 'ONA'
  | 'MUSIC'
  | (string & {})

export type AniListSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export interface AniListMedia {
  id?: number | null
  idMal?: number | null
  siteUrl?: string | null
  title?: {
    romaji?: string | null
    english?: string | null
  } | null
  format?: AniListMediaFormat | null
  seasonYear?: number | null
  startDate?: { year?: number | null } | null
  episodes?: number | null
  /** Gêneros em inglês, como "Action" e "Slice of Life". */
  genres?: (string | null)[] | null
  /** Nota média de 0 a 100. */
  averageScore?: number | null
  /** Sinopse que pode conter tags HTML simples, como `<br>` e `<i>`. */
  description?: string | null
  coverImage?: {
    extraLarge?: string | null
    large?: string | null
    /** Cor predominante da capa, em hexadecimal (#rrggbb). */
    color?: string | null
  } | null
  /** Imagem horizontal de destaque; só é pedida na consulta do sorteio. */
  bannerImage?: string | null
}

export interface AniListPageResponse {
  data: {
    Page: {
      pageInfo?: { hasNextPage?: boolean | null } | null
      media: AniListMedia[]
    }
  }
}
