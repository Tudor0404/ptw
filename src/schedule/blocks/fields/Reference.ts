import { DateTimeRange, IBlock, ISchedule, MergeState, Result } from '../../../types';
import { ReferenceError, EvaluationError } from '../../../errors';
import { generateHash } from '../../../utils/hash';
import { success, fail } from '../../../utils/result';

export default class Reference implements IBlock {
  private id: string;
  private merge: MergeState = MergeState.DEFAULT;
  private _cachedHash: string | null = null;

  constructor(id: string) {
    this.id = id;
  }

  setId(id: string) {
    this.id = id;
    this._invalidateHash();
  }

  getId(): string {
    return this.id;
  }

  setMerge(state: MergeState): void {
    this.merge = state;
    this._invalidateHash();
  }

  getMerge(): MergeState {
    return this.merge;
  }

  toString(): string {
    return `REF[${this.id}]`;
  }

  getHash(): string {
    if (this._cachedHash === null) {
      const baseString = `Reference:${this.merge}:${this.id}`;
      this._cachedHash = generateHash(baseString);
    }
    return this._cachedHash!;
  }

  private _invalidateHash(): void {
    this._cachedHash = null;
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (!schedule) {
      return fail(new ReferenceError(this.id, {
        reason: 'No schedule provided for reference resolution',
        className: 'Reference',
      }));
    }

    const referenced = schedule.expressions.get(this.id);

    if (referenced === null || referenced?.block === undefined) {
      return fail(new ReferenceError(this.id, {
        reason: 'Referenced expression not found',
        className: 'Reference',
      }));
    }

    return referenced.block.evaluateTimestamp(unix, schedule);
  }

  clone(): Reference {
    return new Reference(this.id);
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error> {
    if (!schedule) {
      return fail(new ReferenceError(this.id, {
        reason: 'No schedule provided for reference resolution',
        className: 'Reference',
      }));
    }

    const referenced = schedule.expressions.get(this.id);

    if (referenced === null || referenced?.block === undefined) {
      return fail(new ReferenceError(this.id, {
        reason: 'Referenced expression not found',
        className: 'Reference',
      }));
    }

    // Apply merge state decision logic
    const shouldMerge =
      this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true);

    return referenced.block.evaluate(startUnix, endUnix, schedule, shouldMerge);
  }
}
