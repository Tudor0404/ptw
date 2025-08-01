import type { DateTimeRange, ISchedule, ParsedNumericValue, Result } from '../../types'
import { BlockType, MergeState } from '../../types'
import { parsedNumericValuesToString } from '../../utils/formatting'
import { success } from '../../utils/result'
import { iterativeParsedValueCheck } from '../../utils/value'
import Field from './Field'

/**
 * Month constraints. Values: 1=January, 12=December.
 */
export default class MonthField extends Field<ParsedNumericValue> {
  /**
   * @param values - Array of month constraints (1=January, 12=December)
   */
  constructor(values: ParsedNumericValue[] = []) {
    super(values, 1, 12, 2, BlockType.FIELD_MONTH)
  }

  /**
   * Returns string representation of month field.
   * @returns String like "M[6..8]" or "M[1,12]"
   */
  toString(): string {
    if (this.values.length === 0) {
      return 'M[]'
    }
    return `M[${parsedNumericValuesToString(this.values)}]`
  }

  /**
   * Creates a deep copy with same month constraints.
   * @returns New MonthField instance
   */
  clone(): MonthField {
    return new MonthField([...this.values])
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

    if (this.cache !== null && this.cache[0] === 0xFFF) {
      return success([{ start: startUnix, end: endUnix }])
    }

    const activeMonths = this.getActiveParsedNumeric(this.values)
    const result: DateTimeRange[] = []

    const startDate = new Date(startUnix)
    const endDate = new Date(endUnix)

    const startMonthIdx = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth()
    const endMonthIdx = endDate.getUTCFullYear() * 12 + endDate.getUTCMonth()

    let rangeStart: number | null = null
    let prevMonthEnd: number | null = null

    for (let monthIdx = startMonthIdx; monthIdx <= endMonthIdx; monthIdx++) {
      const year = Math.floor(monthIdx / 12)
      const month = monthIdx % 12

      const isMonthActive = activeMonths[month]

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1))
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0))

      const monthStart = Math.max(firstDayOfMonth.getTime(), startUnix)
      const monthEnd = Math.min(
        Date.UTC(year, month, lastDayOfMonth.getUTCDate(), 23, 59, 59, 999),
        endUnix,
      )

      if (monthEnd < startUnix || monthStart > endUnix) {
        continue
      }

      if (isMonthActive) {
        if (shouldMerge) {
          if (rangeStart === null) {
            rangeStart = monthStart
          }
          prevMonthEnd = monthEnd
        }
        else {
          result.push({
            start: monthStart,
            end: monthEnd,
          })
        }
      }
      else if (shouldMerge && rangeStart !== null) {
        result.push({
          start: rangeStart,
          end: prevMonthEnd!,
        })
        rangeStart = null
      }
    }

    if (shouldMerge && rangeStart !== null && prevMonthEnd !== null) {
      result.push({
        start: rangeStart,
        end: prevMonthEnd,
      })
    }

    return success(result)
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.values.length === 0) {
      return success(false)
    }

    const month = new Date(unix).getUTCMonth() + 1
    return success(iterativeParsedValueCheck(this.values, month, 1, 12))
  }

  protected cacheValues(): void {
    this.cache = this.cacheParsedNumeric(this.values)
  }

  protected validateValue(value: ParsedNumericValue): boolean {
    return this.validateParsedNumeric(value)
  }
}
