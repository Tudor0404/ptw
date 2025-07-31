import type { DateTimeRange, ISchedule, Result } from '../../types'
import { IndexOutOfBoundsError, ValidationError } from '../../errors'
import { BlockType, MergeState } from '../../types'
import { success } from '../../utils/result'
import { createMilitaryTimeString } from '../../utils/value'
import Field from './Field'

/**
 * Represents time-of-day constraints. Times are milliseconds from midnight (0-86399999).
 */
export default class TimeField extends Field<DateTimeRange> {
  /**
   * @param values - Array of time ranges (milliseconds from midnight)
   */
  constructor(values: DateTimeRange[] = []) {
    super(values, 0, 86399999, 0, BlockType.FIELD_TIME)
  }

  /**
   * Adds a time range to this field.
   * @param value - Time range (milliseconds from midnight)
   * @param index - Optional insertion position
   * @throws {ValidationError} Invalid time range
   * @throws {IndexOutOfBoundsError} Invalid index
   */
  override addValue(value: DateTimeRange, index?: number): void {
    if (!this.validateValue(value)) {
      throw new ValidationError(
        'Provided value is out of bounds',
        value,
        { min: this.minValue, max: this.maxValue },
        { className: 'TimeField' },
      )
    }

    if (index !== undefined) {
      if (index >= 0 && index <= this.values.length) {
        this.values.splice(index, 0, value)
        return
      }
      else {
        throw new IndexOutOfBoundsError(
          index,
          { min: 0, max: this.values.length },
          { className: 'TimeField' },
        )
      }
    }

    this.values.push(value)
  }

  /**
   * Removes a time range at the specified index.
   * @param index - Zero-based index
   * @throws {IndexOutOfBoundsError} Invalid index
   */
  override removeValue(index: number): void {
    if (index >= 0 && index < this.values.length) {
      this.values.splice(index, 1)
      return
    }
    throw new IndexOutOfBoundsError(
      index,
      { min: 0, max: this.values.length - 1 },
      { className: 'TimeField' },
    )
  }

  /**
   * Returns string representation in military time format.
   * @returns String like "T[09:00:00..17:00:00]"
   */
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

  /**
   * Creates a deep copy of this TimeField.
   * @returns New TimeField with same time ranges
   */
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
      return success([{ start: startUnix, end: endUnix }])
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
