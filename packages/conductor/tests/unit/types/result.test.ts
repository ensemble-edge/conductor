/**
 * Result Type Tests
 *
 * Comprehensive tests for the Result type - our core error handling abstraction.
 * Target: 95%+ coverage with ~80 test cases
 */

import { describe, it, expect } from 'vitest';
import { Result } from '../../../src/types/result';

describe('Result Type', () => {
	describe('Construction', () => {
		it('should create success result with ok()', () => {
			const result = Result.ok(42);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('should create failure result with err()', () => {
			const error = new Error('test error');
			const result = Result.err(error);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe(error);
			}
		});

		it('should preserve value type in success result', () => {
			interface User {
				id: string;
				name: string;
			}
			const user: User = { id: '123', name: 'Alice' };
			const result = Result.ok(user);

			if (result.success) {
				expect(result.value.id).toBe('123');
				expect(result.value.name).toBe('Alice');
			}
		});

		it('should preserve error type in failure result', () => {
			class CustomError extends Error {
				constructor(
					message: string,
					public code: string
				) {
					super(message);
				}
			}
			const error = new CustomError('test', 'TEST_ERROR');
			const result = Result.err(error);

			if (!result.success) {
				expect(result.error.code).toBe('TEST_ERROR');
			}
		});
	});

	describe('Type Guards', () => {
		it('should identify success results with isOk()', () => {
			const result = Result.ok(42);
			expect(Result.isOk(result)).toBe(true);
			expect(Result.isErr(result)).toBe(false);
		});

		it('should identify failure results with isErr()', () => {
			const result = Result.err(new Error('fail'));
			expect(Result.isErr(result)).toBe(true);
			expect(Result.isOk(result)).toBe(false);
		});

		it('should narrow types correctly with isOk()', () => {
			const result = Result.ok<number, Error>(42);

			if (Result.isOk(result)) {
				// TypeScript should know result.value exists
				const value: number = result.value;
				expect(value).toBe(42);
			}
		});

		it('should narrow types correctly with isErr()', () => {
			const result = Result.err<number, Error>(new Error('fail'));

			if (Result.isErr(result)) {
				// TypeScript should know result.error exists
				const error: Error = result.error;
				expect(error.message).toBe('fail');
			}
		});
	});

	describe('map', () => {
		it('should transform success values', () => {
			const result = Result.ok(5);
			const doubled = Result.map(result, x => x * 2);

			expect(doubled.success).toBe(true);
			if (doubled.success) {
				expect(doubled.value).toBe(10);
			}
		});

		it('should skip transformation on failure', () => {
			const result = Result.err<number, Error>(new Error('fail'));
			const doubled = Result.map(result, x => x * 2);

			expect(doubled.success).toBe(false);
			if (!doubled.success) {
				expect(doubled.error.message).toBe('fail');
			}
		});

		it('should chain multiple transformations', () => {
			const result = Result.ok(5);
			const transformed = Result.map(Result.map(result, x => x * 2), x => x + 1);

			if (transformed.success) {
				expect(transformed.value).toBe(11);
			}
		});

		it('should maintain error type through transformations', () => {
			const result = Result.err<number, string>('error');
			const mapped = Result.map(result, x => String(x));

			if (!mapped.success) {
				const error: string = mapped.error;
				expect(error).toBe('error');
			}
		});
	});

	describe('mapAsync', () => {
		it('should transform success values asynchronously', async () => {
			const result = Result.ok(5);
			const doubled = await Result.mapAsync(result, async x => x * 2);

			expect(doubled.success).toBe(true);
			if (doubled.success) {
				expect(doubled.value).toBe(10);
			}
		});

		it('should skip transformation on failure', async () => {
			const result = Result.err<number, Error>(new Error('fail'));
			const doubled = await Result.mapAsync(result, async x => x * 2);

			expect(doubled.success).toBe(false);
		});
	});

	describe('mapErr', () => {
		it('should transform error values', () => {
			const result = Result.err(new Error('original'));
			const wrapped = Result.mapErr(result, e => new Error(`Wrapped: ${e.message}`));

			if (!wrapped.success) {
				expect(wrapped.error.message).toBe('Wrapped: original');
			}
		});

		it('should skip transformation on success', () => {
			const result = Result.ok(42);
			const wrapped = Result.mapErr(result, e => new Error('should not run'));

			expect(wrapped.success).toBe(true);
			if (wrapped.success) {
				expect(wrapped.value).toBe(42);
			}
		});

		it('should allow error type changes', () => {
			const result = Result.err<number, string>('string error');
			const converted = Result.mapErr(result, str => new Error(str));

			if (!converted.success) {
				const error: Error = converted.error;
				expect(error.message).toBe('string error');
			}
		});
	});

	describe('flatMap', () => {
		it('should chain successful operations', () => {
			const result = Result.ok(5);
			const chained = Result.flatMap(result, x => {
				if (x > 10) return Result.ok(x);
				return Result.err(new Error('too small'));
			});

			expect(chained.success).toBe(false);
		});

		it('should short-circuit on first failure', () => {
			const result = Result.err<number, Error>(new Error('first error'));
			const chained = Result.flatMap(result, x => Result.ok(x * 2));

			expect(chained.success).toBe(false);
			if (!chained.success) {
				expect(chained.error.message).toBe('first error');
			}
		});

		it('should allow type changes in chain', () => {
			const result = Result.ok(5);
			const chained = Result.flatMap(result, x => Result.ok(String(x)));

			if (chained.success) {
				const value: string = chained.value;
				expect(value).toBe('5');
			}
		});
	});

	describe('flatMapAsync', () => {
		it('should chain async operations', async () => {
			const result = Result.ok(5);
			const chained = await Result.flatMapAsync(result, async x => {
				return Result.ok(x * 2);
			});

			if (chained.success) {
				expect(chained.value).toBe(10);
			}
		});

		it('should short-circuit on failure', async () => {
			const result = Result.err<number, Error>(new Error('fail'));
			const chained = await Result.flatMapAsync(result, async x => Result.ok(x * 2));

			expect(chained.success).toBe(false);
		});
	});

	describe('unwrap', () => {
		it('should return value from success result', () => {
			const result = Result.ok(42);
			const value = Result.unwrap(result);

			expect(value).toBe(42);
		});

		it('should throw error from failure result', () => {
			const result = Result.err(new Error('fail'));

			expect(() => Result.unwrap(result)).toThrow('fail');
		});
	});

	describe('unwrapOr', () => {
		it('should return value from success result', () => {
			const result = Result.ok(42);
			const value = Result.unwrapOr(result, 0);

			expect(value).toBe(42);
		});

		it('should return default from failure result', () => {
			const result = Result.err<number, Error>(new Error('fail'));
			const value = Result.unwrapOr(result, 0);

			expect(value).toBe(0);
		});
	});

	describe('unwrapOrElse', () => {
		it('should return value from success result', () => {
			const result = Result.ok(42);
			const value = Result.unwrapOrElse(result, () => 0);

			expect(value).toBe(42);
		});

		it('should compute default from failure result', () => {
			const result = Result.err<number, Error>(new Error('fail'));
			const value = Result.unwrapOrElse(result, error => {
				return error.message.length;
			});

			expect(value).toBe(4); // "fail".length
		});
	});

	describe('fromPromise', () => {
		it('should wrap successful promise', async () => {
			const promise = Promise.resolve(42);
			const result = await Result.fromPromise(promise);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('should wrap rejected promise', async () => {
			const promise = Promise.reject(new Error('fail'));
			const result = await Result.fromPromise(promise);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('fail');
			}
		});

		it('should convert non-Error rejections to Error', async () => {
			const promise = Promise.reject('string error');
			const result = await Result.fromPromise(promise);

			if (!result.success) {
				expect(result.error).toBeInstanceOf(Error);
				expect(result.error.message).toBe('string error');
			}
		});
	});

	describe('fromThrowable', () => {
		it('should wrap successful function', () => {
			const result = Result.fromThrowable(() => 42);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(42);
			}
		});

		it('should catch thrown errors', () => {
			const result = Result.fromThrowable(() => {
				throw new Error('fail');
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toBe('fail');
			}
		});

		it('should convert non-Error throws to Error', () => {
			const result = Result.fromThrowable(() => {
				throw 'string error';
			});

			if (!result.success) {
				expect(result.error).toBeInstanceOf(Error);
				expect(result.error.message).toBe('string error');
			}
		});
	});

	describe('all', () => {
		it('should combine all successful results', () => {
			const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
			const combined = Result.all(results);

			expect(combined.success).toBe(true);
			if (combined.success) {
				expect(combined.value).toEqual([1, 2, 3]);
			}
		});

		it('should return first error', () => {
			const results = [
				Result.ok(1),
				Result.err(new Error('error1')),
				Result.err(new Error('error2'))
			];
			const combined = Result.all(results);

			expect(combined.success).toBe(false);
			if (!combined.success) {
				expect(combined.error.message).toBe('error1');
			}
		});

		it('should handle empty array', () => {
			const results: Result<number, Error>[] = [];
			const combined = Result.all(results);

			expect(combined.success).toBe(true);
			if (combined.success) {
				expect(combined.value).toEqual([]);
			}
		});
	});

	describe('partition', () => {
		it('should collect all values when all succeed', () => {
			const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
			const partitioned = Result.partition(results);

			expect(partitioned.success).toBe(true);
			if (partitioned.success) {
				expect(partitioned.value).toEqual([1, 2, 3]);
			}
		});

		it('should collect all errors when any fail', () => {
			const results = [
				Result.ok(1),
				Result.err(new Error('error1')),
				Result.err(new Error('error2'))
			];
			const partitioned = Result.partition(results);

			expect(partitioned.success).toBe(false);
			if (!partitioned.success) {
				expect(partitioned.error).toHaveLength(2);
				expect(partitioned.error[0].message).toBe('error1');
				expect(partitioned.error[1].message).toBe('error2');
			}
		});
	});

	describe('sequence', () => {
		it('should execute operations in sequence', async () => {
			let counter = 0;
			const operations = [
				async () => Result.ok(++counter),
				async () => Result.ok(++counter),
				async () => Result.ok(++counter)
			];

			const result = await Result.sequence(operations);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual([1, 2, 3]);
			}
		});

		it('should short-circuit on first error', async () => {
			let counter = 0;
			const operations = [
				async () => Result.ok(++counter),
				async () => Result.err(new Error('fail')),
				async () => Result.ok(++counter) // Should not execute
			];

			const result = await Result.sequence(operations);

			expect(result.success).toBe(false);
			expect(counter).toBe(1); // Third operation never ran
		});
	});

	describe('match', () => {
		it('should handle success case', () => {
			const result = Result.ok(42);
			const message = Result.match(result, {
				ok: value => `Success: ${value}`,
				err: error => `Error: ${error.message}`
			});

			expect(message).toBe('Success: 42');
		});

		it('should handle error case', () => {
			const result = Result.err(new Error('fail'));
			const message = Result.match(result, {
				ok: value => `Success: ${value}`,
				err: error => `Error: ${error.message}`
			});

			expect(message).toBe('Error: fail');
		});
	});

	describe('tap', () => {
		it('should execute side effect on success', () => {
			let sideEffect = 0;
			const result = Result.ok(42);

			const tapped = Result.tap(result, value => {
				sideEffect = value;
			});

			expect(sideEffect).toBe(42);
			expect(tapped).toBe(result); // Returns original
		});

		it('should skip side effect on failure', () => {
			let sideEffect = 0;
			const result = Result.err<number, Error>(new Error('fail'));

			Result.tap(result, value => {
				sideEffect = value;
			});

			expect(sideEffect).toBe(0);
		});
	});

	describe('tapErr', () => {
		it('should execute side effect on error', () => {
			let sideEffect = '';
			const result = Result.err(new Error('fail'));

			const tapped = Result.tapErr(result, error => {
				sideEffect = error.message;
			});

			expect(sideEffect).toBe('fail');
			expect(tapped).toBe(result); // Returns original
		});

		it('should skip side effect on success', () => {
			let sideEffect = '';
			const result = Result.ok(42);

			Result.tapErr(result, error => {
				sideEffect = error.message;
			});

			expect(sideEffect).toBe('');
		});
	});

	describe('Complex Scenarios', () => {
		it('should handle nested Result types', () => {
			const nested = Result.ok(Result.ok(42));

			if (nested.success && nested.value.success) {
				expect(nested.value.value).toBe(42);
			}
		});

		it('should support method chaining pattern', () => {
			const result = Result.ok(5);
			const final = Result.map(Result.map(result, x => x * 2), x => x + 1);

			if (final.success) {
				expect(final.value).toBe(11);
			}
		});

		it('should work in real-world validation scenario', () => {
			interface User {
				email: string;
				age: number;
			}

			function validateEmail(email: string): Result<string, Error> {
				if (email.includes('@')) {
					return Result.ok(email);
				}
				return Result.err(new Error('Invalid email'));
			}

			function validateAge(age: number): Result<number, Error> {
				if (age >= 18) {
					return Result.ok(age);
				}
				return Result.err(new Error('Must be 18+'));
			}

			function createUser(email: string, age: number): Result<User, Error> {
				const emailResult = validateEmail(email);
				if (!emailResult.success) return emailResult;

				const ageResult = validateAge(age);
				if (!ageResult.success) return ageResult;

				return Result.ok({ email: emailResult.value, age: ageResult.value });
			}

			// Valid user
			const validUser = createUser('alice@example.com', 25);
			expect(validUser.success).toBe(true);

			// Invalid email
			const invalidEmail = createUser('not-an-email', 25);
			expect(invalidEmail.success).toBe(false);

			// Invalid age
			const invalidAge = createUser('bob@example.com', 16);
			expect(invalidAge.success).toBe(false);
		});
	});
});
