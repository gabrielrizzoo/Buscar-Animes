import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon.tsx'

interface StatusMessageProps {
  icon: IconName
  children: ReactNode
  /** Ação opcional exibida abaixo da mensagem (ex.: "Tentar novamente"). */
  action?: ReactNode
}

/** Mensagem centralizada para busca inválida, sem resultados ou com erro. */
export function StatusMessage({ icon, children, action }: StatusMessageProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-white/8 bg-night/50 px-6 py-12 text-center backdrop-blur-md motion-safe:animate-rise-in">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/25">
        <Icon name={icon} className="size-7" />
      </span>
      <p className="text-lg leading-relaxed text-pretty text-ink/90">
        {children}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  )
}
