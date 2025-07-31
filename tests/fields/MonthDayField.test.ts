import type { DateTimeRange, ParsedNumericValue } from '../../src/types'
import { describe, expect, it } from 'vitest'
import MonthDayField from '../../src/blocks/fields/MonthDayField'
import { createTimestamp, createTimestampEnd } from '../../src/utils/value'

describe('basic initialising and value operations', () => {
  it('should create an empty MonthDayField', () => {
    const field = new MonthDayField()
    expect(field).toBeInstanceOf(MonthDayField)
    expect(field.getValues()).toEqual([])
  })

  it('should create a MonthDayField with simple number values', () => {
    const day1: ParsedNumericValue = { type: 'Number', value: 1 }
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }
    const day31: ParsedNumericValue = { type: 'Number', value: 31 }

    const field = new MonthDayField([day1, day15, day31])
    expect(field.getValues()).toHaveLength(3)
    expect(field.getValues()[0]).toEqual(day1)
    expect(field.getValues()[1]).toEqual(day15)
    expect(field.getValues()[2]).toEqual(day31)
  })

  it('should create a MonthDayField with range values', () => {
    const firstWeek: ParsedNumericValue = { type: 'Range', start: 1, end: 7 }
    const field = new MonthDayField([firstWeek])

    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(firstWeek)
  })

  it('should create a MonthDayField with algebraic values', () => {
    // Every odd day of the month
    const oddDays: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    }

    const field = new MonthDayField([oddDays])
    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(oddDays)
  })

  it('should reject values below the valid day range (1-31)', () => {
    const invalidLow: ParsedNumericValue = { type: 'Number', value: 0 }
    expect(() => new MonthDayField([invalidLow])).toThrow()

    const invalidLowRange: ParsedNumericValue = { type: 'Range', start: 0, end: 15 }
    expect(() => new MonthDayField([invalidLowRange])).toThrow()
  })

  it('should reject values above the valid day range (1-31)', () => {
    const invalidHigh: ParsedNumericValue = { type: 'Number', value: 32 }
    expect(() => new MonthDayField([invalidHigh])).toThrow()

    const invalidHighRange: ParsedNumericValue = { type: 'Range', start: 10, end: 32 }
    expect(() => new MonthDayField([invalidHighRange])).toThrow()
  })

  it('should reject invalid range with start > end', () => {
    const invalidRange: ParsedNumericValue = { type: 'Range', start: 15, end: 5 }
    expect(() => new MonthDayField([invalidRange])).toThrow()
  })

  it('should reject invalid algebraic expressions', () => {
    // Negative coefficient
    const invalidAlgebraic1: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: -2,
      operator: '+',
      constantY: 1,
    }
    expect(() => new MonthDayField([invalidAlgebraic1])).toThrow()

    // Negative constant
    const invalidAlgebraic2: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: -1,
    }
    expect(() => new MonthDayField([invalidAlgebraic2])).toThrow()

    // Too large coefficient/constant
    const invalidAlgebraic3: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 10000,
      operator: '+',
      constantY: 1,
    }
    expect(() => new MonthDayField([invalidAlgebraic3])).toThrow()
  })

  it('should clone a MonthDayField', () => {
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 },
      { type: 'Range', start: 10, end: 20 },
      { type: 'Algebraic', coefficientN: 2, operator: '+', constantY: 1 },
    ]

    const field = new MonthDayField(values)
    const cloned = field.clone()

    expect(cloned).toBeInstanceOf(MonthDayField)
    expect(cloned).not.toBe(field) // Different instance
    expect(cloned.getValues()).toEqual(field.getValues())
  })

  it('should add and remove values correctly', () => {
    const field = new MonthDayField()

    const day1: ParsedNumericValue = { type: 'Number', value: 1 }
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }

    field.addValue(day1)
    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(day1)

    field.addValue(day15)
    expect(field.getValues()).toHaveLength(2)
    expect(field.getValues()[1]).toEqual(day15)

    field.removeValue(0)
    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(day15)
  })

  it('should throw when accessing invalid indices', () => {
    const field = new MonthDayField()

    // Try to remove from empty field
    expect(() => field.removeValue(0)).toThrow()

    // Try to get from empty field
    expect(() => field.getValue(0)).toThrow()

    // Add one value then try to access invalid indices
    const day1: ParsedNumericValue = { type: 'Number', value: 1 }
    field.addValue(day1)

    expect(() => field.removeValue(1)).toThrow()
    expect(() => field.getValue(1)).toThrow()
    expect(() => field.removeValue(-1)).toThrow()
    expect(() => field.getValue(-1)).toThrow()
  })

  it('should handle multiple value types together', () => {
    const field = new MonthDayField()

    // Number
    field.addValue({ type: 'Number', value: 1 })

    // Range
    field.addValue({ type: 'Range', start: 10, end: 15 })

    // Algebraic
    field.addValue({
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    })

    expect(field.getValues()).toHaveLength(3)
    expect(field.getValues()[0]).toEqual({ type: 'Number', value: 1 })
    expect(field.getValues()[1]).toEqual({ type: 'Range', start: 10, end: 15 })
    expect(field.getValues()[2]).toEqual({
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    })
  })
})

describe('monthDayField evaluate method', () => {
  // Utility to create a full day range
  const fullDayRange = (year: number, month: number, day: number): DateTimeRange => {
    return {
      start: createTimestamp(year, month, day),
      end: createTimestampEnd(year, month, day),
    }
  }

  it('should return empty array for an empty field', () => {
    const field = new MonthDayField()
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestamp(2023, 1, 31)

    const result = field.evaluate(startUnix, endUnix)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
    }
  })

  it('should evaluate a single day of month', () => {
    // 15th day of each month
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }
    const field = new MonthDayField([day15])

    // Domain: January 2023 (full month)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 1, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)

      // Should match January 15, 2023
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 15))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 15))
    }
  })

  it('should evaluate a range of days of month', () => {
    // 10th through 15th day of each month
    const day10_15: ParsedNumericValue = { type: 'Range', start: 10, end: 15 }
    const field = new MonthDayField([day10_15])

    // Domain: January 2023 (full month)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 1, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)

      // Should match January 10-15, 2023 as a single continuous range
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 10))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 15))
    }
  })

  it('should evaluate an algebraic expression for days of month', () => {
    // Every odd-numbered day of month
    const oddDays: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '-',
      constantY: 1,
    }
    const field = new MonthDayField([oddDays])

    // Domain: January 1-10, 2023 (first 10 days)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 1, 10)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(5)

      // Should match January 1, 3, 5, 7, 9 (odd days)
      expect(result.value[0]).toEqual(fullDayRange(2023, 1, 1))
      expect(result.value[1]).toEqual(fullDayRange(2023, 1, 3))
      expect(result.value[2]).toEqual(fullDayRange(2023, 1, 5))
      expect(result.value[3]).toEqual(fullDayRange(2023, 1, 7))
      expect(result.value[4]).toEqual(fullDayRange(2023, 1, 9))
    }
  })

  it('should evaluate multiple day specifications combined', () => {
    // 1st, 15th, and 20th-25th of each month
    const day1: ParsedNumericValue = { type: 'Number', value: 1 }
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }
    const day20_25: ParsedNumericValue = { type: 'Range', start: 20, end: 25 }

    const field = new MonthDayField([day1, day15, day20_25])

    // Domain: January 2023 (full month)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 1, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(3)

      // 1st day
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 1))

      // 15th day
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 15))
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 15))

      // 20th-25th days as one range
      expect(result.value[2].start).toBe(createTimestamp(2023, 1, 20))
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 1, 25))
    }
  })

  it('should handle multiple months correctly', () => {
    // First day of each month
    const day1: ParsedNumericValue = { type: 'Number', value: 1 }
    const field = new MonthDayField([day1])

    // Domain: January through March 2023
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 3, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(3)

      // Should match 1st of January, February, and March
      expect(result.value[0]).toEqual(fullDayRange(2023, 1, 1))
      expect(result.value[1]).toEqual(fullDayRange(2023, 2, 1))
      expect(result.value[2]).toEqual(fullDayRange(2023, 3, 1))
    }
  })

  it('should handle domain boundaries correctly', () => {
    // 15th day of each month
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }
    const field = new MonthDayField([day15])

    // Domain: January 10 to February 20, 2023
    const startUnix = createTimestamp(2023, 1, 10)
    const endUnix = createTimestampEnd(2023, 2, 20)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)

      // Should match January 15 and February 15
      expect(result.value[0]).toEqual(fullDayRange(2023, 1, 15))
      expect(result.value[1]).toEqual(fullDayRange(2023, 2, 15))
    }
  })

  it('should handle domain boundaries that cut through matching days', () => {
    // 15th day of each month
    const day15: ParsedNumericValue = { type: 'Number', value: 15 }
    const field = new MonthDayField([day15])

    // Domain: January 15 at noon to February 15 at noon
    const startUnix = createTimestamp(2023, 1, 15, 12)
    const endUnix = createTimestamp(2023, 2, 15, 12)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)

      // January 15, starting at noon
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 15, 12))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 15))

      // February 15, ending at noon
      expect(result.value[1].start).toBe(createTimestamp(2023, 2, 15))
      expect(result.value[1].end).toBe(createTimestamp(2023, 2, 15, 12))
    }
  })

  it('should return all days when all days of month are specified', () => {
    // All days of the month (1-31)
    const days1_31: ParsedNumericValue = { type: 'Range', start: 1, end: 31 }
    const field = new MonthDayField([days1_31])

    // Domain: January 15 to February 15, 2023
    const startUnix = createTimestamp(2023, 1, 15)
    const endUnix = createTimestampEnd(2023, 2, 15)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Since all days are active, should return the entire domain as one range
      expect(result.value.length).toBe(1)
      expect(result.value[0].start).toBe(startUnix)
      expect(result.value[0].end).toBe(endUnix)
    }
  })

  it('should handle months with different numbers of days', () => {
    // 30th and 31st of each month
    const day30_31: ParsedNumericValue = { type: 'Range', start: 30, end: 31 }
    const field = new MonthDayField([day30_31])

    // Domain: January through April 2023 (includes February which has 28 days)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 4, 30)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(3) // Jan 30-31, Mar 30-31, Apr 30

      // January 30-31
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 30))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31))

      // No days in February should match

      // March 30-31
      expect(result.value[1].start).toBe(createTimestamp(2023, 3, 30))
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 3, 31))

      // April 30
      expect(result.value[2].start).toBe(createTimestamp(2023, 4, 30))
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 4, 30))
    }
  })

  it('should handle a leap year correctly', () => {
    // 29th day of each month
    const day29: ParsedNumericValue = { type: 'Number', value: 29 }
    const field = new MonthDayField([day29])

    // Domain: January through April 2024 (leap year)
    const startUnix = createTimestamp(2024, 1, 1)
    const endUnix = createTimestampEnd(2024, 4, 30)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(4) // Jan 29, Feb 29, Mar 29, Apr 29

      // January 29
      expect(result.value[0]).toEqual(fullDayRange(2024, 1, 29))

      // February 29 (exists in leap year)
      expect(result.value[1]).toEqual(fullDayRange(2024, 2, 29))

      // March 29
      expect(result.value[2]).toEqual(fullDayRange(2024, 3, 29))

      // April 29
      expect(result.value[3]).toEqual(fullDayRange(2024, 4, 29))
    }
  })

  it('should handle a non-leap year correctly', () => {
    // 29th day of each month
    const day29: ParsedNumericValue = { type: 'Number', value: 29 }
    const field = new MonthDayField([day29])

    // Domain: January through April 2023 (non-leap year)
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 4, 30)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(3) // Jan 29, Mar 29, Apr 29 (no Feb 29)

      // January 29
      expect(result.value[0]).toEqual(fullDayRange(2023, 1, 29))

      // No February 29 in non-leap year

      // March 29
      expect(result.value[1]).toEqual(fullDayRange(2023, 3, 29))

      // April 29
      expect(result.value[2]).toEqual(fullDayRange(2023, 4, 29))
    }
  })

  it('should return empty array when no days match', () => {
    // 31st day of each month
    const day31: ParsedNumericValue = { type: 'Number', value: 31 }
    const field = new MonthDayField([day31])

    // Domain: February 2023 only (which has 28 days)
    const startUnix = createTimestamp(2023, 2, 1)
    const endUnix = createTimestampEnd(2023, 2, 28)

    const result = field.evaluate(startUnix, endUnix)

    // Should return empty array since no days match
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
    }
  })

  it('should optimize consecutive day ranges', () => {
    // Several individual days that should be merged
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 10 },
      { type: 'Number', value: 11 },
      { type: 'Number', value: 12 },
      { type: 'Number', value: 15 }, // Gap
      { type: 'Number', value: 16 },
      { type: 'Number', value: 17 },
    ]

    const field = new MonthDayField(values)

    // Domain: January 2023
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 1, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should merge consecutive days into ranges
      expect(result.value.length).toBe(2)

      // January 10-12 (merged)
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 10))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 12))

      // January 15-17 (merged)
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 15))
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 17))
    }
  })

  it('should handle a large date range efficiently', () => {
    // Every 5th day of the month
    const day5: ParsedNumericValue = { type: 'Number', value: 5 }
    const field = new MonthDayField([day5])

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 12, 31)

    // Measure performance
    const startTime = performance.now()
    const result = field.evaluate(startUnix, endUnix)
    const endTime = performance.now()

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should match the 5th of each month = 12 days
      expect(result.value.length).toBe(12)

      // Check first and last matches
      expect(result.value[0]).toEqual(fullDayRange(2023, 1, 5))
      expect(result.value[11]).toEqual(fullDayRange(2023, 12, 5))
    }

    // Performance assertion
    const duration = endTime - startTime
    console.log(`Large date range evaluation took ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(50) // Should be very fast
  })

  it('should identify and optimize when all days are active', () => {
    // All days 1-31
    const days1_31: ParsedNumericValue = { type: 'Range', start: 1, end: 31 }
    const field = new MonthDayField([days1_31])

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 12, 31)

    // Measure performance
    const startTime = performance.now()
    const result = field.evaluate(startUnix, endUnix)
    const endTime = performance.now()

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should return the entire domain as one range
      expect(result.value.length).toBe(1)
      expect(result.value[0].start).toBe(startUnix)
      expect(result.value[0].end).toBe(endUnix)
    }

    // This should be very fast since we avoid checking each day
    const duration = endTime - startTime
    console.log(`All days active evaluation took ${duration.toFixed(2)}ms`)
    expect(duration).toBeLessThan(10) // Should be extremely fast
  })
})
