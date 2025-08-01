/**
 * Custom error types for schedule evaluation and validation
 */

/**
 * Base class for all schedule-related errors
 */
export abstract class ScheduleError extends Error {
  abstract readonly code: string

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Error thrown when a value is out of acceptable bounds
 */
export class ValidationError extends ScheduleError {
  readonly code = 'VALIDATION_ERROR'

  constructor(
    message: string,
    public readonly value?: unknown,
    public readonly bounds?: { min: number, max: number },
    context?: Record<string, unknown>,
  ) {
    super(message, context)
  }
}

/**
 * Error thrown when an array index is out of bounds
 */
export class IndexOutOfBoundsError extends ScheduleError {
  readonly code = 'INDEX_OUT_OF_BOUNDS'

  constructor(
    public readonly index: number,
    public readonly bounds: { min: number, max: number },
    context?: Record<string, unknown>,
  ) {
    super(`Index ${index} is out of bounds [${bounds.min}, ${bounds.max}]`, context)
  }
}

/**
 * Error thrown during schedule evaluation when a block fails to evaluate
 */
export class InvalidIDError extends ScheduleError {
  readonly code = 'INVALID_ID_ERROR'

  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context })
  }
}

/**
 * Error thrown when a schedule reference cannot be resolved
 */
export class ReferenceError extends ScheduleError {
  readonly code = 'REFERENCE_ERROR'

  constructor(
    public readonly referenceId: string,
    context?: Record<string, unknown>,
  ) {
    super(`Could not resolve schedule reference: ${referenceId}`, { ...context, referenceId })
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends ScheduleError {
  readonly code = 'PARSE_ERROR'

  constructor(
    message: string,
    public readonly expression?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, expression })
  }
}
