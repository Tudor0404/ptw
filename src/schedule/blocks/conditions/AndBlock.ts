import { BinaryOperator } from './BinaryOperator';
import { DateTimeRange, ISchedule, MergeState, Result } from '../../../types';
import { sweepLineIntersection } from '../../../utils/sweepLine';
import { success, fail } from '../../../utils/result';

export default class AndOperator extends BinaryOperator {
  toString(): string {
    if (this.blocks.length === 0) {
      return 'AND()';
    }
    const blocksStr = this.blocks.map((b) => b.toString()).join(' AND ');
    return `(${blocksStr})`;
  }

  clone(): AndOperator {
    return new AndOperator(this.blocks.map((b) => b.clone()));
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error> {
    if (this.blocks.length === 0) {
      return success([]);
    }

    const shouldMerge =
      this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true);

    const blockResults: DateTimeRange[][] = [];

    for (const block of this.blocks) {
      const result = block.evaluate(startUnix, endUnix, schedule, merge);
      if (!result.ok) {
        return result;
      }
      if (result.value.length === 0) {
        return success([]);
      }
      blockResults.push(result.value);
    }

    return success(sweepLineIntersection(blockResults, shouldMerge));
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.blocks.length === 0) {
      return success(true);
    }

    for (const block of this.blocks) {
      const result = block.evaluateTimestamp(unix, schedule);
      if (!result.ok) {
        return result;
      }
      if (!result.value) {
        return success(false);
      }
    }

    return success(true);
  }
}
