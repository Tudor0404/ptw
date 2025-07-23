# Getting Started

This guide will help you get up and running with PTW quickly.

## Installation

Install PTW using your preferred package manager:

::: code-group

```bash [npm]
npm install ptw
```

```bash [pnpm]
pnpm install ptw
```

```bash [yarn]
yarn add ptw
```

:::

## Quick Start

Here's a simple example to get you started:

```typescript
import { parseExpression, Schedule } from 'ptw'

// Parse a schedule expression for business hours
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')

// Create a schedule instance
const schedule = new Schedule()

// Define evaluation domain (UTC timestamps)
const startTime = Date.UTC(2024, 0, 1) // January 1, 2024 UTC
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999) // January 31, 2024 UTC

if (expression.ok) {
    const result = expression.value.evaluate(startTime, endTime, schedule)
    
    if (result.ok) {
        console.log('Matching time ranges:', result.value)
        // Output: Array of time ranges matching business hours in January 2024
    } else {
        console.error('Evaluation error:', result.error)
    }
} else {
    console.error('Parse error:', expression.error)
}
```

## Important: UTC Timestamps

PTW is timezone-agnostic and works exclusively with UTC timestamps. Always use `Date.UTC()` or ensure your timestamps are in UTC:

```typescript
// ✅ Correct: Using Date.UTC()
const utcStart = Date.UTC(2024, 0, 1, 9, 0, 0) // Jan 1, 2024 09:00:00 UTC

// ✅ Correct: Converting existing date to UTC
const localDate = new Date('2024-01-15T09:00:00')
const utcTimestamp = localDate.getTime() // Already in UTC milliseconds

// ❌ Incorrect: Using local date constructor for evaluation
const localStart = new Date(2024, 0, 1, 9, 0, 0).getTime() // Local timezone
```

## Basic Expression Syntax

PTW uses a simple, intuitive syntax for schedule expressions:

### Field Types

- `T[...]` - Time fields (hours, minutes, seconds)
- `WD[...]` - Weekday fields (1=Monday, 7=Sunday)
- `D[...]` - Date fields (YYYY-MM-DD format)
- `M[...]` - Month fields (1=January, 12=December)
- `MD[...]` - Month day fields (1-31)
- `Y[...]` - Year fields

### Examples

```typescript
// Time ranges
parseExpression('T[9:00..17:00]') // 9 AM to 5 PM

// Weekdays
parseExpression('WD[1..5]') // Monday through Friday

// Specific dates
parseExpression('D[2024-01-15]') // January 15, 2024

// Combining with AND
parseExpression('T[9:00..17:00] AND WD[1..5]') // Business hours

// Multiple values
parseExpression('WD[1,3,5]') // Monday, Wednesday, Friday
```

## Working with Results

PTW returns time ranges as an array of objects with `start` and `end` properties (UTC milliseconds):

```typescript
const expression = parseExpression('T[14:00..16:00] AND WD[1]') // 2-4 PM on Mondays
const result = expression.value.evaluate(startTime, endTime, schedule)

if (result.ok) {
    result.value.forEach(range => {
        const start = new Date(range.start)
        const end = new Date(range.end)
        console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`)
    })
}
```

## Error Handling

PTW uses a `Result` type for safe error handling:

```typescript
const expression = parseExpression('invalid syntax')

if (expression.ok) {
    // Success - use expression.value
    const schedule = expression.value
} else {
    // Error - handle expression.error
    console.error('Parse failed:', expression.error.message)
}
```

## Next Steps

- Learn about [field types and syntax](/guide/field-types)
- Explore [logical operations](/guide/logical-operations)
- Understand [timezone handling](/guide/timezones)
- Check out [common patterns](/guide/patterns)
- Read the [complete API reference](/reference/api)