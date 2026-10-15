// Classes compartilhadas entre componentes que precisam do mesmo visual.

import type { CSSProperties } from 'react'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[color,background-color,border-color] duration-200 aria-disabled:cursor-wait aria-disabled:opacity-60'

/** Botão principal ("Ver no MyAnimeList"). */
export const primaryButton = `${buttonBase} bg-accent text-canvas hover:bg-accent-soft aria-disabled:hover:bg-accent`

/** Botão secundário discreto ("Tentar novamente", "Carregar mais", "Sortear outro"). */
export const secondaryButton = `${buttonBase} border border-white/12 bg-white/[0.04] text-ink hover:border-white/25 hover:bg-white/[0.08] aria-disabled:hover:border-white/12 aria-disabled:hover:bg-white/[0.04]`

/** Grade de resultados: lista no celular e de 3 a 4 colunas de pôsteres em telas maiores. */
export const resultsGrid =
  'grid w-full grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-3 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-6'

/** Título de seção (h2) das sugestões e dos resultados. */
export const sectionTitle =
  'font-display text-2xl font-semibold tracking-tight text-ink'

/** Variável CSS com a cor da capa, usada pela sombra colorida (`shadow-cover`). */
export function coverColorStyle(color: string | null): CSSProperties {
  return color ? ({ '--cover-color': color } as CSSProperties) : {}
}
