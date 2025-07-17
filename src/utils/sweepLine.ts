import type {DateTimeRange} from '../types'

/**
 * Event types for sweep line algorithm
 */
enum EventType {
    START = 'start',
    END = 'end',
}

/**
 * Event structure for sweep line algorithm
 */
interface SweepEvent {
    time: number
    type: EventType
    blockIndex: number
}

/**
 * Performs intersection of multiple blocks using sweep line algorithm
 * @param blocks Array of DateTimeRange arrays (one per block)
 * @param shouldMerge Whether to merge adjacent/touching ranges
 * @returns Intersection ranges
 */
export function sweepLineIntersection(
    blocks: DateTimeRange[][],
    shouldMerge: boolean,
): DateTimeRange[] {
    if (blocks.length === 0)
        return []
    if (blocks.some(block => block.length === 0))
        return []

    const events: SweepEvent[] = []

    blocks.forEach((block, blockIndex) => {
        block.forEach((range) => {
            events.push({time: range.start, type: EventType.START, blockIndex})
            events.push({time: range.end + 1, type: EventType.END, blockIndex})
        })
    })

    events.sort((a, b) => {
        if (a.time !== b.time)
            return a.time - b.time
        return a.type === EventType.START ? -1 : 1
    })

    const result: DateTimeRange[] = []
    const activeBlocks = new Set<number>()
    let intersectionStart: number | null = null

    for (const event of events) {
        if (event.type === EventType.START) {
            activeBlocks.add(event.blockIndex)

            if (activeBlocks.size === blocks.length && intersectionStart === null) {
                intersectionStart = event.time
            }
        } else {
            if (activeBlocks.size === blocks.length && intersectionStart !== null) {
                const intersectionEnd = event.time - 1

                if (intersectionStart <= intersectionEnd) {
                    if (shouldMerge && result.length > 0) {
                        const lastRange = result[result.length - 1]
                        if (intersectionStart <= lastRange.end + 1) {
                            lastRange.end = Math.max(lastRange.end, intersectionEnd)
                        } else {
                            result.push({start: intersectionStart, end: intersectionEnd})
                        }
                    } else {
                        result.push({start: intersectionStart, end: intersectionEnd})
                    }
                }

                intersectionStart = null
            }

            activeBlocks.delete(event.blockIndex)
        }
    }

    return result
}

/**
 * Performs union of multiple blocks using sweep line algorithm
 * @param blocks Array of DateTimeRange arrays (one per block)
 * @param shouldMerge Whether to merge adjacent/touching ranges
 * @returns Union ranges
 */
export function sweepLineUnion(blocks: DateTimeRange[][], shouldMerge: boolean): DateTimeRange[] {
    if (blocks.length === 0)
        return []

    const events: SweepEvent[] = []

    blocks.forEach((block, blockIndex) => {
        block.forEach((range) => {
            events.push({time: range.start, type: EventType.START, blockIndex})
            events.push({time: range.end + 1, type: EventType.END, blockIndex})
        })
    })

    events.sort((a, b) => {
        if (a.time !== b.time)
            return a.time - b.time
        return a.type === EventType.START ? -1 : 1
    })

    const result: DateTimeRange[] = []
    let activeCount = 0
    let unionStart: number | null = null

    for (const event of events) {
        if (event.type === EventType.START) {
            if (activeCount === 0) {
                unionStart = event.time
            }
            activeCount++
        } else {
            activeCount--

            if (activeCount === 0 && unionStart !== null) {
                const unionEnd = event.time - 1

                if (unionStart <= unionEnd) {
                    if (shouldMerge && result.length > 0) {
                        const lastRange = result[result.length - 1]
                        if (unionStart <= lastRange.end + 1) {
                            lastRange.end = Math.max(lastRange.end, unionEnd)
                        } else {
                            result.push({start: unionStart, end: unionEnd})
                        }
                    } else {
                        result.push({start: unionStart, end: unionEnd})
                    }
                }

                unionStart = null
            }
        }
    }

    return result
}

/**
 * Performs complement (NOT) of a single block using sweep line algorithm
 * @param block Array of DateTimeRange to complement
 * @param domainStart Start of the domain
 * @param domainEnd End of the domain
 * @param shouldMerge Whether to merge adjacent/touching ranges
 * @returns Complement ranges
 */
export function sweepLineComplement(
    block: DateTimeRange[],
    domainStart: number,
    domainEnd: number,
    shouldMerge: boolean,
): DateTimeRange[] {
    if (block.length === 0) {
        return [{start: domainStart, end: domainEnd}]
    }

    const result: DateTimeRange[] = []
    let currentPos = domainStart

    for (const range of block) {
        if (currentPos < range.start) {
            const gapStart = currentPos
            const gapEnd = range.start - 1

            if (shouldMerge && result.length > 0) {
                const lastRange = result[result.length - 1]
                if (gapStart <= lastRange.end + 1) {
                    lastRange.end = Math.max(lastRange.end, gapEnd)
                } else {
                    result.push({start: gapStart, end: gapEnd})
                }
            } else {
                result.push({start: gapStart, end: gapEnd})
            }
        }

        currentPos = Math.max(currentPos, range.end + 1)
    }

    // Add final gap after last range
    if (currentPos <= domainEnd) {
        const gapStart = currentPos
        const gapEnd = domainEnd

        if (shouldMerge && result.length > 0) {
            const lastRange = result[result.length - 1]
            if (gapStart <= lastRange.end + 1) {
                // Merge with previous range
                lastRange.end = Math.max(lastRange.end, gapEnd)
            } else {
                result.push({start: gapStart, end: gapEnd})
            }
        } else {
            result.push({start: gapStart, end: gapEnd})
        }
    }

    return result
}
