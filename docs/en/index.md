# PTW - Precise Time Windows

A powerful TypeScript library for parsing and evaluating complex schedule expressions with support for time-based rules,
logical operations, and advanced scheduling patterns.

**Important**: PTW is timezone-agnostic. All timestamps should be provided in UTC milliseconds since epoch.

**Library is currently in BETA, expect drastic API changes in major releases**

## Quick Example

```typescript
import { parseExpression, Schedule } from 'ptw'

// Parse business hours expression
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')

if (!expression.ok) {
  return false
}

// Evaluate for January 2024 (UTC)
const startTime = Date.UTC(2024, 0, 1)
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999)

expression.evaluate(startTime, endTime)
```

## Key Features

- **Expression Parsing**: Human-readable schedule expressions
- **Multiple Field Types**: Time, date, weekday, month, year, and datetime fields
- **Logical Operations**: AND, OR, NOT operations for complex rules
- **Type Safety**: Full TypeScript support with result error handling
- **Performance**: Built-in caching and optimization
- **References**: Reusable schedule expressions
- **Merge Control**: Fine-grained control over range merging
- **Timezone Agnostic**: Consistent UTC-based operations

## Field Types Overview

| Field         | Syntax     | Description                 | Example                                  |
|---------------|------------|-----------------------------|------------------------------------------|
| **Time**      | `T[...]`   | Time ranges within a day    | `T[9:00..17:00]`                         |
| **WeekDay**   | `WD[...]`  | Days of week (1=Mon, 7=Sun) | `WD[1..5]`                               |
| **Date**      | `D[...]`   | Specific dates              | `D[2025-01-15]`                          |
| **Month**     | `M[...]`   | Months (1=Jan, 12=Dec)      | `M[6..8]`                                |
| **MonthDay**  | `MD[...]`  | Days within months          | `MD[1,15]`                               |
| **Year**      | `Y[...]`   | Specific years              | `Y[2025]`                                |
| **DateTime**  | `DT[...]`  | Date and time combinations  | `DT[2025-01-15T09:00..2024501-15T17:00]` |
| **Reference** | `REF[...]` | Named expression references | `REF[holidays]`                          |

## Logical Operators

| Operator | Syntax                             | Description                  |
|----------|------------------------------------|------------------------------|
| **AND**  | `expr1 AND expr2` or `expr1.expr2` | Both conditions must be true |
| **OR**   | `expr1 OR expr2` or `expr1,expr2`  | Either condition can be true |
| **NOT**  | `NOT expr` or `!expr`              | Negation of expression       |

## Common Patterns

### Business Hours

```typescript
parseExpression('T[9:00..17:00] AND WD[1..5]')
```

### Maintenance Windows

```typescript
parseExpression('WD[7] AND T[2:00..6:00]')
```

### Holiday Exclusions

```typescript
parseExpression('WD[1..5] AND NOT REF[holidays]')
```

### Quarterly Meetings

```typescript
parseExpression('M[3,6,9,12] AND MD[1..7] AND WD[1] AND T[14:00]')
```

### Rotating Schedules

```typescript
parseExpression('WD[2n+1] AND T[8:00..16:00]')
```

## Installation

```bash
npm install ptw
```

## Documentation

- [Getting Started](/guide/getting-started) - Quick setup and basic usage
- [What is PTW?](/guide/what-is) - Overview and core concepts
- [Field Types](/guide/field-types) - Complete field reference
- [Logical Operations](/guide/logical-operations) - AND, OR, NOT operations
- [Timezone Handling](/guide/timezones) - Working with UTC and timezones

## TypeScript Support

PTW is written in TypeScript and provides comprehensive type definitions for safe, type-checked schedule operations.

```typescript
import type { DateTimeRange, IBlock, Result } from 'ptw'

const result: Result<IBlock, Error> = parseExpression('T[9:00..17:00]')
```
