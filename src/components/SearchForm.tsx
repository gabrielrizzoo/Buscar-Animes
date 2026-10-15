import type { SubmitEvent } from 'react'

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
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 md:flex-row"
    >
      <label htmlFor="campo-pesquisa" className="sr-only">
        Digite o título de um anime
      </label>
      <input
        id="campo-pesquisa"
        type="search"
        required
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Ex: One Piece, Naruto..."
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-w-0 flex-1 rounded-full border border-white/5 bg-night-soft/40 px-7 py-[1.2rem] text-[1.05rem] text-ink backdrop-blur-[16px] transition-[background-color,border-color,box-shadow] duration-300 ease-smooth outline-none placeholder:text-muted focus:border-accent/70 focus:bg-night-soft/80 focus:ring-[3px] focus:ring-accent/35"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-10 py-[1.2rem] font-semibold text-night shadow-[0_4px_10px_rgb(0_0_0/0.2)] transition-[background-color,translate,box-shadow] duration-300 ease-smooth hover:bg-accent-strong hover:shadow-[0_6px_15px_rgb(245_158_11/0.3)] active:translate-y-0 motion-safe:hover:-translate-y-0.5 md:py-0"
      >
        Explorar
      </button>
    </form>
  )
}
