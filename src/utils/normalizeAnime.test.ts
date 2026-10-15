import { describe, expect, it } from 'vitest'
import { makeMedia } from '../test/fixtures.ts'
import { MISSING_TITLE, normalizeAnime } from './normalizeAnime.ts'

describe('normalizeAnime', () => {
  it('mapeia um item completo do AniList', () => {
    expect(
      normalizeAnime(
        makeMedia({ bannerImage: 'https://s4.anilist.co/banner.jpg' }),
        '1-0',
      ),
    ).toEqual({
      id: '20',
      title: 'NARUTO',
      englishTitle: null,
      imageUrl:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20.jpg',
      thumbnailUrl:
        'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20.jpg',
      bannerUrl: 'https://s4.anilist.co/banner.jpg',
      color: '#e4a15d',
      url: 'https://myanimelist.net/anime/20',
      linkSite: 'MyAnimeList',
      type: 'TV',
      year: 2002,
      episodes: 220,
      genres: ['Ação', 'Aventura', 'Comédia'],
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

  it('guarda o título em inglês só quando ele é diferente do principal', () => {
    const different = makeMedia({
      title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan' },
    })
    expect(normalizeAnime(different, '1-0')).toMatchObject({
      title: 'Shingeki no Kyojin',
      englishTitle: 'Attack on Titan',
    })
    expect(normalizeAnime(makeMedia(), '1-0').englishTitle).toBeNull()
  })

  it('traduz os gêneros conhecidos e mantém os demais', () => {
    const anime = makeMedia({
      genres: ['Slice of Life', 'Sci-Fi', 'Mecha', null, ' '],
    })
    expect(normalizeAnime(anime, '1-0').genres).toEqual([
      'Cotidiano',
      'Ficção científica',
      'Mecha',
    ])
  })

  it('aceita só cores no formato #rrggbb', () => {
    const color = (value: string) =>
      normalizeAnime(makeMedia({ coverImage: { color: value } }), '1-0').color

    expect(color('#43E4A1')).toBe('#43E4A1')
    expect(color('red; background: url(x)')).toBeNull()
    expect(color('#fff')).toBeNull()
  })

  it('ignora banners que não são https e episódios inválidos', () => {
    const anime = makeMedia({ bannerImage: 'http://x.jpg', episodes: 0 })
    expect(normalizeAnime(anime, '1-0')).toMatchObject({
      bannerUrl: null,
      episodes: null,
    })
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
      englishTitle: null,
      imageUrl: null,
      thumbnailUrl: null,
      bannerUrl: null,
      color: null,
      url: 'https://anilist.co/',
      linkSite: 'AniList',
      type: null,
      year: null,
      episodes: null,
      genres: [],
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
