import type { ReactNode, Ref } from 'react'
import { Icon } from './Icon.tsx'

interface HeroProps {
  /** Formulário de busca, exibido logo abaixo do título. */
  children: ReactNode
  onRandom: () => void
  randomBusy: boolean
  randomButtonRef?: Ref<HTMLButtonElement>
  /** Versão menor, usada durante uma busca para os resultados aparecerem antes. */
  compact?: boolean
}

export function Hero({
  children,
  onRandom,
  randomBusy,
  randomButtonRef,
  compact = false,
}: HeroProps) {
  return (
    <div
      className={`mx-auto max-w-2xl text-center ${compact ? 'pt-8 pb-10 sm:pt-12 sm:pb-12' : 'pt-12 pb-12 sm:pt-20 sm:pb-16'}`}
    >
      <h1
        className={`font-display leading-[1.08] font-bold tracking-tight text-balance ${compact ? 'text-3xl sm:text-5xl' : 'text-[2.6rem] sm:text-6xl'}`}
      >
        Encontre seu próximo{' '}
        <span className="bg-linear-to-r from-accent-soft via-accent to-accent-strong bg-clip-text text-transparent">
          anime
        </span>
      </h1>
      {!compact && (
        <p className="mx-auto mt-4 max-w-lg text-base text-pretty text-muted sm:mt-5 sm:text-lg">
          Busque pelo título, explore as listas de sugestões ou deixe a sorte
          escolher por você.
        </p>
      )}

      <div className={compact ? 'mt-6 sm:mt-8' : 'mt-8 sm:mt-10'}>
        {children}
      </div>

      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted">
        Não sabe o que assistir?
        {/* aria-disabled em vez de disabled: o botão continua focado durante o sorteio */}
        <button
          ref={randomButtonRef}
          type="button"
          aria-disabled={randomBusy}
          onClick={randomBusy ? undefined : onRandom}
          className="group inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 font-semibold text-accent-soft transition-[color,background-color,border-color] duration-200 hover:border-accent/60 hover:bg-accent/20 aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          <Icon
            name="dice"
            className="size-4.5 transition-transform duration-300 motion-safe:group-hover:rotate-[20deg]"
          />
          Sortear um anime
        </button>
      </p>
    </div>
  )
}
