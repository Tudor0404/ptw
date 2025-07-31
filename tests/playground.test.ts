import { describe, expect, it } from 'vitest'
import { parseExpression } from '../src'

describe('parsing testing', () => {
  it('empty string should pass', () => {
    const expression = parseExpression('(T[9:0:0.001..11:00,13:00..15:00] AND WD[1,2,3]) OR WD[4, 5]')

    expect(expression.ok).toBe(true)
  })
})
