import { DateTimeRange, ISchedule, MergeState, Result } from '../../../types';
import { BinaryOperator } from './BinaryOperator';
import { sweepLineUnion } from '../../../utils/sweepLine';
import { success, fail } from '../../../utils/result';

export default class OrBlock extends BinaryOperator {
  toString(): string {
    if (this.blocks.length === 0) {
      return 'OR()';
    }
    const blocksStr = this.blocks.map((b) => b.toString()).join(' OR ');
    return `(${blocksStr})`;
  }

  clone(): OrBlock {
    return new OrBlock(this.blocks.map((b) => b.clone()));
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
      if (result.value.length > 0) {
        blockResults.push(result.value);
      }
    }

    if (blockResults.length === 0) {
      return success([]);
    }

    return success(sweepLineUnion(blockResults, shouldMerge));
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.blocks.length === 0) {
      return success(false);
    }

    for (const block of this.blocks) {
      const result = block.evaluateTimestamp(unix, schedule);
      if (!result.ok) {
        return result;
      }
      if (result.value) {
        return success(true);
      }
    }

    return success(false);
  }
}
