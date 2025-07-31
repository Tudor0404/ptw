import type { BlockType, DateTimeRange, IBlock, IField, ISchedule, ParsedNumericValue, Result } from '../../types'
import { IndexOutOfBoundsError, ValidationError } from '../../errors'
import { BlockGroup, MergeState } from '../../types'
import { updateAlgebraicBitmap, updateBitmap } from '../../utils/cache'
import { generateHash } from '../../utils/hash'
import { checkAlgebraic, iterativeParsedValueCheck } from '../../utils/value'

/**
 * Base class for all field types that match against specific values or ranges.
 */
export default abstract class Field<V> implements IField<V> {
  public blockGroup: BlockGroup = BlockGroup.FIELD
  public blockType: BlockType
  protected cache: Uint8Array | null = null
  protected values: V[] = []
  protected merge: MergeState = MergeState.DEFAULT
  protected cacheSize: number
  protected minValue: number
  protected maxValue: number
  private _cachedHash: string | null = null

  /**
   * @param values - Array of values for this field
   * @param minValue - Minimum allowed value
   * @param maxValue - Maximum allowed value
   * @param cache_size - Cache size for optimization
   * @param blockType - Type identifier for this block
   */
  constructor(
        values: V[] = [],
        minValue: number = 0,
        maxValue: number = Number.MAX_SAFE_INTEGER,
        cache_size: number = 0,
        blockType: BlockType,
  ) {
    this.cacheSize = cache_size
    this.minValue = minValue
    this.maxValue = maxValue
    for (const value of values) {
      if (!this.validateValue(value)) {
        throw new ValidationError(
          'One or more of the provided values are out of bounds',
          value,
          { min: this.minValue, max: this.maxValue },
          { className: this.constructor.name },
        )
      }
    }

    this.values = values
    this.cacheValues()
    this._invalidateHash()
    this.blockType = blockType
  }

  protected static getOptimizedRanges(values: DateTimeRange[]): DateTimeRange[] {
    if (values.length <= 1) {
      return [...values]
    }

    const sortedRanges = [...values].sort((a, b) => a.start - b.start)

    const result: DateTimeRange[] = []
    let current = { ...sortedRanges[0] }

    for (let i = 1; i < sortedRanges.length; i++) {
      const next = sortedRanges[i]

      if (next.start <= current.end + 1) {
        current.end = Math.max(current.end, next.end)
      }
      else {
        result.push(current)
        current = { ...next }
      }
    }

    result.push(current)

    return result
  }

  public setMerge(state: MergeState): void {
    this.merge = state
    this._invalidateHash()
  }

  public getMerge(): MergeState {
    return this.merge
  }

  abstract toString(): string

  getHash(): string {
    if (this._cachedHash === null) {
      const baseString = `${this.constructor.name}:${this.merge}:${JSON.stringify(this.values)}`
      this._cachedHash = generateHash(baseString)
    }
    return this._cachedHash
  }

  addValue(value: V, index?: number): void {
    if (!this.validateValue(value)) {
      throw new ValidationError(
        'Provided value is out of bounds',
        value,
        { min: this.minValue, max: this.maxValue },
        { className: this.constructor.name },
      )
    }

    if (index !== undefined) {
      if (index >= 0 && index <= this.values.length) {
        this.values.splice(index, 0, value)
      }
      else {
        throw new IndexOutOfBoundsError(
          index,
          { min: 0, max: this.values.length },
          { className: this.constructor.name },
        )
      }
    }
    else {
      this.values.push(value)
    }

    this.cache = null
    this.cacheValues()
    this._invalidateHash()
  }

  abstract clone(): IBlock

  abstract evaluate(
    startUnix: number,
    endUnix: number,
    schedule?: ISchedule,
    merge?: boolean,
  ): Result<DateTimeRange[], Error>

  getValue(index: number): V {
    if (index >= 0 && index < this.values.length) {
      return this.values[index]
    }
    throw new IndexOutOfBoundsError(
      index,
      { min: 0, max: this.values.length - 1 },
      { className: this.constructor.name },
    )
  }

  getValues(): readonly V[] {
    return this.values
  }

  removeValue(index: number): void {
    if (index >= 0 && index < this.values.length) {
      this.values.splice(index, 1)
      this.cache = null
      this.cacheValues()
      this._invalidateHash()
      return
    }
    throw new IndexOutOfBoundsError(
      index,
      { min: 0, max: this.values.length - 1 },
      { className: this.constructor.name },
    )
  }

  addValues(values: readonly V[]): void {
    for (const value of values) {
      this.addValue(value)
    }
  }

  abstract evaluateTimestamp(unix: number, schedule?: ISchedule): Result<boolean, Error>

  protected _invalidateHash(): void {
    this._cachedHash = null
  }

  protected validateParsedNumeric(value: ParsedNumericValue): boolean {
    switch (value.type) {
      case 'Number':
        return (
          value.value >= this.minValue
          && value.value <= this.maxValue
          && Number.isInteger(value.value)
        )
      case 'Range':
        return (
          value.start >= this.minValue
          && value.end <= this.maxValue
          && Number.isInteger(value.start)
          && Number.isInteger(value.end)
          && value.start <= value.end
        )
      case 'Algebraic':
        return checkAlgebraic(value)
    }
  }

  protected cacheParsedNumeric(values: ParsedNumericValue[]): null | Uint8Array {
    if (values.length === 0) {
      return null
    }

    const bitmap: Uint8Array = new Uint8Array(this.cacheSize)

    for (const value of values) {
      switch (value.type) {
        case 'Number':
          if (value.value >= this.minValue && value.value <= this.maxValue) {
            updateBitmap(bitmap, value.value - 1)
          }
          break
        case 'Range':
          for (
            let m = Math.max(this.minValue, value.start);
            m <= Math.min(this.maxValue, value.end);
            m++
          ) {
            updateBitmap(bitmap, m - 1)
          }
          break
        case 'Algebraic':
          updateAlgebraicBitmap(value, bitmap, 1, this.maxValue)
          break
      }
    }

    return bitmap
  }

  protected getActiveParsedNumeric(values: ParsedNumericValue[]): boolean[] {
    const activeDays: boolean[] = new Array(this.maxValue).fill(false)

    if (this.cache) {
      for (let i = 1; i <= this.maxValue; i++) {
        const byteIndex = Math.floor((i - 1) / 8)
        const bitInByte = (i - 1) % 8

        if (byteIndex < this.cache.length) {
          activeDays[i - 1] = (this.cache[byteIndex] & (1 << bitInByte)) !== 0
        }
      }
      return activeDays
    }

    // Fall back to manually checking each day
    for (let i = 1; i <= this.maxValue; i++) {
      activeDays[i - 1] = iterativeParsedValueCheck(values, i, this.minValue, this.maxValue)
    }

    return activeDays
  }

  protected cacheValues(): void {
    this.cache = null
  }

  protected abstract validateValue(value: V): boolean
}
