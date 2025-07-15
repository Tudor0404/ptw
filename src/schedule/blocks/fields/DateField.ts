import Field from './Field';
import { DateTimeRange, ISchedule, MergeState, Result } from '../../../types';
import { findFirstIntersectingIndex, findLastIntersectingIndex } from '../../../utils/rangeIntersection';
import { success, fail } from '../../../utils/result';
import { EvaluationError } from '../../../errors';

export default class DateField extends Field<DateTimeRange> {
  constructor(values: DateTimeRange[] = []) {
    super(values, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0);
  }

  override addValue(value: DateTimeRange, index?: number): void {
    if (!this.validateValue(value)) {
      throw new Error('Provided value is out of bounds.');
    }

    if (index) {
      if (index >= 0 && index < this.values.length) {
        this.values.splice(index, 0, value);
      } else {
        throw new RangeError('Provided index is out of bounds');
      }
    }

    this.values.push(value);
  }

  override removeValue(index: number): void {
    if (index >= 0 && index < this.values.length) {
      this.values.splice(index, 1);
      return;
    }
    throw new RangeError('index is out of bounds');
  }

  toString(): string {
    if (this.values.length === 0) {
      return 'D[]';
    }
    const rangesStr = this.values.map((range) => `${range.start}..${range.end}`).join(',');
    return `D[${rangesStr}]`;
  }

  override clone(): DateField {
    return new DateField([...this.values]);
  }

  override evaluate(
    startUnix: number,
    endUnix: number,
    schedule: ISchedule | null = null,
    merge: boolean | null = null,
  ): Result<DateTimeRange[], Error> {
    if (this.values.length === 0) {
      return success([]);
    }

    const shouldMerge =
      this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true);

    let processedRanges = shouldMerge ? Field.getOptimizedRanges(this.values) : [...this.values];

    if (processedRanges.length === 0) {
      return success([]);
    }

    // Sort ranges if not merging (optimized ranges are already sorted)
    if (!shouldMerge) {
      processedRanges.sort((a, b) => a.start - b.start);
    }

    // Since the processedRanges are sorted, ensures the ranges are within domain
    if (
      processedRanges[0].start > endUnix ||
      processedRanges[processedRanges.length - 1].end < startUnix
    ) {
      return success([]);
    }

    // Remove ranges outside bounds using intersection functions
    const startIndex = findFirstIntersectingIndex(processedRanges, startUnix);
    if (startIndex === -1) {
      return success([]);
    }

    const endIndex = findLastIntersectingIndex(processedRanges, endUnix);
    if (endIndex === -1 || endIndex < startIndex) {
      return success([]);
    }

    processedRanges = processedRanges.slice(startIndex, endIndex + 1);

    // Restrict ranges to bounds
    processedRanges = processedRanges.map((range) => ({
      start: Math.max(startUnix, range.start),
      end: Math.min(endUnix, range.end),
    }));

    return success(processedRanges);
  }

  override evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.values.length === 0) {
      return success(false);
    }

    for (const range of this.values) {
      if (unix >= range.start && unix <= range.end) {
        return success(true);
      }
    }

    return success(false);
  }

  override optimise(): void {
    throw new Error('Not implemented');
  }

  protected validateValue(value: DateTimeRange): boolean {
    if (!Number.isInteger(value.start) || !Number.isInteger(value.end) || value.start > value.end) {
      return false;
    }

    const startDate = new Date(value.start);
    const endDate = new Date(value.end);

    const isStartAtMidnight =
      startDate.getUTCHours() === 0 &&
      startDate.getUTCMinutes() === 0 &&
      startDate.getUTCSeconds() === 0 &&
      startDate.getUTCMilliseconds() === 0;

    if (!isStartAtMidnight) {
      return false;
    }

    return (
      endDate.getUTCHours() === 23 &&
      endDate.getUTCMinutes() === 59 &&
      endDate.getUTCSeconds() === 59 &&
      endDate.getUTCMilliseconds() === 999
    );
  }
}
