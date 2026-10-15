import { useState } from 'react'

interface CoverImageProps {
  src: string | null
  title: string
}

/** Capa no formato 3:4 com fallback local quando não há imagem ou ela falha ao carregar. */
export function CoverImage({ src, title }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src !== null && !failed

  return (
    <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-night-deep">
      {showImage ? (
        <img
          src={src}
          alt={`Capa de ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover object-center transition-transform duration-600 ease-cover motion-safe:group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`Capa indisponível para ${title}`}
          className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-accent"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-12 opacity-70"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-lg font-medium">Capa indisponível</span>
        </div>
      )}
    </div>
  )
}
