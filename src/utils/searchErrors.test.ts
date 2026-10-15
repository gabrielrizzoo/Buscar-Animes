import { describe, expect, it } from 'vitest'
import {
  ApiHttpError,
  ApiResponseError,
  RequestTimeoutError,
} from '../services/anilist.ts'
import { describeSearchError } from './searchErrors.ts'

describe('describeSearchError', () => {
  it.each([
    ['timeout', new RequestTimeoutError(), /demorou demais/],
    ['HTTP 429 sem prazo', new ApiHttpError(429), /Aguarde alguns segundos/],
    [
      'HTTP 429 com prazo',
      new ApiHttpError(429, 42),
      /Aguarde cerca de 42 segundos/,
    ],
    ['HTTP 503', new ApiHttpError(503), /instável no momento/],
    ['HTTP 400', new ApiHttpError(400), /Revise o termo/],
    ['resposta inválida', new ApiResponseError(), /resposta inesperada/],
    ['falha de rede', new TypeError('Failed to fetch'), /Problema de conexão/],
    ['erro desconhecido', new Error('???'), /Algo deu errado/],
  ])('descreve %s', (_label, error, expected) => {
    expect(describeSearchError(error).message).toMatch(expected)
  })
})
