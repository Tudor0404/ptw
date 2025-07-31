# What is PTW?

PTW (Precise Time Windows) is a powerful TypeScript library for parsing and evaluating complex schedule expressions with
support for time-based rules, logical operations, and advanced scheduling patterns.

**Important**: PTW is timezone-agnostic. All timestamps should be provided in UTC milliseconds since epoch. The library
does not perform timezone conversions - it operates on absolute time values.

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

## Architecture Overview

PTW uses a **block-based architecture** where everything is a composable block:

### **Blocks**
Blocks are the fundamental building units in PTW. Every parsed expression returns a block that can be evaluated. There are three main types of blocks:

- **Field Blocks**: Match against specific values (TimeField, DateField, WeekDayField, etc.)
- **Condition Blocks**: Apply logical operations (AndBlock, OrBlock, NotBlock)
- **Reference Blocks**: Reference other expressions stored in a Schedule

### **Expressions and Parsing**
When you parse an expression, you get a **block** that represents the parsed logic:

```typescript
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')
// expression.value is an AndBlock containing a TimeField and WeekDayField
```

### **Schedules**
A **Schedule** is a container that:
- Stores multiple named expressions (blocks) for reuse
- Provides context for reference resolution
- Offers caching and optimization

## How Evaluation Works

Blocks can be evaluated in two ways:

### **Direct Block Evaluation**
```typescript
// Parse and evaluate directly
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')
if (!expression.ok)
  return

// Evaluate the block directly
const result = expression.value.evaluate(startTime, endTime)

// You can also pass a schedule for reference resolution
const result2 = expression.value.evaluate(startTime, endTime, schedule)
```

### **Schedule-based Evaluation**
```typescript
// Store expressions in a schedule
const schedule = new Schedule()
schedule.setExpression('businesshours', 'Business Hours', expression.value)

// Evaluate through the schedule
const result = schedule.evaluate('businesshours', startTime, endTime)
```

**Important**: Any block can accept a Schedule as an optional parameter during evaluation. This allows expressions with references to resolve them properly, but the block itself doesn't need to be stored in the schedule to use this feature.

The library operates on UTC timestamps exclusively, ensuring consistent behavior across different timezones and environments.
