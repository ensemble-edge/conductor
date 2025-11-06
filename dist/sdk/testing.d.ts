/**
 * SDK Testing Utilities
 *
 * Helpers for testing members and ensembles
 */
import type { MemberExecutionContext } from './types.js';
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
export declare function mockContext(overrides?: Partial<MemberExecutionContext>): MemberExecutionContext;
/**
 * Create a mock Env object
 */
export declare function mockEnv(overrides?: Partial<Env>): Env;
/**
 * Create a mock ExecutionContext
 */
export declare function mockExecutionContext(): ExecutionContext;
/**
 * Create a mock KV namespace
 */
export declare function mockKV(): KVNamespace;
/**
 * Create a mock AI binding
 */
export declare function mockAI(): Ai;
/**
 * Create a mock D1 database
 */
export declare function mockD1(): D1Database;
/**
 * Create a mock R2 bucket
 */
export declare function mockR2(): R2Bucket;
/**
 * Spy on a function (simple implementation)
 */
export declare function spy<T extends (...args: unknown[]) => unknown>(fn: T): T & {
    calls: unknown[][];
};
//# sourceMappingURL=testing.d.ts.map