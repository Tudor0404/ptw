import type {ParsedNumericValue} from '../../src/types'
import {describe, expect, it} from 'vitest'
import WeekDayField from '../../src/blocks/fields/WeekDayField'
import {createTimestamp, createTimestampEnd} from '../../src/utils/value'

describe('basic initialising and value operations', () => {
    it('should create an empty WeekDayField', () => {
        const field = new WeekDayField()
        expect(field).toBeInstanceOf(WeekDayField)
        expect(field.getValues()).toEqual([])
    })

    it('should create a WeekDayField with simple number values', () => {
        // 1 = Monday, 7 = Sunday (ISO weekday format)
        const monday: ParsedNumericValue = {type: 'Number', value: 1}
        const wednesday: ParsedNumericValue = {type: 'Number', value: 3}
        const friday: ParsedNumericValue = {type: 'Number', value: 5}

        const field = new WeekDayField([monday, wednesday, friday])
        expect(field.getValues()).toHaveLength(3)
        expect(field.getValues()[0]).toEqual(monday)
        expect(field.getValues()[1]).toEqual(wednesday)
        expect(field.getValues()[2]).toEqual(friday)
    })

    it('should create a WeekDayField with range values', () => {
        const weekdays: ParsedNumericValue = {type: 'Range', start: 1, end: 5} // Monday to Friday
        const field = new WeekDayField([weekdays])

        expect(field.getValues()).toHaveLength(1)
        expect(field.getValues()[0]).toEqual(weekdays)
    })

    it('should create a WeekDayField with algebraic values', () => {
        // Every odd weekday (Monday, Wednesday, Friday)
        const oddWeekdays: ParsedNumericValue = {
            type: 'Algebraic',
            coefficientN: 2,
            operator: '+',
            constantY: 1,
        }

        const field = new WeekDayField([oddWeekdays])
        expect(field.getValues()).toHaveLength(1)
        expect(field.getValues()[0]).toEqual(oddWeekdays)
    })

    it('should reject values below the valid weekday range (1-7)', () => {
        const invalidLow: ParsedNumericValue = {type: 'Number', value: 0}
        expect(() => new WeekDayField([invalidLow])).toThrow()

        const invalidLowRange: ParsedNumericValue = {type: 'Range', start: 0, end: 3}
        expect(() => new WeekDayField([invalidLowRange])).toThrow()
    })

    it('should reject values above the valid weekday range (1-7)', () => {
        const invalidHigh: ParsedNumericValue = {type: 'Number', value: 8}
        expect(() => new WeekDayField([invalidHigh])).toThrow()

        const invalidHighRange: ParsedNumericValue = {type: 'Range', start: 5, end: 8}
        expect(() => new WeekDayField([invalidHighRange])).toThrow()
    })

    it('should reject invalid range with start > end', () => {
        const invalidRange: ParsedNumericValue = {type: 'Range', start: 5, end: 2}
        expect(() => new WeekDayField([invalidRange])).toThrow()
    })

    it('should reject invalid algebraic expressions', () => {
        // Negative coefficient
        const invalidAlgebraic1: ParsedNumericValue = {
            type: 'Algebraic',
            coefficientN: -2,
            operator: '+',
            constantY: 1,
        }
        expect(() => new WeekDayField([invalidAlgebraic1])).toThrow()

        // Negative constant
        const invalidAlgebraic2: ParsedNumericValue = {
            type: 'Algebraic',
            coefficientN: 2,
            operator: '+',
            constantY: -1,
        }
        expect(() => new WeekDayField([invalidAlgebraic2])).toThrow()

        // Too large coefficient/constant
        const invalidAlgebraic3: ParsedNumericValue = {
            type: 'Algebraic',
            coefficientN: 10000,
            operator: '+',
            constantY: 1,
        }
        expect(() => new WeekDayField([invalidAlgebraic3])).toThrow()
    })

    it('should clone a WeekDayField', () => {
        const values: ParsedNumericValue[] = [
            {type: 'Number', value: 1},
            {type: 'Range', start: 3, end: 5},
            {type: 'Algebraic', coefficientN: 2, operator: '+', constantY: 1},
        ]

        const field = new WeekDayField(values)
        const cloned = field.clone()

        expect(cloned).toBeInstanceOf(WeekDayField)
        expect(cloned).not.toBe(field) // Different instance
        expect(cloned.getValues()).toEqual(field.getValues())
    })

    it('should add and remove values correctly', () => {
        const field = new WeekDayField()

        const monday: ParsedNumericValue = {type: 'Number', value: 1}
        const friday: ParsedNumericValue = {type: 'Number', value: 5}

        field.addValue(monday)
        expect(field.getValues()).toHaveLength(1)
        expect(field.getValues()[0]).toEqual(monday)

        field.addValue(friday)
        expect(field.getValues()).toHaveLength(2)
        expect(field.getValues()[1]).toEqual(friday)

        field.removeValue(0)
        expect(field.getValues()).toHaveLength(1)
        expect(field.getValues()[0]).toEqual(friday)
    })

    it('should throw when accessing invalid indices', () => {
        const field = new WeekDayField()

        // Try to remove from empty field
        expect(() => field.removeValue(0)).toThrow()

        // Try to get from empty field
        expect(() => field.getValue(0)).toThrow()

        // Add one value then try to access invalid indices
        const monday: ParsedNumericValue = {type: 'Number', value: 1}
        field.addValue(monday)

        expect(() => field.removeValue(1)).toThrow()
        expect(() => field.getValue(1)).toThrow()
        expect(() => field.removeValue(-1)).toThrow()
        expect(() => field.getValue(-1)).toThrow()
    })

    it('should check if cache is properly initialized', () => {
        // WeekDayField has a cache size of 1 byte (7 days)
        const field = new WeekDayField()

        // Add values that should be cached
        field.addValue({type: 'Number', value: 1}) // Monday
        field.addValue({type: 'Number', value: 4}) // Thursday
        field.addValue({type: 'Number', value: 7}) // Sunday

        // We can't directly check the cache, but we can clone and ensure values are preserved
        const cloned = field.clone()
        expect(cloned.getValues()).toHaveLength(3)
        expect(cloned.getValues()[0]).toEqual({type: 'Number', value: 1})
        expect(cloned.getValues()[1]).toEqual({type: 'Number', value: 4})
        expect(cloned.getValues()[2]).toEqual({type: 'Number', value: 7})
    })

    it('should handle multiple value types together', () => {
        const field = new WeekDayField()

        // Number - Monday
        field.addValue({type: 'Number', value: 1})

        // Range - Wednesday to Friday
        field.addValue({type: 'Range', start: 3, end: 5})

        // Algebraic - Odd days (Monday, Wednesday, Friday, Sunday)
        field.addValue({
            type: 'Algebraic',
            coefficientN: 2,
            operator: '+',
            constantY: 1,
        })

        expect(field.getValues()).toHaveLength(3)
        expect(field.getValues()[0]).toEqual({type: 'Number', value: 1})
        expect(field.getValues()[1]).toEqual({type: 'Range', start: 3, end: 5})
        expect(field.getValues()[2]).toEqual({
            type: 'Algebraic',
            coefficientN: 2,
            operator: '+',
            constantY: 1,
        })
    })
})

describe('weekDayField evaluate method', () => {
    it('should return empty array for an empty field', () => {
        const field = new WeekDayField()
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 7)

        const result = field.evaluate(startUnix, endUnix)
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual([])
        }
    })

    it('should evaluate a single weekday value', () => {
        // Monday only (ISO weekday 1)
        const monday: ParsedNumericValue = {type: 'Number', value: 1}
        const field = new WeekDayField([monday])

        // Domain: January 1-7, 2023 (spans a full week)
        // Jan 1, 2023 is a Sunday, Jan 2 is Monday
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 7)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(1)

            // Should correspond to Monday, January 2, 2023
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2))
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2))
        }
    })

    it('should evaluate multiple individual weekdays', () => {
        // Monday, Wednesday, Friday
        const weekdays: ParsedNumericValue[] = [
            {type: 'Number', value: 1}, // Monday
            {type: 'Number', value: 3}, // Wednesday
            {type: 'Number', value: 5}, // Friday
        ]
        const field = new WeekDayField(weekdays)

        // Domain: January 1-7, 2023 (spans a full week)
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 7)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(3)

            // Monday, Jan 2
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2))
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2))

            // Wednesday, Jan 4
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 4))
            expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 4))

            // Friday, Jan 6
            expect(result.value[2].start).toBe(createTimestamp(2023, 1, 6))
            expect(result.value[2].end).toBe(createTimestampEnd(2023, 1, 6))
        }
    })

    it('should evaluate a weekday range', () => {
        // Weekdays (Monday to Friday)
        const weekdays: ParsedNumericValue = {type: 'Range', start: 1, end: 5}
        const field = new WeekDayField([weekdays])

        // Domain: January 1-7, 2023 (spans a full week)
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 7)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(1)

            // Should be a continuous range from Monday to Friday
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2)) // Monday
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 6)) // Friday
        }
    })

    it('should merge weekends that wrap around week boundaries', () => {
        // Weekends (Saturday and Sunday)
        const weekends: ParsedNumericValue = {type: 'Range', start: 6, end: 7} // Sat-Sun
        const field = new WeekDayField([weekends])

        // Domain: January 1-14, 2023 (spans two weeks)
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 14)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(3) // Three weekend periods

            // First Sunday (Jan 1)
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 1))

            // First Saturday-Sunday pair (Jan 7-8)
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 7))
            expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 8))

            // Second Saturday (Jan 14)
            expect(result.value[2].start).toBe(createTimestamp(2023, 1, 14))
            expect(result.value[2].end).toBe(createTimestampEnd(2023, 1, 14))
        }
    })

    it('should properly merge consecutive days that cross week boundaries', () => {
        // Sunday and Monday
        const weekends: ParsedNumericValue[] = [
            {type: 'Number', value: 7}, // Sunday
            {type: 'Number', value: 1}, // Monday
        ]
        const field = new WeekDayField(weekends)

        // Domain: January 1-9, 2023 (spans more than a week)
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 9)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(2) // Two Sunday-Monday pairs

            // First Sunday-Monday pair (Jan 1-2)
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1))
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2))

            // Second Sunday-Monday pair (Jan 8-9)
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 8))
            expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 9))
        }
    })

    it('should evaluate an algebraic expression for odd weekdays', () => {
        // Odd weekdays (Monday, Wednesday, Friday, Sunday)
        const oddWeekdays: ParsedNumericValue = {
            type: 'Algebraic',
            coefficientN: 2,
            operator: '-',
            constantY: 1,
        }
        const field = new WeekDayField([oddWeekdays])

        const startUnix = createTimestamp(2023, 1, 2)
        const endUnix = createTimestampEnd(2023, 1, 8)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(4)

            // mon
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2))
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2))

            // wed
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 4))
            expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 4))

            // fri
            expect(result.value[2].start).toBe(createTimestamp(2023, 1, 6))
            expect(result.value[2].end).toBe(createTimestampEnd(2023, 1, 6))

            // sun
            expect(result.value[3].start).toBe(createTimestamp(2023, 1, 8))
            expect(result.value[3].end).toBe(createTimestampEnd(2023, 1, 8))
        }
    })

    it('should handle complex combinations of weekdays', () => {
        // Weekdays (Mon-Fri) OR Sunday
        const values: ParsedNumericValue[] = [
            {type: 'Range', start: 1, end: 5}, // Monday-Friday
            {type: 'Number', value: 7}, // Sunday
        ]
        const field = new WeekDayField(values)

        // Domain: January 1-14, 2023 (spans two weeks)
        const startUnix = createTimestamp(2023, 1, 1)
        const endUnix = createTimestampEnd(2023, 1, 14)

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Should have 2 ranges: Jan 1-6 and Jan 8-13
            expect(result.value.length).toBe(2)

            // First period: Sunday Jan 1 + Monday-Friday Jan 2-6
            // These days are consecutive so they should be merged
            expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1)) // Sunday
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 6)) // Friday

            // Second period: Sunday Jan 8 + Monday-Friday Jan 9-13
            // These days are consecutive so they should be merged
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 8)) // Sunday
            expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 13)) // Friday
        }
    })

    it('should handle domain boundaries correctly', () => {
        // Weekdays (Monday to Friday)
        const weekdays: ParsedNumericValue = {type: 'Range', start: 1, end: 5}
        const field = new WeekDayField([weekdays])

        // Domain: January 3 (Tuesday) to January 10 (Tuesday), 2023
        const startUnix = createTimestamp(2023, 1, 3, 12) // Tuesday at noon
        const endUnix = createTimestamp(2023, 1, 10, 12) // Tuesday at noon

        const result = field.evaluate(startUnix, endUnix)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(2)

            // First weekday period: Tuesday (partial) to Friday
            expect(result.value[0].start).toBe(startUnix) // Tuesday at noon
            expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 6)) // Friday end

            // Second weekday period: Monday to Tuesday (partial)
            expect(result.value[1].start).toBe(createTimestamp(2023, 1, 9)) // Monday start
            expect(result.value[1].end).toBe(endUnix) // Tuesday at noon
        }
    })

    it('should handle zero-length domain', () => {
        // All weekdays
        const allDays: ParsedNumericValue = {type: 'Range', start: 1, end: 7}
        const field = new WeekDayField([allDays])

        // Domain with zero length: January 5, 2023 at noon
        const timestamp = createTimestamp(2023, 1, 5, 12)

        const result = field.evaluate(timestamp, timestamp)

        // With zero-length domain, should still produce a match
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(1)
            expect(result.value[0].start).toBe(timestamp)
            expect(result.value[0].end).toBe(timestamp)
        }
    })
})
