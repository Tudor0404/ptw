// src/schedule/blocks/fields/__tests__/DateTimeField.evaluate.test.ts
import DateTimeField from '../../src/schedule/blocks/fields/DateTimeFields';
import { DateTimeRange } from '../../src/types';
import { createRange, createTimestamp, createTimestampEnd } from '../../src/utils/value';
import { describe, expect, it } from 'vitest';

describe('Basic initialising and value operations', () => {
  it('should create an empty DateTimeField', () => {
    const field = new DateTimeField();
    expect(field).toBeInstanceOf(DateTimeField);
    expect(field.getValues()).toEqual([]);
  });

  it('should create a DateTimeField with initial values', () => {
    const dateTimeRange = createRange([2023, 1, 1], [2023, 1, 1]);

    const field = new DateTimeField([dateTimeRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateTimeRange);
  });

  it('should reject invalid DateTimeRange with end before start', () => {
    const invalidRange: DateTimeRange = {
      start: createTimestampEnd(2023, 1, 1),
      end: createTimestamp(2023, 1, 1),
    };

    expect(() => new DateTimeField([invalidRange])).toThrow();
  });

  it('should accept DateTimeRange with non-midnight start time', () => {
    // This is valid for DateTimeField but not for DateField
    const dateTimeRange: DateTimeRange = {
      start: createTimestamp(2023, 1, 1, 1), // Not at midnight
      end: createTimestampEnd(2023, 1, 1),
    };

    const field = new DateTimeField([dateTimeRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateTimeRange);
  });

  it('should accept DateTimeRange with non-end-of-day end time', () => {
    // This is valid for DateTimeField but not for DateField
    const dateTimeRange: DateTimeRange = {
      start: createTimestamp(2023, 1, 1),
      end: createTimestamp(2023, 1, 1, 22), // Not at end of day
    };

    const field = new DateTimeField([dateTimeRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateTimeRange);
  });

  it('should clone a DateTimeField', () => {
    const dateTimeRange = createRange([2023, 1, 1], [2023, 1, 1]);

    const field = new DateTimeField([dateTimeRange]);
    const cloned = field.clone();

    expect(cloned).toBeInstanceOf(DateTimeField);
    expect(cloned).not.toBe(field); // Different instance
    expect(cloned.getValues()).toEqual(field.getValues());
  });

  it('should add and remove values correctly', () => {
    const field = new DateTimeField();

    const dateTimeRange1 = createRange([2023, 1, 1], [2023, 1, 1]);
    const dateTimeRange2 = createRange([2023, 1, 2], [2023, 1, 2]);

    field.addValue(dateTimeRange1);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateTimeRange1);

    field.addValue(dateTimeRange2);
    expect(field.getValues()).toHaveLength(2);
    expect(field.getValues()[1]).toEqual(dateTimeRange2);

    field.removeValue(0);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateTimeRange2);
  });

  it('should throw when accessing invalid indices', () => {
    const field = new DateTimeField();

    // Try to remove from empty field
    expect(() => field.removeValue(0)).toThrow();

    // Try to get from empty field
    expect(() => field.getValue(0)).toThrow();

    // Add one value then try to access invalid indices
    const dateTimeRange = createRange([2023, 1, 1], [2023, 1, 1]);

    field.addValue(dateTimeRange);

    expect(() => field.removeValue(1)).toThrow();
    expect(() => field.getValue(1)).toThrow();
    expect(() => field.removeValue(-1)).toThrow();
    expect(() => field.getValue(-1)).toThrow();
  });
});

describe('DateTimeField evaluate method', () => {
  it('should return empty array for an empty field', () => {
    const field = new DateTimeField();
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestamp(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should return empty array for a domain with zero length', () => {
    const jan1 = createRange([2023, 1, 1], [2023, 1, 1]);
    const field = new DateTimeField([jan1]);

    const timestamp = createTimestamp(2023, 1, 2, 12);

    const result = field.evaluate(timestamp, timestamp);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('should return empty array if all ranges are outside the domain', () => {
    // January 1-2, 2023
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateTimeField([jan1_2]);

    // Domain: January 3-4, 2023 (after the range)
    const startUnix = createTimestamp(2023, 1, 3);
    const endUnix = createTimestamp(2023, 1, 4);

    const result = field.evaluate(startUnix, endUnix);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('should evaluate a single range that exactly matches the domain', () => {
    // January 1-2, 2023
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateTimeField([jan1_2]);

    // Domain exactly matches the range
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should evaluate a single range that partially overlaps with the domain (clipping at start)', () => {
    // January 1-3, 2023
    const jan1_3 = createRange([2023, 1, 1], [2023, 1, 3]);
    const field = new DateTimeField([jan1_3]);

    // Domain: January 2-4, 2023 (partial overlap)
    const startUnix = createTimestamp(2023, 1, 2);
    const endUnix = createTimestampEnd(2023, 1, 4);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix); // Clipped at domain start
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 3)); // Original range end
    }
  });

  it('should evaluate a single range that partially overlaps with the domain (clipping at end)', () => {
    // January 2-4, 2023
    const jan2_4 = createRange([2023, 1, 2], [2023, 1, 4]);
    const field = new DateTimeField([jan2_4]);

    // Domain: January 1-3, 2023 (partial overlap)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2)); // Original range start
      expect(result.value[0].end).toBe(endUnix); // Clipped at domain end
    }
  });

  it('should evaluate a single range completely contained within the domain', () => {
    // January 2, 2023
    const jan2 = createRange([2023, 1, 2], [2023, 1, 2]);
    const field = new DateTimeField([jan2]);

    // Domain: January 1-3, 2023 (contains the range)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      // Range should be unchanged as it's completely within the domain
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2));
    }
  });

  it('should evaluate a single range that completely contains the domain', () => {
    // January 1-5, 2023
    const jan1_5 = createRange([2023, 1, 1], [2023, 1, 5]);
    const field = new DateTimeField([jan1_5]);

    // Domain: January 2-3, 2023 (contained within the range)
    const startUnix = createTimestamp(2023, 1, 2);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      // Since the range completely contains the domain, we should return the domain itself
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should evaluate multiple non-overlapping ranges', () => {
    // January 1-2 and January 4-5, 2023
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const jan4_5 = createRange([2023, 1, 4], [2023, 1, 5]);
    const field = new DateTimeField([jan1_2, jan4_5]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // First range
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2));

      // Second range
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 4));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 5));
    }
  });

  it('should evaluate multiple overlapping ranges', () => {
    // January 1-3 and January 2-5, 2023 (overlap on January 2-3)
    const jan1_3 = createRange([2023, 1, 1], [2023, 1, 3]);
    const jan2_5 = createRange([2023, 1, 2], [2023, 1, 5]);
    const field = new DateTimeField([jan1_3, jan2_5]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      // After optimization, the overlapping ranges should be merged
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 5));
    }
  });

  it('should evaluate multiple ranges with some outside the domain', () => {
    // December 28-29, 2022, January 2-3, 2023, and January 7-8, 2023
    const dec28_29 = createRange([2022, 12, 28], [2022, 12, 29]);
    const jan2_3 = createRange([2023, 1, 2], [2023, 1, 3]);
    const jan7_8 = createRange([2023, 1, 7], [2023, 1, 8]);
    const field = new DateTimeField([dec28_29, jan2_3, jan7_8]);

    // Domain: January 1-5, 2023 (only includes the middle range)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      // Only the middle range overlaps with the domain
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 3));
    }
  });

  it('should handle multiple adjacent ranges', () => {
    // January 1-2 and January 3-4, 2023 (adjacent but not overlapping)
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const jan3_4 = createRange([2023, 1, 3], [2023, 1, 4]);
    const field = new DateTimeField([jan1_2, jan3_4]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);

    expect(result).not.toBe(false);
    if (result.ok) {
      // After optimization with adjacent ranges (where end+1 = start of next), they should be merged
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 4));
    }
  });

  it('should handle ranges with precise time boundaries', () => {
    // January 1, 2023 from 10 AM to 5 PM
    const jan1_daytime = createRange([2023, 1, 1, 10], [2023, 1, 1, 17]);
    const field = new DateTimeField([jan1_daytime]);

    // Domain: January 1, 2023 from 12 PM to 3 PM (within the range)
    const startUnix = createTimestamp(2023, 1, 1, 12);
    const endUnix = createTimestamp(2023, 1, 1, 15);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should handle unsorted input ranges', () => {
    // January 5-6 and January 1-2, 2023 (out of order)
    const jan5_6 = createRange([2023, 1, 5], [2023, 1, 6]);
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateTimeField([jan5_6, jan1_2]); // Note the order

    // Domain: January 1-7, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 7);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Ranges should be sorted in the result
      expect(result.value.length).toBe(2);

      // First range (January 1-2)
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 2));

      // Second range (January 5-6)
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 5));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 6));
    }
  });
});
