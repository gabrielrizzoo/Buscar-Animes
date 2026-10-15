// Subconjunto da resposta de GET /v4/anime usado pela aplicação.
// A documentação da Jikan avisa que propriedades ausentes chegam como `null`,
// por isso quase tudo aqui é opcional ou anulável.
// Referência: https://docs.api.jikan.moe/#tag/anime/operation/getAnimeSearch

export interface JikanImageSet {
  image_url?: string | null
  small_image_url?: string | null
  large_image_url?: string | null
}

export interface JikanAnime {
  mal_id?: number | null
  url?: string | null
  title?: string | null
  type?: string | null
  year?: number | null
  score?: number | null
  synopsis?: string | null
  images?: {
    jpg?: JikanImageSet | null
    webp?: JikanImageSet | null
  } | null
  aired?: {
    prop?: {
      from?: { year?: number | null } | null
    } | null
  } | null
}

export interface JikanPagination {
  current_page?: number
  has_next_page?: boolean
  last_visible_page?: number
  items?: {
    count?: number
    total?: number
    per_page?: number
  }
}

export interface JikanSearchResponse {
  data: JikanAnime[]
  pagination?: JikanPagination
}
