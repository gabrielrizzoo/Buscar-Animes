import type { SubmitEvent } from 'react'
import { Icon } from './Icon.tsx'

interface SearchFormProps {
  value: string
  onValueChange: (value: string) => void
  onSearch: (query: string) => void
}

export function SearchForm({
  value,
  onValueChange,
  onSearch,
}: SearchFormProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(value)
  }

  return (
    // No celular, campo e botão ficam empilhados; a partir de sm, dividem a mesma pílula.
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-white/10 sm:bg-night/70 sm:p-1.5 sm:shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)] sm:backdrop-blur-xl sm:transition-[border-color,box-shadow] sm:duration-200 sm:focus-within:border-accent/60 sm:focus-within:ring-4 sm:focus-within:ring-accent/15"
    >
      <label htmlFor="campo-pesquisa" className="sr-only">
        Digite o título de um anime
      </label>
      <div className="relative flex-1">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-5 z-10 size-5 -translate-y-1/2 text-muted"
        />
        <input
          id="campo-pesquisa"
          type="search"
          required
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Ex: One Piece, Naruto..."
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="w-full rounded-full border border-white/10 bg-night/70 py-4 pr-5 pl-13 text-base text-ink backdrop-blur-xl transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted focus:border-accent/60 focus:ring-4 focus:ring-accent/15 sm:border-transparent sm:bg-transparent sm:py-3 sm:backdrop-blur-none sm:focus:border-transparent sm:focus:ring-0"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-accent px-7 py-4 font-semibold text-night shadow-[0_10px_30px_-10px_rgb(245_158_11/0.7)] transition-[background-color,translate] duration-200 hover:bg-accent-soft active:translate-y-px sm:py-3"
      >
        Explorar
      </button>
    </form>
  )
}
