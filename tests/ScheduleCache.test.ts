import ScheduleCache from '../src/cache/ScheduleCache';
import { DateTimeRange, IBlock, Result } from '../src/types';
import { success } from '../src/utils/result';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock block for testing
class MockBlock implements IBlock {
  constructor(private hash: string) {
  }

  getHash(): string {
    return this.hash;
  }

  evaluate(): Result<DateTimeRange[], Error> {
    return success([]);
  }

  evaluateTimestamp(): Result<boolean, Error> {
    return success(false);
  }

  toString(): string {
    return `Mock(${this.hash})`;
  }

  clone(): IBlock {
    return new MockBlock(this.hash);
  }
}

describe('ScheduleCache', () => {
  let cache: ScheduleCache;
  let mockBlock: MockBlock;

  beforeEach(() => {
    cache = new ScheduleCache({ maxSize: 3 });
    mockBlock = new MockBlock('test-hash');
  });

  describe('basic operations', () => {
    it('should return null for cache miss', () => {
      const result = cache.get(mockBlock, 100, 200);
      expect(result).toBeNull();
    });

    it('should store and retrieve exact matches', () => {
      const ranges: DateTimeRange[] = [{ start: 150, end: 180 }];

      cache.set(mockBlock, 100, 200, ranges);
      const result = cache.get(mockBlock, 100, 200);

      expect(result).toEqual(ranges);
      expect(result).not.toBe(ranges); // Should be cloned
    });

    it('should handle empty ranges', () => {
      const ranges: DateTimeRange[] = [];

      cache.set(mockBlock, 100, 200, ranges);
      const result = cache.get(mockBlock, 100, 200);

      expect(result).toEqual([]);
    });

    it('should handle multiple ranges', () => {
      const ranges: DateTimeRange[] = [
        { start: 110, end: 120 },
        { start: 150, end: 180 },
        { start: 190, end: 195 },
      ];

      cache.set(mockBlock, 100, 200, ranges);
      const result = cache.get(mockBlock, 100, 200);

      expect(result).toEqual(ranges);
    });
  });

  describe('subset extraction', () => {
    it('should extract subset when requested range is within cached range', () => {
      const ranges: DateTimeRange[] = [
        { start: 110, end: 150 },
        { start: 160, end: 190 },
      ];

      cache.set(mockBlock, 100, 200, ranges);

      // Request subset [120, 180] from cached [100, 200]
      const result = cache.get(mockBlock, 120, 180);

      expect(result).toEqual([
        { start: 120, end: 150 }, // Trimmed first range
        { start: 160, end: 180 }, // Trimmed second range
      ]);
    });

    it('should handle subset with no intersections', () => {
      const ranges: DateTimeRange[] = [{ start: 110, end: 120 }];

      cache.set(mockBlock, 100, 200, ranges);

      // Request subset [150, 180] - no intersection
      const result = cache.get(mockBlock, 150, 180);

      expect(result).toEqual([]);
    });

    it('should handle partial intersections in subset', () => {
      const ranges: DateTimeRange[] = [
        { start: 110, end: 150 },
        { start: 170, end: 190 },
      ];

      cache.set(mockBlock, 100, 200, ranges);

      // Request subset [130, 175] - partial intersections
      const result = cache.get(mockBlock, 130, 175);

      expect(result).toEqual([
        { start: 130, end: 150 },
        { start: 170, end: 175 },
      ]);
    });

    it('should extract exact boundaries', () => {
      const ranges: DateTimeRange[] = [{ start: 120, end: 180 }];

      cache.set(mockBlock, 100, 200, ranges);

      // Request exact subset boundaries
      const result = cache.get(mockBlock, 120, 180);

      expect(result).toEqual([{ start: 120, end: 180 }]);
    });

    it('should handle binary search edge cases efficiently', () => {
      // Test with many ranges to verify binary search efficiency
      const ranges: DateTimeRange[] = [];
      for (let i = 0; i < 100; i++) {
        ranges.push({ start: i * 10, end: i * 10 + 5 });
      }

      cache.set(mockBlock, 0, 1000, ranges);

      // Test subset extraction at beginning
      const beginning = cache.get(mockBlock, 0, 50);
      expect(beginning).toHaveLength(6); // Should find ranges 0-5: [0,5], [10,15], [20,25], [30,35], [40,45], [50,55]

      // Test subset extraction in middle
      const middle = cache.get(mockBlock, 450, 550);
      expect(middle).toHaveLength(11); // Should find ranges around 450-550

      // Test subset extraction at end
      const end = cache.get(mockBlock, 950, 1000);
      expect(end).toHaveLength(5); // Should find ranges 95-99: [950,955], [960,965], [970,975], [980,985], [990,995]

      // Test no intersection within domain (gap between ranges)
      const noIntersection = cache.get(mockBlock, 506, 508);
      expect(noIntersection).toEqual([]);
    });

    it('should handle single range binary search', () => {
      const ranges: DateTimeRange[] = [{ start: 500, end: 600 }];

      cache.set(mockBlock, 0, 1000, ranges);

      // Before range
      expect(cache.get(mockBlock, 100, 200)).toEqual([]);

      // Intersecting range
      expect(cache.get(mockBlock, 550, 650)).toEqual([{ start: 550, end: 600 }]);

      // After range
      expect(cache.get(mockBlock, 700, 800)).toEqual([]);
    });
  });

  describe('cache expansion', () => {
    it('should replace existing entry when new range expands it', () => {
      // Cache smaller range first with specific data
      cache.set(mockBlock, 200, 300, [{ start: 250, end: 280 }]);
      expect(cache.size()).toBe(1);

      // Verify original data
      expect(cache.get(mockBlock, 200, 300)).toEqual([{ start: 250, end: 280 }]);

      // Set larger range that expands the cached one with different data
      cache.set(mockBlock, 100, 400, [{ start: 150, end: 350 }]);
      expect(cache.size()).toBe(1);

      // Should have the new expanded range
      const result = cache.get(mockBlock, 100, 400);
      expect(result).toEqual([{ start: 150, end: 350 }]);

      // When requesting [200, 300] now, it should extract from the larger range
      // giving different data than the original [250, 280]
      const subsetResult = cache.get(mockBlock, 200, 300);
      expect(subsetResult).toEqual([{ start: 200, end: 300 }]); // Extracted from [150, 350]
      expect(subsetResult).not.toEqual([{ start: 250, end: 280 }]); // Not the original data
    });

    it('should not expand when ranges do not overlap properly', () => {
      // Cache range [200, 300]
      cache.set(mockBlock, 200, 300, [{ start: 250, end: 280 }]);

      // Try to cache non-overlapping range [400, 500]
      cache.set(mockBlock, 400, 500, [{ start: 450, end: 480 }]);

      expect(cache.size()).toBe(2);

      // Both should be accessible
      expect(cache.get(mockBlock, 200, 300)).toEqual([{ start: 250, end: 280 }]);
      expect(cache.get(mockBlock, 400, 500)).toEqual([{ start: 450, end: 480 }]);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when cache is full', async () => {
      const block1 = new MockBlock('hash1');
      const block2 = new MockBlock('hash2');
      const block3 = new MockBlock('hash3');
      const block4 = new MockBlock('hash4');

      // Fill cache to capacity with small delays to ensure different timestamps
      cache.set(block1, 100, 200, []);
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block2, 100, 200, []);
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block3, 100, 200, []);
      expect(cache.size()).toBe(3);

      // Access block1 to make it recently used
      await new Promise((resolve) => setTimeout(resolve, 2));
      const accessResult = cache.get(block1, 100, 200);
      expect(accessResult).toEqual([]); // Should find block1

      // Add fourth item, should evict block2 (oldest unaccessed)
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block4, 100, 200, []);
      expect(cache.size()).toBe(3);

      // block1 should still be in cache
      expect(cache.get(block1, 100, 200)).toEqual([]);

      // block2 should be evicted
      expect(cache.get(block2, 100, 200)).toBeNull();

      // block3 and block4 should be in cache
      expect(cache.get(block3, 100, 200)).toEqual([]);
      expect(cache.get(block4, 100, 200)).toEqual([]);
    });

    it('should update access time on subset extraction', async () => {
      const block1 = new MockBlock('hash1');
      const block2 = new MockBlock('hash2');
      const block3 = new MockBlock('hash3');
      const block4 = new MockBlock('hash4');

      // Fill cache
      cache.set(block1, 100, 300, [{ start: 150, end: 250 }]);
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block2, 100, 200, []);
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block3, 100, 200, []);

      // Access block1 via subset extraction to make it recently used
      await new Promise((resolve) => setTimeout(resolve, 2));
      const subset = cache.get(block1, 150, 200);
      expect(subset).toEqual([{ start: 150, end: 200 }]);

      // Add fourth item
      await new Promise((resolve) => setTimeout(resolve, 1));
      cache.set(block4, 100, 200, []);

      // block1 should still be in cache (accessed via subset)
      expect(cache.get(block1, 100, 300)).toEqual([{ start: 150, end: 250 }]);

      // block2 should be evicted
      expect(cache.get(block2, 100, 200)).toBeNull();
    });
  });

  describe('cache key differentiation', () => {
    it('should differentiate between different blocks', () => {
      const block1 = new MockBlock('hash1');
      const block2 = new MockBlock('hash2');

      cache.set(block1, 100, 200, [{ start: 150, end: 180 }]);
      cache.set(block2, 100, 200, [{ start: 120, end: 160 }]);

      expect(cache.get(block1, 100, 200)).toEqual([{ start: 150, end: 180 }]);
      expect(cache.get(block2, 100, 200)).toEqual([{ start: 120, end: 160 }]);
    });

    it('should differentiate between different time ranges for same block', () => {
      cache.set(mockBlock, 100, 200, [{ start: 150, end: 180 }]);
      cache.set(mockBlock, 300, 400, [{ start: 320, end: 360 }]);

      expect(cache.get(mockBlock, 100, 200)).toEqual([{ start: 150, end: 180 }]);
      expect(cache.get(mockBlock, 300, 400)).toEqual([{ start: 320, end: 360 }]);
      expect(cache.get(mockBlock, 200, 300)).toBeNull();
    });

    it('should handle overlapping ranges for same block', () => {
      cache.set(mockBlock, 100, 200, [{ start: 150, end: 180 }]);
      cache.set(mockBlock, 150, 250, [{ start: 170, end: 220 }]);

      // Both should be accessible
      expect(cache.get(mockBlock, 100, 200)).toEqual([{ start: 150, end: 180 }]);
      expect(cache.get(mockBlock, 150, 250)).toEqual([{ start: 170, end: 220 }]);

      // Subset of first range
      expect(cache.get(mockBlock, 160, 190)).toEqual([{ start: 160, end: 180 }]);

      // Subset of second range
      expect(cache.get(mockBlock, 180, 230)).toEqual([{ start: 180, end: 220 }]);
    });
  });

  describe('configuration options', () => {
    it('should respect maxRangesPerEntry configuration', () => {
      const configuredCache = new ScheduleCache({ maxRangesPerEntry: 500 });
      expect(configuredCache.maxRangesPerEntry).toBe(500);
    });

    it('should use default maxRangesPerEntry when not specified', () => {
      expect(cache.maxRangesPerEntry).toBe(10000);
    });

    it('should respect maxSize configuration', () => {
      const smallCache = new ScheduleCache({ maxSize: 2 });
      const block1 = new MockBlock('hash1');
      const block2 = new MockBlock('hash2');
      const block3 = new MockBlock('hash3');

      smallCache.set(block1, 100, 200, []);
      smallCache.set(block2, 100, 200, []);
      expect(smallCache.size()).toBe(2);

      smallCache.set(block3, 100, 200, []);
      expect(smallCache.size()).toBe(2); // Should evict one entry
    });
  });

  describe('utility methods', () => {
    it('should clear all entries', () => {
      cache.set(mockBlock, 100, 200, []);
      cache.set(new MockBlock('other'), 100, 200, []);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get(mockBlock, 100, 200)).toBeNull();
    });

    it('should return correct size', () => {
      expect(cache.size()).toBe(0);

      cache.set(mockBlock, 100, 200, []);
      expect(cache.size()).toBe(1);

      cache.set(new MockBlock('other'), 100, 200, []);
      expect(cache.size()).toBe(2);
    });

    it('should return cache keys for debugging', () => {
      cache.set(mockBlock, 100, 200, []);
      cache.set(new MockBlock('other'), 300, 400, []);

      const keys = cache.getKeys();
      expect(keys).toHaveLength(2);
      expect(keys.some((key) => key.includes('test-hash_100_200'))).toBe(true);
      expect(keys.some((key) => key.includes('other_300_400'))).toBe(true);
    });

    it('should handle edge case with identical timestamps', () => {
      // Mock Date.now to return same timestamp
      const originalNow = Date.now;
      const fixedTime = 1000000;
      Date.now = vi.fn(() => fixedTime);

      try {
        const block1 = new MockBlock('hash1');
        const block2 = new MockBlock('hash2');
        const block3 = new MockBlock('hash3');
        const block4 = new MockBlock('hash4');

        // Add items with same timestamp
        cache.set(block1, 100, 200, []);
        cache.set(block2, 100, 200, []);
        cache.set(block3, 100, 200, []);

        // Access block1 (still same timestamp but different call)
        cache.get(block1, 100, 200);

        // Add fourth item
        cache.set(block4, 100, 200, []);

        // Cache should still work despite identical timestamps
        expect(cache.size()).toBe(3);
      } finally {
        Date.now = originalNow;
      }
    });
  });
});
