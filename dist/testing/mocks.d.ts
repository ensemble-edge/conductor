/**
 * Mock Utilities for Testing
 */
import type { VectorSearchResult } from './types.js';
/**
 * Mock AI provider responses
 */
export declare class MockAIProvider {
    private responses;
    constructor(responses: Record<string, unknown | Error>);
    getResponse(memberName: string): unknown | Error;
    setResponse(memberName: string, response: unknown | Error): void;
}
/**
 * Mock database for testing
 */
export declare class MockDatabase {
    private tables;
    constructor(tables?: Record<string, unknown[]>);
    query(table: string): unknown[];
    insert(table: string, record: unknown): void;
    update(table: string, predicate: (record: unknown) => boolean, updates: unknown): void;
    delete(table: string, predicate: (record: unknown) => boolean): void;
    clear(table?: string): void;
}
/**
 * Mock HTTP client for testing
 */
export declare class MockHTTPClient {
    private routes;
    constructor(routes?: Record<string, unknown>);
    fetch(url: string): Promise<unknown>;
    setRoute(url: string, response: unknown | Error): void;
    clearRoutes(): void;
}
/**
 * Mock Vectorize for testing
 */
export declare class MockVectorize {
    private collections;
    constructor(collections?: Record<string, VectorSearchResult[]>);
    query(query: number[] | string, options?: {
        topK?: number;
        namespace?: string;
    }): VectorSearchResult[];
    insert(namespace: string, documents: Array<{
        id: string;
        metadata: Record<string, unknown>;
    }>): void;
    clear(namespace?: string): void;
}
/**
 * Mock Durable Object for testing
 */
export declare class MockDurableObject<T = unknown> {
    private state;
    constructor(state: T);
    getState(): T;
    setState(state: T): void;
    reset(initialState: T): void;
}
/**
 * Helper to create mock AI provider
 */
export declare function mockAIProvider(responses: Record<string, unknown>): MockAIProvider;
/**
 * Helper to create mock database
 */
export declare function mockDatabase(tables: Record<string, unknown[]>): MockDatabase;
/**
 * Helper to create mock HTTP client
 */
export declare function mockHTTP(routes: Record<string, unknown>): MockHTTPClient;
/**
 * Helper to create mock Vectorize
 */
export declare function mockVectorize(collections: Record<string, VectorSearchResult[]>): MockVectorize;
/**
 * Helper to create mock Durable Object
 */
export declare function mockDurableObject<T>(initialState?: T): MockDurableObject<T>;
//# sourceMappingURL=mocks.d.ts.map