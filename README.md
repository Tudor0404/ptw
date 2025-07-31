# PTW - Predicate Time Windows

A powerful TypeScript library for parsing and evaluating complex schedule expressions with support for time-based rules,
logical operations, and advanced scheduling patterns.


**Important**: PTW is timezone-agnostic. All timestamps should be provided in UTC milliseconds since epoch. The library
does not perform timezone conversions - it operates on absolute time values.

## Features

- **Expression Parsing**: Parse human-readable schedule expressions into structured objects
- **Multiple Field Types**: Support for time, date, weekday, month, year, and datetime fields
- **Logical Operations**: AND, OR, NOT operations for complex scheduling rules
- **Type Safety**: Full TypeScript support with proper error handling
- **Performance**: Built-in caching and optimization for efficient evaluation
- **References**: Support for reusable schedule expressions
- **Merge Control**: Fine-grained control over range merging behavior
- **Timezone Agnostic**: Works with UTC timestamps for consistent behavior across timezones

## Quick Start

```typescript
import { parseExpression, Schedule } from 'ptw'

// Parse a schedule expression
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]') // Work hours on weekdays

// Create a schedule and evaluate with UTC timestamps
const schedule = new Schedule()
const startTime = Date.UTC(2024, 0, 1) // January 1, 2024 UTC
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999) // January 31, 2024 UTC

if (expression.ok) {
  const result = expression.value.evaluate(startTime, endTime, schedule)

  if (result.ok) {
    console.log('Matching time ranges:', result.value)
  }
  else {
    console.error('Evaluation error:', result.error)
  }
}
else {
  console.error('Parse error:', expression.error)
}
```

## Installation

```bash
npm install ptw
# or
pnpm install ptw
# or
yarn add ptw
```

## Timezone Handling

PTW operates on UTC timestamps exclusively. When working with local times or specific timezones:

1. **Convert local times to UTC** before passing to PTW
2. **Convert results back to local time** for display purposes
3. **Use consistent UTC timestamps** throughout your application

```typescript
// Example: Working with local timezone
const localDate = new Date('2024-01-15T09:00:00') // Local time
const utcTimestamp = localDate.getTime() // Convert to UTC milliseconds

// Use UTC timestamp with PTW
const result = expression.value.evaluate(utcTimestamp, utcTimestamp + 86400000, schedule)

// Convert results back to local time for display
if (result.ok) {
  result.value.forEach((range) => {
    const startLocal = new Date(range.start).toLocaleString()
    const endLocal = new Date(range.end).toLocaleString()
    console.log(`Range: ${startLocal} to ${endLocal}`)
  })
}
```

## View full guide at https://tudor0404.github.io/ptw/
