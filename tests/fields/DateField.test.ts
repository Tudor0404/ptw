import DateField from '../../src/schedule/blocks/fields/DateField';
import { DateTimeRange } from '../../src/types';
import { createRange, createTimestamp, createTimestampEnd } from '../../src/utils/value';
import { describe, expect, it } from 'vitest';

describe('Basic initialising and value operations', () => {
  it('should create an empty DateField', () => {
    const field = new DateField();
    expect(field).toBeInstanceOf(DateField);
    expect(field.getValues()).toEqual([]);
  });

  it('should create a DateField with initial values', () => {
    const dateRange = createRange([2023, 1, 1], [2023, 1, 1]);

    const field = new DateField([dateRange]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateRange);
  });

  it('should reject invalid DateTimeRange with non-midnight start time', () => {
    const dateRange: DateTimeRange = {
      start: createTimestamp(2023, 1, 1, 1), // Not at midnight
      end: createTimestampEnd(2023, 1, 1),
    };

    expect(() => new DateField([dateRange])).toThrow();
  });

  it('should reject invalid DateTimeRange with non-end-of-day end time', () => {
    const dateRange: DateTimeRange = {
      start: createTimestamp(2023, 1, 1),
      end: createTimestamp(2023, 1, 1, 22), // Not at end of day
    };

    expect(() => new DateField([dateRange])).toThrow();
  });

  it('should reject DateTimeRange with end before start', () => {
    const dateRange: DateTimeRange = {
      start: createTimestamp(2023, 1, 2),
      end: createTimestampEnd(2023, 1, 1),
    };

    expect(() => new DateField([dateRange])).toThrow();
  });

  it('should clone a DateField', () => {
    const dateRange = createRange([2023, 1, 1], [2023, 1, 1]);

    const field = new DateField([dateRange]);
    const cloned = field.clone();

    expect(cloned).toBeInstanceOf(DateField);
    expect(cloned).not.toBe(field); // Different instance
    expect(cloned.getValues()).toEqual(field.getValues());
  });

  it('should add and remove values correctly', () => {
    const field = new DateField();

    const dateRange1 = createRange([2023, 1, 1], [2023, 1, 1]);
    const dateRange2 = createRange([2023, 1, 2], [2023, 1, 2]);

    field.addValue(dateRange1);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateRange1);

    field.addValue(dateRange2);
    expect(field.getValues()).toHaveLength(2);
    expect(field.getValues()[1]).toEqual(dateRange2);

    field.removeValue(0);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(dateRange2);
  });

  it('should throw when accessing invalid indices', () => {
    const field = new DateField();

    // Try to remove from empty field
    expect(() => field.removeValue(0)).toThrow();

    // Try to get from empty field
    expect(() => field.getValue(0)).toThrow();

    // Add one value then try to access invalid indices
    const dateRange = createRange([2023, 1, 1], [2023, 1, 1]);

    field.addValue(dateRange);

    expect(() => field.removeValue(1)).toThrow();
    expect(() => field.getValue(1)).toThrow();
    expect(() => field.removeValue(-1)).toThrow();
    expect(() => field.getValue(-1)).toThrow();
  });
});

describe('DateField evaluate method', () => {
  it('should return empty array for an empty field', () => {
    const field = new DateField();
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestamp(2023, 1, 2);

    const result = field.evaluate(startUnix, endUnix);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should return an empty array if all ranges are outside the domain', () => {
    // January 1-2, 2023
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateField([jan1_2]);

    // Domain: January 3-4, 2023 (after the range)
    const startUnix = createTimestamp(2023, 1, 3);
    const endUnix = createTimestamp(2023, 1, 4);

    const result = field.evaluate(startUnix, endUnix);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should evaluate a single range that exactly matches the domain', () => {
    // January 1-2, 2023
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateField([jan1_2]);

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

  it('should evaluate a single range that partially overlaps the domain (clipping at start)', () => {
    // January 1-3, 2023
    const jan1_3 = createRange([2023, 1, 1], [2023, 1, 3]);
    const field = new DateField([jan1_3]);

    // Domain: January 2-4, 2023 (partial overlap)
    const startUnix = createTimestamp(2023, 1, 2);
    const endUnix = createTimestampEnd(2023, 1, 4);

    const result = field.evaluate(startUnix, endUnix);

    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix); // Clipped at domain start
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 3)); // Original range end
    }
  });

  it('should evaluate a single range that partially overlaps the domain (clipping at end)', () => {
    // January 2-4, 2023
    const jan2_4 = createRange([2023, 1, 2], [2023, 1, 4]);
    const field = new DateField([jan2_4]);

    // Domain: January 1-3, 2023 (partial overlap)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix);


    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2)); // Original range start
      expect(result.value[0].end).toBe(endUnix); // Clipped at domain end
    }
  });

  it('should evaluate a single range completely contained within the domain', () => {
    // January 2, 2023
    const jan2 = createRange([2023, 1, 2], [2023, 1, 2]);
    const field = new DateField([jan2]);

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
    const field = new DateField([jan1_5]);

    // Domain: January 2-3, 2023 (contained within the range)
    const startUnix = createTimestamp(2023, 1, 2);
    const endUnix = createTimestampEnd(2023, 1, 3);

    const result = field.evaluate(startUnix, endUnix);


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
    const field = new DateField([jan1_2, jan4_5]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);


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
    const field = new DateField([jan1_3, jan2_5]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);


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
    const field = new DateField([dec28_29, jan2_3, jan7_8]);

    // Domain: January 1-5, 2023 (only includes the middle range)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);

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
    const field = new DateField([jan1_2, jan3_4]);

    // Domain: January 1-5, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 5);

    const result = field.evaluate(startUnix, endUnix);


    if (result.ok) {
      // After optimization with adjacent ranges (where end+1 = start of next), they should be merged
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 4));
    }
  });

  it('should handle unsorted input ranges', () => {
    // January 5-6 and January 1-2, 2023 (out of order)
    const jan5_6 = createRange([2023, 1, 5], [2023, 1, 6]);
    const jan1_2 = createRange([2023, 1, 1], [2023, 1, 2]);
    const field = new DateField([jan5_6, jan1_2]); // Note the order

    // Domain: January 1-7, 2023 (contains both ranges)
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 1, 7);

    const result = field.evaluate(startUnix, endUnix);


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

  it('should handle a domain that partially intersects multiple ranges', () => {
    // January 1-3, January 5-7, and January 9-11, 2023
    const jan1_3 = createRange([2023, 1, 1], [2023, 1, 3]);
    const jan5_7 = createRange([2023, 1, 5], [2023, 1, 7]);
    const jan9_11 = createRange([2023, 1, 9], [2023, 1, 11]);
    const field = new DateField([jan1_3, jan5_7, jan9_11]);

    // Domain: January 2-10, 2023 (partially overlaps with all ranges)
    const startUnix = createTimestamp(2023, 1, 2);
    const endUnix = createTimestampEnd(2023, 1, 10);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      // First range - clipped at start
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 2));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 3));

      // Second range - unchanged
      expect(result.value[1].start).toBe(createTimestamp(2023, 1, 5));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 1, 7));

      // Third range - clipped at end
      expect(result.value[2].start).toBe(createTimestamp(2023, 1, 9));
      expect(result.value[2].end).toBe(endUnix);
    }
  });

  it('should handle domain boundaries that fall inside days', () => {
    // January 1-5, 2023
    const jan1_5 = createRange([2023, 1, 1], [2023, 1, 5]);
    const field = new DateField([jan1_5]);

    // Domain: January 1 at noon to January 4 at noon
    const startUnix = createTimestamp(2023, 1, 1, 12);
    const endUnix = createTimestamp(2023, 1, 4, 12);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Since the range completely contains the domain, we should return the domain
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should perform very efficiently for large date ranges', () => {
    // Create a larger date range spanning a year with small gaps
    const ranges: DateTimeRange[] = [];

    // Create ranges for each month of 2023, with a 1-day gap between each month
    for (let month = 1; month <= 12; month++) {
      const lastDay = new Date(2023, month, 0).getDate(); // Last day of month
      const startDay = month === 1 ? 1 : 2; // Skip first day except for January

      ranges.push(createRange([2023, month, startDay], [2023, month, lastDay]));
    }

    const field = new DateField(ranges);

    // Domain: entire year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    // Measure performance
    const startTime = performance.now();
    const result = field.evaluate(startUnix, endUnix);
    const endTime = performance.now();

    // Assert results
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should have 12 ranges (one per month), with the first day of each month missing (except January)
      expect(result.value.length).toBe(12);

      // First range should be all of January
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));

      // Last range should end at the end of December
      expect(result.value[result.value.length - 1].end).toBe(createTimestampEnd(2023, 12, 31));
    }

    // Performance assertion (should be very fast, under 10ms)
    // This is a soft assertion because it depends on the test environment
    const duration = endTime - startTime;
    console.log(`Large date range evaluation took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50); // Very generous upper bound
  });
});
