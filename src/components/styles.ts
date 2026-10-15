// Classes compartilhadas entre componentes que precisam do mesmo visual.

/** Superfície de vidro dos cards (resultado e skeleton). */
export const cardSurface =
  'relative flex h-full gap-4 rounded-2xl border border-white/8 bg-night/60 p-3 backdrop-blur-md sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0'

/** Botão secundário discreto ("Tentar novamente", "Carregar mais"). */
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-ink transition-[color,background-color,border-color] duration-200 hover:border-accent/60 hover:bg-accent/10 hover:text-accent-soft aria-disabled:cursor-wait aria-disabled:opacity-60 aria-disabled:hover:border-white/12 aria-disabled:hover:bg-white/[0.04] aria-disabled:hover:text-ink'

/** Grade de resultados: lista no celular e de 2 a 4 colunas em telas maiores. */
export const resultsGrid =
  'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6'
