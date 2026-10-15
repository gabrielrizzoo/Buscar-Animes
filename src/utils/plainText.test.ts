import { describe, expect, it } from 'vitest'
import { toPlainText } from './plainText.ts'

describe('toPlainText', () => {
  it('remove tags e transforma quebras de linha em espaços', () => {
    expect(
      toPlainText(
        'Primeira linha.<br><br>\nSegunda <i>linha</i> em <b>destaque</b>.',
      ),
    ).toBe('Primeira linha. Segunda linha em destaque.')
  })

  it('decodifica entidades nomeadas e numéricas', () => {
    expect(toPlainText('Tom &amp; Jerry &quot;&#039;&#x2764;&hellip;')).toBe(
      'Tom & Jerry "\'❤…',
    )
  })

  it('mantém entidades desconhecidas como estão', () => {
    expect(toPlainText('a &naoexiste; b')).toBe('a &naoexiste; b')
  })

  it('não deixa sobrar código: scripts viram texto inofensivo', () => {
    expect(toPlainText('<script>alert(1)</script>Olá')).toBe('alert(1)Olá')
  })
})
