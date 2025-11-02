/**
 * SDK Testing Utilities
 *
 * Helpers for testing members and ensembles
 */

import type { MemberExecutionContext } from './types';

/**
 * Create a mock execution context for testing
 *
 * @example
 * ```typescript
 * const context = mockContext({
 *   input: { name: 'Test' }
 * });
 *
 * const result = await myMember(context);
 * expect(result.message).toBe('Hello, Test!');
 * ```
 */
export function mockContext(overrides?: Partial<MemberExecutionContext>): MemberExecutionContext {
	return {
		input: {},
		env: mockEnv(),
		ctx: mockExecutionContext(),
		...overrides
	} as MemberExecutionContext;
}

/**
 * Create a mock Env object
 */
export function mockEnv(overrides?: Partial<Env>): Env {
	return {
		CACHE: mockKV(),
		AI: mockAI(),
		...overrides
	} as Env;
}

/**
 * Create a mock ExecutionContext
 */
export function mockExecutionContext(): ExecutionContext {
	const waitUntilPromises: Promise<any>[] = [];

	return {
		waitUntil(promise: Promise<any>) {
			waitUntilPromises.push(promise);
		},
		passThroughOnException() {
			// No-op in tests
		},
		props: {}
	} as ExecutionContext;
}

/**
 * Create a mock KV namespace
 */
export function mockKV(): KVNamespace {
	const store = new Map<string, string>();

	return {
		get: async (key: string) => store.get(key) || null,
		put: async (key: string, value: string) => {
			store.set(key, value);
		},
		delete: async (key: string) => {
			store.delete(key);
		},
		list: async () => ({
			keys: Array.from(store.keys()).map(key => ({ name: key })),
			list_complete: true,
			cacheStatus: null
		})
	} as any;
}

/**
 * Create a mock AI binding
 */
export function mockAI(): Ai {
	return {
		run: async (model: string, options: any) => {
			// Return mock AI response
			return {
				response: 'Mock AI response',
				result: { response: 'Mock AI response' }
			};
		}
	} as any;
}

/**
 * Create a mock D1 database
 */
export function mockD1(): D1Database {
	const data: any[] = [];

	return {
		prepare: (sql: string) => ({
			bind: (...params: any[]) => ({
				all: async () => ({
					results: data,
					success: true,
					meta: {}
				}),
				first: async () => data[0] || null,
				run: async () => ({
					success: true,
					meta: {}
				})
			})
		}),
		dump: async () => new ArrayBuffer(0),
		batch: async () => [],
		exec: async () => ({
			count: 0,
			duration: 0
		})
	} as any;
}

/**
 * Create a mock R2 bucket
 */
export function mockR2(): R2Bucket {
	const store = new Map<string, string>();

	return {
		get: async (key: string) => {
			const value = store.get(key);
			if (!value) return null;

			return {
				key,
				size: value.length,
				uploaded: new Date(),
				httpMetadata: {},
				customMetadata: {},
				text: async () => value,
				json: async () => JSON.parse(value),
				arrayBuffer: async () => new TextEncoder().encode(value).buffer,
				blob: async () => new Blob([value])
			} as any;
		},
		put: async (key: string, value: any) => {
			store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
		},
		delete: async (key: string) => {
			store.delete(key);
		},
		list: async () => ({
			objects: Array.from(store.keys()).map(key => ({
				key,
				size: store.get(key)!.length,
				uploaded: new Date()
			})),
			truncated: false,
			delimitedPrefixes: []
		})
	} as any;
}

/**
 * Spy on a function (simple implementation)
 */
export function spy<T extends (...args: any[]) => any>(fn: T): T & { calls: any[][] } {
	const calls: any[][] = [];

	const spied = ((...args: any[]) => {
		calls.push(args);
		return fn(...args);
	}) as T & { calls: any[][] };

	spied.calls = calls;

	return spied;
}
