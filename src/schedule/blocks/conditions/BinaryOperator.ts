import { DateTimeRange, IBinaryOperator, IBlock, ISchedule, MergeState, Result } from '../../../types';
import { IndexOutOfBoundsError } from '../../../errors';
import { generateHash } from '../../../utils/hash';
import { success, fail } from '../../../utils/result';

export abstract class BinaryOperator implements IBinaryOperator {
  protected blocks: IBlock[] = [];
  protected merge: MergeState = MergeState.DEFAULT;
  private _cachedHash: string | null = null;

  constructor(blocks: IBlock[] = []) {
    this.blocks = blocks;
  }

  addBlock(block: IBlock, index?: number): void {
    if (index !== undefined) {
      if (index >= 0 && index <= this.blocks.length) {
        this.blocks.splice(index, 0, block);
        this._invalidateHash();
        return;
      } else {
        throw new IndexOutOfBoundsError(
          index,
          { min: 0, max: this.blocks.length },
          { className: this.constructor.name }
        );
      }
    }

    this.blocks.push(block);
    this._invalidateHash();
  }

  abstract clone(): BinaryOperator;

  abstract evaluate(
    startUnix: number,
    endUnix: number,
    scheduleRoot?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error>;

  abstract evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error>;

  setMerge(state: MergeState): void {
    this.merge = state;
    this._invalidateHash();
  }

  getMerge(): MergeState {
    return this.merge;
  }

  abstract toString(): string;

  getHash(): string {
    if (this._cachedHash === null) {
      const blockHashes = this.blocks.map((block) => block.getHash()).join(',');
      const baseString = `${this.constructor.name}:${this.merge}:${blockHashes}`;
      this._cachedHash = generateHash(baseString);
    }
    return this._cachedHash;
  }

  getBlock(index: number): IBlock {
    if (index >= 0 && index < this.blocks.length) {
      return this.blocks[index];
    }
    throw new IndexOutOfBoundsError(
      index,
      { min: 0, max: this.blocks.length - 1 },
      { className: this.constructor.name }
    );
  }

  getBlocks(): readonly IBlock[] {
    return this.blocks;
  }

  removeBlock(index: number): boolean {
    if (index >= 0 && index < this.blocks.length) {
      this.blocks.splice(index, 1);
      this._invalidateHash();
      return true;
    }
    throw new IndexOutOfBoundsError(
      index,
      { min: 0, max: this.blocks.length - 1 },
      { className: this.constructor.name }
    );
  }

  addBlocks(blocks: readonly IBlock[]): void {
    for (const block of blocks) {
      this.addBlock(block);
    }
  }

  protected _invalidateHash(): void {
    this._cachedHash = null;
  }
}
