# Timezone Handling

🚧 **Beta Status**: PTW currently has limited timezone support and requires all timestamps to be in UTC.

## UTC Only

PTW operates exclusively on UTC timestamps. All timestamps must be provided in UTC milliseconds since epoch.

## Creating UTC Timestamps

```typescript
// ✅ Correct: Using Date.UTC()
const startTime = Date.UTC(2024, 0, 1, 9, 0, 0) // Jan 1, 2024 09:00:00 UTC

// ✅ Correct: From ISO string with Z suffix
const timestamp = new Date('2024-01-01T09:00:00Z').getTime()

// ✅ Correct: Current time
const now = Date.now()

// ❌ Incorrect: Local date constructor
const localTime = new Date(2024, 0, 1, 9, 0, 0).getTime() // Uses local timezone
```
