import type { DateTimeRange, ISchedule, ParsedNumericValue, Result } from '../../types'
import { BlockType, MergeState } from '../../types'
import { parsedNumericValuesToString } from '../../utils/formatting'
import { success } from '../../utils/result'
import { iterativeParsedValueCheck } from '../../utils/value'
import Field from './Field'

/**
 * Year constraints. Values: any integer year (-9999 to 9999).
 */
export default class YearField extends Field<ParsedNumericValue> {
  /**
   * @param values - Array of year constraints
   */
  constructor(values: ParsedNumericValue[] = []) {
    super(values, -9999, 9999, 0, BlockType.FIELD_YEAR)
  }

  override addValue(value: ParsedNumericValue, index?: number): void {
    if (!this.validateValue(value)) {
      throw new Error('Provided value is out of bounds.')
    }

    if (index) {
      if (index >= 0 && index < this.values.length) {
        this.values.splice(index, 0, value)
      }
      else {
        throw new RangeError('Provided index is out of bounds')
      }
    }

    this.values.push(value)
  }

  override removeValue(index: number): void {
    if (index >= 0 && index < this.values.length) {
      this.values.splice(index, 1)
      return
    }
    throw new RangeError('index is out of bounds')
  }

  /**
   * Returns string representation of year field.
   * @returns String like "Y[2023..2025]" or "Y[2023,2024]"
   */
  toString(): string {
    if (this.values.length === 0) {
      return 'Y[]'
    }
    return `Y[${parsedNumericValuesToString(this.values)}]`
  }

  /**
   * Creates a deep copy with same year constraints.
   * @returns New YearField instance
   */
  clone(): YearField {
    return new YearField([...this.values])
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.values.length === 0) {
      return success(false)
    }

    const year = new Date(unix).getFullYear()

    return success(iterativeParsedValueCheck(this.values, year, year - 1, year + 1))
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

    const result: DateTimeRange[] = []

    const startDate = new Date(startUnix)
    const endDate = new Date(endUnix)
    const startYear = startDate.getUTCFullYear()
    const endYear = endDate.getUTCFullYear()

    let rangeStart: number | null = null
    let prevYearEnd: number | null = null

    for (let year = startYear; year <= endYear; year++) {
      const isYearActive = iterativeParsedValueCheck(this.values, year, 1, 9999)

      const yearStart = Math.max(Date.UTC(year, 0, 1), startUnix)
      const yearEnd = Math.min(Date.UTC(year, 11, 31, 23, 59, 59, 999), endUnix)

      if (isYearActive) {
        if (shouldMerge) {
          if (rangeStart === null) {
            rangeStart = yearStart
          }
          prevYearEnd = yearEnd
        }
        else {
          result.push({
            start: yearStart,
            end: yearEnd,
          })
        }
      }
      else if (shouldMerge && rangeStart !== null) {
        result.push({
          start: rangeStart,
          end: prevYearEnd!,
        })
        rangeStart = null
      }
    }

    if (shouldMerge && rangeStart !== null && prevYearEnd !== null) {
      result.push({
        start: rangeStart,
        end: prevYearEnd,
      })
    }

    return success(result)
  }

  protected validateValue(value: ParsedNumericValue): boolean {
    return this.validateParsedNumeric(value)
  }
}
