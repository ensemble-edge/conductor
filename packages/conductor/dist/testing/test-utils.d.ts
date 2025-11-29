/**
 * Test Utilities
 *
 * Common test helpers and factory functions to reduce duplicate setup code.
 * Import these utilities instead of writing boilerplate in each test file.
 *
 * @example
 * ```typescript
 * import {
 *   createMockEnv,
 *   createMockContext,
 *   createTestHonoApp,
 *   MockResponse,
 *   MockRepository,
 * } from '@ensemble-edge/conductor/testing';
 *
 * const env = createMockEnv({ API_KEY: 'test-key' });
 * const ctx = createMockContext();
 * const app = createTestHonoApp();
 * ```
 */
import { Hono } from 'hono';
import type { ConductorEnv } from '../types/env.js';
import type { ConductorContext, AuthContext } from '../api/types.js';
import { Result } from '../types/result.js';
import { type SecurityConfig } from '../config/security.js';
import { ConductorError } from '../errors/error-types.js';
import { type RequestId as RequestIdType } from '../types/branded.js';
/**
 * Create a mock ConductorEnv for testing
 *
 * @param overrides - Optional environment variable overrides
 * @returns A mock environment object
 *
 * @example
 * ```typescript
 * const env = createMockEnv({ API_KEY: 'test-key' });
 * const result = await agent.execute({ input: {}, env, ctx });
 * ```
 */
export declare function createMockEnv(overrides?: Partial<ConductorEnv>): ConductorEnv;
/**
 * Create a mock ExecutionContext for testing
 *
 * @returns A minimal mock ExecutionContext
 *
 * @example
 * ```typescript
 * const ctx = createMockContext();
 * const result = await agent.execute({ input: {}, env, ctx });
 * ```
 */
export declare function createMockContext(): ExecutionContext;
/**
 * Create a complete agent execution context for testing
 *
 * @param options - Optional overrides for input, env, ctx, and state
 * @returns An object suitable for agent.execute()
 *
 * @example
 * ```typescript
 * const context = createAgentContext({ input: { url: 'https://example.com' } });
 * const result = await agent.execute(context);
 * ```
 */
export declare function createAgentContext(options?: {
    input?: unknown;
    env?: Partial<ConductorEnv>;
    ctx?: Partial<ExecutionContext>;
    state?: Record<string, unknown>;
}): {
    input: unknown;
    env: ConductorEnv;
    ctx: ExecutionContext;
    state?: Record<string, unknown>;
};
/**
 * Options for creating a test Hono app
 */
export interface TestAppOptions {
    /** Environment bindings */
    env?: Record<string, unknown>;
    /** Security config overrides */
    security?: Partial<SecurityConfig>;
    /** Request ID to use (can be string or branded RequestId) */
    requestId?: string | RequestIdType;
    /** Auth context to inject - uses AuthContext from api/types for full type safety */
    auth?: AuthContext;
}
/**
 * Create a Hono test app with common middleware pre-configured
 *
 * @param options - Optional configuration
 * @returns A Hono app ready for testing
 *
 * @example
 * ```typescript
 * const app = createTestHonoApp({ env: { API_KEY: 'test' } });
 * app.route('/api', myRoutes);
 *
 * const res = await app.request('/api/endpoint', { method: 'GET' });
 * expect(res.status).toBe(200);
 * ```
 */
export declare function createTestHonoApp(options?: TestAppOptions): Hono<{
    Bindings: ConductorEnv;
    Variables: ConductorContext['var'];
}>;
/**
 * Mock Response class for testing HTTP agents
 *
 * @example
 * ```typescript
 * global.fetch = vi.fn().mockResolvedValue(
 *   new MockResponse({ data: 'test' }, { status: 200 })
 * );
 * ```
 */
export declare class MockResponse {
    private body;
    private init;
    constructor(body: unknown, init?: ResponseInit);
    get ok(): boolean;
    get status(): number;
    get statusText(): string;
    get headers(): {
        get: (key: string) => string | null;
        entries: () => IterableIterator<[string, string]>;
    };
    json(): Promise<unknown>;
    text(): Promise<string>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
    clone(): MockResponse;
}
/**
 * Mock Repository implementation for testing data agents
 *
 * This is a simple key-value store that can simulate errors.
 * It uses ConductorError for compatibility with the Repository interface.
 *
 * @example
 * ```typescript
 * const repo = new MockRepository();
 * await repo.put('key', { data: 'value' });
 * const result = await repo.get('key');
 * ```
 */
export declare class MockRepository<T = unknown> {
    private store;
    private getError;
    private putError;
    private deleteError;
    /**
     * Set an error to be returned on next get() call
     */
    setGetError(error: string | null): void;
    /**
     * Set an error to be returned on next put() call
     */
    setPutError(error: string | null): void;
    /**
     * Set an error to be returned on next delete() call
     */
    setDeleteError(error: string | null): void;
    get(key: string): Promise<Result<T, ConductorError>>;
    put(key: string, value: T, _options?: {
        ttl?: number;
    }): Promise<Result<void, ConductorError>>;
    delete(key: string): Promise<Result<void, ConductorError>>;
    list(options?: {
        prefix?: string;
        limit?: number;
        cursor?: string;
    }): Promise<Result<{
        keys: string[];
        cursor?: string;
    }, ConductorError>>;
    /**
     * Get all stored data (for test assertions)
     */
    getAll(): Map<string, T>;
    /**
     * Clear all stored data
     */
    clear(): void;
    /**
     * Seed the repository with initial data
     */
    seed(data: Record<string, T>): void;
}
/**
 * Email result type for mock provider
 */
export interface MockEmailResult {
    messageId: string;
    status: 'sent' | 'failed' | 'queued';
    provider: string;
    error?: string;
}
/**
 * Mock Email Provider for testing email agents
 *
 * @example
 * ```typescript
 * const provider = new MockEmailProvider();
 * provider.setResponse({ messageId: 'msg-123', status: 'sent', provider: 'mock' });
 *
 * const agent = new EmailAgent(config);
 * (agent as any).provider = provider;
 * ```
 */
export declare class MockEmailProvider {
    name: string;
    private sendResponse;
    private validateResponse;
    private sentEmails;
    /**
     * Set the response to return from send()
     */
    setResponse(response: MockEmailResult): void;
    /**
     * Set the validation response
     */
    setValidationResponse(response: {
        valid: boolean;
        errors?: string[];
    }): void;
    send(message: {
        to: string;
        subject: string;
        html?: string;
        text?: string;
    }): Promise<MockEmailResult>;
    validateConfig(): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Get all emails that were "sent"
     */
    getSentEmails(): Array<{
        to: string;
        subject: string;
        html?: string;
        text?: string;
    }>;
    /**
     * Clear sent email history
     */
    clear(): void;
}
/**
 * Assert that a Result is successful and return its value
 *
 * @example
 * ```typescript
 * const result = await agent.execute(context);
 * const value = assertSuccess(result);
 * expect(value.data).toBe('expected');
 * ```
 */
export declare function assertSuccess<T, E>(result: Result<T, E>): T;
/**
 * Assert that a Result is an error and return the error
 *
 * @example
 * ```typescript
 * const result = await agent.execute(context);
 * const error = assertError(result);
 * expect(error.message).toContain('expected error');
 * ```
 */
export declare function assertError<T, E>(result: Result<T, E>): E;
/**
 * Create a mock fetch function that returns predefined responses
 *
 * @param routes - Map of URL patterns to responses
 * @returns A mock fetch function
 *
 * @example
 * ```typescript
 * const mockFetch = createMockFetch({
 *   'https://api.example.com/users': { data: [{ id: 1 }] },
 *   'https://api.example.com/error': new Error('Network error'),
 * });
 *
 * global.fetch = mockFetch;
 * ```
 */
export declare function createMockFetch(routes: Record<string, unknown | Error | ((url: string, init?: RequestInit) => unknown | Error)>): (input: RequestInfo | URL, init?: RequestInit) => Promise<MockResponse>;
/**
 * Wait for a condition to become true
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Timeout and interval options
 * @returns Promise that resolves when condition is true
 *
 * @example
 * ```typescript
 * await waitFor(() => document.querySelector('.loaded') !== null);
 * ```
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, options?: {
    timeout?: number;
    interval?: number;
}): Promise<void>;
/**
 * Wait for a specified number of milliseconds
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=test-utils.d.ts.map