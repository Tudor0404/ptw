// src/schedule/blocks/fields/__tests__/TimeField.test.ts

import TimeField from '../../src/schedule/blocks/fields/TimeField';
import { DateTimeRange } from '../../src/types';
import Schedule from '../../src/schedule/Schedule';
import { createTimestamp, createTimestampEnd } from '../../src/utils/value';
import { describe, expect, it } from 'vitest';

describe('Basic initialising and value operations', () => {
  it('should create an empty TimeField', () => {
    const field = new TimeField();
    expect(field).toBeInstanceOf(TimeField);
    expect(field.getValues()).toEqual([]);
  });

  it('should create a TimeField with initial values', () => {
    const timeRange: DateTimeRange = {
      start: 32400000, // 9 hours from midnight (9:00 AM)
      end: 61200000, // 17 hours from midnight (5:00 PM)
    };

    const field = new TimeField([timeRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(timeRange);
  });

  it('should reject invalid TimeRange with end before start', () => {
    const invalidRange: DateTimeRange = {
      start: 61200000, // 5:00 PM
      end: 32400000, // 9:00 AM
    };

    expect(() => new TimeField([invalidRange])).toThrow();
  });

  it('should reject invalid TimeRange with negative start time', () => {
    const invalidRange: DateTimeRange = {
      start: -3600000, // -1 hour
      end: 32400000, // 9:00 AM
    };

    expect(() => new TimeField([invalidRange])).toThrow();
  });

  it('should reject invalid TimeRange with time greater than 24 hours', () => {
    const invalidRange: DateTimeRange = {
      start: 32400000, // 9:00 AM
      end: 90000000, // 25 hours - beyond valid range
    };

    expect(() => new TimeField([invalidRange])).toThrow();
  });

  it('should accept valid TimeRange at boundary values', () => {
    const boundaryRange: DateTimeRange = {
      start: 0, // 00:00:00
      end: 86399999, // 23:59:59.999 (just before midnight)
    };

    const field = new TimeField([boundaryRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(boundaryRange);
  });

  it('should clone a TimeField', () => {
    const timeRange: DateTimeRange = {
      start: 32400000, // 9:00 AM
      end: 61200000, // 5:00 PM
    };

    const field = new TimeField([timeRange]);
    const cloned = field.clone();

    expect(cloned).toBeInstanceOf(TimeField);
    expect(cloned).not.toBe(field); // Different instance
    expect(cloned.getValues()).toEqual(field.getValues());
  });

  it('should add and remove values correctly', () => {
    const field = new TimeField();

    const morningRange: DateTimeRange = {
      start: 32400000, // 9:00 AM
      end: 43200000, // 12:00 PM
    };

    const afternoonRange: DateTimeRange = {
      start: 46800000, // 1:00 PM
      end: 61200000, // 5:00 PM
    };

    field.addValue(morningRange);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(morningRange);

    field.addValue(afternoonRange);
    expect(field.getValues()).toHaveLength(2);
    expect(field.getValues()[1]).toEqual(afternoonRange);

    field.removeValue(0);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(afternoonRange);
  });

  it('should throw when accessing invalid indices', () => {
    const field = new TimeField();

    // Try to remove from empty field
    expect(() => field.removeValue(0)).toThrow();

    // Try to get from empty field
    expect(() => field.getValue(0)).toThrow();

    // Add one value then try to access invalid indices
    const timeRange: DateTimeRange = {
      start: 32400000, // 9:00 AM
      end: 61200000, // 5:00 PM
    };

    field.addValue(timeRange);

    expect(() => field.removeValue(1)).toThrow();
    expect(() => field.getValue(1)).toThrow();
    expect(() => field.removeValue(-1)).toThrow();
    expect(() => field.getValue(-1)).toThrow();
  });

  it('should add values at specific indices', () => {
    const field = new TimeField();

    const morningRange: DateTimeRange = {
      start: 32400000, // 9:00 AM
      end: 43200000, // 12:00 PM
    };

    const afternoonRange: DateTimeRange = {
      start: 46800000, // 1:00 PM
      end: 61200000, // 5:00 PM
    };

    const eveningRange: DateTimeRange = {
      start: 64800000, // 6:00 PM
      end: 72000000, // 8:00 PM
    };

    field.addValue(morningRange);
    field.addValue(eveningRange);

    // Insert at index 1 (between morning and evening)
    field.addValue(afternoonRange, 1);

    expect(field.getValues()).toHaveLength(3);
    expect(field.getValues()[0]).toEqual(morningRange);
    expect(field.getValues()[1]).toEqual(afternoonRange);
    expect(field.getValues()[2]).toEqual(eveningRange);
  });

  it('should throw when adding at invalid index', () => {
    const field = new TimeField();

    const timeRange: DateTimeRange = {
      start: 32400000,
      end: 61200000,
    };

    field.addValue(timeRange);

    const anotherRange: DateTimeRange = {
      start: 64800000,
      end: 72000000,
    };

    expect(() => field.addValue(anotherRange, -1)).toThrow();
    expect(() => field.addValue(anotherRange, 10)).toThrow();
  });
});

// Mock Schedule for testing
const mockSchedule = new Schedule();

describe('TimeField evaluate method', () => {
  it('should return empty array for an empty field', () => {
    const field = new TimeField();
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestamp(2023, 1, 2, 0);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should evaluate a single time range within a single day domain', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000, // 9 AM in milliseconds
      end: 17 * 3600000 - 1, // 4:59:59.999 PM
    };

    const field = new TimeField([businessHours]);

    // Domain: January 1, 2023 (full day)
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 1);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect one range for January 1, 2023 9 AM to 5 PM
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 9));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 16, 59, 59, 999));
    }
  });

  it('should evaluate a single time range across multiple days', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([businessHours]);

    // Domain: January 1-3, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect three ranges, one for each day
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      // January 1, 2023 9 AM to 5 PM
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 9));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 16, 59, 59, 999));

      // January 2, 2023 9 AM to 5 PM
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 2, 9));
      expect(result.value[1].end).toBe(createTimestamp(2023, 1, 2, 16, 59, 59, 999));

      // January 3, 2023 9 AM to 5 PM
      expect(result.value[2].start).toBe(createTimestamp(2023, 1, 3, 9));
      expect(result.value[2].end).toBe(createTimestamp(2023, 1, 3, 16, 59, 59, 999));
    }
  });

  it('should evaluate multiple time ranges within a day', () => {
    // Morning and afternoon shifts
    const morningShift: DateTimeRange = {
      start: 9 * 3600000, // 9 AM
      end: 12 * 3600000 - 1, // 11:59:59.999 AM
    };

    const afternoonShift: DateTimeRange = {
      start: 13 * 3600000, // 1 PM
      end: 17 * 3600000 - 1, // 4:59:59.999 PM
    };

    const field = new TimeField([morningShift, afternoonShift]);

    // Domain: January 1, 2023 (full day)
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 1);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect two ranges for January 1
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // Morning shift
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 9));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 11, 59, 59, 999));

      // Afternoon shift
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 1, 13));
      expect(result.value[1].end).toBe(createTimestamp(2023, 1, 1, 16, 59, 59, 999));
    }
  });

  it('should correctly handle domain boundaries', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([businessHours]);

    // Domain: January 1, 2023 from 10 AM to 3 PM (partial day)
    const startUnix = createTimestamp(2023, 1, 1, 10);
    const endUnix = createTimestamp(2023, 1, 1, 15);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect one range, clipped to the domain boundaries
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix); // 10 AM
      expect(result.value[0].end).toBe(endUnix); // 3 PM
    }
  });

  it('should evaluate time ranges that cross domain boundaries', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([businessHours]);

    // Domain: January 1, 2023 from 3 PM to January 2, 2023 at 11 AM
    const startUnix = createTimestamp(2023, 1, 1, 15);
    const endUnix = createTimestamp(2023, 1, 2, 11);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect two ranges, one for each day, clipped to the domain
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // January 1, from 3 PM to 5 PM
      expect(result.value[0].start).toBe(startUnix); // 3 PM
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 16, 59, 59, 999)); // 4:59:59.999 PM

      // January 2, from 9 AM to 11 AM
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 2, 9)); // 9 AM
      expect(result.value[1].end).toBe(endUnix); // 11 AM
    }
  });

  it('should handle time ranges that span the full day', () => {
    // Full day: midnight to midnight
    const fullDay: DateTimeRange = {
      start: 0, // Midnight
      end: 86399999, // 23:59:59.999
    };

    const field = new TimeField([fullDay]);

    // Domain: January 1-2, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // Since we cover the full day, we expect one continuous range
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should optimize consecutive time ranges', () => {
    // Late night: 10 PM to midnight
    const lateNight: DateTimeRange = {
      start: 22 * 3600000, // 10 PM
      end: 24 * 3600000 - 1, // 11:59:59.999 PM
    };

    // Early morning: midnight to 2 AM
    const earlyMorning: DateTimeRange = {
      start: 0, // Midnight
      end: 2 * 3600000 - 1, // 1:59:59.999 AM
    };

    const field = new TimeField([lateNight, earlyMorning]);

    // Domain: January 1-2, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect ranges to be merged when they connect across midnight
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Rather than having 4 separate ranges, we should have merged ranges
      // 1. Jan 1 12 AM to 2 AM
      // 2. Jan 1 10 PM to Jan 2 2 AM (merged across midnight)
      // 3. Jan 2 10 PM to 12 AM
      expect(result.value.length).toBe(3);

      // Jan 1 12 AM to 2 AM
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 0));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 1, 59, 59, 999));

      // Jan 1 10 PM to Jan 2 2 AM (merged across midnight)
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 1, 22));
      expect(result.value[1].end).toBe(createTimestamp(2023, 1, 2, 1, 59, 59, 999));

      // Jan 2 10 PM to 12 AM
      expect(result.value[2].start).toBe(createTimestamp(2023, 1, 2, 22));
      expect(result.value[2].end).toBe(createTimestamp(2023, 1, 2, 23, 59, 59, 999));
    }
  });

  it('should merge overlapping time ranges within a day', () => {
    // Morning: 9 AM to 12 PM
    const morning: DateTimeRange = {
      start: 9 * 3600000,
      end: 12 * 3600000 - 1,
    };

    // Midday: 11 AM to 2 PM (overlaps with morning)
    const midday: DateTimeRange = {
      start: 11 * 3600000,
      end: 14 * 3600000 - 1,
    };

    // Afternoon: 1 PM to 5 PM (overlaps with midday)
    const afternoon: DateTimeRange = {
      start: 13 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([morning, midday, afternoon]);

    // Domain: January 1, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 1);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect the overlapping ranges to be merged into one
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 9));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 16, 59, 59, 999));
    }
  });

  it('should handle time ranges that combine to cover the full day', () => {
    // First half of day: midnight to noon
    const firstHalf: DateTimeRange = {
      start: 0,
      end: 12 * 3600000 - 1,
    };

    // Second half of day: noon to midnight
    const secondHalf: DateTimeRange = {
      start: 12 * 3600000,
      end: 24 * 3600000 - 1,
    };

    const field = new TimeField([firstHalf, secondHalf]);

    // Domain: January 1-2, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect one continuous range for the full domain
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should handle time ranges with second precision', () => {
    // 9:30:00 AM to 5:45:30 PM
    const workHours: DateTimeRange = {
      start: 9 * 3600000 + 30 * 60000, // 9:30 AM
      end: 17 * 3600000 + 45 * 60000 + 30 * 1000 - 1, // 5:45:29.999 PM
    };

    const field = new TimeField([workHours]);

    // Domain: January 1, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 1);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect one range with precise start and end times
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 9, 30));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 17, 45, 29, 999));
    }
  });

  it('should handle domain where the start is the end', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([businessHours]);

    // Empty domain: start equals end
    const timestamp = createTimestamp(2023, 1, 1, 12);

    const result = field.evaluate(timestamp, timestamp, mockSchedule);

    // We expect a zero-length range at that point in time
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(timestamp);
      expect(result.value[0].end).toBe(timestamp);
    }
  });

  it('should handle domain completely outside active hours', () => {
    // 9 AM to 5 PM
    const businessHours: DateTimeRange = {
      start: 9 * 3600000,
      end: 17 * 3600000 - 1,
    };

    const field = new TimeField([businessHours]);

    // Domain: January 1, 2023 from 6 PM to 8 PM (after business hours)
    const startUnix = createTimestamp(2023, 1, 1, 18);
    const endUnix = createTimestamp(2023, 1, 1, 20);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect no active ranges
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('should handle time ranges that exactly align with days', () => {
    // Full day: midnight to midnight
    const fullDay: DateTimeRange = {
      start: 0, // Midnight
      end: 86399999, // 23:59:59.999
    };

    const field = new TimeField([fullDay]);

    // Domain: January 1, 2023 from midnight to January 2, 2023 at midnight (minus 1ms)
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestamp(2023, 1, 2, 0) - 1; // 1 ms before midnight

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect one continuous range for exactly one day
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should optimize and merge ranges across multiple days', () => {
    // Evening: 8 PM to midnight
    const evening: DateTimeRange = {
      start: 20 * 3600000,
      end: 24 * 3600000 - 1,
    };

    const field = new TimeField([evening]);

    // Domain: January 1-3, 2023
    const startUnix = createTimestamp(2023, 1, 1, 0);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix, mockSchedule);

    // We expect three separate evening periods
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      // January 1 evening
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1, 20));
      expect(result.value[0].end).toBe(createTimestamp(2023, 1, 1, 23, 59, 59, 999));

      // January 2 evening
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 2, 20));
      expect(result.value[1].end).toBe(createTimestamp(2023, 1, 2, 23, 59, 59, 999));

      // January 3 evening
      expect(result.value[2].start).toBe(createTimestamp(2023, 1, 3, 20));
      expect(result.value[2].end).toBe(createTimestamp(2023, 1, 3, 23, 59, 59, 999));
    }
  });
});
