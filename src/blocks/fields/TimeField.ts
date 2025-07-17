import type {DateTimeRange, ISchedule, Result} from '../../types'
import {BlockType, MergeState} from '../../types'
import {IndexOutOfBoundsError, NotImplementedError, ValidationError} from '../../errors'
import {success} from '../../utils/result'
import {createMilitaryTimeString} from '../../utils/value'
import Field from './Field'

export default class TimeField extends Field<DateTimeRange> {
    constructor(values: DateTimeRange[] = []) {
        super(values, 0, 86399999, 0, BlockType.FieldTime)
    }

    override addValue(value: DateTimeRange, index?: number): void {
        if (!this.validateValue(value)) {
            throw new ValidationError(
                'Provided value is out of bounds',
                value,
                {min: this.minValue, max: this.maxValue},
                {className: 'TimeField'},
            )
        }

        if (index !== undefined) {
            if (index >= 0 && index <= this.values.length) {
                this.values.splice(index, 0, value)
                return
            } else {
                throw new IndexOutOfBoundsError(
                    index,
                    {min: 0, max: this.values.length},
                    {className: 'TimeField'},
                )
            }
        }

        this.values.push(value)
    }

    override removeValue(index: number): void {
        if (index >= 0 && index < this.values.length) {
            this.values.splice(index, 1)
            return
        }
        throw new IndexOutOfBoundsError(
            index,
            {min: 0, max: this.values.length - 1},
            {className: 'TimeField'},
        )
    }

    toString(): string {
        if (this.values.length === 0) {
            return 'T[]'
        }
        const rangesStr = this.values
            .map(
                range =>
                    `${createMilitaryTimeString(range.start)}..${createMilitaryTimeString(range.end)}`,
            )
            .join(',')
        return `T[${rangesStr}]`
    }

    clone(): TimeField {
        return new TimeField([...this.values])
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

        const processedTimeRanges = shouldMerge ? Field.getOptimizedRanges(this.values) : this.values

        if (processedTimeRanges.length === 0) {
            return success([])
        }

        if (processedTimeRanges[0].start === 0 && processedTimeRanges[0].end === this.maxValue) {
            return success([{start: startUnix, end: endUnix}])
        }

        const result: DateTimeRange[] = []

        const startDate = new Date(startUnix)
        const endDate = new Date(endUnix)

        const currentDate = new Date(
            Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
        )

        while (currentDate.getTime() <= endDate.getTime()) {
            const dayStart = currentDate.getTime()

            for (const timeRange of processedTimeRanges) {
                let rangeStart = dayStart + timeRange.start
                let rangeEnd = dayStart + timeRange.end

                if (rangeEnd >= startUnix && rangeStart <= endUnix) {
                    // Clip ranges to domain
                    rangeStart = Math.max(rangeStart, startUnix)
                    rangeEnd = Math.min(rangeEnd, endUnix)

                    if (shouldMerge) {
                        // Merging path: combine adjacent/overlapping ranges
                        if (result.length > 0) {
                            const lastRange = result[result.length - 1]

                            // If this range starts right after the last one ends (or overlaps)
                            if (rangeStart <= lastRange.end + 1) {
                                // Extend the last range
                                lastRange.end = Math.max(lastRange.end, rangeEnd)
                                continue
                            }
                        }
                    }

                    // Non-merging path or new separate range for merging path
                    result.push({
                        start: rangeStart,
                        end: rangeEnd,
                    })
                }
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1)
        }

        return success(result)
    }

    evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
        if (this.values.length === 0) {
            return success(false)
        }

        const timeOfDay = unix % 86400000

        for (const range of this.values) {
            if (timeOfDay >= range.start && timeOfDay <= range.end) {
                return success(true)
            }
        }

        return success(false)
    }

    optimise(): void {
        throw new NotImplementedError('optimise', 'TimeField')
    }

    protected validateValue(value: DateTimeRange): boolean {
        return (
            value.start >= this.minValue
            && value.end <= this.maxValue
            && value.start < value.end
            && Number.isInteger(value.start)
            && Number.isInteger(value.end)
        )
    }
}
