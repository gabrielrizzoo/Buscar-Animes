const SUGGESTIONS = [
  'One Piece',
  'Frieren',
  'Jujutsu Kaisen',
  'Death Note',
  'Cowboy Bebop',
]

interface SearchSuggestionsProps {
  onSelect: (title: string) => void
}

/** Atalhos de busca para quem chega sem um título em mente. */
export function SearchSuggestions({ onSelect }: SearchSuggestionsProps) {
  return (
    <div
      role="group"
      aria-labelledby="titulo-sugestoes"
      className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm"
    >
      <span id="titulo-sugestoes" className="mr-1 text-muted">
        Experimente:
      </span>
      {SUGGESTIONS.map((title) => (
        <button
          key={title}
          type="button"
          onClick={() => onSelect(title)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-ink/80 transition-[color,background-color,border-color] duration-200 hover:border-accent/50 hover:bg-accent/10 hover:text-accent-soft"
        >
          {title}
        </button>
      ))}
    </div>
  )
}
