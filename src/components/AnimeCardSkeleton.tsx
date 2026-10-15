import { cardSurface } from './styles.ts'

/** Card de carregamento com o mesmo formato do AnimeCard. */
export function AnimeCardSkeleton() {
  return (
    <div className={`${cardSurface} motion-safe:animate-fade-in`}>
      <div className="aspect-[3/4] w-full skeleton" />
      <div className="flex flex-1 flex-col p-7">
        <div className="mb-3 h-6 w-4/5 skeleton rounded" />
        <div className="mb-5 flex gap-2">
          <div className="h-6 w-12 skeleton rounded-full" />
          <div className="h-6 w-12 skeleton rounded-full" />
        </div>
        <div className="mb-8 h-16 w-full skeleton rounded" />
        <div className="mt-auto h-10 w-full skeleton rounded-lg" />
      </div>
    </div>
  )
}
