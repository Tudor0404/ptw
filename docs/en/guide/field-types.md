# Field Types

PTW supports various field types for different aspects of time and date scheduling.

🚧 **Beta Limitation**: PTW currently has limited timezone support. All timestamps must be provided in UTC.

## Time Fields (`T[...]`)

Time fields represent specific times within a day using 24-hour format.

### Syntax

```
T[time1..time2, time3..time4, ...]
```

All time values must be specified as ranges. Single times are not supported.

### Time Padding Behavior

You can optionally pad incomplete time specifications to their maximum values by adding a `>` suffix:

- `09` → `09:00:00.000` (no padding)
- `09>` → `09:59:59.999` (padded to maximum)
- `09:30` → `09:30:00.000` (no padding)
- `09:30>` → `09:30:59.999` (padded to maximum)
- `09:30:45` → `09:30:45.000` (no padding)
- `09:30:45>` → `09:30:45.999` (padded to maximum)

This allows you to specify time ranges that either start exactly at the specified time or cover the full intended
period.

### Time Formats

PTW supports four time precision levels:

| Format                         | Example                              | Description                            |
|--------------------------------|--------------------------------------|----------------------------------------|
| Hour                           | `T[9..17]`, `T[09>..17>]`            | 1-2 digits for hours (00-23)           |
| Hour:Minute                    | `T[9:30..17:45]`, `T[9:30>..17:45>]` | Hours and minutes                      |
| Hour:Minute:Second             | `T[9:30:45..17:30:45]`               | Hours, minutes, and seconds            |
| Hour:Minute:Second.Millisecond | `T[9:30:45.123..17:30:45.123]`       | Full precision (padding has no effect) |

**Note:** milliseconds are not right padded (xx:xx:xx.1 represents 1 millisecond, not 100 milliseconds)

### Examples

```typescript
// Standard time ranges (no padding)
parseExpression('T[9:00..17:00]') // 9:00:00.000 to 17:00:00.000

// Time ranges with padding
parseExpression('T[9>..17>]') // 9:59:59.999 to 17:59:59.999

// Mixed padding in ranges
parseExpression('T[9:00..12>]') // 9:00:00.000 to 12:59:59.999

// Multiple time ranges with padding
parseExpression('T[9>..12>, 13:30>..17>]') // Morning and afternoon with padding

// Practical example: business hours covering full hours
parseExpression('T[9>..17>] AND WD[1..5]') // 9:59:59.999 to 17:59:59.999 on weekdays

// Hour-only with and without padding
parseExpression('T[9..17]') // 9:00:00.000 to 17:00:00.000 (exact times)
parseExpression('T[9>..17>]') // 9:59:59.999 to 17:59:59.999 (full hours)
```

## WeekDay Fields (`WD[...]`)

WeekDay fields represent days of the week where 1=Monday, 2=Tuesday, ..., 7=Sunday.

### Supported Value Types

WD fields support:

- **Single numbers**
- **Ranges** (`start..end`)
- **Algebraic expressions** (`an±b`)

### Examples

```typescript
// Single weekday
parseExpression('WD[1]') // Monday only

// Weekday range
parseExpression('WD[1..5]') // Monday through Friday

// Multiple weekdays (list OR)
parseExpression('WD[1,3,5]') // Monday, Wednesday, Friday

// Weekends
parseExpression('WD[6,7]') // Saturday and Sunday

// Algebraic patterns
parseExpression('WD[2n+1]') // Odd weekdays: 1,3,5,7 (Mon, Wed, Fri, Sun)
parseExpression('WD[2n+0]') // Even weekdays: 2,4,6 (Tue, Thu, Sat)
```

## Date Fields (`D[...]`)

Date fields represent specific calendar dates using ISO format (YYYY-MM-DD).

### Syntax

Date fields can contain:

- **Single date** (YYYY-MM-DD format)
- **Date range** (`date..date`)

### Examples

```typescript
// Single date
parseExpression('D[2024-01-15]') // January 15, 2024

// Date range
parseExpression('D[2024-01-01..2024-01-31]') // All of January 2024

// Multiple dates
parseExpression('D[2024-01-01, 2024-06-15, 2024-12-25]') // Specific dates

// Date ranges with multiple periods
parseExpression('D[2024-01-01..2024-01-07, 2024-06-01..2024-06-07]')

// Mixed single dates and ranges
parseExpression('D[2024-12-25, 2024-01-01..2024-01-03]') // Christmas + New Year period
```

## Month Fields (`M[...]`)

Month fields represent months of the year where 1=January, 2=February, ..., 12=December.

### Supported Value Types

M fields support:

- **Single numbers**
- **Ranges** (`start..end`)
- **Algebraic expressions** (`an±b`)

### Examples

```typescript
// Single month
parseExpression('M[6]') // June only

// Month range
parseExpression('M[6..8]') // Summer months (June, July, August)

// Multiple months (quarterly)
parseExpression('M[3,6,9,12]') // March, June, September, December

// Algebraic patterns
parseExpression('M[3n+0]') // Every third month: 3,6,9,12 (Mar, Jun, Sep, Dec)
parseExpression('M[2n+1]') // Odd months: 1,3,5,7,9,11 (Jan, Mar, May, Jul, Sep, Nov)
parseExpression('M[4n+1]') // Every 4th month starting Jan: 1,5,9 (Jan, May, Sep)
```

## MonthDay Fields (`MD[...]`)

MonthDay fields represent days within any month (1-31).

### Supported Value Types

MD fields support:

- **Single numbers**
- **Ranges** (`start..end`)
- **Algebraic expressions** (`an±b`)

### Examples

```typescript
// Single day
parseExpression('MD[1]') // First day of every month

// Day range
parseExpression('MD[1..7]') // First week of every month

// Multiple days
parseExpression('MD[1,15]') // 1st and 15th of every month

// End of month considerations
parseExpression('MD[28..31]') // Last few days (handles months with fewer days)

// Algebraic patterns
parseExpression('MD[2n+1]') // Odd days: 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31
parseExpression('MD[7n+1]') // Every 7th day starting from 1st: 1,8,15,22,29
parseExpression('MD[10n+5]') // Every 10th day starting from 5th: 5,15,25
```

## Year Fields (`Y[...]`)

Year fields represent specific calendar years.

### Supported Value Types

Y fields support:

- **Single numbers**
- **Ranges** (`start..end`)
- **Algebraic expressions** (`an±b`)

### Examples

```typescript
// Single year
parseExpression('Y[2024]') // Year 2024 only

// Year range
parseExpression('Y[2023..2025]') // Years 2023, 2024, 2025

// Multiple years
parseExpression('Y[2020, 2024, 2028]') // Specific years

// Algebraic patterns
parseExpression('Y[4n+2024]') // Every 4 years starting from 2024: 2024, 2028, 2032...
parseExpression('Y[2n+2020]') // Every other year starting from 2020: 2020, 2022, 2024...
parseExpression('Y[1n+2020]') // Every year from 2020 onwards
```

## DateTime Fields (`DT[...]`)

DateTime fields combine date and time into precise datetime ranges using ISO-like format.

### Syntax

DateTime fields contain ranges only:

```
DT[YYYY-MM-DDTHH:MM:SS..YYYY-MM-DDTHH:MM:SS, ...]
DT[YYYY-MM-DDTHH:MM:SS.sss..YYYY-MM-DDTHH:MM:SS.sss, ...]
```

### Examples

```typescript
// Single datetime range
parseExpression('DT[2024-01-15T09:00..2024-01-15T17:00]') // Full day on Jan 15

// Multiple datetime ranges (lunch break)
parseExpression('DT[2024-01-15T09:00..2024-01-15T12:00, 2024-01-15T13:00..2024-01-15T17:00]')

// Cross-day ranges
parseExpression('DT[2024-01-15T22:00..2024-01-16T06:00]') // Night shift

// High precision timestamps
parseExpression('DT[2024-01-15T09:30:45.123..2024-01-15T17:45:30.500]')
```

## Reference Fields (`REF[...]`)

Reference fields allow you to reference other named schedule expressions.

### Syntax

Reference fields reference other expressions by ID:

```
REF[referenceId]
```

Reference IDs must be alphanumeric characters only.

### Examples

```typescript
// Create schedule and define reusable expressions
const schedule = new Schedule()

// Parse and store base expressions
const businessHoursExpr = parseExpression('T[9:00..17:00] AND WD[1..5]')
const holidaysExpr = parseExpression('D[2024-01-01, 2024-07-04, 2024-12-25]')

if (!businessHoursExpr.ok || !holidaysExpr.ok) {
  console.error('Failed to parse base expressions')
  return
}

// Add expressions to schedule first
const setResult1 = schedule.setExpression('businesshours', 'Business Hours', businessHoursExpr.value)
const setResult2 = schedule.setExpression('holidays', 'Company Holidays', holidaysExpr.value)

if (!setResult1.ok || !setResult2.ok) {
  console.error('Failed to set expressions in schedule')
  return
}

// Now parse expressions that reference the stored ones
const workingHoursExpr = parseExpression('REF[businesshours] AND NOT REF[holidays]')
if (!workingHoursExpr.ok) {
  console.error('Parse failed:', workingHoursExpr.error)
  return
}

// Add the reference expression to schedule
const setResult3 = schedule.setExpression('workinghours', 'Working Hours', workingHoursExpr.value)
if (!setResult3.ok) {
  console.error('Failed to set reference expression')
  return
}

// Evaluate using the schedule context
const startTime = Date.UTC(2024, 0, 1)
const endTime = Date.UTC(2024, 0, 31, 23, 59, 59, 999)

const result = schedule.evaluate('workinghours', startTime, endTime)
if (!result.ok) {
  console.error('Evaluation failed:', result.error)
  return
}

console.log('Working hours in January 2024:', result.value)

// Reference IDs must be alphanumeric only
// ✓ Valid: 'businesshours', 'lunch1', 'breaktime', 'shifta'
// ✗ Invalid: 'break_time', 'shift-a' (contain special characters)
```

## Value Expression Types

All field types (except Date, DateTime, and Reference) support these value expression patterns:

### Single Values

```typescript
parseExpression('WD[5]') // Single value: Friday
parseExpression('M[12]') // Single value: December
parseExpression('MD[15]') // Single value: 15th of month
```

### Ranges (`start..end`)

```typescript
parseExpression('WD[1..5]') // Range: Monday through Friday
parseExpression('M[6..8]') // Range: June through August
parseExpression('Y[2020..2025]') // Range: 2020 through 2025
parseExpression('MD[1..7]') // Range: 1st through 7th of month
```

### Lists (Comma-separated, OR logic)

```typescript
parseExpression('WD[1,3,5]') // List: Monday, Wednesday, Friday
parseExpression('M[3,6,9,12]') // List: March, June, September, December
parseExpression('T[9:00..9:01,12:00..12:01,15:00..15:01]') // List: 9 AM, noon, 3 PM (as ranges)
```

### Mixed Lists and Ranges

```typescript
parseExpression('WD[1,3..5,7]') // Monday, Wednesday through Friday, Sunday
parseExpression('MD[1,15..20,31]') // 1st, 15th-20th, 31st of every month
parseExpression('M[1..3,6,9..12]') // Q1, June, Q4
```

### Algebraic Expressions (`coefficient*n ± constant`)

Algebraic expressions follow the pattern `an±b` where:

- `a` is the coefficient (step size)
- `n` is the variable
- `b` is the constant (offset)

Pattern: `an±b` where `a` is coefficient, `n` is variable, `b` is constant

```typescript
// Common patterns
parseExpression('WD[2n+1]') // Every 2nd day starting from 1: 1,3,5,7 (Mon,Wed,Fri,Sun)
parseExpression('WD[2n+0]') // Every 2nd day starting from 0: 2,4,6 (Tue,Thu,Sat)
parseExpression('M[3n+0]') // Every 3rd month starting from 0: 3,6,9,12 (Mar,Jun,Sep,Dec)
parseExpression('MD[7n+1]') // Every 7 days starting from 1st: 1,8,15,22,29
parseExpression('Y[4n+2024]') // Every 4 years starting from 2024: 2024,2028,2032...

// Using subtraction
parseExpression('WD[3n-1]') // Every 3rd day with offset: 2,5 (Tue,Fri)
parseExpression('M[6n-2]') // Every 6th month with offset: 4,10 (Apr,Oct)
parseExpression('MD[5n-3]') // Every 5th day with offset: 2,7,12,17,22,27

// Edge cases
parseExpression('WD[1n+1]') // Every day starting from 1: 1,2,3,4,5,6,7 (all days)
parseExpression('M[12n+1]') // Every 12th month starting from 1: 1 (January only)
```

## Operator Precedence

PTW follows specific precedence rules:

1. **Parentheses** `()`
2. **Merge Control** `#`, `~`
3. **NOT** `NOT`, `!`
4. **AND** `AND`, `.`
5. **OR** `OR`, `,`

### Examples

```typescript
// Without parentheses: T[9:00..12:00] AND (WD[1] OR WD[5])
parseExpression('T[9:00..12:00] AND WD[1] OR WD[5]')

// With parentheses: (T[9:00..12:00] AND WD[1]) OR WD[5]
parseExpression('(T[9:00..12:00] AND WD[1]) OR WD[5]')

// NOT has high precedence: (NOT WD[6,7]) AND T[9:00..17:00]
parseExpression('NOT WD[6,7] AND T[9:00..17:00]')

// Explicit grouping: NOT (WD[6,7] AND T[10:00..14:00])
parseExpression('NOT (WD[6,7] AND T[10:00..14:00])')
```

## Merge Control

Defines whether consecutive adjacent time windows should be merged or not.

- `~` merge (default)
- `#` no merge

The merge state is passed onto the children, unless the merge state is explicitly set as otherwise.

Useful if you want to maintain strict scheduling boundaries

```typescript
// No merge is set on the OR condition and the two time fields
parseExpression('#(T[9:00..10:00] OR T[10:00..12:00])')

// No merge is set on the AND condition and on the week day field. The time field is set to merge
parseExpression('#(~T[9:00..10:00] AND WD[1..5])')
```

```typescript
// this returns 1 range within a week (1 -> 5)
// ~ is not necessary as force merging is the default
parseExpression('~WD[1..5]')

// this returns 5 ranges within a week (days 1, 2, 3, 4, 5)
parseExpression('#WD[1..5]')
```

## Combining Field Types

Field types can be combined using logical operators to create complex schedules:

```typescript
// Business hours: 9 AM to 5 PM, Monday through Friday
parseExpression('T[9:00..17:00] AND WD[1..5]')

// Quarterly meetings: First Monday of specified months at 2 PM
parseExpression('M[3,6,9,12] AND MD[1..7] AND WD[1] AND T[14:00]')

// Summer weekend hours with merge control
parseExpression('~(M[6..8] AND WD[6,7] AND T[10:00..16:00])')

// Holiday exclusion with reference
parseExpression('WD[1..5] AND NOT REF[companyholidays]')

// Complex scheduling with algebraic patterns
parseExpression('WD[2n+1] AND T[8:00..16:00] AND M[1..6]') // Odd weekdays, first half of year
```
