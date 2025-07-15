import { DateTimeRange, ISchedule, MergeState, Result } from '../../../types';
import UnaryOperator from './UnaryOperator';
import { sweepLineComplement } from '../../../utils/sweepLine';
import { success, fail } from '../../../utils/result';

export default class NotBlock extends UnaryOperator {
  toString(): string {
    if (!this.block) {
      return 'NOT()';
    }
    return `NOT(${this.block.toString()})`;
  }

  clone(): NotBlock {
    return new NotBlock(this.block?.clone());
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error> {
    if (!this.block) {
      return success([{ start: startUnix, end: endUnix }]);
    }

    const shouldMerge =
      this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true);

    const blockResult = this.block.evaluate(startUnix, endUnix, schedule, merge);

    if (!blockResult.ok) {
      return blockResult;
    }

    if (blockResult.value.length === 0) {
      return success([{ start: startUnix, end: endUnix }]);
    }

    return success(sweepLineComplement(blockResult.value, startUnix, endUnix, shouldMerge));
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (!this.block) {
      return success(true);
    }

    const blockResult = this.block.evaluateTimestamp(unix, schedule);
    if (!blockResult.ok) {
      return blockResult;
    }

    return success(!blockResult.value);
  }
}
