import type { DateTimeRange, IBlock, ISchedule, Result } from '../../types'
import { ReferenceError } from '../../errors'
import { BlockGroup, BlockType, MergeState } from '../../types'
import { generateHash } from '../../utils/hash'
import { fail } from '../../utils/result'

/**
 * Reference to another expression in the schedule.
 */
export default class Reference implements IBlock {
  public blockGroup: BlockGroup = BlockGroup.REFERENCE
  public blockType: BlockType = BlockType.REFERENCE
  private id: string
  private merge: MergeState = MergeState.DEFAULT
  private _cachedHash: string | null = null

  /**
   * @param id - ID of the expression to reference
   */
  constructor(id: string) {
    this.id = id
  }

  /**
   * Sets the reference ID.
   * @param id - New reference ID
   */
  setId(id: string): void {
    this.id = id
    this._invalidateHash()
  }

  /**
   * Gets the reference ID.
   * @returns Current reference ID
   */
  getId(): string {
    return this.id
  }

  setMerge(state: MergeState): void {
    this.merge = state
    this._invalidateHash()
  }

  getMerge(): MergeState {
    return this.merge
  }

  /**
   * Returns string representation of reference.
   * @returns String like "REF[expression-id]"
   */
  toString(): string {
    return `REF[${this.id}]`
  }

  getHash(): string {
    if (this._cachedHash === null) {
      const baseString = `Reference:${this.merge}:${this.id}`
      this._cachedHash = generateHash(baseString)
    }
    return this._cachedHash!
  }

  evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error> {
    if (!schedule) {
      return fail(new ReferenceError(this.id, {
        reason: 'No schedule provided for reference resolution',
        className: 'Reference',
      }))
    }

    const referenced = schedule.expressions.get(this.id)

    if (referenced === null || referenced?.block === undefined) {
      return fail(new ReferenceError(this.id, {
        reason: 'Referenced expression not found',
        className: 'Reference',
      }))
    }

    return referenced.block.evaluateTimestamp(unix, schedule)
  }

  /**
   * Creates a deep copy with same reference ID.
   * @returns New Reference instance
   */
  clone(): Reference {
    return new Reference(this.id)
  }

  evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean,
  ): Result<DateTimeRange[], Error> {
    if (!schedule) {
      return fail(new ReferenceError(this.id, {
        reason: 'No schedule provided for reference resolution',
        className: 'Reference',
      }))
    }

    const referenced = schedule.expressions.get(this.id)

    if (referenced === null || referenced?.block === undefined) {
      return fail(new ReferenceError(this.id, {
        reason: 'Referenced expression not found',
        className: 'Reference',
      }))
    }

    const shouldMerge
            = this.merge !== MergeState.DEFAULT ? this.merge === MergeState.EXPLICIT_ON : (merge ?? true)

    return referenced.block.evaluate(startUnix, endUnix, schedule, shouldMerge)
  }

  private _invalidateHash(): void {
    this._cachedHash = null
  }
}
