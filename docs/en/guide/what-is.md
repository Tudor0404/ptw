# What is PTW?

PTW (Precise Time Windows) is a powerful TypeScript library for parsing and evaluating complex schedule expressions with support for time-based rules, logical operations, and advanced scheduling patterns.

**Important**: PTW is timezone-agnostic. All timestamps should be provided in UTC milliseconds since epoch. The library does not perform timezone conversions - it operates on absolute time values.

## Key Features

- **Expression Parsing**: Parse human-readable schedule expressions into structured objects
- **Multiple Field Types**: Support for time, date, weekday, month, year, and datetime fields
- **Logical Operations**: AND, OR, NOT operations for complex scheduling rules
- **Type Safety**: Full TypeScript support with proper error handling
- **Performance**: Built-in caching and optimization for efficient evaluation
- **References**: Support for reusable schedule expressions
- **Merge Control**: Fine-grained control over range merging behavior
- **Timezone Agnostic**: Works with UTC timestamps for consistent behavior across timezones

## Use Cases

PTW is perfect for applications that need to:

- Define business hours and operational schedules
- Schedule maintenance windows and system downtime
- Create complex recurring patterns (every other Monday, quarterly meetings, etc.)
- Handle holiday exclusions and special schedules
- Implement time-based access controls
- Generate availability calendars
- Manage shift rotations and staffing schedules

## How It Works

PTW uses a grammar-based parser to convert human-readable expressions into executable schedule objects. These objects can then evaluate time ranges against specified domains, returning precise time windows that match the schedule criteria.

```typescript
// Parse a schedule expression
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')

// Evaluate against a time domain
const result = expression.value.evaluate(startTime, endTime, schedule)
```

The library operates on UTC timestamps exclusively, ensuring consistent behavior across different timezones and environments.