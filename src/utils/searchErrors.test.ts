import { describe, expect, it } from 'vitest'
import {
  JikanHttpError,
  JikanResponseError,
  RequestTimeoutError,
} from '../services/jikan.ts'
import { describeSearchError } from './searchErrors.ts'

describe('describeSearchError', () => {
  it.each([
    ['timeout', new RequestTimeoutError(), /demorou demais/],
    ['HTTP 429', new JikanHttpError(429), /Muitas requisições/],
    ['HTTP 503', new JikanHttpError(503), /instável no momento/],
    ['HTTP 400', new JikanHttpError(400), /Revise o termo/],
    ['resposta inválida', new JikanResponseError(), /resposta inesperada/],
    ['falha de rede', new TypeError('Failed to fetch'), /Problema de conexão/],
    ['erro desconhecido', new Error('???'), /Algo deu errado/],
  ])('descreve %s', (_label, error, expected) => {
    expect(describeSearchError(error).message).toMatch(expected)
  })
})
