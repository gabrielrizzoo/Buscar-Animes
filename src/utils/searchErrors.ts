import {
  JikanHttpError,
  JikanResponseError,
  RequestTimeoutError,
} from '../services/jikan.ts'

export interface ErrorFeedback {
  icon: string
  message: string
}

/** Traduz o erro de uma busca em uma mensagem para quem está usando o site. */
export function describeSearchError(error: unknown): ErrorFeedback {
  if (error instanceof RequestTimeoutError) {
    return {
      icon: '⏱️',
      message:
        'A API demorou demais para responder. Tente novamente em instantes.',
    }
  }

  if (error instanceof JikanHttpError) {
    if (error.status === 429) {
      return {
        icon: '⏳',
        message:
          'Muitas requisições. O banco de dados do MyAnimeList pede para você esperar alguns segundos e tentar novamente.',
      }
    }
    if (error.status >= 500) {
      return {
        icon: '🛠️',
        message:
          'O serviço da Jikan (MyAnimeList) está instável no momento. Tente novamente mais tarde.',
      }
    }
    return {
      icon: '⚠️',
      message:
        'Não foi possível realizar essa busca. Revise o termo e tente novamente.',
    }
  }

  if (error instanceof JikanResponseError) {
    return {
      icon: '⚠️',
      message:
        'A API retornou uma resposta inesperada. Tente novamente mais tarde.',
    }
  }

  // fetch rejeita com TypeError quando não consegue se conectar ao servidor.
  if (error instanceof TypeError) {
    return {
      icon: '📡',
      message: 'Problema de conexão. Verifique sua internet e tente novamente.',
    }
  }

  return {
    icon: '⚠️',
    message: 'Algo deu errado ao buscar os animes. Tente novamente.',
  }
}
