import type { IconName } from '../components/Icon.tsx'
import {
  ApiHttpError,
  ApiResponseError,
  RequestTimeoutError,
} from '../services/anilist.ts'

export interface ErrorFeedback {
  icon: IconName
  message: string
}

/** Traduz o erro de uma busca em uma mensagem para quem está usando o site. */
export function describeSearchError(error: unknown): ErrorFeedback {
  if (error instanceof RequestTimeoutError) {
    return {
      icon: 'clock',
      message:
        'A API demorou demais para responder. Tente novamente em instantes.',
    }
  }

  if (error instanceof ApiHttpError) {
    if (error.status === 429) {
      const wait = error.retryAfterSeconds
        ? `cerca de ${error.retryAfterSeconds} segundos`
        : 'alguns segundos'
      return {
        icon: 'clock',
        message: `Muitas buscas em pouco tempo. Aguarde ${wait} e tente novamente.`,
      }
    }
    if (error.status >= 500) {
      return {
        icon: 'server',
        message:
          'O serviço do AniList está instável no momento. Tente novamente mais tarde.',
      }
    }
    return {
      icon: 'alert',
      message:
        'Não foi possível realizar essa busca. Revise o termo e tente novamente.',
    }
  }

  if (error instanceof ApiResponseError) {
    return {
      icon: 'alert',
      message:
        'A API retornou uma resposta inesperada. Tente novamente mais tarde.',
    }
  }

  // fetch rejeita com TypeError quando não consegue se conectar ao servidor.
  if (error instanceof TypeError) {
    return {
      icon: 'wifi-off',
      message: 'Problema de conexão. Verifique sua internet e tente novamente.',
    }
  }

  return {
    icon: 'alert',
    message: 'Algo deu errado ao buscar os animes. Tente novamente.',
  }
}
