import type { BlockType, DateTimeRange, IBlock, ISchedule, IUnaryOperator, Result } from '../../types'
import { BlockGroup, MergeState } from '../../types'
import { generateHash } from '../../utils/hash'

/**
 * Base class for operators that take a single child block (NOT).
 */
export default abstract class UnaryOperator implements IUnaryOperator {
  public blockGroup: BlockGroup = BlockGroup.CONDITION
  public blockType: BlockType
  protected block: IBlock | null = null
  protected merge: MergeState = MergeState.DEFAULT
  private _cachedHash: string | null = null

  /**
   * @param block - Child block (optional)
   * @param blockType - Type identifier for this operator
   */
  constructor(block: IBlock | null = null, blockType: BlockType) {
    this.blockType = blockType
    this.block = block
  }

  setMerge(state: MergeState): void {
    this.merge = state
    this._invalidateHash()
  }

  getMerge(): MergeState {
    return this.merge
  }

  /**
   * Removes the child block.
   */
  clearBlock(): void {
    this.block = null
    this._invalidateHash()
  }

  /**
   * Gets the current child block.
   * @returns Child block or null
   */
  getBlock(): IBlock | null {
    return this.block
  }

  /**
   * Sets the child block for this operator.
   * @param block - Block to set as child
   */
  setBlock(block: IBlock): void {
    this.block = block
    this._invalidateHash()
  }

  abstract toString(): string

  getHash(): string {
    if (this._cachedHash === null) {
      const blockHash = this.block ? this.block.getHash() : 'null'
      const baseString = `${this.constructor.name}:${this.merge}:${blockHash}`
      this._cachedHash = generateHash(baseString)
    }
    return this._cachedHash
  }

  abstract clone(): IBlock

  abstract evaluate(
    domainStartUnix: number,
    domainEndUnix: number,
    schedule?: ISchedule,
    merge?: boolean
  ): Result<DateTimeRange[], Error>

  abstract evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error>

  protected _invalidateHash(): void {
    this._cachedHash = null
  }
}
