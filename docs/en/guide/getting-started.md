# Getting Started

## Installation

Install PTW using your preferred package manager:

```bash [npm]
npm install ptw
```

```bash [pnpm]
pnpm install ptw
```

```bash [yarn]
yarn add ptw
```

## Usage

### Direct Expression Evaluation

For simple expressions without references:

```typescript
import {parseExpression} from 'ptw'

// Parse a schedule expression for business hours
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]')
if (!expression.ok) return

// Define evaluation domain (UTC timestamps)
const startTime = Date.UTC(2024, 0, 1) // January 1, 2024 UTC
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999) // January 31, 2024 UTC

// Evaluate directly - no Schedule instance needed
const result = expression.value.evaluate(startTime, endTime)
if (!result.ok) return

console.log('Business hours in January 2024:', result.value)
// Output: Array of time ranges matching business hours

// You can also check if a specific timestamp matches
const specificTime = Date.UTC(2024, 0, 15, 10, 30) // Jan 15, 2024 10:30 AM UTC
const timestampResult = expression.value.evaluateTimestamp(specificTime)
if (!timestampResult.ok) return

console.log('Is 10:30 AM on Jan 15 a business hour?', timestampResult.value)
```

### Schedule Class (For References and Caching)

Use the Schedule class when you need:
- **References between expressions**: Store and reuse expressions by name
- **Caching**: Automatic optimization for repeated evaluations  
- **Organization**: Manage multiple related expressions together

**Note**: You can pass a Schedule to any block's `evaluate()` method, even if the block isn't stored in that schedule. This is useful for reference resolution.

```typescript
import {parseExpression, Schedule} from 'ptw'

// Create a schedule instance for caching and references
const schedule = new Schedule()

// Define reusable expressions first
const businessHoursExpr = parseExpression('T[9:00..17:00] AND WD[1..5]')
const holidaysExpr = parseExpression('D[2024-01-01, 2024-07-04, 2024-12-25]')
if (!businessHoursExpr.ok || !holidaysExpr.ok) return

// Set expressions in schedule before using them
const setResult1 = schedule.setExpression('businesshours', 'Business Hours', businessHoursExpr.value)
const setResult2 = schedule.setExpression('holidays', 'Company Holidays', holidaysExpr.value)
if (!setResult1.ok || !setResult2.ok) return

// Now we can create expressions that reference the stored ones
const workingDaysExpr = parseExpression('REF[businesshours] AND NOT REF[holidays]')
if (!workingDaysExpr.ok) return

const startTime = Date.UTC(2024, 0, 1)
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999)

// Evaluate with schedule context for references and caching
const result = workingDaysExpr.value.evaluate(startTime, endTime, schedule)
if (!result.ok) return

console.log('Working days (excluding holidays):', result.value)

// Check specific timestamps using Schedule context
const newYearsDay = Date.UTC(2024, 0, 1, 10, 0) // Jan 1, 2024 10:00 AM UTC
const timestampResult = workingDaysExpr.value.evaluateTimestamp(newYearsDay, schedule)
if (!timestampResult.ok) return

console.log('Is New Years Day at 10 AM a working hour?', timestampResult.value) // false (holiday)
```

### Using Schedule Context with Any Block

You can pass a Schedule to any block's evaluation, even if the block isn't stored in that schedule:

```typescript
// Parse an expression that uses references
const dynamicExpr = parseExpression('REF[businesshours] OR T[20:00..22:00]') // Business hours OR evening
if (!dynamicExpr.ok) return

// Evaluate using the schedule context (block not stored in schedule)
const startTime = Date.UTC(2024, 0, 15, 21, 0) // Jan 15, 9 PM
const result = dynamicExpr.value.evaluateTimestamp(startTime, schedule)
if (!result.ok) return

console.log('Is 9 PM a valid time?', result.value) // true (evening time)
```


## UTC Timestamps

PTW works exclusively with UTC timestamps:

```typescript
// ✅ Correct: Using Date.UTC()
const utcStart = Date.UTC(2024, 0, 1, 9, 0, 0) // Jan 1, 2024 09:00:00 UTC

// ✅ Correct: Converting existing date to UTC
const localDate = new Date('2024-01-15T09:00:00')
const utcTimestamp = localDate.getTime() // Already in UTC milliseconds

// ❌ Incorrect: Using local date constructor for evaluation
const localStart = new Date(2024, 0, 1, 9, 0, 0).getTime() // Local timezone
```

## Expression Syntax

```typescript
// Time ranges (24-hour format)
parseExpression('T[9:00..17:00]') // 9:00:00.000 to 17:00:00.000 (exact times)
parseExpression('T[9>..17>]') // 9:59:59.999 to 17:59:59.999 (with padding)

// Time padding: Add > to pad incomplete times to maximum values
parseExpression('T[9..17]')     // 9:00:00.000 to 17:00:00.000
parseExpression('T[9>..17>]')   // 9:59:59.999 to 17:59:59.999
parseExpression('T[9:30>..12>]') // 9:30:59.999 to 12:59:59.999

// Weekdays (1=Monday, 7=Sunday)  
parseExpression('WD[1..5]') // Monday through Friday

// Dates (YYYY-MM-DD)
parseExpression('D[2024-01-15]') // January 15, 2024

// Combining with AND
parseExpression('T[9:00..17:00] AND WD[1..5]') // Business hours

// Multiple values
parseExpression('WD[1,3,5]') // Monday, Wednesday, Friday

// References (Schedule class only)
parseExpression('REF[businesshours] AND NOT REF[holidays]')
```

## Evaluation Methods

### Range Evaluation (`evaluate`)

```typescript
const expression = parseExpression('T[14:00..16:00] AND WD[1]') // 2-4 PM on Mondays
if (!expression.ok) return

const startTime = Date.UTC(2024, 0, 1)
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999)

const result = expression.value.evaluate(startTime, endTime)
if (!result.ok) return

result.value.forEach(range => {
    const start = new Date(range.start)
    const end = new Date(range.end)
    console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`)
})
```

### Timestamp Evaluation (`evaluateTimestamp`)

```typescript
const expression = parseExpression('T[9:00..17:00] AND WD[1..5]') // Business hours
if (!expression.ok) return

// Check if right now is during business hours
const now = Date.now()
const result = expression.value.evaluateTimestamp(now)
if (!result.ok) return

console.log('Is it currently business hours?', result.value)

// Check multiple specific times
const times = [
    Date.UTC(2024, 0, 15, 10, 30), // Monday 10:30 AM
    Date.UTC(2024, 0, 13, 10, 30), // Saturday 10:30 AM
    Date.UTC(2024, 0, 15, 20, 30), // Monday 8:30 PM
]

times.forEach(time => {
    const result = expression.value.evaluateTimestamp(time)
    if (result.ok) {
        const date = new Date(time)
        console.log(`${date.toISOString()}: ${result.value}`)
    }
})
```

## Error Handling

```typescript
// Parse errors
const expression = parseExpression('invalid syntax')
if (!expression.ok) {
    console.error('Parse failed:', expression.error.message)
    return
}

// Success - use expression.value
const block = expression.value

// Schedule operations also return Results
const schedule = new Schedule()
const setResult = schedule.setExpression('test', 'Test', someBlock)
if (!setResult.ok) {
    console.error('Failed to set expression:', setResult.error.message)
    return
}

console.log('Expression set successfully')

// Evaluation errors
const evalResult = block.evaluate(startTime, endTime)
if (!evalResult.ok) {
    console.error('Evaluation failed:', evalResult.error.message)
    return
}

// Timestamp evaluation errors
const timestampResult = block.evaluateTimestamp(Date.now())
if (!timestampResult.ok) {
    console.error('Timestamp evaluation failed:', timestampResult.error.message)
    return
}

console.log('Timestamp matches:', timestampResult.value)
```

## Next Steps

- [Field types and syntax](/guide/field-types)
- [Logical operations](/guide/logical-operations)
- [Timezone handling](/guide/timezones)