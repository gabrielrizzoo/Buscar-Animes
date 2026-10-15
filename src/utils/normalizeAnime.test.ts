import { describe, expect, it } from 'vitest'
import { makeJikanAnime } from '../test/fixtures.ts'
import { MISSING_TITLE, normalizeAnime } from './normalizeAnime.ts'

describe('normalizeAnime', () => {
  it('mapeia um item completo da Jikan', () => {
    expect(normalizeAnime(makeJikanAnime(), '1-0')).toEqual({
      id: '20',
      title: 'Naruto',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405l.webp',
      url: 'https://myanimelist.net/anime/20/Naruto',
      type: 'TV',
      year: 2002,
      score: 8.01,
      synopsis: 'Naruto Uzumaki quer se tornar Hokage.',
    })
  })

  it('não inventa um tipo quando a API não informa', () => {
    expect(
      normalizeAnime(makeJikanAnime({ type: null }), '1-0').type,
    ).toBeNull()
  })

  it('usa o ano de estreia quando `year` vem vazio', () => {
    const anime = makeJikanAnime({
      year: null,
      aired: { prop: { from: { year: 1998 } } },
    })
    expect(normalizeAnime(anime, '1-0').year).toBe(1998)
  })

  it('trata nota zero ou ausente como sem nota', () => {
    expect(normalizeAnime(makeJikanAnime({ score: 0 }), '1-0').score).toBeNull()
    expect(
      normalizeAnime(makeJikanAnime({ score: null }), '1-0').score,
    ).toBeNull()
  })

  it('preenche valores padrão quando quase tudo está ausente', () => {
    expect(normalizeAnime({}, '2-5')).toEqual({
      id: 'sem-id-2-5',
      title: MISSING_TITLE,
      imageUrl: null,
      url: 'https://myanimelist.net/',
      type: null,
      year: null,
      score: null,
      synopsis: null,
    })
  })

  it('escolhe a próxima capa quando a preferida não é https', () => {
    const anime = makeJikanAnime({
      images: {
        webp: { large_image_url: 'http://cdn.myanimelist.net/inseguro.webp' },
        jpg: {
          large_image_url: 'javascript:alert(1)',
          image_url: 'https://cdn.myanimelist.net/a.jpg',
        },
      },
    })
    expect(normalizeAnime(anime, '1-0').imageUrl).toBe(
      'https://cdn.myanimelist.net/a.jpg',
    )
  })

  it('rejeita links que não sejam do MyAnimeList e usa uma busca pelo título', () => {
    const anime = makeJikanAnime({
      url: 'javascript:alert(1)',
      title: 'Cowboy Bebop',
    })
    expect(normalizeAnime(anime, '1-0').url).toBe(
      'https://myanimelist.net/anime.php?q=Cowboy%20Bebop',
    )
  })

  it('mantém textos com HTML como texto puro (o React os escapa ao renderizar)', () => {
    const title = '<img src=x onerror="alert(1)">'
    expect(normalizeAnime(makeJikanAnime({ title }), '1-0').title).toBe(title)
  })
})
