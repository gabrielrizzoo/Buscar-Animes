const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

/**
 * Converte a sinopse do AniList (que pode trazer `<br>`, `<i>` e entidades HTML)
 * em texto puro. O resultado é exibido pelo React como texto, nunca como HTML.
 */
export function toPlainText(html: string): string {
  return decodeEntities(
    html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (match, entity: string) => {
      if (entity[0] === '#') {
        const code =
          entity[1]?.toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10)
        return Number.isInteger(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match
    },
  )
}
