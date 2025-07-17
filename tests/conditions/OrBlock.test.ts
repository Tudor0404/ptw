import {describe, expect, it} from 'vitest'
import OrBlock from '../../src/blocks/conditions/OrBlock'
import TimeField from '../../src/blocks/fields/TimeField'
import WeekDayField from '../../src/blocks/fields/WeekDayField'

describe('basic initialisation and operations', () => {
    it('should create an empty OrBlock', () => {
        const orBlock = new OrBlock()
        expect(orBlock).toBeInstanceOf(OrBlock)
        expect(orBlock.getBlocks()).toEqual([])
    })

    it('should create an OrBlock with initial blocks', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
            {type: 'Number', value: 2}, // Tuesday
            {type: 'Number', value: 3}, // Wednesday
        ])

        const orBlock = new OrBlock([timeField, weekDayField])

        expect(orBlock.getBlocks()).toHaveLength(2)
        expect(orBlock.getBlock(0)).toBe(timeField)
        expect(orBlock.getBlock(1)).toBe(weekDayField)
    })

    it('should add blocks to the OrBlock', () => {
        const orBlock = new OrBlock()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        orBlock.addBlock(timeField)
        expect(orBlock.getBlocks()).toHaveLength(1)
        expect(orBlock.getBlock(0)).toBe(timeField)
    })

    it('should add blocks at specific indexes', () => {
        const orBlock = new OrBlock()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const monthField = new WeekDayField([
            {type: 'Number', value: 1}, // January
        ])

        orBlock.addBlock(timeField)
        orBlock.addBlock(weekDayField)

        // Add at index 1 (between timeField and weekDayField)
        orBlock.addBlock(monthField, 1)

        expect(orBlock.getBlocks()).toHaveLength(3)
        expect(orBlock.getBlock(0)).toBe(timeField)
        expect(orBlock.getBlock(1)).toBe(monthField)
        expect(orBlock.getBlock(2)).toBe(weekDayField)
    })

    it('should throw when adding at invalid index', () => {
        const orBlock = new OrBlock()
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        orBlock.addBlock(timeField)

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        expect(() => orBlock.addBlock(weekDayField, -1)).toThrow()
        expect(() => orBlock.addBlock(weekDayField, 10)).toThrow()
    })

    it('should remove blocks at specific indexes', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const orBlock = new OrBlock([timeField, weekDayField])

        orBlock.removeBlock(0)
        expect(orBlock.getBlocks()).toHaveLength(1)
        expect(orBlock.getBlock(0)).toBe(weekDayField)
    })

    it('should throw when removing at invalid index', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const orBlock = new OrBlock([timeField])

        expect(() => orBlock.removeBlock(-1)).toThrow()
        expect(() => orBlock.removeBlock(10)).toThrow()
    })

    it('should clone OrBlock with all blocks', () => {
        const timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM
        ])

        const weekDayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
        ])

        const orBlock = new OrBlock([timeField, weekDayField])
        const cloned = orBlock.clone()

        expect(cloned).toBeInstanceOf(OrBlock)
        expect(cloned).not.toBe(orBlock) // Different instance
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

    it('should handle empty OrBlock cloning correctly', () => {
        const orBlock = new OrBlock()
        const cloned = orBlock.clone()

        expect(cloned).toBeInstanceOf(OrBlock)
        expect(cloned.getBlocks()).toHaveLength(0)
    })

    it('should return empty array when no blocks are present', () => {
        const orBlock = new OrBlock()

        // The evaluate method should return empty array for no blocks
        const result = orBlock.evaluate(0, 1)
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual([])
        }
    })

    it('should return empty array when all blocks return false', () => {
        const timeField1 = new TimeField([]) // Empty time field will return false
        const timeField2 = new TimeField([]) // Empty time field will return false

        const orBlock = new OrBlock([timeField1, timeField2])

        // Should return empty array since all blocks return false
        const result = orBlock.evaluate(0, 86400000) // One day
        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual([])
        }
    })
})
