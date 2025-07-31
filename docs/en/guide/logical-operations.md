# Logical Operations

PTW supports logical operations to combine and modify schedule expressions.

## AND Operation

The AND operation requires both conditions to be true.

### Syntax

- `expr1 AND expr2` - Explicit AND keyword
- `expr1.expr2` - Dot notation (shorthand)

### Examples

```typescript
// Business hours: Both time range AND weekdays must match
parseExpression('T[9:00..17:00] AND WD[1..5]')
parseExpression('T[9:00..17:00].WD[1..5]')

// Multiple AND conditions
parseExpression('T[9:00..17:00] AND WD[1..5] AND M[1..12]')

// AND with parentheses
parseExpression('(T[9:00..12:00] OR T[13:00..17:00]) AND WD[1..5]')
```

## OR Operation

The OR operation includes periods where at least one condition is true.

### Syntax

- `expr1 OR expr2` - Explicit OR keyword
- `expr1,expr2` - Comma notation (within field brackets)

### Examples

```typescript
// Either Monday OR Friday
parseExpression('WD[1] OR WD[5]')
parseExpression('WD[1],WD[5]')
parseExpression('WD[1,5]')

// Multiple time periods
parseExpression('T[9:00..12:00] OR T[13:00..17:00]')
parseExpression('T[9:00..12:00],T[13:00..17:00]')
parseExpression('T[9:00..12:00,13:00..17:00]')
```

## NOT Operation

The NOT operation excludes periods that match the specified condition.

### Syntax

- `NOT expr` - Explicit NOT keyword
- `!expr` - Exclamation mark notation

### Examples

```typescript
// All days except weekends
parseExpression('NOT WD[6,7]')

// Using exclamation mark (equivalent to above)
parseExpression('!WD[6,7]')

// Business hours excluding lunch
parseExpression('T[9:00..17:00] AND NOT T[12:00..13:00]')

// Weekdays excluding holidays
parseExpression('WD[1..5] AND NOT REF[company-holidays]')

// Multiple exclusions
parseExpression('T[9:00..17:00] AND NOT T[12:00..13:00] AND NOT T[15:00..15:15]')
```

## Operator Precedence

Precedence from highest to lowest:

1. **Parentheses** `()` - Highest precedence
2. **NOT** `NOT`, `!` - Unary operators
3. **AND** `AND`, `.` - Higher than OR
4. **OR** `OR`, `,` - Lowest precedence

### Examples

```typescript
// Without parentheses: (A AND B) OR C
parseExpression('T[9:00..12:00] AND WD[1] OR WD[5]')

// With parentheses: A AND (B OR C)
parseExpression('T[9:00..12:00] AND (WD[1] OR WD[5])')

// NOT has high precedence: (NOT A) AND B
parseExpression('NOT WD[6,7] AND T[9:00..17:00]')

// Explicit grouping: NOT (A AND B)
parseExpression('NOT (WD[6,7] AND T[10:00..14:00])')
```

## Examples

```typescript
// Business hours with lunch break
parseExpression('T[9:00..17:00] AND WD[1..5] AND NOT T[12:00..13:00]')

// Seasonal schedules
parseExpression('(M[6..8] AND T[8:00..16:00]) OR (M[1..5,9..12] AND T[9:00..17:00])')

// Weekend maintenance
parseExpression('WD[6,7] AND T[2:00..6:00]')

// Business hours excluding holidays
parseExpression('T[9:00..17:00] AND WD[1..5] AND NOT REF[holidays]')
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

// No merge is set on the AND condition and on the week day field
parseExpression('#(~T[9:00..10:00] AND WD[1..5])')
```

```typescript
// this returns 1 range within a week (1 -> 5)
// ~ is not necessary as force merging is the default
parseExpression('~WD[1..5]')

// this returns 5 ranges within a week (days 1, 2, 3, 4, 5)
parseExpression('#WD[1..5]')
```
