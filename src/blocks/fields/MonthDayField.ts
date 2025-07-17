import type {DateTimeRange, ISchedule, ParsedNumericValue, Result} from '../../types'
import {BlockType, MergeState} from '../../types'
import {parsedNumericValuesToString} from '../../utils/formatting'
import {success} from '../../utils/result'
import {iterativeParsedValueCheck} from '../../utils/value'
import Field from './Field'

export default class MonthDayField extends Field<ParsedNumericValue> {
    constructor(values: ParsedNumericValue[] = []) {
        super(values, 1, 31, 4, BlockType.FieldMonthDay)
    }

    toString(): string {
        if (this.values.length === 0) {
            return 'MD[]'
        }
        return `MD[${parsedNumericValuesToString(this.values)}]`
    }

    override clone(): MonthDayField {
        return new MonthDayField([...this.values])
    }

    override evaluate(
        startUnix: number,
        endUnix: number,
        schedule: ISchedule | null = null,
        merge: boolean | null = null,
    ): Result<DateTimeRange[], Error> {
        if (this.values.length === 0) {
            return success([])
        }

        const shouldMerge
            = this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true)

        if (
            this.cache !== null
            && this.cache[0] === 0xFF
            && this.cache[1] === 0xFF
            && this.cache[2] === 0xFF
            && (this.cache[3] & 0x7F) === 0x7F
        ) {
            return success([{start: startUnix, end: endUnix}])
        }

        const activeDays = this.getActiveParsedNumberic(this.values)

        const result: DateTimeRange[] = []

        const currentDate = new Date(startUnix)
        currentDate.setUTCHours(0, 0, 0, 0)

        let rangeStart: number | null = null
        let lastMatchEnd: number | null = null

        while (currentDate.getTime() <= endUnix) {
            const dayStart = currentDate.getTime()
            const day = currentDate.getUTCDate()

            if (activeDays[day - 1]) {
                const dayEnd = Math.min(dayStart + 86399999, endUnix)

                if (shouldMerge) {
                    if (rangeStart === null) {
                        rangeStart = Math.max(dayStart, startUnix)
                        lastMatchEnd = dayEnd
                    } else if (dayStart <= lastMatchEnd! + 1) {
                        lastMatchEnd = dayEnd
                    } else {
                        result.push({start: rangeStart, end: lastMatchEnd!})
                        rangeStart = Math.max(dayStart, startUnix)
                        lastMatchEnd = dayEnd
                    }
                } else {
                    result.push({
                        start: Math.max(dayStart, startUnix),
                        end: dayEnd,
                    })
                }
            } else if (shouldMerge && rangeStart !== null) {
                result.push({start: rangeStart, end: lastMatchEnd!})
                rangeStart = null
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
            currentDate.setUTCHours(0, 0, 0, 0)
        }

        if (shouldMerge && rangeStart !== null && lastMatchEnd !== null) {
            result.push({start: rangeStart, end: Math.min(lastMatchEnd, endUnix)})
        }

        return success(result)
    }

    evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
        if (this.values.length === 0) {
            return success(false)
        }

        const date = new Date(unix)
        const dayOfMonth = date.getUTCDate()

        return success(iterativeParsedValueCheck(this.values, dayOfMonth, this.minValue, this.maxValue))
    }

    override optimise(): void {
        throw new Error('Not implemented')
    }

    protected cacheValues(): void {
        this.cache = this.cacheParsedNumeric(this.values)
    }

    protected validateValue(value: ParsedNumericValue): boolean {
        return this.validateParsedNumeric(value)
    }
}
