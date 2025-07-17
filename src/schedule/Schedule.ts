import type {DateTimeRange, IBlock, ISchedule, ReferenceId} from '../types'
import type {CacheOptions} from './ScheduleCache'
import ScheduleCache from './ScheduleCache'
import {ValidationError} from '../errors'

export default class Schedule implements ISchedule {
    expressions: Map<ReferenceId, { block: IBlock, name: string | null }> = new Map()
    private cache: ScheduleCache

    constructor(cacheOptions?: CacheOptions) {
        this.cache = new ScheduleCache(cacheOptions)
    }

    getExpression(id: ReferenceId): IBlock | undefined {
        return this.expressions.get(id)?.block
    }

    setExpression(
        id: ReferenceId,
        name: string | null,
        block: IBlock,
        overwrite: boolean = true,
    ): void {
        if (!overwrite && this.expressions.has(id)) {
            throw new ValidationError(
                `Expression with id '${id}' already exists and overwrite is false`,
                id,
                undefined,
                {className: 'Schedule'},
            )
        }

        this.expressions.set(id, {block, name})
    }

    removeExpression(id: ReferenceId): boolean {
        return this.expressions.delete(id)
    }

    getAllExpressions(): Map<ReferenceId, { block: IBlock, name: string | null }> {
        return new Map(this.expressions)
    }

    evaluateExpression(
        id: ReferenceId,
        domainStart: number | Date,
        domainEnd: number | Date,
        cacheAfter: boolean = true,
    ): DateTimeRange[] {
        const expression = this.expressions.get(id)
        if (!expression) {
            throw new ValidationError(`Expression with id '${id}' not found`, id, undefined, {
                className: 'Schedule',
            })
        }

        const startUnix = typeof domainStart === 'number' ? domainStart : domainStart.getTime()
        const endUnix = typeof domainEnd === 'number' ? domainEnd : domainEnd.getTime()

        const cachedResult = this.cache.get(expression.block, startUnix, endUnix)
        if (cachedResult !== null) {
            return cachedResult
        }

        const result = expression.block.evaluate(startUnix, endUnix, this)

        if (!result.ok) {
            throw result.error
        }

        const ranges = result.value

        if (cacheAfter && this.cache.maxRangesPerEntry >= ranges.length) {
            this.cache.set(expression.block, startUnix, endUnix, ranges)
        }

        return ranges
    }
}
