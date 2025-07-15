import { DateTimeRange } from '../types';

export function findFirstIntersectingIndex(ranges: DateTimeRange[], newStart: number): number {
  let left = 0;
  let right = ranges.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const range = ranges[mid];

    if (range.end >= newStart) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return result;
}

export function findLastIntersectingIndex(ranges: DateTimeRange[], newEnd: number): number {
  let left = 0;
  let right = ranges.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const range = ranges[mid];

    if (range.start <= newEnd) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}