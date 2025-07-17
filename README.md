# PTW - Schedule Expression Parser

A TypeScript library for parsing and evaluating schedule expressions with support for complex time-based rules and
conditions.

## Features

- **Expression Parsing**: Parse human-readable schedule expressions into structured objects
- **Field Types**: Support for time, date, weekday, month, and year fields
- **Logical Operations**: AND, OR, NOT operations for complex scheduling rules
- **Result Types**: Type-safe evaluation with proper error handling
- **Caching**: Built-in caching for performance optimization
- **References**: Support for reusable schedule expressions

## Quick Start

```typescript
import {parseExpression, Schedule} from 'ptw'

// Parse a schedule expression
const expression = parseExpression('T[9:00..17:00] & WD[1..5]') // Work hours on weekdays

// Create a schedule and evaluate
const schedule = new Schedule()
const result = expression.evaluate(startTime, endTime, schedule)

if (result.ok) {
    console.log('Matching time ranges:', result.value)
} else {
    console.error('Evaluation error:', result.error)
}
```

## Field Types

- **TimeField**: `T[9:00..17:00]` - Time ranges within a day
- **DateField**: `D[2024-01-01..2024-01-31]` - Date ranges
- **WeekDayField**: `WD[1..5]` - Days of the week (1=Monday, 7=Sunday)
- **MonthField**: `M[1..12]` - Months of the year
- **YearField**: `Y[2024]` - Years
- **MonthDayField**: `MD[1..31]` - Days within a month

## Logical Operations

- **AND**: `T[9:00..17:00] & WD[1..5]` - Both conditions must be true
- **OR**: `T[9:00..12:00] | T[13:00..17:00]` - Either condition can be true
- **NOT**: `!WD[6..7]` - Negates the condition

## Installation

```bash
npm install ptw
# or
pnpm install ptw
```

## Documentation

Full documentation is coming soon. This library is actively being developed.

## License

MIT © Tudor Popescu
