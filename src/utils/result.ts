export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}