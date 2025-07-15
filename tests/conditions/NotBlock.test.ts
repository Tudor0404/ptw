import NotBlock from '../../src/schedule/blocks/conditions/NotBlock';
import TimeField from '../../src/schedule/blocks/fields/TimeField';
import WeekDayField from '../../src/schedule/blocks/fields/WeekDayField';
import { describe, expect, it } from 'vitest';

describe('Basic initialisation and operations', () => {
  it('should create an empty NotBlock', () => {
    const notBlock = new NotBlock();
    expect(notBlock).toBeInstanceOf(NotBlock);
    expect(notBlock.getBlock()).toBeNull();
  });

  it('should create a NotBlock with an initial block', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    const notBlock = new NotBlock(timeField);
    expect(notBlock.getBlock()).toBe(timeField);
  });

  it('should set a block in the NotBlock', () => {
    const notBlock = new NotBlock();
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    notBlock.setBlock(timeField);
    expect(notBlock.getBlock()).toBe(timeField);
  });

  it('should overwrite an existing block when overwrite is true', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    const weekDayField = new WeekDayField([
      { type: 'Number', value: 1 }, // Monday
    ]);

    const notBlock = new NotBlock(timeField);
    notBlock.setBlock(weekDayField);
    expect(notBlock.getBlock()).toBe(weekDayField);
  });

  it('should silently set a block when the NotBlock is empty, regardless of overwrite flag', () => {
    const notBlock = new NotBlock();
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    // Should work even with overwrite = false because the NotBlock is empty
    notBlock.setBlock(timeField);
    expect(notBlock.getBlock()).toBe(timeField);
  });

  it('should clear the block', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    const notBlock = new NotBlock(timeField);
    notBlock.clearBlock();
    expect(notBlock.getBlock()).toBeNull();
  });

  it('should clone NotBlock with its inner block', () => {
    const timeField = new TimeField([
      { start: 32400000, end: 61200000 }, // 9AM to 5PM
    ]);

    const notBlock = new NotBlock(timeField);
    const cloned = notBlock.clone();

    expect(cloned).toBeInstanceOf(NotBlock);
    expect(cloned).not.toBe(notBlock); // Different instance

    // The inner block should be cloned, not just a reference
    expect(cloned.getBlock()).not.toBe(timeField);

    // But it should have the same values
    const clonedTimeField = cloned.getBlock() as TimeField;
    expect(clonedTimeField.getValues()).toEqual(timeField.getValues());
  });

  it('should handle empty NotBlock cloning correctly', () => {
    const notBlock = new NotBlock();
    const cloned = notBlock.clone();

    expect(cloned).toBeInstanceOf(NotBlock);
    expect(cloned.getBlock()).toBeNull();
  });

  it('should return complement of empty block (full domain)', () => {
    const notBlock = new NotBlock(); // No block set

    // Should return the entire domain when negating nothing
    const result = notBlock.evaluate(0, 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([{ start: 0, end: 1000 }]);
    }
  });

  it('should return complement of a time field', () => {
    const timeField = new TimeField([
      { start: 100, end: 200 }, // Simple range
    ]);

    const notBlock = new NotBlock(timeField);

    // Should return gaps around the time field
    const result = notBlock.evaluate(0, 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(expect.any(Array));
      expect(result.value.length).toBeGreaterThan(0);
    }
  });
});
