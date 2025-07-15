import MonthField from '../../src/schedule/blocks/fields/MonthField';
import { MergeState, ParsedNumericValue } from '../../src/types';
import { createTimestamp, createTimestampEnd } from '../../src/utils/value';
import { describe, expect, it } from 'vitest';

describe('Basic initialising and value operations', () => {
  it('should create an empty MonthField', () => {
    const field = new MonthField();
    expect(field).toBeInstanceOf(MonthField);
    expect(field.getValues()).toEqual([]);
  });

  it('should create a MonthField with simple number values', () => {
    const january: ParsedNumericValue = { type: 'Number', value: 1 };
    const april: ParsedNumericValue = { type: 'Number', value: 4 };
    const december: ParsedNumericValue = { type: 'Number', value: 12 };

    const field = new MonthField([january, april, december]);
    expect(field.getValues()).toHaveLength(3);
    expect(field.getValues()[0]).toEqual(january);
    expect(field.getValues()[1]).toEqual(april);
    expect(field.getValues()[2]).toEqual(december);
  });

  it('should create a MonthField with range values', () => {
    const springMonths: ParsedNumericValue = { type: 'Range', start: 3, end: 5 }; // March to May
    const field = new MonthField([springMonths]);

    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(springMonths);
  });

  it('should create a MonthField with algebraic values', () => {
    // Every odd month
    const oddMonths: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 1,
    };

    const field = new MonthField([oddMonths]);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(oddMonths);
  });

  it('should reject values below the valid month range (1-12)', () => {
    const invalidLow: ParsedNumericValue = { type: 'Number', value: 0 };
    expect(() => new MonthField([invalidLow])).toThrow();

    const invalidLowRange: ParsedNumericValue = { type: 'Range', start: 0, end: 5 };
    expect(() => new MonthField([invalidLowRange])).toThrow();
  });

  it('should reject values above the valid month range (1-12)', () => {
    const invalidHigh: ParsedNumericValue = { type: 'Number', value: 13 };
    expect(() => new MonthField([invalidHigh])).toThrow();

    const invalidHighRange: ParsedNumericValue = { type: 'Range', start: 10, end: 13 };
    expect(() => new MonthField([invalidHighRange])).toThrow();
  });

  it('should reject invalid range with start > end', () => {
    const invalidRange: ParsedNumericValue = { type: 'Range', start: 12, end: 1 };
    expect(() => new MonthField([invalidRange])).toThrow();
  });

  it('should reject invalid algebraic expressions', () => {
    // Negative coefficient
    const invalidAlgebraic1: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: -2,
      operator: '+',
      constantY: 1,
    };
    expect(() => new MonthField([invalidAlgebraic1])).toThrow();

    // Negative constant
    const invalidAlgebraic2: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: -1,
    };
    expect(() => new MonthField([invalidAlgebraic2])).toThrow();

    // Too large coefficient/constant (just using an arbitrary large number)
    const invalidAlgebraic3: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 10000,
      operator: '+',
      constantY: 1,
    };
    expect(() => new MonthField([invalidAlgebraic3])).toThrow();
  });

  it('should clone a MonthField', () => {
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 },
      { type: 'Range', start: 3, end: 5 },
      { type: 'Algebraic', coefficientN: 2, operator: '+', constantY: 1 },
    ];

    const field = new MonthField(values);
    const cloned = field.clone();

    expect(cloned).toBeInstanceOf(MonthField);
    expect(cloned).not.toBe(field); // Different instance
    expect(cloned.getValues()).toEqual(field.getValues());
  });

  it('should add and remove values correctly', () => {
    const field = new MonthField();

    const january: ParsedNumericValue = { type: 'Number', value: 1 };
    const june: ParsedNumericValue = { type: 'Number', value: 6 };

    field.addValue(january);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(january);

    field.addValue(june);
    expect(field.getValues()).toHaveLength(2);
    expect(field.getValues()[1]).toEqual(june);

    field.removeValue(0);
    expect(field.getValues()).toHaveLength(1);
    expect(field.getValues()[0]).toEqual(june);
  });

  it('should throw when accessing invalid indices', () => {
    const field = new MonthField();

    // Try to remove from empty field
    expect(() => field.removeValue(0)).toThrow();

    // Try to get from empty field
    expect(() => field.getValue(0)).toThrow();

    // Add one value then try to access invalid indices
    const january: ParsedNumericValue = { type: 'Number', value: 1 };
    field.addValue(january);

    expect(() => field.removeValue(1)).toThrow();
    expect(() => field.getValue(1)).toThrow();
    expect(() => field.removeValue(-1)).toThrow();
    expect(() => field.getValue(-1)).toThrow();
  });
});

describe('MonthField evaluate method', () => {
  it('should return empty array for an empty field', () => {
    const field = new MonthField();
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestamp(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should evaluate a single month value', () => {
    // January only
    const january: ParsedNumericValue = { type: 'Number', value: 1 };
    const field = new MonthField([january]);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);

      // Should correspond to January 2023
      const janStart = createTimestamp(2023, 1, 1);
      const janEnd = createTimestampEnd(2023, 1, 31);

      expect(result.value[0].start).toBe(janStart);
      expect(result.value[0].end).toBe(janEnd);
    }
  });

  it('should evaluate a month range', () => {
    // Spring months: March-May
    const spring: ParsedNumericValue = { type: 'Range', start: 3, end: 5 };
    const field = new MonthField([spring]);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);

      // Should correspond to March-May 2023
      const springStart = createTimestamp(2023, 3, 1);
      const springEnd = createTimestampEnd(2023, 5, 31);

      expect(result.value[0].start).toBe(springStart);
      expect(result.value[0].end).toBe(springEnd);
    }
  });

  it('should evaluate an algebraic month expression for odd months', () => {
    // Odd months (January, March, May, July, September, November)
    const oddMonths: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '-',
      constantY: 1,
    };
    const field = new MonthField([oddMonths]);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(6);

      // Check each odd month
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1)); // January
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      expect(result.value[1].start).toBe(createTimestamp(2023, 3, 1)); // March
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 3, 31));

      expect(result.value[2].start).toBe(createTimestamp(2023, 5, 1)); // May
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 5, 31));

      expect(result.value[3].start).toBe(createTimestamp(2023, 7, 1)); // July
      expect(result.value[3].end).toBe(createTimestampEnd(2023, 7, 31));

      expect(result.value[4].start).toBe(createTimestamp(2023, 9, 1)); // September
      expect(result.value[4].end).toBe(createTimestampEnd(2023, 9, 30));

      expect(result.value[5].start).toBe(createTimestamp(2023, 11, 1)); // November
      expect(result.value[5].end).toBe(createTimestampEnd(2023, 11, 30));
    }
  });

  it('should evaluate an algebraic month expression for even months', () => {
    // Even months (February, April, June, August, October, December)
    const evenMonths: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 2,
      operator: '+',
      constantY: 0,
    };
    const field = new MonthField([evenMonths]);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(6);

      // Check each even month
      expect(result.value[0].start).toBe(createTimestamp(2023, 2, 1)); // February
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 2, 28)); // Non-leap year

      expect(result.value[1].start).toBe(createTimestamp(2023, 4, 1)); // April
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 4, 30));

      expect(result.value[2].start).toBe(createTimestamp(2023, 6, 1)); // June
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 6, 30));

      expect(result.value[3].start).toBe(createTimestamp(2023, 8, 1)); // August
      expect(result.value[3].end).toBe(createTimestampEnd(2023, 8, 31));

      expect(result.value[4].start).toBe(createTimestamp(2023, 10, 1)); // October
      expect(result.value[4].end).toBe(createTimestampEnd(2023, 10, 31));

      expect(result.value[5].start).toBe(createTimestamp(2023, 12, 1)); // December
      expect(result.value[5].end).toBe(createTimestampEnd(2023, 12, 31));
    }
  });

  it('should evaluate quarterly months', () => {
    // Quarterly: January, April, July, October
    const quarterly: ParsedNumericValue = {
      type: 'Algebraic',
      coefficientN: 3,
      operator: '-',
      constantY: 2,
    };
    const field = new MonthField([quarterly]);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(4);

      // Check each quarter
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1)); // January
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      expect(result.value[1].start).toBe(createTimestamp(2023, 4, 1)); // April
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 4, 30));

      expect(result.value[2].start).toBe(createTimestamp(2023, 7, 1)); // July
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 7, 31));

      expect(result.value[3].start).toBe(createTimestamp(2023, 10, 1)); // October
      expect(result.value[3].end).toBe(createTimestampEnd(2023, 10, 31));
    }
  });

  it('should evaluate multiple month values', () => {
    // January, March, and December
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 3 }, // March
      { type: 'Number', value: 12 }, // December
    ];
    const field = new MonthField(values);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      // Check each specified month
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1)); // January
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      expect(result.value[1].start).toBe(createTimestamp(2023, 3, 1)); // March
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 3, 31));

      expect(result.value[2].start).toBe(createTimestamp(2023, 12, 1)); // December
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 12, 31));
    }
  });

  it('should evaluate a mix of month specifications', () => {
    // Q1 (Jan-Mar) and December
    const values: ParsedNumericValue[] = [
      { type: 'Range', start: 1, end: 3 }, // Q1
      { type: 'Number', value: 12 }, // December
    ];
    const field = new MonthField(values);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // Q1 as a single continuous range
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 3, 31));

      // December
      expect(result.value[1].start).toBe(createTimestamp(2023, 12, 1));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 12, 31));
    }
  });

  it('should handle domain boundaries correctly', () => {
    // All months
    const allMonths: ParsedNumericValue = { type: 'Range', start: 1, end: 12 };
    const field = new MonthField([allMonths]);

    // Domain: March 15, 2023 to July 15, 2023
    const startUnix = createTimestamp(2023, 3, 15);
    const endUnix = createTimestamp(2023, 7, 15);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);

      // Since all months are active, should return the entire domain
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(endUnix);
    }
  });

  it('should handle partial months correctly', () => {
    // January and July only
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 7 }, // July
    ];
    const field = new MonthField(values);

    // Domain: January 15, 2023 to July 15, 2023
    const startUnix = createTimestamp(2023, 1, 15);
    const endUnix = createTimestamp(2023, 7, 15);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // Partial January (15th to end of month)
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      // Partial July (beginning to 15th)
      expect(result.value[1].start).toBe(createTimestamp(2023, 7, 1));
      expect(result.value[1].end).toBe(endUnix);
    }
  });

  it('should handle multiple years correctly', () => {
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 12 }, // December
    ];
    const field = new MonthField(values);

    // Domain: December 15, 2022 to January 15, 2024
    const startUnix = createTimestamp(2022, 12, 15);
    const endUnix = createTimestampEnd(2024, 1, 15);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);

      // Partial December 2022
      expect(result.value[0].start).toBe(startUnix);
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      // Full January 2023 and December 2023
      expect(result.value[1].start).toBe(createTimestamp(2023, 12, 1));
      expect(result.value[1].end).toBe(endUnix);
    }
  });

  it('should return empty array when no months match', () => {
    // February only
    const february: ParsedNumericValue = { type: 'Number', value: 2 };
    const field = new MonthField([february]);

    // Domain: March to April 2023 (no February)
    const startUnix = createTimestamp(2023, 3, 1);
    const endUnix = createTimestampEnd(2023, 4, 30);

    const result = field.evaluate(startUnix, endUnix);

    // No matches should return empty array
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('should optimize adjacent months into ranges', () => {
    // January, February, March, May, June (with a gap in April)
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 2 }, // February
      { type: 'Number', value: 3 }, // March
      { type: 'Number', value: 5 }, // May
      { type: 'Number', value: 6 }, // June
    ];
    const field = new MonthField(values);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should optimize into two ranges: Jan-Mar and May-Jun
      expect(result.value.length).toBe(2);

      // January to March
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 3, 31));

      // May to June
      expect(result.value[1].start).toBe(createTimestamp(2023, 5, 1));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 6, 30));
    }
  });

  it('should handle leap years correctly', () => {
    // February only
    const february: ParsedNumericValue = { type: 'Number', value: 2 };
    const field = new MonthField([february]);

    // Domain: Full year for 2020 (leap year)
    const startUnix = createTimestamp(2020, 1, 1);
    const endUnix = createTimestampEnd(2020, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);

      // February in a leap year has 29 days
      expect(result.value[0].start).toBe(createTimestamp(2020, 2, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2020, 2, 29));
    }

    // Compare with non-leap year
    const startUnixNonLeap = createTimestamp(2023, 1, 1);
    const endUnixNonLeap = createTimestampEnd(2023, 12, 31);

    const resultNonLeap = field.evaluate(startUnixNonLeap, endUnixNonLeap);

    expect(resultNonLeap.ok).toBe(true);
    if (resultNonLeap.ok) {
      expect(resultNonLeap.value.length).toBe(1);

      // February in a non-leap year has 28 days
      expect(resultNonLeap.value[0].start).toBe(createTimestamp(2023, 2, 1));
      expect(resultNonLeap.value[0].end).toBe(createTimestampEnd(2023, 2, 28));
    }
  });

  it('should correctly handle a domain spanning multiple years with selected months', () => {
    // Summer months only (June, July, August)
    const summerMonths: ParsedNumericValue = { type: 'Range', start: 6, end: 8 };
    const field = new MonthField([summerMonths]);

    const startUnix = createTimestamp(2022, 1, 1);
    const endUnix = createTimestampEnd(2024, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3); // 3 summers

      // Summer 2022
      expect(result.value[0].start).toBe(createTimestamp(2022, 6, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2022, 8, 31));

      // Summer 2023
      expect(result.value[1].start).toBe(createTimestamp(2023, 6, 1));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 8, 31));

      // Summer 2024
      expect(result.value[2].start).toBe(createTimestamp(2024, 6, 1));
      expect(result.value[2].end).toBe(createTimestampEnd(2024, 8, 31));
    }
  });

  it('should handle complex month combinations and evaluate them efficiently', () => {
    // January, April-June, December
    const values: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Range', start: 4, end: 6 }, // April-June
      { type: 'Number', value: 12 }, // December
    ];
    const field = new MonthField(values);

    // Domain: Full year 2023
    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    // Measure performance
    const startTime = performance.now();
    const result = field.evaluate(startUnix, endUnix);
    const endTime = performance.now();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);

      // January
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      // April-June
      expect(result.value[1].start).toBe(createTimestamp(2023, 4, 1));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 6, 30));

      // December
      expect(result.value[2].start).toBe(createTimestamp(2023, 12, 1));
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 12, 31));
    }

    // Performance assertion
    const duration = endTime - startTime;
    console.log(`Complex month evaluation took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50); // Should be quite fast
  });

  it('should handle zero-length domain', () => {
    // All months
    const allMonths: ParsedNumericValue = { type: 'Range', start: 1, end: 12 };
    const field = new MonthField([allMonths]);

    // Domain with zero length: July 15, 2023 at noon
    const timestamp = createTimestamp(2023, 7, 15, 12);

    const result = field.evaluate(timestamp, timestamp);

    // Empty domain should still produce a match, but with zero duration
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(timestamp);
      expect(result.value[0].end).toBe(timestamp);
    }
  });
});

describe('MonthField merge behavior', () => {
  it('should merge consecutive months by default', () => {
    // Months 1, 2, 3 (consecutive)
    const months: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 2 }, // February
      { type: 'Number', value: 3 }, // March
    ];
    const field = new MonthField(months);

    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should merge into one continuous range
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 3, 31));
    }
  });

  it('should not merge consecutive months when merge state is EXPLICIT_OFF', () => {
    // Months 1, 2, 3 (consecutive)
    const months: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 2 }, // February
      { type: 'Number', value: 3 }, // March
    ];
    const field = new MonthField(months);
    field.setMerge(MergeState.EXPLICIT_OFF);

    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should NOT merge - each month is separate
      expect(result.value.length).toBe(3);

      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 1, 31));

      expect(result.value[1].start).toBe(createTimestamp(2023, 2, 1));
      expect(result.value[1].end).toBe(createTimestampEnd(2023, 2, 28));

      expect(result.value[2].start).toBe(createTimestamp(2023, 3, 1));
      expect(result.value[2].end).toBe(createTimestampEnd(2023, 3, 31));
    }
  });

  it('should merge consecutive months when merge state is EXPLICIT_ON', () => {
    // Months 1, 2, 3 (consecutive)
    const months: ParsedNumericValue[] = [
      { type: 'Number', value: 1 }, // January
      { type: 'Number', value: 2 }, // February
      { type: 'Number', value: 3 }, // March
    ];
    const field = new MonthField(months);
    field.setMerge(MergeState.EXPLICIT_ON);

    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    const result = field.evaluate(startUnix, endUnix);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should merge into one continuous range
      expect(result.value.length).toBe(1);
      expect(result.value[0].start).toBe(createTimestamp(2023, 1, 1));
      expect(result.value[0].end).toBe(createTimestampEnd(2023, 3, 31));
    }
  });

  it('should respect merge parameter when merge state is DEFAULT', () => {
    const months: ParsedNumericValue[] = [
      { type: 'Number', value: 6 }, // June
      { type: 'Number', value: 7 }, // July
    ];
    const field = new MonthField(months);

    const startUnix = createTimestamp(2023, 1, 1);
    const endUnix = createTimestampEnd(2023, 12, 31);

    // Test with merge=false
    const resultNoMerge = field.evaluate(startUnix, endUnix, null, false);
    expect(resultNoMerge.ok).toBe(true);
    if (resultNoMerge.ok) {
      expect(resultNoMerge.value.length).toBe(2); // Separate ranges
    }

    // Test with merge=true
    const resultMerge = field.evaluate(startUnix, endUnix, null, true);
    if (resultMerge.ok) {
      expect(resultMerge.value.length).toBe(1); // Merged range
    }
  });
});
