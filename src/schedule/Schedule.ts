import type {DateTimeRange, IBlock, ISchedule, ReferenceId, Result} from '../types'
import type {CacheOptions} from './ScheduleCache'
import ScheduleCache from './ScheduleCache'
import {InvalidIDError, ValidationError} from '../errors'
import {fail, success} from "../utils/result";

/**
 * Main class for managing and evaluating temporal expressions.
 */
export default class Schedule implements ISchedule {
    /** Map of expression IDs to their corresponding blocks and human-readable names */
    expressions: Map<ReferenceId, { block: IBlock, name: string | null }> = new Map()
    private cache: ScheduleCache

    /**
     * @param cacheOptions - Optional cache configuration
     */
    constructor(cacheOptions?: CacheOptions) {
        this.cache = new ScheduleCache(cacheOptions)
    }

    /**
     * Retrieves a stored expression block by ID.
     * @param id - Expression identifier
     * @returns The expression block or undefined
     */
    getExpression(id: ReferenceId): IBlock | undefined {
        return this.expressions.get(id)?.block
    }

    /**
     * Stores an expression block with a unique ID.
     * @param id - Unique identifier
     * @param name - Human-readable name (optional)
     * @param block - Expression block
     * @param overwrite - Whether to overwrite existing (default: true)
     */
    setExpression(
        id: ReferenceId,
        name: string | null,
        block: IBlock,
        overwrite: boolean = true,
    ): Result<boolean, Error> {
        if (!/^[a-zA-Z0-9]+$/.test(id)) {
            return fail(new InvalidIDError("The id of an expression must be made up of numbers and letters only."))
        }


        if (!overwrite && this.expressions.has(id)) {
            return fail(new ValidationError(
                `Expression with id '${id}' already exists and overwrite is false`,
                id,
                undefined,
                {className: 'Schedule'},
            ))
        }

        this.expressions.set(id, {block, name})

        return success(true);
    }

    /**
     * Removes an expression from the schedule.
     * @param id - Expression identifier
     * @returns true if removed, false if not found
     */
    removeExpression(id: ReferenceId): boolean {
        return this.expressions.delete(id)
    }

    /**
     * Gets a copy of all stored expressions.
     * @returns Map of expression IDs to {block, name}
     */
    getAllExpressions(): Map<ReferenceId, { block: IBlock, name: string | null }> {
        return new Map(this.expressions)
    }

    /**
     * Tests if a timestamp matches the expression.
     * @param id - Expression identifier
     * @param timestamp - Unix milliseconds or Date object
     * @returns Result<boolean, Error>
     * @throws {ValidationError} When expression ID not found
     */
    evaluateTimestamp(id: ReferenceId, timestamp: number | Date): Result<boolean, Error> {
        const expression = this.expressions.get(id)
        if (!expression) {
            throw new ValidationError(`Expression with id '${id}' not found`, id, undefined, {
                className: 'Schedule',
            })
        }

        const timestampUnix = typeof timestamp === 'number' ? timestamp : timestamp.getTime();

        return expression.block.evaluateTimestamp(timestampUnix, this);
    }

    /**
     * Evaluates an expression over a time domain. Sending a list of unix timestamps where the schedule is valid
     * @param id - Expression identifier
     * @param domainStart - Start time (Unix ms or Date)
     * @param domainEnd - End time (Unix ms or Date)
     * @param cacheAfter - Cache result (default: true)
     * @returns Result<DateTimeRange[], Error>
     */
    evaluate(
        id: ReferenceId,
        domainStart: number | Date,
        domainEnd: number | Date,
        cacheAfter: boolean = true,
    ): Result<DateTimeRange[], Error> {
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
            return success(cachedResult)
        }

        const result = expression.block.evaluate(startUnix, endUnix, this)

        if (!result.ok) {
            return fail(result.error)
        }

        const ranges = result.value

        if (cacheAfter && this.cache.maxRangesPerEntry >= ranges.length) {
            this.cache.set(expression.block, startUnix, endUnix, ranges)
        }

        return success(ranges)
    }
}
