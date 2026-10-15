import type { LoadMoreStatus } from '../hooks/useAnimeSearch.ts'
import { describeSearchError } from '../utils/searchErrors.ts'
import { secondaryButton } from './styles.ts'

interface LoadMoreProps {
  status: LoadMoreStatus
  error: unknown
  onLoadMore: () => void
  onRetry: () => void
}

export function LoadMore({
  status,
  error,
  onLoadMore,
  onRetry,
}: LoadMoreProps) {
  if (status === 'error') {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 text-center text-muted">
        <p>{describeSearchError(error).message}</p>
        <button type="button" className={secondaryButton} onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    )
  }

  const loading = status === 'loading'

  return (
    <div className="mt-12 flex justify-center">
      {/* aria-disabled em vez de disabled: o botão continua focado durante o carregamento */}
      <button
        type="button"
        className={secondaryButton}
        aria-disabled={loading}
        onClick={loading ? undefined : onLoadMore}
      >
        {loading ? 'Carregando…' : 'Carregar mais'}
      </button>
    </div>
  )
}
