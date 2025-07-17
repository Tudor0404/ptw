import type {AlgebraicValue, DateTimeRange, ParsedNumericValue, UserDateTimeInput} from '../types'

export function checkAlgebraic(expr: AlgebraicValue): boolean {
    return (
        Number.isInteger(expr.coefficientN)
        && Number.isInteger(expr.constantY)
        && expr.coefficientN > 0
        && expr.constantY >= 0
        && expr.coefficientN < 9999
        && expr.constantY < 9999
    )
}

export function iterativeParsedValueCheck(
    values: ParsedNumericValue[],
    toCheck: number,
    min: number,
    max: number,
): boolean {
    for (const value of values) {
        switch (value.type) {
            case 'Number':
                if (value.value === toCheck) {
                    return true
                }
                break
            case 'Range':
                if (toCheck >= value.start && toCheck <= value.end) {
                    return true
                }
                break
            case 'Algebraic':
                const parameters = getAlgebraicParameters(value, min, max)

                if (!parameters) {
                    continue
                }

                for (let n = parameters.start; n <= parameters.end; n++) {
                    let calculatedValue: number
                    if (value.operator === '+') {
                        calculatedValue = value.coefficientN * n + value.constantY
                    } else {
                        calculatedValue = value.coefficientN * n - value.constantY
                    }

                    if (calculatedValue === toCheck) {
                        return true
                    }
                }
        }
    }
    return false
}

export function getAlgebraicParameters(
    value: AlgebraicValue,
    min: number,
    max: number,
):
    | false
    | {
    start: number
    end: number
} {
    if (
        (value.constantY > max && value.operator === '+')
        || (value.constantY < min && value.operator === '-')
    ) {
        return false
    }

    const Y_SIGNED = value.operator === '+' ? value.constantY : -value.constantY
    return {
        start: Math.max(Math.ceil((min - Y_SIGNED) / value.coefficientN), 1),
        end: Math.floor((max - Y_SIGNED) / value.coefficientN),
    }
}

export function createTimestamp(
    year: number,
    month: number = 1,
    day: number = 1,
    hour: number = 0,
    minute: number = 0,
    second: number = 0,
    ms: number = 0,
): number {
    return Date.UTC(year, month - 1, day, hour, minute, second, ms)
}

export function createTimestampEnd(
    year: number,
    month: number = 12,
    day: number = 31,
    hour: number = 23,
    minute: number = 59,
    second: number = 59,
    ms: number = 999,
): number {
    return Date.UTC(year, month - 1, day, hour, minute, second, ms)
}

export function createRange(start: UserDateTimeInput, end: UserDateTimeInput): DateTimeRange {
    return {
        start: createTimestamp(...(start as [number, number, number, number, number, number, number])),
        end: createTimestampEnd(...(end as [number, number, number, number, number, number, number])),
    }
}

export function createMilitaryTimeString(t: number): string {
    if (t < 0 || t > 86399999 || !Number.isInteger(t))
        return 'null'

    const hours = Math.floor(t / 3600000)
    const minutes = Math.floor((t % 3600000) / 60000)
    const seconds = Math.floor((t % 60000) / 1000)
    const milliseconds = t % 1000

    let result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    if (seconds !== 0 || milliseconds !== 0) {
        result += `:${seconds.toString().padStart(2, '0')}`
        if (milliseconds !== 0) {
            result += `.${milliseconds.toString().padStart(3, '0')}`
        }
    }

    return result
}
