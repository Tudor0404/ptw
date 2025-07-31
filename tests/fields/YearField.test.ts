import type { ParsedNumericValue } from '../../src/types'
import { describe, expect, it } from 'vitest'
import YearField from '../../src/blocks/fields/YearField'
import { MergeState } from '../../src/types'
import { createTimestamp, createTimestampEnd } from '../../src/utils/value'

describe('yearField basic operations', () => {
  it('should create an empty YearField', () => {
    const field = new YearField()
    expect(field).toBeInstanceOf(YearField)
    expect(field.getValues()).toEqual([])
  })

  it('should create a YearField with simple number values', () => {
    const year2023: ParsedNumericValue = { type: 'Number', value: 2023 }
    const year2025: ParsedNumericValue = { type: 'Number', value: 2025 }

    const field = new YearField([year2023, year2025])
    expect(field.getValues()).toHaveLength(2)
    expect(field.getValues()[0]).toEqual(year2023)
    expect(field.getValues()[1]).toEqual(year2025)
  })

  it('should create a YearField with range values', () => {
    const yearRange: ParsedNumericValue = { type: 'Range', start: 2023, end: 2025 }
    const field = new YearField([yearRange])

    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(yearRange)
  })

  it('should create a YearField with algebraic values', () => {
    // Every odd year
    const oddYears: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    }

    const field = new YearField([oddYears])
    expect(field.getValues()).toHaveLength(1)
    expect(field.getValues()[0]).toEqual(oddYears)
  })
})

describe('yearField evaluate method', () => {
  it('should return empty array for an empty field', () => {
    const field = new YearField()
    const startUnix = createTimestamp(2023, 1, 1)
    const endUnix = createTimestampEnd(2023, 12, 31)

    const result = field.evaluate(startUnix, endUnix)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
    }
  })

  it('should evaluate a single year value', () => {
    // Just year 2023
    const year2023: ParsedNumericValue = { type: 'Number', value: 2023 }
    const field = new YearField([year2023])

    // Domain: 2022-2024
    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2024, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)

      // Should select all of 2023
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 12, 31))
    }
  })

  it('should evaluate multiple individual year values', () => {
    // Years 2023 and 2025
    const years: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 },
      { type: 'Number', value: 2025 },
    ]
    const field = new YearField(years)

    // Domain: 2022-2026
    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2026, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(2)

      // Should select all of 2023
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 12, 31))

      // Should select all of 2025
      expect(result.value[1].start).toBe(createTimestamp(2025, 1, 1))
      expect(result.value[1].end).toBe(createTimestampEnd(2025, 12, 31))
    }
  })

  it('should evaluate a range of years', () => {
    // Years 2023-2025
    const yearRange: ParsedNumericValue = { type: 'Range', start: 2023, end: 2025 }
    const field = new YearField([yearRange])

    // Domain: 2022-2026
    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2026, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)

      // Should select 2023-2025 as one continuous range
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2025, 12, 31))
    }
  })

  it('should evaluate an algebraic expression for leap years', () => {
    // Every 4 years starting from 2020 (leap years)
    const leapYears: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 4,
      operator: '+',
      constantY: 0,
    }
    const field = new YearField([leapYears])

    // Domain: 2019-2033
    const startUnix = createTimestamp(2019, 1, 1)
    const endUnix = createTimestampEnd(2033, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(4)

      // 2020
      expect(result.value[0].start).toBe(createTimestamp(2020, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2020, 12, 31))

      // 2024
      expect(result.value[1].start).toBe(createTimestamp(2024, 1, 1))
      expect(result.value[1].end).toBe(createTimestampEnd(2024, 12, 31))

      // 2028
      expect(result.value[2].start).toBe(createTimestamp(2028, 1, 1))
      expect(result.value[2].end).toBe(createTimestampEnd(2028, 12, 31))

      // 2032
      expect(result.value[3].start).toBe(createTimestamp(2032, 1, 1))
      expect(result.value[3].end).toBe(createTimestampEnd(2032, 12, 31))
    }
  })

  it('should evaluate an algebraic expression for odd years', () => {
    // Odd years (2023, 2025, 2027...)
    const oddYears: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    }
    const field = new YearField([oddYears])

    // Domain: 2022-2027
    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2027, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(3)

      // 2023
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 12, 31))

      // 2025
      expect(result.value[1].start).toBe(createTimestamp(2025, 1, 1))
      expect(result.value[1].end).toBe(createTimestampEnd(2025, 12, 31))

      // 2027
      expect(result.value[2].start).toBe(createTimestamp(2027, 1, 1))
      expect(result.value[2].end).toBe(createTimestampEnd(2027, 12, 31))
    }
  })

  it('should handle domain boundaries correctly', () => {
    // Every year from 2023-2027
    const yearRange: ParsedNumericValue = { type: 'Range', start: 2023, end: 2027 }
    const field = new YearField([yearRange])

    // Domain: July 2024 to March 2026 (partial years)
    const startUnix = createTimestamp(2024, 7, 1)
    const endUnix = createTimestampEnd(2026, 3, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)

      // Should select from July 2024 to March 2026
      expect(result.value[0].start).toBe(startUnix)
      expect(result.value[0].end).toBe(endUnix)
    }
  })

  it('should handle a domain completely outside active years', () => {
    // Only year 2023
    const year2023: ParsedNumericValue = { type: 'Number', value: 2023 }
    const field = new YearField([year2023])

    // Domain: 2024-2025 (no overlap with active year)
    const startUnix = createTimestamp(2024, 1, 1)
    const endUnix = createTimestampEnd(2025, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should return empty array since no overlap
      expect(result.value.length).toBe(0)
    }
  })

  it('should handle multiple value types together', () => {
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 }, // Specific year
      { type: 'Range', start: 2025, end: 2026 }, // Range of years
      { type: 'Algebraic', coefficientN: 10, operator: '+', constantY: 0 }, // Decade years (2020, 2030...)
    ]
    const field = new YearField(values)

    // Domain: 2020-2035
    const startUnix = createTimestamp(2020, 1, 1)
    const endUnix = createTimestampEnd(2035, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(4)

      // 2020
      expect(result.value[0].start).toBe(createTimestamp(2020, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2020, 12, 31))

      // 2023
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 12, 31))

      // 2025-2026 (continuous range)
      expect(result.value[2].start).toBe(createTimestamp(2025, 1, 1))
      expect(result.value[2].end).toBe(createTimestampEnd(2026, 12, 31))

      // 2030
      expect(result.value[3].start).toBe(createTimestamp(2030, 1, 1))
      expect(result.value[3].end).toBe(createTimestampEnd(2030, 12, 31))
    }
  })

  it('should handle zero-length domain', () => {
    // Year 2023
    const year2023: ParsedNumericValue = { type: 'Number', value: 2023 }
    const field = new YearField([year2023])

    // Domain with zero length: June 15, 2023 at noon
    const timestamp = createTimestamp(2023, 6, 15, 12)

    const result = field.evaluate(timestamp, timestamp)

    // With zero-length domain in an active year, should still produce a match
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
      expect(result.value[0].start).toBe(timestamp)
      expect(result.value[0].end).toBe(timestamp)
    }
  })

  it('should handle edge cases with very large year ranges', () => {
    // Year range spanning multiple centuries
    const centuryRange: ParsedNumericValue = { type: 'Range', start: 2000, end: 2200 }
    const field = new YearField([centuryRange])

    // Domain: 2099-2101 (around century boundary)
    const startUnix = createTimestamp(2099, 12, 25)
    const endUnix = createTimestampEnd(2101, 1, 5)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.length).toBe(1)
      // Should be a continuous range across the century boundary
      expect(result.value[0].start).toBe(startUnix)
      expect(result.value[0].end).toBe(endUnix)
    }
  })
})

describe('yearField merge behavior', () => {
  it('should merge consecutive years by default', () => {
    // Years 2023, 2024, 2025 (consecutive)
    const years: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 },
      { type: 'Number', value: 2024 },
      { type: 'Number', value: 2025 },
    ]
    const field = new YearField(years)

    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2026, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should merge into one continuous range
      expect(result.value.length).toBe(1)
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2025, 12, 31))
    }
  })

  it('should not merge consecutive years when merge state is EXPLICIT_OFF', () => {
    // Years 2023, 2024, 2025 (consecutive)
    const years: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 },
      { type: 'Number', value: 2024 },
      { type: 'Number', value: 2025 },
    ]
    const field = new YearField(years)
    field.setMerge(MergeState.EXPLICIT_OFF)

    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2026, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should NOT merge - each year is separate
      expect(result.value.length).toBe(3)

      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 12, 31))

      expect(result.value[1].start).toBe(createTimestamp(2024, 1, 1))
      expect(result.value[1].end).toBe(createTimestampEnd(2024, 12, 31))

      expect(result.value[2].start).toBe(createTimestamp(2025, 1, 1))
      expect(result.value[2].end).toBe(createTimestampEnd(2025, 12, 31))
    }
  })

  it('should merge consecutive years when merge state is EXPLICIT_ON', () => {
    // Years 2023, 2024, 2025 (consecutive)
    const years: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 },
      { type: 'Number', value: 2024 },
      { type: 'Number', value: 2025 },
    ]
    const field = new YearField(years)
    field.setMerge(MergeState.EXPLICIT_ON)

    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2026, 12, 31)

    const result = field.evaluate(startUnix, endUnix)

    expect(result.ok).toBe(true)
    if (result.ok) {
      // Should merge into one continuous range
      expect(result.value.length).toBe(1)
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
      expect(result.value[0].end).toBe(createTimestampEnd(2025, 12, 31))
    }
  })

  it('should respect merge parameter when merge state is DEFAULT', () => {
    const years: ParsedNumericValue[] = [
      { type: 'Number', value: 2023 },
      { type: 'Number', value: 2024 },
    ]
    const field = new YearField(years)

    const startUnix = createTimestamp(2022, 1, 1)
    const endUnix = createTimestampEnd(2025, 12, 31)

    // Test with merge=false
    const resultNoMerge = field.evaluate(startUnix, endUnix, null, false)
    expect(resultNoMerge.ok).toBe(true)
    if (resultNoMerge.ok) {
      expect(resultNoMerge.value.length).toBe(2) // Separate ranges
    }

    // Test with merge=true
    const resultMerge = field.evaluate(startUnix, endUnix, null, true)
    expect(resultMerge.ok).toBe(true)
    if (resultMerge.ok) {
      expect(resultMerge.value.length).toBe(1) // Merged range
    }
  })
})
