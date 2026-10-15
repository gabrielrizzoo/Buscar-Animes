import type { Ref, SubmitEvent } from 'react'
import { Icon } from './Icon.tsx'

interface SearchFormProps {
  value: string
  onValueChange: (value: string) => void
  onSearch: (query: string) => void
  inputRef?: Ref<HTMLInputElement>
}

export function SearchForm({
  value,
  onValueChange,
  onSearch,
  inputRef,
}: SearchFormProps) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch(value)
  }

  return (
    // O contorno de foco fica na barra inteira, que envolve o campo e o botão.
    <form
      role="search"
      onSubmit={handleSubmit}
      className="group/search flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/80 p-1.5 pl-4 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-[border-color,box-shadow] duration-200 focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10"
    >
      <label htmlFor="campo-pesquisa" className="sr-only">
        Digite o título de um anime
      </label>
      <Icon
        name="search"
        className="size-5 shrink-0 text-faint transition-colors duration-200 group-focus-within/search:text-accent"
      />
      <input
        ref={inputRef}
        id="campo-pesquisa"
        type="search"
        required
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Ex: Frieren, One Piece..."
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-faint"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-accent px-4 py-2.5 font-semibold text-canvas transition-[background-color,translate] duration-200 hover:bg-accent-soft active:translate-y-px sm:px-6"
      >
        Buscar
      </button>
    </form>
  )
}
