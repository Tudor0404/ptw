import type {DateTimeRange, IBlock} from '../types'
import {findFirstIntersectingIndex, findLastIntersectingIndex} from '../utils/rangeIntersection'

export interface CacheEntry {
    ranges: DateTimeRange[]
    startUnix: number
    endUnix: number
    lastAccessed: number
}

export interface CacheOptions {
    maxSize?: number
    maxRangesPerEntry?: number
}

export default class ScheduleCache {
    readonly maxRangesPerEntry: number
    private cache = new Map<string, CacheEntry>()
    private readonly maxSize: number

    constructor(options: CacheOptions = {}) {
        this.maxSize = options.maxSize ?? 10
        this.maxRangesPerEntry = options.maxRangesPerEntry ?? 10000
    }

    get(block: IBlock, startUnix: number, endUnix: number): DateTimeRange[] | null {
        const exactKey = this.generateKey(block, startUnix, endUnix)

        if (this.cache.has(exactKey)) {
            const entry = this.cache.get(exactKey)!
            entry.lastAccessed = Date.now()
            return entry.ranges
        }

        const blockHash = block.getHash()

        for (const [key, entry] of this.cache) {
            if (!key.startsWith(`${blockHash}_`))
                continue

            if (this.canExtract(entry, startUnix, endUnix)) {
                entry.lastAccessed = Date.now()
                return this.extractSubset(entry.ranges, startUnix, endUnix)
            }
        }

        return null
    }

    set(block: IBlock, startUnix: number, endUnix: number, ranges: DateTimeRange[]): void {
        const key = this.generateKey(block, startUnix, endUnix)
        const blockHash = block.getHash()

        for (const [existingKey, entry] of this.cache) {
            if (!existingKey.startsWith(`${blockHash}_`))
                continue

            if (this.canExpand(entry, startUnix, endUnix)) {
                this.cache.delete(existingKey)
                break
            }
        }

        this.evictLRU()

        this.cache.set(key, {
            ranges: [...ranges],
            startUnix,
            endUnix,
            lastAccessed: Date.now(),
        })
    }

    clear(): void {
        this.cache.clear()
    }

    size(): number {
        return this.cache.size
    }

    getKeys(): string[] {
        return Array.from(this.cache.keys())
    }

    private generateKey(block: IBlock, startUnix: number, endUnix: number): string {
        return `${block.getHash()}_${startUnix}_${endUnix}`
    }

    private evictLRU(): void {
        if (this.cache.size < this.maxSize)
            return

        let oldestKey: string | null = null
        let oldestTime = Number.MAX_SAFE_INTEGER

        for (const [key, entry] of this.cache) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed
                oldestKey = key
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey)
        }
    }

    private canExpand(cached: CacheEntry, newStart: number, newEnd: number): boolean {
        return newStart <= cached.startUnix && newEnd >= cached.endUnix
    }

    private canExtract(cached: CacheEntry, newStart: number, newEnd: number): boolean {
        return newStart >= cached.startUnix && newEnd <= cached.endUnix
    }

    private extractSubset(
        ranges: DateTimeRange[],
        newStart: number,
        newEnd: number,
    ): DateTimeRange[] {
        if (ranges.length === 0)
            return []

        const startIndex = findFirstIntersectingIndex(ranges, newStart)
        if (startIndex === -1)
            return []

        const endIndex = findLastIntersectingIndex(ranges, newEnd)
        if (endIndex === -1 || endIndex < startIndex)
            return []

        const result: DateTimeRange[] = []

        for (let i = startIndex; i <= endIndex; i++) {
            const range = ranges[i]
            const intersectionStart = Math.max(range.start, newStart)
            const intersectionEnd = Math.min(range.end, newEnd)

            if (intersectionStart <= intersectionEnd) {
                result.push({
                    start: intersectionStart,
                    end: intersectionEnd,
                })
            }
        }

        return result
    }
}
