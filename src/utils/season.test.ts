import { describe, expect, it } from 'vitest'
import { currentSeason } from './season.ts'

describe('currentSeason', () => {
  it.each([
    [0, 'WINTER', 'janeiro'],
    [2, 'WINTER', 'janeiro'],
    [3, 'SPRING', 'abril'],
    [6, 'SUMMER', 'julho'],
    [9, 'FALL', 'outubro'],
    [11, 'FALL', 'outubro'],
  ])('no mês %i é a temporada %s (%s)', (month, season, monthName) => {
    expect(currentSeason(new Date(2026, month, 15))).toEqual({
      season,
      year: 2026,
      label: `temporada de ${monthName} de 2026`,
    })
  })
})
