import { DateTimeRange, ISchedule, MergeState, ParsedNumericValue, Result } from '../../../types';
import Field from './Field';
import { parsedNumericValuesToString } from '../../../utils/formatting';
import { success, fail } from '../../../utils/result';
import { EvaluationError } from '../../../errors';
import { iterativeParsedValueCheck } from '../../../utils/value';

export default class MonthField extends Field<ParsedNumericValue> {
  constructor(values: ParsedNumericValue[] = []) {
    super(values, 1, 12, 2);
  }

  toString(): string {
    if (this.values.length === 0) {
      return 'M[]';
    }
    return `M[${parsedNumericValuesToString(this.values)}]`;
  }

  clone(): MonthField {
    return new MonthField([...this.values]);
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule: ISchedule | null = null,
    merge: boolean | null = null
  ): Result<DateTimeRange[], Error> {
    if (this.values.length === 0) {
      return success([]);
    }

    const shouldMerge =
      this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true);

    if (this.cache !== null && this.cache[0] === 0xfff) {
      return success([{ start: startUnix, end: endUnix }]);
    }

    const activeMonths = this.getActiveParsedNumberic(this.values);
    const result: DateTimeRange[] = [];

    const startDate = new Date(startUnix);
    const endDate = new Date(endUnix);

    const startMonthIdx = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
    const endMonthIdx = endDate.getUTCFullYear() * 12 + endDate.getUTCMonth();

    let rangeStart: number | null = null;
    let prevMonthEnd: number | null = null;

    for (let monthIdx = startMonthIdx; monthIdx <= endMonthIdx; monthIdx++) {
      const year = Math.floor(monthIdx / 12);
      const month = monthIdx % 12;

      const isMonthActive = activeMonths[month];

      const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

      const monthStart = Math.max(firstDayOfMonth.getTime(), startUnix);
      const monthEnd = Math.min(
        Date.UTC(year, month, lastDayOfMonth.getUTCDate(), 23, 59, 59, 999),
        endUnix
      );

      if (monthEnd < startUnix || monthStart > endUnix) {
        continue;
      }

      if (isMonthActive) {
        if (shouldMerge) {
          if (rangeStart === null) {
            rangeStart = monthStart;
          }
          prevMonthEnd = monthEnd;
        } else {
          result.push({
            start: monthStart,
            end: monthEnd,
          });
        }
      } else if (shouldMerge && rangeStart !== null) {
        result.push({
          start: rangeStart,
          end: prevMonthEnd!,
        });
        rangeStart = null;
      }
    }

    if (shouldMerge && rangeStart !== null && prevMonthEnd !== null) {
      result.push({
        start: rangeStart,
        end: prevMonthEnd,
      });
    }

    return success(result);
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.values.length === 0) {
      return success(false);
    }

    const month = new Date(unix).getUTCMonth() + 1;
    return success(iterativeParsedValueCheck(this.values, month, 1, 12));
  }

  optimise(): void {
    throw new Error('Not implemented');
  }

  protected cacheValues(): void {
    this.cache = this.cacheParsedNumeric(this.values);
  }

  protected validateValue(value: ParsedNumericValue): boolean {
    return this.validateParsedNumeric(value);
  }
}
