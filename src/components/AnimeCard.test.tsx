import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Anime } from '../types/anime.ts'
import { AnimeCard, MISSING_SYNOPSIS } from './AnimeCard.tsx'

function makeAnime(overrides: Partial<Anime> = {}): Anime {
  return {
    id: '20',
    title: 'Naruto',
    imageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405l.webp',
    url: 'https://myanimelist.net/anime/20/Naruto',
    type: 'TV',
    year: 2002,
    score: 8,
    synopsis: 'Naruto Uzumaki quer se tornar Hokage.',
    ...overrides,
  }
}

describe('AnimeCard', () => {
  it('exibe título, capa, detalhes e sinopse', () => {
    render(<AnimeCard anime={makeAnime()} />)

    expect(screen.getByRole('heading', { name: 'Naruto' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Capa de Naruto' })).toHaveAttribute(
      'src',
      'https://cdn.myanimelist.net/images/anime/13/17405l.webp',
    )
    expect(
      screen.getByText('Tipo:', { exact: false }).parentElement,
    ).toHaveTextContent('TV')
    expect(screen.getByText('2002')).toBeInTheDocument()
    expect(screen.getByText('8.00')).toBeInTheDocument()
    expect(
      screen.getByText('Naruto Uzumaki quer se tornar Hokage.'),
    ).toBeInTheDocument()
  })

  it('abre o MyAnimeList em nova aba com um nome acessível descritivo', () => {
    render(<AnimeCard anime={makeAnime()} />)

    const link = screen.getByRole('link', {
      name: 'Saber Mais sobre Naruto no MyAnimeList (abre em nova aba)',
    })
    expect(link).toHaveAttribute(
      'href',
      'https://myanimelist.net/anime/20/Naruto',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('usa os textos padrão quando faltam dados', () => {
    render(
      <AnimeCard
        anime={makeAnime({
          type: null,
          year: null,
          score: null,
          synopsis: null,
        })}
      />,
    )

    expect(
      screen.queryByText('Tipo:', { exact: false }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('TBA')).toBeInTheDocument()
    expect(screen.getByText('S/ Nota')).toBeInTheDocument()
    expect(screen.getByText(MISSING_SYNOPSIS)).toBeInTheDocument()
  })

  it('mostra a capa substituta quando não há imagem', () => {
    render(<AnimeCard anime={makeAnime({ imageUrl: null })} />)

    expect(
      screen.getByRole('img', { name: 'Capa indisponível para Naruto' }),
    ).toBeInTheDocument()
  })

  it('troca para a capa substituta quando a imagem falha ao carregar', () => {
    render(<AnimeCard anime={makeAnime()} />)

    fireEvent.error(screen.getByRole('img', { name: 'Capa de Naruto' }))

    expect(
      screen.getByRole('img', { name: 'Capa indisponível para Naruto' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Capa de Naruto' }),
    ).not.toBeInTheDocument()
  })

  it('exibe HTML vindo da API como texto, sem executá-lo', () => {
    const title = '<img src=x onerror="alert(1)">'
    const { container } = render(
      <AnimeCard anime={makeAnime({ title, imageUrl: null })} />,
    )

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
