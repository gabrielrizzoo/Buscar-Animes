import type { ReactNode } from 'react'

interface StatusMessageProps {
  icon: string
  children: ReactNode
  /** Ação opcional exibida abaixo da mensagem (ex.: "Tentar novamente"). */
  action?: ReactNode
}

/** Mensagem centralizada para busca inválida, sem resultados ou com erro. */
export function StatusMessage({ icon, children, action }: StatusMessageProps) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center text-[1.3rem] text-muted motion-safe:animate-fade-in motion-safe:[animation-duration:0.4s]">
      <span aria-hidden="true" className="mb-4 block text-5xl opacity-50">
        {icon}
      </span>
      <p className="max-w-xl">{children}</p>
      {action && <div className="mt-8 text-base">{action}</div>}
    </div>
  )
}
