import {beforeEach, describe, expect, it} from 'vitest'
import Reference from '../../src/blocks/fields/Reference'
import TimeField from '../../src/blocks/fields/TimeField'
import WeekDayField from '../../src/blocks/fields/WeekDayField'
import {ReferenceError} from '../../src/errors'
import Schedule from '../../src/schedule/Schedule'
import {MergeState} from '../../src/types'

describe('reference basic operations', () => {
    it('should create a Reference with an id', () => {
        const ref = new Reference('test-id')
        expect(ref).toBeInstanceOf(Reference)
        expect(ref.getId()).toBe('test-id')
    })

    it('should set and get id', () => {
        const ref = new Reference('initial-id')
        ref.setId('new-id')
        expect(ref.getId()).toBe('new-id')
    })

    it('should set and get merge state', () => {
        const ref = new Reference('test-id')
        expect(ref.getMerge()).toBe(MergeState.DEFAULT)

        ref.setMerge(MergeState.EXPLICIT_ON)
        expect(ref.getMerge()).toBe(MergeState.EXPLICIT_ON)

        ref.setMerge(MergeState.EXPLICIT_OFF)
        expect(ref.getMerge()).toBe(MergeState.EXPLICIT_OFF)
    })

    it('should clone correctly', () => {
        const ref = new Reference('test-id')
        ref.setMerge(MergeState.EXPLICIT_ON)

        const cloned = ref.clone()
        expect(cloned).toBeInstanceOf(Reference)
        expect(cloned).not.toBe(ref)
        expect(cloned.getId()).toBe('test-id')
        expect(cloned.getMerge()).toBe(MergeState.DEFAULT) // Clone doesn't copy merge state
    })

    it('should generate correct toString', () => {
        const ref = new Reference('my-schedule')
        expect(ref.toString()).toBe('REF[my-schedule]')
    })

    it('should generate consistent hash', () => {
        const ref1 = new Reference('test-id')
        const ref2 = new Reference('test-id')

        expect(ref1.getHash()).toBe(ref2.getHash())

        ref1.setMerge(MergeState.EXPLICIT_ON)
        expect(ref1.getHash()).not.toBe(ref2.getHash())

        ref2.setMerge(MergeState.EXPLICIT_ON)
        expect(ref1.getHash()).toBe(ref2.getHash())

        const ref3 = new Reference('different-id')
        expect(ref1.getHash()).not.toBe(ref3.getHash())
    })
})

describe('reference evaluation', () => {
    let schedule: Schedule
    let timeField: TimeField
    let weekdayField: WeekDayField

    beforeEach(() => {
        schedule = new Schedule()

        timeField = new TimeField([
            {start: 32400000, end: 61200000}, // 9AM to 5PM in milliseconds
        ])

        weekdayField = new WeekDayField([
            {type: 'Number', value: 1}, // Monday
            {type: 'Number', value: 2}, // Tuesday
        ])

        // Add expressions to schedule
        schedule.setExpression('working-hours', 'Working Hours', timeField)
        schedule.setExpression('weekdays', 'Work Days', weekdayField)
    })

    it('should return error when no schedule is provided', () => {
        const ref = new Reference('working-hours')

        const result = ref.evaluate(0, 1000)
        expect(result.ok).toBe(false)
        if (!(result.ok)) {
            expect(result.error).toBeInstanceOf(ReferenceError)
        }
    })

    it('should return error when referenced expression does not exist', () => {
        const ref = new Reference('non-existent')

        const result = ref.evaluate(0, 1000, schedule)
        expect(result.ok).toBe(false)
        if (!(result.ok)) {
            expect(result.error).toBeInstanceOf(ReferenceError)
        }
    })

    it('should evaluate referenced expression successfully', () => {
        const ref = new Reference('working-hours')
        const result = ref.evaluate(0, 86400000, schedule) // Full day domain

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBeGreaterThan(0)
            // Should delegate to the timeField's evaluation
            expect(result.value[0].start).toBe(32400000) // 9AM
            expect(result.value[0].end).toBe(61200000) // 5PM
        }
    })
})

describe('reference merge behavior', () => {
    let schedule: Schedule
    let timeField: TimeField

    beforeEach(() => {
        schedule = new Schedule()

        // Time field with consecutive hours that can be merged
        timeField = new TimeField([
            {start: 32400000, end: 36000000}, // 9AM to 10AM
            {start: 36000000, end: 39600000}, // 10AM to 11AM
            {start: 39600000, end: 43200000}, // 11AM to 12PM
        ])

        schedule.setExpression('consecutive-hours', 'Consecutive Hours', timeField)
    })

    it('should use explicit merge state when set to EXPLICIT_ON', () => {
        const ref = new Reference('consecutive-hours')
        ref.setMerge(MergeState.EXPLICIT_ON)

        // Call with merge=false, but ref should override with true
        const result = ref.evaluate(0, 86400000, schedule, false)

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Should be merged into one continuous range
            expect(result.value.length).toBe(1)
            expect(result.value[0].start).toBe(32400000) // 9AM
            expect(result.value[0].end).toBe(43200000) // 12PM
        }
    })

    it('should use explicit merge state when set to EXPLICIT_OFF', () => {
        const ref = new Reference('consecutive-hours')
        ref.setMerge(MergeState.EXPLICIT_OFF)

        // Call with merge=true, but ref should override with false
        const result = ref.evaluate(0, 86400000, schedule, true)

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Should NOT be merged - each hour separate
            expect(result.value.length).toBe(3)
            expect(result.value[0].start).toBe(32400000) // 9AM
            expect(result.value[0].end).toBe(36000000) // 10AM
            expect(result.value[1].start).toBe(36000000) // 10AM
            expect(result.value[1].end).toBe(39600000) // 11AM
            expect(result.value[2].start).toBe(39600000) // 11AM
            expect(result.value[2].end).toBe(43200000) // 12PM
        }
    })

    it('should pass through merge parameter when merge state is DEFAULT', () => {
        const ref = new Reference('consecutive-hours')
        expect(ref.getMerge()).toBe(MergeState.DEFAULT)

        // Test with merge=true
        const resultMerged = ref.evaluate(0, 86400000, schedule, true)
        expect(resultMerged.ok).toBe(true)
        if (resultMerged.ok) {
            expect(resultMerged.value.length).toBe(1) // Should be merged
        }

        // Test with merge=false
        const resultNotMerged = ref.evaluate(0, 86400000, schedule, false)
        expect(resultNotMerged.ok).toBe(true)
        if (resultNotMerged.ok) {
            expect(resultNotMerged.value.length).toBe(3) // Should NOT be merged
        }
    })

    it('should default to merge=true when no merge parameter provided and state is DEFAULT', () => {
        const ref = new Reference('consecutive-hours')

        // No merge parameter provided, should default to true
        const result = ref.evaluate(0, 86400000, schedule)

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Should be merged by default
            expect(result.value.length).toBe(1)
            expect(result.value[0].start).toBe(32400000) // 9AM
            expect(result.value[0].end).toBe(43200000) // 12PM
        }
    })
})

describe('reference with complex expressions', () => {
    let schedule: Schedule

    beforeEach(() => {
        schedule = new Schedule()
    })

    it('should handle references to fields with different merge behaviors', () => {
        const mergeOffField = new TimeField([
            {start: 32400000, end: 36000000}, // 9AM to 10AM
            {start: 36000000, end: 39600000}, // 10AM to 11AM
        ])
        mergeOffField.setMerge(MergeState.EXPLICIT_OFF)

        const mergeOnField = new TimeField([
            {start: 43200000, end: 46800000}, // 12PM to 1PM
            {start: 46800000, end: 50400000}, // 1PM to 2PM
        ])
        mergeOnField.setMerge(MergeState.EXPLICIT_ON)

        schedule.setExpression('no-merge', 'No Merge Field', mergeOffField)
        schedule.setExpression('force-merge', 'Force Merge Field', mergeOnField)

        const refNoMerge = new Reference('no-merge')
        const refForceMerge = new Reference('force-merge')

        // The referenced field's own merge state should take precedence
        const resultNoMerge = refNoMerge.evaluate(0, 86400000, schedule, true)
        expect(resultNoMerge.ok).toBe(true)
        if (resultNoMerge.ok) {
            expect(resultNoMerge.value.length).toBe(2) // Field's EXPLICIT_OFF overrides ref's merge=true
        }

        const resultForceMerge = refForceMerge.evaluate(0, 86400000, schedule, false)
        expect(resultForceMerge.ok).toBe(true)
        if (resultForceMerge.ok) {
            expect(resultForceMerge.value.length).toBe(1) // Field's EXPLICIT_ON overrides ref's merge=false
        }
    })

    it('should work with nested references', () => {
        const baseField = new TimeField([
            {start: 32400000, end: 39600000}, // 9AM to 11AM
        ])

        const innerRef = new Reference('base-time')
        innerRef.setMerge(MergeState.EXPLICIT_ON)

        schedule.setExpression('base-time', 'Base Time', baseField)
        schedule.setExpression('ref-to-base', 'Reference to Base', innerRef)

        const outerRef = new Reference('ref-to-base')
        const result = outerRef.evaluate(0, 86400000, schedule)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.length).toBe(1)
            expect(result.value[0].start).toBe(32400000)
            expect(result.value[0].end).toBe(39600000)
        }
    })
})
