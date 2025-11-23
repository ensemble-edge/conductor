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
 * Result utilities and constructors
 */
export const Result = {
    /**
     * Create a successful Result
     */
    ok(value) {
        return { success: true, value };
    },
    /**
     * Create a failed Result
     */
    err(error) {
        return { success: false, error };
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
    async fromPromise(promise) {
        try {
            const value = await promise;
            return Result.ok(value);
        }
        catch (error) {
            return Result.err(error instanceof Error ? error : new Error(String(error)));
        }
    },
    /**
     * Wrap a synchronous function to catch errors and return a Result
     * @example
     * ```typescript
     * const result = Result.fromThrowable(() => JSON.parse(input));
     * ```
     */
    fromThrowable(fn) {
        try {
            return Result.ok(fn());
        }
        catch (error) {
            return Result.err(error instanceof Error ? error : new Error(String(error)));
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
    map(result, fn) {
        if (result.success) {
            return Result.ok(fn(result.value));
        }
        return result;
    },
    /**
     * Async version of map
     */
    async mapAsync(result, fn) {
        if (result.success) {
            return Result.ok(await fn(result.value));
        }
        return result;
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
    mapErr(result, fn) {
        if (result.success) {
            return result;
        }
        return Result.err(fn(result.error));
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
    flatMap(result, fn) {
        if (result.success) {
            return fn(result.value);
        }
        return result;
    },
    /**
     * Async version of flatMap
     */
    async flatMapAsync(result, fn) {
        if (result.success) {
            return await fn(result.value);
        }
        return result;
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
    unwrap(result) {
        if (result.success) {
            return result.value;
        }
        throw result.error;
    },
    /**
     * Unwrap a Result, returning a default value if it's an error
     * @example
     * ```typescript
     * const value = Result.unwrapOr(result, 'default');
     * ```
     */
    unwrapOr(result, defaultValue) {
        return result.success ? result.value : defaultValue;
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
    unwrapOrElse(result, fn) {
        return result.success ? result.value : fn(result.error);
    },
    /**
     * Check if Result is success
     */
    isOk(result) {
        return result.success === true;
    },
    /**
     * Check if Result is error
     */
    isErr(result) {
        return result.success === false;
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
    all(results) {
        const values = [];
        for (const result of results) {
            if (!result.success) {
                return result;
            }
            values.push(result.value);
        }
        return Result.ok(values);
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
    partition(results) {
        const values = [];
        const errors = [];
        for (const result of results) {
            if (result.success) {
                values.push(result.value);
            }
            else {
                errors.push(result.error);
            }
        }
        if (errors.length > 0) {
            return Result.err(errors);
        }
        return Result.ok(values);
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
    async sequence(operations) {
        const values = [];
        for (const operation of operations) {
            const result = await operation();
            if (!result.success) {
                return result;
            }
            values.push(result.value);
        }
        return Result.ok(values);
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
    match(result, handlers) {
        if (result.success) {
            return handlers.ok(result.value);
        }
        return handlers.err(result.error);
    },
    /**
     * Perform a side effect on success, returning the original Result
     * @example
     * ```typescript
     * const result = Result.ok(user)
     *   .pipe(Result.tap(u => console.log('Found user:', u.name)));
     * ```
     */
    tap(result, fn) {
        if (result.success) {
            fn(result.value);
        }
        return result;
    },
    /**
     * Perform a side effect on error, returning the original Result
     * @example
     * ```typescript
     * const result = operation()
     *   .pipe(Result.tapErr(e => console.error('Operation failed:', e)));
     * ```
     */
    tapErr(result, fn) {
        if (!result.success) {
            fn(result.error);
        }
        return result;
    },
};
/**
 * Helper for creating async results
 */
export const AsyncResult = {
    /**
     * Create a successful async Result
     */
    ok(value) {
        return Promise.resolve(Result.ok(value));
    },
    /**
     * Create a failed async Result
     */
    err(error) {
        return Promise.resolve(Result.err(error));
    },
    /**
     * Chain async operations
     */
    async flatMap(result, fn) {
        const resolved = await result;
        return Result.flatMapAsync(resolved, fn);
    },
};
