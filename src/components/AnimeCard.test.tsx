import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Anime } from '../types/anime.ts'
import { AnimeCard, MISSING_SYNOPSIS } from './AnimeCard.tsx'

function makeAnime(overrides: Partial<Anime> = {}): Anime {
  return {
    id: '20',
    title: 'Naruto',
    imageUrl: 'https://s4.anilist.co/capa-grande.jpg',
    thumbnailUrl: 'https://s4.anilist.co/capa-media.jpg',
    url: 'https://myanimelist.net/anime/20',
    linkSite: 'MyAnimeList',
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

    expect(screen.getByRole('heading', { name: /^Naruto/ })).toBeInTheDocument()
    const cover = screen.getByRole('img', { name: 'Capa de Naruto' })
    expect(cover).toHaveAttribute(
      'src',
      'https://s4.anilist.co/capa-grande.jpg',
    )
    expect(cover).toHaveAttribute(
      'srcset',
      'https://s4.anilist.co/capa-media.jpg 230w, https://s4.anilist.co/capa-grande.jpg 460w',
    )
    expect(
      screen.getByText('Tipo:', { exact: false }).parentElement,
    ).toHaveTextContent('TV')
    expect(screen.getByText('2002')).toBeInTheDocument()
    expect(screen.getByText('8.0')).toBeInTheDocument()
    expect(
      screen.getByText('Naruto Uzumaki quer se tornar Hokage.'),
    ).toBeInTheDocument()
  })

  it('abre o MyAnimeList em nova aba a partir do título, avisando o leitor de tela', () => {
    render(<AnimeCard anime={makeAnime()} />)

    const link = screen.getByRole('link', {
      name: 'Naruto (abre no MyAnimeList em nova aba)',
    })
    expect(link).toHaveAttribute('href', 'https://myanimelist.net/anime/20')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('indica o AniList como destino quando o anime não tem página no MyAnimeList', () => {
    render(
      <AnimeCard
        anime={makeAnime({
          url: 'https://anilist.co/anime/20',
          linkSite: 'AniList',
        })}
      />,
    )

    expect(
      screen.getByRole('link', {
        name: 'Naruto (abre no AniList em nova aba)',
      }),
    ).toHaveAttribute('href', 'https://anilist.co/anime/20')
    expect(screen.getByText('AniList')).toBeInTheDocument()
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
    expect(screen.getByText('Sem nota')).toBeInTheDocument()
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

    expect(
      screen.getByRole('heading', {
        name: `${title} (abre no MyAnimeList em nova aba)`,
      }),
    ).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
