import Schedule from '../src/schedule/Schedule';
import TimeField from '../src/schedule/blocks/fields/TimeField';
import WeekDayField from '../src/schedule/blocks/fields/WeekDayField';
import AndBlock from '../src/schedule/blocks/conditions/AndBlock';
import { ValidationError } from '../src/errors';
import { MergeState } from '../src/types';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Schedule basic operations', () => {
  it('should create an empty schedule', () => {
    const schedule = new Schedule();
    expect(schedule).toBeInstanceOf(Schedule);
    expect(schedule.expressions.size).toBe(0);
  });

  it('should add expressions correctly', () => {
    const schedule = new Schedule();
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    schedule.setExpression('working-hours', 'Working Hours', timeField);

    expect(schedule.expressions.size).toBe(1);
    expect(schedule.getExpression('working-hours')).toBe(timeField);
  });

  it('should retrieve expression correctly', () => {
    const schedule = new Schedule();
    const weekdayField = new WeekDayField([
      { type: 'Number', value: 1 }, // Monday
    ]);

    schedule.setExpression('monday', 'Monday Only', weekdayField);

    const retrieved = schedule.getExpression('monday');
    expect(retrieved).toBe(weekdayField);
    expect(retrieved).toBeInstanceOf(WeekDayField);
  });

  it('should return undefined for non-existent expression', () => {
    const schedule = new Schedule();
    expect(schedule.getExpression('non-existent')).toBeUndefined();
  });

  it('should remove expressions correctly', () => {
    const schedule = new Schedule();
    const timeField = new TimeField([
      { start: 0, end: 86399999 }, // Full day (minus 1ms to stay within bounds)
    ]);

    schedule.setExpression('full-day', 'Full Day', timeField);
    expect(schedule.expressions.size).toBe(1);

    const removed = schedule.removeExpression('full-day');
    expect(removed).toBe(true);
    expect(schedule.expressions.size).toBe(0);
    expect(schedule.getExpression('full-day')).toBeUndefined();
  });

  it('should return false when removing non-existent expression', () => {
    const schedule = new Schedule();
    const removed = schedule.removeExpression('non-existent');
    expect(removed).toBe(false);
  });

  it('should get all expressions correctly', () => {
    const schedule = new Schedule();
    const timeField = new TimeField([{ start: 0, end: 43200000 }]); // Half day
    const weekdayField = new WeekDayField([{ type: 'Number', value: 5 }]); // Friday

    schedule.setExpression('half-day', 'Half Day', timeField);
    schedule.setExpression('friday', 'Friday', weekdayField);

    const allExpressions = schedule.getAllExpressions();
    expect(allExpressions.size).toBe(2);
    expect(allExpressions.get('half-day')?.block).toBe(timeField);
    expect(allExpressions.get('half-day')?.name).toBe('Half Day');
    expect(allExpressions.get('friday')?.block).toBe(weekdayField);
    expect(allExpressions.get('friday')?.name).toBe('Friday');

    // Should be a copy, not the original
    expect(allExpressions).not.toBe(schedule.expressions);
  });
});

describe('Schedule expression overwrite behavior', () => {
  let schedule: Schedule;
  let originalField: TimeField;
  let newField: WeekDayField;

  beforeEach(() => {
    schedule = new Schedule();
    originalField = new TimeField([{ start: 0, end: 43200000 }]);
    newField = new WeekDayField([{ type: 'Number', value: 1 }]);

    schedule.setExpression('test-expr', 'Original', originalField);
  });

  it('should overwrite by default', () => {
    schedule.setExpression('test-expr', 'New', newField);

    expect(schedule.getExpression('test-expr')).toBe(newField);
    expect(schedule.expressions.get('test-expr')?.name).toBe('New');
  });

  it('should overwrite when explicitly set to true', () => {
    schedule.setExpression('test-expr', 'New', newField, true);

    expect(schedule.getExpression('test-expr')).toBe(newField);
    expect(schedule.expressions.get('test-expr')?.name).toBe('New');
  });

  it('should throw error when overwrite is false and expression exists', () => {
    expect(() => {
      schedule.setExpression('test-expr', 'New', newField, false);
    }).toThrow(ValidationError);

    // Original should still be there
    expect(schedule.getExpression('test-expr')).toBe(originalField);
    expect(schedule.expressions.get('test-expr')?.name).toBe('Original');
  });

  it('should allow setting new expression when overwrite is false', () => {
    schedule.setExpression('new-expr', 'New Expression', newField, false);

    expect(schedule.getExpression('new-expr')).toBe(newField);
    expect(schedule.expressions.size).toBe(2);
  });
});

describe('Schedule expression evaluation', () => {
  let schedule: Schedule;

  beforeEach(() => {
    schedule = new Schedule();
  });

  it('should evaluate simple time expression', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    schedule.setExpression('working-hours', 'Working Hours', timeField);

    const result = schedule.evaluateExpression('working-hours', 0, 86400000);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(32400000);
    expect(result[0].end).toBe(61200000);
  });

  it('should handle Date objects for evaluation', () => {
    const timeField = new TimeField([
      { start: 43200000, end: 46800000 }, // 12PM to 1PM
    ]);

    schedule.setExpression('lunch-time', 'Lunch Time', timeField);

    const startDate = new Date(2023, 0, 1); // Jan 1, 2023
    const endDate = new Date(2023, 0, 2); // Jan 2, 2023

    const result = schedule.evaluateExpression('lunch-time', startDate, endDate);
    expect(result).toHaveLength(1);

    // TimeField should return the time ranges constrained to the domain
    // Since we're passing a full day domain, expect the time field's ranges
    const expectedStart = startDate.getTime() + 43200000; // Start of domain + 12PM offset
    const expectedEnd = startDate.getTime() + 46800000; // Start of domain + 1PM offset

    expect(result[0].start).toBe(expectedStart);
    expect(result[0].end).toBe(expectedEnd);
  });

  it('should throw error when evaluating non-existent expression', () => {
    expect(() => {
      schedule.evaluateExpression('non-existent', 0, 86400000);
    }).toThrow(ValidationError);
  });

  it('should return empty array when expression evaluates to false', () => {
    const emptyField = new TimeField([]); // No time ranges

    schedule.setExpression('empty', 'Empty Field', emptyField);

    const result = schedule.evaluateExpression('empty', 0, 86400000);
    expect(result).toEqual([]);
  });

  it('should handle complex expressions with conditions', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    const weekdayField = new WeekDayField([
      { type: 'Range', start: 1, end: 5 }, // Monday to Friday
    ]);

    const workingHours = new AndBlock([timeField, weekdayField]);

    schedule.setExpression('business-hours', 'Business Hours', workingHours);

    const result = schedule.evaluateExpression('business-hours', 0, 604800000); // One week
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Schedule merge state handling', () => {
  let schedule: Schedule;

  beforeEach(() => {
    schedule = new Schedule();
  });

  it('should evaluate expression with merge state considerations', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 36000000 }, // 9AM to 10AM
      { start: 36000000, end: 39600000 }, // 10AM to 11AM
    ]);

    // Test with field having explicit merge off
    timeField.setMerge(MergeState.EXPLICIT_OFF);
    schedule.setExpression('no-merge-time', 'No Merge Time', timeField);

    const result = schedule.evaluateExpression('no-merge-time', 0, 86400000);
    expect(result).toHaveLength(2); // Should not merge

    // Test with field having explicit merge on
    timeField.setMerge(MergeState.EXPLICIT_ON);
    schedule.setExpression('force-merge-time', 'Force Merge Time', timeField);

    const mergedResult = schedule.evaluateExpression('force-merge-time', 0, 86400000);
    expect(mergedResult).toHaveLength(1); // Should merge
  });
});

describe('Schedule edge cases', () => {
  it('should handle expressions with null names', () => {
    const schedule = new Schedule();
    const timeField = new TimeField([{ start: 0, end: 43200000 }]);

    schedule.setExpression('unnamed', null, timeField);

    expect(schedule.expressions.get('unnamed')?.name).toBeNull();
    expect(schedule.getExpression('unnamed')).toBe(timeField);
  });

  it('should handle empty expressions map', () => {
    const schedule = new Schedule();
    const allExpressions = schedule.getAllExpressions();

    expect(allExpressions.size).toBe(0);
    expect(allExpressions).toBeInstanceOf(Map);
  });
});
