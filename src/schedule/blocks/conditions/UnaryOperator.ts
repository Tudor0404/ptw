import { DateTimeRange, IBlock, ISchedule, IUnaryOperator, MergeState, Result } from '../../../types';
import { generateHash } from '../../../utils/hash';
import { success, fail } from '../../../utils/result';

export default abstract class UnaryOperator implements IUnaryOperator {
  protected block: IBlock | null = null;
  protected merge: MergeState = MergeState.DEFAULT;
  private _cachedHash: string | null = null;

  constructor(block: IBlock | null = null) {
    this.block = block;
  }

  setMerge(state: MergeState): void {
    this.merge = state;
    this._invalidateHash();
  }

  getMerge(): MergeState {
    return this.merge;
  }

  clearBlock(): void {
    this.block = null;
    this._invalidateHash();
  }

  getBlock(): IBlock | null {
    return this.block;
  }

  setBlock(block: IBlock): void {
    this.block = block;
    this._invalidateHash();
  }

  abstract toString(): string;

  getHash(): string {
    if (this._cachedHash === null) {
      const blockHash = this.block ? this.block.getHash() : 'null';
      const baseString = `${this.constructor.name}:${this.merge}:${blockHash}`;
      this._cachedHash = generateHash(baseString);
    }
    return this._cachedHash;
  }

  abstract clone(): IBlock;

  abstract evaluate(
    domainStartUnix: number,
    domainEndUnix: number,
    schedule?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error>;

  abstract evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error>;

  protected _invalidateHash(): void {
    this._cachedHash = null;
  }
}
