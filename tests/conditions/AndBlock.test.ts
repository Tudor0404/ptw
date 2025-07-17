import {describe, expect, it} from 'vitest'
import AndOperator from '../../src/blocks/conditions/AndBlock'
import TimeField from '../../src/blocks/fields/TimeField'
import WeekDayField from '../../src/blocks/fields/WeekDayField'

describe('basic initialisation and operations', () => {
    it('should create an empty AndOperator', () => {
        const andOp = new AndOperator()
        expect(andOp).toBeInstanceOf(AndOperator)
        expect(andOp.getBlocks()).toEqual([])
    })

    it('should create an AndOperator with initial blocks', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
            {type: 'Number', value: 2}, // Tuesday
            {type: 'Number', value: 3}, // Wednesday
        ])

        const andOp = new AndOperator([timeField, weekDayField])

        expect(andOp.getBlocks()).toHaveLength(2)
        expect(andOp.getBlock(0)).toBe(timeField)
        expect(andOp.getBlock(1)).toBe(weekDayField)
    })

    it('should add blocks to the AndOperator', () => {
        const andOp = new AndOperator()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        andOp.addBlock(timeField)
        expect(andOp.getBlocks()).toHaveLength(1)
        expect(andOp.getBlock(0)).toBe(timeField)
    })

    it('should add blocks at specific indexes', () => {
        const andOp = new AndOperator()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const monthField = new WeekDayField([
            {type: 'Number', value: 1}, // January
        ])

        andOp.addBlock(timeField)
        andOp.addBlock(weekDayField)

        // Add at index 1 (between timeField and weekDayField)
        andOp.addBlock(monthField, 1)

        expect(andOp.getBlocks()).toHaveLength(3)
        expect(andOp.getBlock(0)).toBe(timeField)
        expect(andOp.getBlock(1)).toBe(monthField)
        expect(andOp.getBlock(2)).toBe(weekDayField)
    })

    it('should throw when adding at invalid index', () => {
        const andOp = new AndOperator()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        andOp.addBlock(timeField)

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        expect(() => andOp.addBlock(weekDayField, -1)).toThrow()
        expect(() => andOp.addBlock(weekDayField, 10)).toThrow()
    })

    it('should remove blocks at specific indexes', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const andOp = new AndOperator([timeField, weekDayField])

        andOp.removeBlock(0)
        expect(andOp.getBlocks()).toHaveLength(1)
        expect(andOp.getBlock(0)).toBe(weekDayField)
    })

    it('should throw when removing at invalid index', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const andOp = new AndOperator([timeField])

        expect(() => andOp.removeBlock(-1)).toThrow()
        expect(() => andOp.removeBlock(10)).toThrow()
    })

    it('should clone AndOperator with all blocks', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const andOp = new AndOperator([timeField, weekDayField])
        const cloned = andOp.clone()

        expect(cloned).toBeInstanceOf(AndOperator)
        expect(cloned).not.toBe(andOp) // Different instance
        expect(cloned.getBlocks()).toHaveLength(2)

        // The blocks should be cloned, not just references
        expect(cloned.getBlock(0)).not.toBe(timeField)
        expect(cloned.getBlock(1)).not.toBe(weekDayField)

        // But they should have the same values
        const clonedTimeField = cloned.getBlock(0) as TimeField
        expect(clonedTimeField.getValues()).toEqual(timeField.getValues())

        const clonedWeekDayField = cloned.getBlock(1) as WeekDayField
        expect(clonedWeekDayField.getValues()).toEqual(weekDayField.getValues())
    })

    it('should handle empty AndOperator cloning correctly', () => {
        const andOp = new AndOperator()
        const cloned = andOp.clone()

        expect(cloned).toBeInstanceOf(AndOperator)
        expect(cloned.getBlocks()).toHaveLength(0)
    })

    it('should return empty array when no blocks are present', () => {
        const andOp = new AndOperator()

        // The evaluate method should return empty array for no blocks
        const result = andOp.evaluate(0, 1)
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual([])
        }
    })

    it('should return empty array when any block returns false', () => {
        const timeField = new TimeField([]) // Empty time field will return false
        const weekDayField = new WeekDayField([{type: 'Number', value: 1}])

        const andOp = new AndOperator([timeField, weekDayField])

        // Should return empty array since timeField returns false
        const result = andOp.evaluate(0, 86400000) // One day
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual([])
        }
    })
})
