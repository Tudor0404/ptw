import type {Result} from './utils/result'

export type {Result}

/**
 * Date range using Date objects.
 */
export interface DateObjectRange {
    dateStart: Date
    dateEnd: Date
}

/**
 * Time range as Unix timestamps in milliseconds.
 */
export interface DateTimeRange {
    /** Start time as Unix timestamp in milliseconds */
    start: number
    /** End time as Unix timestamp in milliseconds (inclusive) */
    end: number
}

/**
 * Controls merging of adjacent/overlapping time ranges.
 */
export enum MergeState {
    /** Use the default merge behavior for the context */
    DEFAULT,
    /** Force merging of adjacent/overlapping ranges */
    EXPLICIT_ON,
    /** Prevent merging, keep ranges separate */
    EXPLICIT_OFF,
}

export enum BlockType {
    ConditionAnd,
    ConditionOr,
    ConditionNot,
    FieldDate,
    FieldDateTime,
    FieldMonthDay,
    FieldMonth,
    Reference,
    FieldTime,
    FieldWeekDay,
    FieldYear,
}

export enum BlockGroup { Field, Condition, Reference } // keep it in this order (least computationally expensive on the left)

/**
 * Flexible time input: [hour] to [hour, minute, second, millisecond].
 */
export type UserTimeInput =
    | [hour: number]
    | [hour: number, minute: number]
    | [hour: number, minute: number, second: number]
    | [hour: number, minute: number, second: number, millisecond: number]

/**
 * Flexible date-time input: [year] to [year, month, day, hour, minute, second, millisecond].
 */
export type UserDateTimeInput =
    | [year: number]
    | [year: number, month: number]
    | [year: number, month: number, day: number]
    | [year: number, month: number, day: number, hour: number]
    | [year: number, month: number, day: number, hour: number, minute: number]
    | [year: number, month: number, day: number, hour: number, minute: number, second: number]
    | [
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
]

export interface NumberValue {
    type: 'Number'
    value: number
}

export interface RangeValue {
    type: 'Range'
    start: number
    end: number
}

export interface AlgebraicValue {
    type: 'Algebraic'
    coefficientN: number
    operator: '+' | '-'
    constantY: number
}

export type ParsedNumericValue = NumberValue | RangeValue | AlgebraicValue

export type ReferenceId = string

export interface IBlock {
    blockType: BlockType
    blockGroup: BlockGroup

    evaluate: (
        startUnix: number,
        endUnix: number,
        schedule?: ISchedule,
        merge?: boolean,
    ) => Result<DateTimeRange[], Error>

    evaluateTimestamp: (unix: number, schedule?: ISchedule) => Result<boolean, Error>

    toString: () => string

    clone: () => IBlock

    getHash: () => string
}

export interface IBinaryOperator extends IBlock {
    addBlock: (block: IBlock, index?: number) => void

    addBlocks: (blocks: readonly IBlock[]) => void

    removeBlock: (index: number) => void

    getBlock: (index: number) => IBlock

    getBlocks: () => readonly IBlock[]
}

export interface IUnaryOperator extends IBlock {
    setBlock: (block: IBlock) => void

    getBlock: () => IBlock | null

    clearBlock: () => void
}

export interface IField<V> extends IBlock {
    addValue: (value: V, index?: number) => void

    addValues: (values: readonly V[]) => void

    removeValue: (index: number) => void

    getValue: (index: number) => V

    getValues: () => readonly V[]
}

export interface ISchedule {
    expressions: Map<ReferenceId, { block: IBlock, name: string | null }>

    getExpression: (id: ReferenceId) => IBlock | undefined

    setExpression: (id: ReferenceId, name: string | null, block: IBlock, overwrite?: boolean) => Result<boolean, Error>

    removeExpression: (id: ReferenceId) => boolean

    getAllExpressions: () => Map<ReferenceId, { block: IBlock, name: string | null }>

    evaluate: (
        id: ReferenceId,
        domainStart: number | Date,
        domainEnd: number | Date,
    ) => Result<DateTimeRange[], Error>

    evaluateTimestamp: (
        id: ReferenceId,
        timestamp: number | Date,
    ) => Result<boolean, Error>
}
