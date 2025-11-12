/**
 * SDK Testing Utilities
 *
 * Helpers for testing agents and ensembles
 */
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
export function mockContext(overrides) {
    return {
        input: {},
        env: mockEnv(),
        ctx: mockExecutionContext(),
        ...overrides,
    };
}
/**
 * Create a mock Env object
 */
export function mockEnv(overrides) {
    return {
        CACHE: mockKV(),
        AI: mockAI(),
        ...overrides,
    };
}
/**
 * Create a mock ExecutionContext
 */
export function mockExecutionContext() {
    const waitUntilPromises = [];
    return {
        waitUntil(promise) {
            waitUntilPromises.push(promise);
        },
        passThroughOnException() {
            // No-op in tests
        },
        props: {},
    };
}
/**
 * Create a mock KV namespace
 */
export function mockKV() {
    const store = new Map();
    return {
        get: async (key) => store.get(key) || null,
        put: async (key, value) => {
            store.set(key, value);
        },
        delete: async (key) => {
            store.delete(key);
        },
        list: async () => ({
            keys: Array.from(store.keys()).map((key) => ({ name: key })),
            list_complete: true,
            cacheStatus: null,
        }),
    };
}
/**
 * Create a mock AI binding
 */
export function mockAI() {
    return {
        run: async (model, options) => {
            // Return mock AI response
            return {
                response: 'Mock AI response',
                result: { response: 'Mock AI response' },
            };
        },
    };
}
/**
 * Create a mock D1 database
 */
export function mockD1() {
    const data = [];
    return {
        prepare: (sql) => ({
            bind: (...params) => ({
                all: async () => ({
                    results: data,
                    success: true,
                    meta: {},
                }),
                first: async () => data[0] || null,
                run: async () => ({
                    success: true,
                    meta: {},
                }),
            }),
        }),
        dump: async () => new ArrayBuffer(0),
        batch: async () => [],
        exec: async () => ({
            count: 0,
            duration: 0,
        }),
    };
}
/**
 * Create a mock R2 bucket
 */
export function mockR2() {
    const store = new Map();
    return {
        get: async (key) => {
            const value = store.get(key);
            if (!value)
                return null;
            return {
                key,
                size: value.length,
                uploaded: new Date(),
                httpMetadata: {},
                customMetadata: {},
                text: async () => value,
                json: async () => JSON.parse(value),
                arrayBuffer: async () => new TextEncoder().encode(value).buffer,
                blob: async () => new Blob([value]),
            };
        },
        put: async (key, value) => {
            store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
        },
        delete: async (key) => {
            store.delete(key);
        },
        list: async () => ({
            objects: Array.from(store.keys()).map((key) => ({
                key,
                size: store.get(key).length,
                uploaded: new Date(),
            })),
            truncated: false,
            delimitedPrefixes: [],
        }),
    };
}
/**
 * Spy on a function (simple implementation)
 */
export function spy(fn) {
    const calls = [];
    const spied = ((...args) => {
        calls.push(args);
        return fn(...args);
    });
    spied.calls = calls;
    return spied;
}
