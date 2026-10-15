// Classes compartilhadas entre componentes que precisam do mesmo visual.

/** Superfície de vidro dos cards (resultado e skeleton). */
export const cardSurface =
  'flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-white/5 border-t-white/15 bg-night/40 backdrop-blur-[20px]'

/** Botão secundário com contorno âmbar ("Tentar novamente", "Carregar mais"). */
export const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-accent/40 px-8 py-3 font-semibold text-accent transition-[color,background-color,border-color] duration-300 hover:border-accent hover:bg-accent hover:text-night aria-disabled:cursor-wait aria-disabled:opacity-60 aria-disabled:hover:bg-transparent aria-disabled:hover:text-accent'
