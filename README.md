# PTW - Precise Time Windows

A powerful TypeScript library for parsing and evaluating complex schedule expressions with support for time-based rules,
logical operations, and advanced scheduling patterns.

test

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

## Complete Reference

### Field Types

| Field Type    | Syntax     | Description                                    | Examples                                     |
|---------------|------------|------------------------------------------------|----------------------------------------------|
| **Time**      | `T[...]`   | Time ranges within a day (24-hour format, UTC) | `T[9:00..17:00]`, `T[9, 13:30, 18:00]`       |
| **WeekDay**   | `WD[...]`  | Days of week (1=Monday, 7=Sunday)              | `WD[1..5]`, `WD[1,3,5]`, `WD[6,7]`           |
| **Date**      | `D[...]`   | Specific dates (YYYY-MM-DD format, UTC)        | `D[2024-01-15]`, `D[2024-01-01..2024-01-31]` |
| **Month**     | `M[...]`   | Months (1=January, 12=December)                | `M[1..12]`, `M[6,7,8]`, `M[12]`              |
| **MonthDay**  | `MD[...]`  | Days within months (1-31)                      | `MD[1]`, `MD[15]`, `MD[1..7]`                |
| **Year**      | `Y[...]`   | Specific years                                 | `Y[2024]`, `Y[2023..2025]`                   |
| **DateTime**  | `DT[...]`  | Date and time combinations (UTC)               | `DT[2024-01-15T09:00..2024-01-15T17:00]`     |
| **Reference** | `REF[...]` | Reference to named expressions                 | `REF[working-hours]`, `REF[holidays]`        |

### Time Format Support

All times are interpreted as UTC. The library supports flexible time formats:

| Format                         | Example         | Description                      |
|--------------------------------|-----------------|----------------------------------|
| Hour                           | `9`, `23`       | 1-2 digits for hours (0-23)      |
| Hour:Minute                    | `9:30`, `17:45` | Hours and minutes                |
| Hour:Minute:Second             | `9:30:45`       | Hours, minutes, and seconds      |
| Hour:Minute:Second.Millisecond | `9:30:45.123`   | Full precision with milliseconds |

### Value Expression Types

| Type             | Syntax  | Description                 | Examples                              |
|------------------|---------|-----------------------------|---------------------------------------|
| **Single Value** | `n`     | Single number               | `5`, `15`, `2024`                     |
| **Range**        | `n..m`  | Inclusive range from n to m | `1..5`, `9..17`, `2024..2026`         |
| **Algebraic**    | `an±b`  | Arithmetic sequence         | `2n+1` (odd), `3n+0` (multiples of 3) |
| **List**         | `n,m,o` | Multiple values/ranges      | `1,3,5`, `1..5,10..15`                |

### Logical Operators

| Operator | Syntax            | Description                  | Example                       |
|----------|-------------------|------------------------------|-------------------------------|
| **AND**  | `expr1 AND expr2` | Both conditions must be true | `T[9:00..17:00] AND WD[1..5]` |
| **AND**  | `expr1.expr2`     | Dot notation for AND         | `T[9:00..17:00].WD[1..5]`     |
| **OR**   | `expr1 OR expr2`  | Either condition can be true | `WD[1] OR WD[7]`              |
| **OR**   | `expr1,expr2`     | Comma notation for OR        | `M[6,7,8]`                    |
| **NOT**  | `NOT expr`        | Negation of expression       | `NOT WD[6,7]`                 |
| **NOT**  | `!expr`           | Alternative NOT syntax       | `!WD[6,7]`                    |

### Merge Control

| Operator          | Syntax  | Description                       | Example          |
|-------------------|---------|-----------------------------------|------------------|
| **Force Merge**   | `~expr` | Force consecutive ranges to merge | `~T[9:00,10:00]` |
| **Prevent Merge** | `#expr` | Prevent range merging             | `#T[9:00,10:00]` |

### Grouping

| Syntax   | Description                         | Example                                    |
|----------|-------------------------------------|--------------------------------------------|
| `(expr)` | Parentheses for explicit precedence | `(WD[1..5] AND T[9:00..17:00]) OR WD[6,7]` |

## Common Usage Patterns

### Business Hours

```typescript
// Standard business hours: 9 AM to 5 PM, Monday through Friday (UTC)
const businessHours = parseExpression('T[9:00..17:00] AND WD[1..5]')
```

### Maintenance Windows

```typescript
// Sunday early morning maintenance: 2 AM to 6 AM on Sundays (UTC)
const maintenance = parseExpression('WD[7] AND T[2:00..6:00]')
```

### Holiday Exclusions

```typescript
// Weekdays excluding holidays
const workDays = parseExpression('WD[1..5] AND NOT REF[company-holidays]')
```

### Quarterly Meetings

```typescript
// First Monday of each quarter at 2 PM (UTC)
const quarterlyMeetings = parseExpression('M[3,6,9,12] AND MD[1..7] AND WD[1] AND T[14:00]')
```

### Rotating Schedules

```typescript
// Every other weekday (Monday, Wednesday, Friday) with 8-hour shifts
const alternatingDays = parseExpression('WD[2n+1] AND T[8:00..16:00]')
```

### Summer Hours

```typescript
// Reduced hours during summer months (UTC)
const summerHours = parseExpression('M[6..8] AND WD[1..5] AND T[8:00..16:00]')
```

## Advanced Features

### Algebraic Expressions

Create patterns using algebraic formulas:

```typescript
// Every odd weekday (Mon, Wed, Fri, Sun)
parseExpression('WD[2n+1]')

// Every third month (Mar, Jun, Sep, Dec)
parseExpression('M[3n+0]')

// First week of every month
parseExpression('MD[1..7]')

// Every other year starting from 2024
parseExpression('Y[2n+2024]')
```

### Complex Combinations

```typescript
// Complex schedule: Work hours excluding lunch, but including Saturday mornings
const complexSchedule = parseExpression(`
    (T[9:00..12:00] OR T[13:00..17:00]) AND WD[1..5]
    OR
    T[9:00..12:00] AND WD[6]
`)
```

### Reference System

```typescript
// Define reusable expressions
const schedule = new Schedule()
schedule.addSchedule('core-hours', parseExpression('T[10:00..15:00]').value)
schedule.addSchedule('extended-hours', parseExpression('T[8:00..18:00]').value)

// Use references in expressions
const meetingTimes = parseExpression('REF[core-hours] AND WD[1..5]')
```

### Working with Timezones

```typescript
// Example: Converting from Eastern Time to UTC for PTW
import { parseExpression } from 'ptw'

// Business hours in Eastern Time: 9 AM - 5 PM ET
// Convert to UTC (ET is UTC-5 in winter, UTC-4 in summer)
// For simplicity, using winter time (UTC-5)
const etBusinessHours = parseExpression('T[14:00..22:00] AND WD[1..5]') // 9 AM ET = 2 PM UTC

// Always use Date.UTC() for consistent UTC timestamps
const startTime = Date.UTC(2024, 0, 1) // January 1, 2024 00:00:00 UTC
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999) // January 31, 2024 23:59:59.999 UTC
```

### Error Handling

```typescript
const result = parseExpression('invalid expression')

if (result.ok) {
  // Success case
  const expression = result.value
  // Use expression...
}
else {
  // Error case
  console.error('Parse failed:', result.error.message)
}
```

## API Reference

### Main Functions

#### `parseExpression(expression: string): Result<IBlock, Error>`

Parses a schedule expression string into an executable block.

```typescript
const result = parseExpression('T[9:00..17:00] AND WD[1..5]')
```

#### `Schedule`

Container for managing multiple named schedule expressions.

```typescript
const schedule = new Schedule()
schedule.addSchedule('work-hours', workHoursBlock)
const referenced = schedule.getSchedule('work-hours')
```

### Core Classes

#### `TimeField`

Handles time-based scheduling within days. All times are treated as UTC.

#### `WeekDayField`

Manages day-of-week based scheduling.

#### `DateField`

Handles specific date-based scheduling. All dates are treated as UTC.

#### `AndBlock`, `OrBlock`, `NotBlock`

Logical operators for combining expressions.

## Performance Considerations

- **Caching**: The library automatically caches evaluation results for improved performance
- **Range Merging**: Consecutive and overlapping ranges are automatically optimized
- **Domain Clipping**: Results are efficiently clipped to specified time domains
- **Memory Efficient**: Lazy evaluation and optimized data structures minimize memory usage
- **UTC Operations**: Working in UTC eliminates timezone conversion overhead

## TypeScript Support

PTW is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  DateTimeRange,
  IBlock,
  IField,
  MergeState,
  Result
} from 'ptw'

// All functions return Result types for safe error handling
const result: Result<IBlock, Error> = parseExpression('T[9:00..17:00]')

// Type-safe field operations
const timeField: TimeField = new TimeField()
timeField.addValues([{ start: 32400000, end: 61200000 }]) // UTC milliseconds
```

## License

MIT © Tudor Popescu

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.

## Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/Tudor0404/ptw).
