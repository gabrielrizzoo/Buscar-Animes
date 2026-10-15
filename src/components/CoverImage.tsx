import { useState } from 'react'
import { Icon } from './Icon.tsx'

interface CoverImageProps {
  src: string | null
  /** Versão menor da capa, usada quando o card é estreito (lista do celular). */
  thumbnailSrc?: string | null
  title: string
}

// Larguras das capas do AniList: `large` tem 230 px e `extraLarge`, 460 px.
const THUMBNAIL_WIDTH = 230
const LARGE_WIDTH = 460

/** Capa em formato de pôster com fallback local quando não há imagem ou ela falha ao carregar. */
export function CoverImage({ src, thumbnailSrc, title }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const showImage = src !== null && !failed
  const srcSet =
    src && thumbnailSrc && thumbnailSrc !== src
      ? `${thumbnailSrc} ${THUMBNAIL_WIDTH}w, ${src} ${LARGE_WIDTH}w`
      : undefined

  return (
    <div className="aspect-[5/7] w-full overflow-hidden bg-night-deep">
      {showImage ? (
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? '(min-width: 640px) 290px, 96px' : undefined}
          alt={`Capa de ${title}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover object-center transition-transform duration-500 ease-cover motion-safe:group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`Capa indisponível para ${title}`}
          className="flex size-full flex-col items-center justify-center gap-2 bg-linear-to-b from-night-soft/60 to-night-deep p-3 text-center text-muted"
        >
          <Icon name="image-off" className="size-7 opacity-70 sm:size-9" />
          <span className="text-[0.7rem] font-medium sm:text-sm">
            Capa indisponível
          </span>
        </div>
      )}
    </div>
  )
}
