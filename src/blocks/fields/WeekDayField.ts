import type {DateTimeRange, ISchedule, ParsedNumericValue, Result} from '../../types'
import {BlockType, MergeState} from '../../types'
import {parsedNumericValuesToString} from '../../utils/formatting'
import {success} from '../../utils/result'
import {iterativeParsedValueCheck} from '../../utils/value'
import Field from './Field'

export default class WeekDayField extends Field<ParsedNumericValue> {
    constructor(values: ParsedNumericValue[] = []) {
        super(values, 1, 7, 1, BlockType.FieldWeekDay)
    }

    toString(): string {
        if (this.values.length === 0) {
            return 'WD[]'
        }
        return `WD[${parsedNumericValuesToString(this.values)}]`
    }

    clone(): WeekDayField {
        return new WeekDayField([...this.values])
    }

    evaluate(
        startUnix: number,
        endUnix: number,
        schedule?: ISchedule,
        merge?: boolean,
    ): Result<DateTimeRange[], Error> {
        if (this.values.length === 0) {
            return success([])
        }

        const shouldMerge
            = this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true)

        if (this.cache !== null && this.cache[0] === 0x7F) {
            return success([{start: startUnix, end: endUnix}])
        }

        const activeWeekdays = this.getActiveParsedNumberic(this.values)

        const result: DateTimeRange[] = []

        const startDate = new Date(startUnix)

        const currentDate = new Date(
            Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
        )

        let rangeStart: number | null = null
        let lastMatchEnd: number | null = null

        while (currentDate.getTime() <= endUnix) {
            const dayStart = currentDate.getTime()

            const weekday = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay()

            if (activeWeekdays[weekday - 1]) {
                const dayEnd = Math.min(dayStart + 86399999, endUnix)

                if (rangeStart === null) {
                    rangeStart = Math.max(dayStart, startUnix)
                    lastMatchEnd = dayEnd
                } else if (shouldMerge && dayStart <= lastMatchEnd! + 1) {
                    lastMatchEnd = dayEnd
                } else {
                    result.push({start: rangeStart, end: lastMatchEnd!})
                    rangeStart = Math.max(dayStart, startUnix)
                    lastMatchEnd = dayEnd
                }
            } else if (rangeStart !== null) {
                result.push({start: rangeStart, end: lastMatchEnd!})
                rangeStart = null
                lastMatchEnd = null
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
            currentDate.setUTCHours(0, 0, 0, 0)
        }

        if (rangeStart !== null && lastMatchEnd !== null) {
            result.push({start: rangeStart, end: Math.min(lastMatchEnd, endUnix)})
        }

        return success(result)
    }

    evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
        if (this.values.length === 0) {
            return success(false)
        }

        const date = new Date(unix)
        const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay()

        return success(iterativeParsedValueCheck(this.values, weekday, this.minValue, this.maxValue))
    }

    optimise(): void {
        throw new Error('Not implemented')
    }

    protected cacheValues(): void {
        this.cache = this.cacheParsedNumeric(this.values)
    }

    protected validateValue(value: ParsedNumericValue): boolean {
        return this.validateParsedNumeric(value)
    }
}
