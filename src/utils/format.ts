/** Nota de 0 a 10 sempre com uma casa decimal (8 → "8.0"). */
export function formatScore(score: number): string {
  return score.toFixed(1)
}

/** Resumo da quantidade de resultados, ex.: "12 resultados para “naruto”". */
export function formatResultSummary(shown: number, query: string): string {
  return `${shown} ${shown === 1 ? 'resultado' : 'resultados'} para “${query}”`
}

/** Quantidade de episódios por extenso, ex.: "1 episódio", "24 episódios". */
export function formatEpisodes(episodes: number): string {
  return `${episodes} ${episodes === 1 ? 'episódio' : 'episódios'}`
}
