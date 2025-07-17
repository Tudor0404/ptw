import {describe, expect, it} from 'vitest'
import {parseExpression} from '../src'

describe('parsing testing', () => {
    it('empty string should pass', () => {
        const expression = parseExpression('')

        expect(expression.ok).toBe(false)
    })
})
