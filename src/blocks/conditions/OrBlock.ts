import type {DateTimeRange, IBlock, ISchedule, Result} from '../../types'
import {BlockType, MergeState} from '../../types'
import {success} from '../../utils/result'
import {sweepLineUnion} from '../../utils/sweepLine'
import {BinaryOperator} from './BinaryOperator'

export default class OrBlock extends BinaryOperator {
    constructor(blocks: IBlock[] = []) {
        super(blocks, BlockType.ConditionOr)
    }

    toString(): string {
        if (this.blocks.length === 0) {
            return 'OR()'
        }
        const blocksStr = this.blocks.map(b => b.toString()).join(' OR ')
        return `(${blocksStr})`
    }

    clone(): OrBlock {
        return new OrBlock(this.blocks.map(b => b.clone()),
        )
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
            if (result.value.length > 0) {
                blockResults.push(result.value)
            }
        }

        if (blockResults.length === 0) {
            return success([])
        }

        return success(sweepLineUnion(blockResults, shouldMerge))
    }

    evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
        if (this.blocks.length === 0) {
            return success(false)
        }

        for (const block of this.blocks) {
            const result = block.evaluateTimestamp(unix, schedule)
            if (!result.ok) {
                return result
            }
            if (result.value) {
                return success(true)
            }
        }

        return success(false)
    }
}
