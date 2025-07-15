import { EvaluationError } from './errors';
import { Result } from './utils/result';

export type { Result };

export type DateObjectRange = {
  dateStart: Date;
  dateEnd: Date;
};

export type DateTimeRange = {
  start: number; // Milliseconds from midnight
  end: number; // Milliseconds from midnight, inclusive end
};

export enum MergeState {
  DEFAULT,
  EXPLICIT_ON,
  EXPLICIT_OFF,
}

export type UserTimeInput =
  | [hour: number]
  | [hour: number, minute: number]
  | [hour: number, minute: number, second: number]
  | [hour: number, minute: number, second: number, millisecond: number];

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
];

export type NumberValue = { type: 'Number'; value: number };
export type RangeValue = { type: 'Range'; start: number; end: number };
export type AlgebraicValue = {
  type: 'Algebraic';
  coefficientN: number;
  operator: '+' | '-';
  constantY: number;
};
export type ParsedNumericValue = NumberValue | RangeValue | AlgebraicValue;

export type ReferenceId = string;

export interface IBlock {
  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean,
  ): Result<DateTimeRange[], Error>;

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error>;

  toString(): string;

  clone(): IBlock;

  getHash(): string;
}

export interface IBinaryOperator extends IBlock {
  addBlock(block: IBlock, index?: number): void;

  addBlocks(blocks: readonly IBlock[]): void;

  removeBlock(index: number): void;

  getBlock(index: number): IBlock;

  getBlocks(): readonly IBlock[];
}

export interface IUnaryOperator extends IBlock {
  setBlock(block: IBlock): void;

  getBlock(): IBlock | null;

  clearBlock(): void;
}

export interface IField<V> extends IBlock {
  optimise(): void;

  addValue(value: V, index?: number): void;

  addValues(values: readonly V[]): void;

  removeValue(index: number): void;

  getValue(index?: number): V;

  getValues(): readonly V[];
}

export interface ISchedule {
  expressions: Map<ReferenceId, { block: IBlock; name: string | null }>;

  getExpression(id: ReferenceId): IBlock | undefined;

  setExpression(id: ReferenceId, name: string | null, block: IBlock, overwrite?: boolean): void;

  removeExpression(id: ReferenceId): boolean;

  getAllExpressions(): Map<ReferenceId, { block: IBlock; name: string | null }>;

  evaluateExpression(
    id: ReferenceId,
    domainStart: number | Date,
    domainEnd: number | Date,
  ): DateTimeRange[];
}
