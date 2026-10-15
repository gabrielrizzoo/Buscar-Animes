/** Nota no formato usado pelo MyAnimeList: sempre com duas casas decimais (8 → "8.00"). */
export function formatScore(score: number): string {
  return score.toFixed(2)
}

/** Resumo da quantidade de resultados, ex.: "Exibindo 12 de 87 resultados para “naruto”". */
export function formatResultSummary(
  shown: number,
  total: number | null,
  query: string,
): string {
  if (total !== null && total > shown) {
    return `Exibindo ${shown} de ${total} resultados para “${query}”`
  }
  return `${shown} ${shown === 1 ? 'resultado' : 'resultados'} para “${query}”`
}
