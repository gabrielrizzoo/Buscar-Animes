// Ícones de traço desenhados para o projeto (24×24), sem depender de bibliotecas.

const paths = {
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'm20 20-4.2-4.2'],
  'search-x': [
    'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z',
    'm20 20-4.2-4.2',
    'm8.5 8.5 5 5',
    'm13.5 8.5-5 5',
  ],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3.2 2'],
  'wifi-off': [
    'M3 3l18 18',
    'M8.6 15.4a5 5 0 0 1 6.3-.6',
    'M5.2 12a10 10 0 0 1 4-2.4',
    'M14.8 9.7A10 10 0 0 1 18.8 12',
    'M12 19h.01',
  ],
  alert: [
    'M10.3 4 2 18.5A2 2 0 0 0 3.7 21.5h16.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z',
    'M12 9.5v4',
    'M12 17.5h.01',
  ],
  server: [
    'M5 4h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z',
    'M5 14h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z',
    'M8 7h.01',
    'M8 17h.01',
  ],
  'image-off': [
    'M4 4h16v16H4z',
    'M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    'm20 15-4-4-9 9',
  ],
  'arrow-up-right': ['M7 17 17 7', 'M8 7h9v9'],
  code: ['m8 6-6 6 6 6', 'm16 6 6 6-6 6'],
} as const

export type IconName = keyof typeof paths

interface IconProps {
  name: IconName
  className?: string
}

/** Ícone decorativo: o significado sempre vem do texto ao lado. */
export function Icon({ name, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/** Estrela preenchida usada na nota. */
export function StarIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
      />
    </svg>
  )
}

/** Marca do Buscar Animes: lupa âmbar sobre fundo noturno, igual ao favicon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
      <rect width="64" height="64" rx="16" fill="#0F172A" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        fill="none"
        stroke="#F59E0B"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle
        cx="28"
        cy="28"
        r="12"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="6"
      />
      <path
        d="M37 37 48 48"
        stroke="#F59E0B"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}
