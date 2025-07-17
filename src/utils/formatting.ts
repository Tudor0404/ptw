import type {ParsedNumericValue} from '../types'

/**
 * Converts a ParsedNumericValue to its string representation
 */
export function parsedNumericValueToString(value: ParsedNumericValue): string {
    switch (value.type) {
        case 'Number':
            return value.value.toString()
        case 'Range':
            return `${value.start}..${value.end}`
        case 'Algebraic':
            return `${value.coefficientN}n${value.operator}${value.constantY}`
    }
}

/**
 * Converts an array of ParsedNumericValue to a comma-separated string
 */
export function parsedNumericValuesToString(values: ParsedNumericValue[]): string {
    return values.map(parsedNumericValueToString).join(',')
}
