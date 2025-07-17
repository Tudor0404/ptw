import type {DateTimeRange, IBlock, ISchedule, Result} from '../../types'
import {BlockType, MergeState} from '../../types'
import {success} from '../../utils/result'
import {sweepLineComplement} from '../../utils/sweepLine'
import UnaryOperator from './UnaryOperator'

export default class NotBlock extends UnaryOperator {
    constructor(block?: IBlock) {
        super(block, BlockType.ConditionNot)
    }

    toString(): string {
        if (!this.block) {
            return 'NOT()'
        }
        return `NOT(${this.block.toString()})`
    }

    clone(): NotBlock {
        return new NotBlock(this.block?.clone())
    }

    evaluate(
        startUnix: number,
        endUnix: number,
        schedule?: ISchedule,
        merge?: boolean,
    ): Result<DateTimeRange[], Error> {
        if (!this.block) {
            return success([{start: startUnix, end: endUnix}])
        }

        const shouldMerge
            = this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true)

        const blockResult = this.block.evaluate(startUnix, endUnix, schedule, merge)

        if (!blockResult.ok) {
            return blockResult
        }

        if (blockResult.value.length === 0) {
            return success([{start: startUnix, end: endUnix}])
        }

        return success(sweepLineComplement(blockResult.value, startUnix, endUnix, shouldMerge))
    }

    evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
        if (!this.block) {
            return success(true)
        }

        const blockResult = this.block.evaluateTimestamp(unix, schedule)
        if (!blockResult.ok) {
            return blockResult
        }

        return success(!blockResult.value)
    }
}
