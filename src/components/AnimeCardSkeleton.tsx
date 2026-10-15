import { PAGE_SIZE } from '../services/anilist.ts'
import { resultsGrid } from './styles.ts'

/** Card de carregamento com o mesmo formato do AnimeCard. */
export function AnimeCardSkeleton() {
  return (
    <div className="flex h-full gap-4 motion-safe:animate-fade-in sm:flex-col sm:gap-3.5">
      <div className="aspect-[5/7] w-24 shrink-0 skeleton self-start rounded-xl sm:w-full" />
      <div className="flex flex-1 flex-col gap-2.5 py-1 sm:py-0">
        <div className="h-4 w-4/5 skeleton rounded" />
        <div className="h-3 w-1/3 skeleton rounded" />
        <div className="mt-1 h-3 w-full skeleton rounded" />
        <div className="h-3 w-2/3 skeleton rounded" />
      </div>
    </div>
  )
}

/** Grade de cards de carregamento exibida enquanto a primeira página chega. */
export function GridSkeleton() {
  return (
    <div aria-hidden="true" className={resultsGrid}>
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <AnimeCardSkeleton key={index} />
      ))}
    </div>
  )
}
