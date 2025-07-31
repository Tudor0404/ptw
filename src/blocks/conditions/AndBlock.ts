import type { DateTimeRange, IBlock, ISchedule, Result } from '../../types'
import { BlockType, MergeState } from '../../types'
import { success } from '../../utils/result'
import { sweepLineIntersection } from '../../utils/sweepLine'
import { BinaryOperator } from './BinaryOperator'

/**
 * Logical AND condition requiring all child blocks to be true.
 */
export default class AndOperator extends BinaryOperator {
  /**
   * @param blocks - Array of blocks that must all be true
   */
  constructor(blocks: IBlock[] = []) {
    super(blocks, BlockType.CONDITION_AND)
  }

  /**
   * Returns string representation of the AND operation.
   * @returns String like "(block1 AND block2)"
   */
  toString(): string {
    if (this.blocks.length === 0) {
      return 'AND()'
    }
    const blocksStr = this.blocks.map(b => b.toString()).join(' AND ')
    return `(${blocksStr})`
  }

  /**
   * Creates a deep copy with cloned child blocks.
   * @returns New AndOperator instance
   */
  clone(): AndOperator {
    return new AndOperator(this.blocks.map(b => b.clone()))
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean,
  ): Result<DateTimeRange[], Error> {
    if (this.blocks.length === 0) {
      return success([])
    }

    const shouldMerge
            = this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true)

    const blockResults: DateTimeRange[][] = []

    for (const block of this.blocks.toSorted((b1, b2) => b1.blockGroup - b2.blockGroup)) {
      const result = block.evaluate(startUnix, endUnix, schedule, merge)
      if (!result.ok) {
        return result
      }
      if (result.value.length === 0) {
        return success([])
      }
      blockResults.push(result.value)
    }

    return success(sweepLineIntersection(blockResults, shouldMerge))
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (this.blocks.length === 0) {
      return success(true)
    }

    for (const block of this.blocks.toSorted((b1, b2) => b1.blockGroup - b2.blockGroup)) {
      const result = block.evaluateTimestamp(unix, schedule)
      if (!result.ok) {
        return result
      }
      if (!result.value) {
        return success(false)
      }
    }

    return success(true)
  }
}
