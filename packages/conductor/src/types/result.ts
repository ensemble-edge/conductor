/**
 * Result Type for Explicit Error Handling
 *
 * A Result type represents the outcome of an operation that may fail.
 * It forces explicit error handling at compile time, making it impossible
 * to forget to handle errors.
 *
 * @example
 * ```typescript
 * // Function that may fail
 * function findUser(id: string): Result<User, UserNotFoundError> {
 *   const user = database.find(id);
 *   if (!user) {
 *     return Result.err(new UserNotFoundError(id));
 *   }
 *   return Result.ok(user);
 * }
 *
 * // Error handling is explicit and checked
 * const result = findUser('123');
 * if (!result.success) {
 *   console.error('Error:', result.error.message);
 *   return;
 * }
 * const user = result.value; // Type-safe access
 * ```
 */

/**
 * Result type - either success with a value or failure with an error
 */
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }

/**
 * Result utilities and constructors
 */
export const Result = {
  /**
   * Create a successful Result
   */
  ok<T>(value: T): Result<T, never> {
    return { success: true, value }
  },

  /**
   * Create a failed Result
   */
  err<E>(error: E): Result<never, E> {
    return { success: false, error }
  },

  /**
   * Wrap a Promise to catch errors and return a Result
   * @example
   * ```typescript
   * const result = await Result.fromPromise(
   *   fetch('https://api.example.com/data')
   * );
   * ```
   */
  async fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
    try {
      const value = await promise
      return Result.ok(value)
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)))
    }
  },

  /**
   * Wrap a synchronous function to catch errors and return a Result
   * @example
   * ```typescript
   * const result = Result.fromThrowable(() => JSON.parse(input));
   * ```
   */
  fromThrowable<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.ok(fn())
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)))
    }
  },

  /**
   * Transform the value inside a successful Result
   * Leaves error Results unchanged
   * @example
   * ```typescript
   * const result = Result.ok(5);
   * const doubled = Result.map(result, x => x * 2);
   * // doubled = { success: true, value: 10 }
   * ```
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.value))
    }
    return result
  },

  /**
   * Async version of map
   */
  async mapAsync<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Promise<U>
  ): Promise<Result<U, E>> {
    if (result.success) {
      return Result.ok(await fn(result.value))
    }
    return result
  },

  /**
   * Transform the error inside a failed Result
   * Leaves success Results unchanged
   * @example
   * ```typescript
   * const result = Result.err(new Error('failed'));
   * const wrapped = Result.mapErr(result, e => new CustomError(e));
   * ```
   */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.success) {
      return result
    }
    return Result.err(fn(result.error))
  },

  /**
   * Chain Results together (flatMap/bind)
   * If the first Result is an error, returns it without calling fn
   * If the first Result is success, calls fn with the value
   * @example
   * ```typescript
   * const result = Result.ok(5);
   * const chained = Result.flatMap(result, x => {
   *   if (x > 10) return Result.ok(x);
   *   return Result.err(new Error('too small'));
   * });
   * ```
   */
  flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (result.success) {
      return fn(result.value)
    }
    return result
  },

  /**
   * Async version of flatMap
   */
  async flatMapAsync<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Promise<Result<U, E>>
  ): Promise<Result<U, E>> {
    if (result.success) {
      return await fn(result.value)
    }
    return result
  },

  /**
   * Unwrap a Result, throwing if it's an error
   * Use sparingly - prefer explicit error handling
   * @throws The error if Result is failed
   * @example
   * ```typescript
   * const value = Result.unwrap(result); // Throws if error
   * ```
   */
  unwrap<T, E>(result: Result<T, E>): T {
    if (result.success) {
      return result.value
    }
    throw result.error
  },

  /**
   * Unwrap a Result, returning a default value if it's an error
   * @example
   * ```typescript
   * const value = Result.unwrapOr(result, 'default');
   * ```
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.success ? result.value : defaultValue
  },

  /**
   * Unwrap a Result, computing a default value from the error
   * @example
   * ```typescript
   * const value = Result.unwrapOrElse(result, error => {
   *   console.error('Failed:', error);
   *   return 'fallback';
   * });
   * ```
   */
  unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
    return result.success ? result.value : fn(result.error)
  },

  /**
   * Check if Result is success
   */
  isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
    return result.success === true
  },

  /**
   * Check if Result is error
   */
  isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false
  },

  /**
   * Combine multiple Results into one
   * Returns first error, or all values if all succeed
   * @example
   * ```typescript
   * const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
   * const combined = Result.all(results);
   * // combined = { success: true, value: [1, 2, 3] }
   * ```
   */
  all<T, E>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = []

    for (const result of results) {
      if (!result.success) {
        return result
      }
      values.push(result.value)
    }

    return Result.ok(values)
  },

  /**
   * Combine multiple Results, collecting all errors or all values
   * Unlike `all`, this doesn't short-circuit on first error
   * @example
   * ```typescript
   * const results = [
   *   Result.ok(1),
   *   Result.err(new Error('e1')),
   *   Result.err(new Error('e2'))
   * ];
   * const combined = Result.partition(results);
   * // combined = { success: false, error: [Error('e1'), Error('e2')] }
   * ```
   */
  partition<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
    const values: T[] = []
    const errors: E[] = []

    for (const result of results) {
      if (result.success) {
        values.push(result.value)
      } else {
        errors.push(result.error)
      }
    }

    if (errors.length > 0) {
      return Result.err(errors)
    }

    return Result.ok(values)
  },

  /**
   * Sequence async operations, short-circuiting on first error
   * @example
   * ```typescript
   * const result = await Result.sequence([
   *   () => validateInput(data),
   *   () => fetchUser(data.userId),
   *   () => updateUser(user)
   * ]);
   * ```
   */
  async sequence<T, E>(operations: Array<() => Promise<Result<T, E>>>): Promise<Result<T[], E>> {
    const values: T[] = []

    for (const operation of operations) {
      const result = await operation()
      if (!result.success) {
        return result
      }
      values.push(result.value)
    }

    return Result.ok(values)
  },

  /**
   * Match on a Result, providing handlers for both cases
   * @example
   * ```typescript
   * const message = Result.match(result, {
   *   ok: user => `Welcome ${user.name}`,
   *   err: error => `Error: ${error.message}`
   * });
   * ```
   */
  match<T, E, R>(
    result: Result<T, E>,
    handlers: {
      ok: (value: T) => R
      err: (error: E) => R
    }
  ): R {
    if (result.success) {
      return handlers.ok(result.value)
    }
    return handlers.err(result.error)
  },

  /**
   * Perform a side effect on success, returning the original Result
   * @example
   * ```typescript
   * const result = Result.ok(user)
   *   .pipe(Result.tap(u => console.log('Found user:', u.name)));
   * ```
   */
  tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
    if (result.success) {
      fn(result.value)
    }
    return result
  },

  /**
   * Perform a side effect on error, returning the original Result
   * @example
   * ```typescript
   * const result = operation()
   *   .pipe(Result.tapErr(e => console.error('Operation failed:', e)));
   * ```
   */
  tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
    if (!result.success) {
      fn(result.error)
    }
    return result
  },
}

/**
 * Async Result for operations that return promises
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * Helper for creating async results
 */
export const AsyncResult = {
  /**
   * Create a successful async Result
   */
  ok<T>(value: T): AsyncResult<T, never> {
    return Promise.resolve(Result.ok(value))
  },

  /**
   * Create a failed async Result
   */
  err<E>(error: E): AsyncResult<never, E> {
    return Promise.resolve(Result.err(error))
  },

  /**
   * Chain async operations
   */
  async flatMap<T, U, E>(
    result: AsyncResult<T, E>,
    fn: (value: T) => AsyncResult<U, E>
  ): AsyncResult<U, E> {
    const resolved = await result
    return Result.flatMapAsync(resolved, fn)
  },
}
