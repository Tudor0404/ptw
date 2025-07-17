import type {AlgebraicValue} from '../types'
import {getAlgebraicParameters} from './value'

export function updateBitmap(bitmap: Uint8Array, pos: number): void {
    const byteIndex = Math.floor(pos / 8)
    const bitInByte = pos % 8

    if (byteIndex < bitmap.length) {
        bitmap[byteIndex] |= 1 << bitInByte
    } else {
        throw new Error('Incorrect sized mask')
    }
}

export function updateAlgebraicBitmap(
    expr: AlgebraicValue,
    bitmap: Uint8Array,
    minRange: number,
    maxRange: number,
): void {
    const parameter = getAlgebraicParameters(expr, minRange, maxRange)

    if (!parameter)
        return

    for (let n = parameter.start; n <= parameter.end; n++) {
        let val: number
        if (expr.operator === '+') {
            val = expr.coefficientN * n + expr.constantY
        } else {
            val = expr.coefficientN * n - expr.constantY
        }

        if (val >= minRange && val <= maxRange) {
            updateBitmap(bitmap, val - minRange)
        }
    }
}
