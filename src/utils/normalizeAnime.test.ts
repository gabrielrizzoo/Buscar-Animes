import { describe, expect, it } from 'vitest'
import { makeMedia } from '../test/fixtures.ts'
import { MISSING_TITLE, normalizeAnime } from './normalizeAnime.ts'

describe('normalizeAnime', () => {
  it('mapeia um item completo do AniList', () => {
    expect(normalizeAnime(makeMedia(), '1-0')).toEqual({
      id: '20',
      title: 'NARUTO',
      imageUrl:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20.jpg',
      thumbnailUrl:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20.jpg',
      url: 'https://myanimelist.net/anime/20',
      linkSite: 'MyAnimeList',
      type: 'TV',
      year: 2002,
      score: 8,
      synopsis: 'Naruto Uzumaki quer se tornar Hokage. (Source: MAL Rewrite)',
    })
  })

  it('converte a nota de 0–100 para 0–10 com uma casa decimal', () => {
    expect(normalizeAnime(makeMedia({ averageScore: 87 }), '1-0').score).toBe(
      8.7,
    )
  })

  it('trata nota zero ou ausente como sem nota', () => {
    expect(
      normalizeAnime(makeMedia({ averageScore: 0 }), '1-0').score,
    ).toBeNull()
    expect(
      normalizeAnime(makeMedia({ averageScore: null }), '1-0').score,
    ).toBeNull()
  })

  it.each([
    ['MOVIE', 'Filme'],
    ['TV_SHORT', 'TV curta'],
    ['SPECIAL', 'Especial'],
    ['OVA', 'OVA'],
    ['MUSIC', 'Clipe musical'],
  ])('traduz o formato %s para "%s"', (format, label) => {
    expect(normalizeAnime(makeMedia({ format }), '1-0').type).toBe(label)
  })

  it('não inventa um tipo quando o formato é ausente ou desconhecido', () => {
    expect(normalizeAnime(makeMedia({ format: null }), '1-0').type).toBeNull()
    expect(
      normalizeAnime(makeMedia({ format: 'NOVO_FORMATO' }), '1-0').type,
    ).toBeNull()
  })

  it('usa o ano de estreia quando `seasonYear` vem vazio', () => {
    const anime = makeMedia({ seasonYear: null, startDate: { year: 1998 } })
    expect(normalizeAnime(anime, '1-0').year).toBe(1998)
  })

  it('usa o título em inglês quando falta o romanizado', () => {
    const anime = makeMedia({
      title: { romaji: null, english: 'Attack on Titan' },
    })
    expect(normalizeAnime(anime, '1-0').title).toBe('Attack on Titan')
  })

  it('leva ao AniList quando não há ID do MyAnimeList', () => {
    const anime = makeMedia({ idMal: null })
    expect(normalizeAnime(anime, '1-0')).toMatchObject({
      url: 'https://anilist.co/anime/20',
      linkSite: 'AniList',
    })
  })

  it('rejeita links desconhecidos e usa uma busca pelo título no AniList', () => {
    const anime = makeMedia({
      idMal: null,
      siteUrl: 'javascript:alert(1)',
      title: { romaji: 'Cowboy Bebop' },
    })
    expect(normalizeAnime(anime, '1-0')).toMatchObject({
      url: 'https://anilist.co/search/anime?search=Cowboy%20Bebop',
      linkSite: 'AniList',
    })
  })

  it('aceita só capas https', () => {
    const anime = makeMedia({
      coverImage: {
        extraLarge: 'javascript:alert(1)',
        large: 'https://s4.anilist.co/capa-media.jpg',
      },
    })
    expect(normalizeAnime(anime, '1-0')).toMatchObject({
      imageUrl: 'https://s4.anilist.co/capa-media.jpg',
      thumbnailUrl: 'https://s4.anilist.co/capa-media.jpg',
    })
  })

  it('preenche valores padrão quando quase tudo está ausente', () => {
    expect(normalizeAnime({}, '2-5')).toEqual({
      id: 'sem-id-2-5',
      title: MISSING_TITLE,
      imageUrl: null,
      thumbnailUrl: null,
      url: 'https://anilist.co/',
      linkSite: 'AniList',
      type: null,
      year: null,
      score: null,
      synopsis: null,
    })
  })

  it('mantém textos com HTML no título como texto puro (o React os escapa ao renderizar)', () => {
    const title = '<img src=x onerror="alert(1)">'
    expect(
      normalizeAnime(makeMedia({ title: { romaji: title } }), '1-0').title,
    ).toBe(title)
  })
})
