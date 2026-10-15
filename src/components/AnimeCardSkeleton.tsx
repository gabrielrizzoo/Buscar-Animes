import { cardSurface } from './styles.ts'

/** Card de carregamento com o mesmo formato do AnimeCard. */
export function AnimeCardSkeleton() {
  return (
    <div className={`${cardSurface} motion-safe:animate-fade-in`}>
      <div className="aspect-[5/7] w-24 shrink-0 skeleton self-start rounded-xl sm:w-full sm:rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 py-1 sm:p-4">
        <div className="h-4 w-4/5 skeleton rounded" />
        <div className="h-3 w-1/3 skeleton rounded" />
        <div className="mt-1 h-3 w-full skeleton rounded" />
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-2/3 skeleton rounded" />
      </div>
    </div>
  )
}
