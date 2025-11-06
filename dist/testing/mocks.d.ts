/**
 * Mock Utilities for Testing
 */
import type { VectorSearchResult } from './types.js';
import type { AIProvider, AIProviderRequest, AIProviderResponse, AIProviderConfig } from '../members/think-providers/index.js';
import type { ConductorEnv } from '../types/env.js';
import type { ProviderId } from '../types/branded.js';
/**
 * Mock AI provider for testing
 * Implements the AIProvider interface to integrate with ThinkMember
 */
export declare class MockAIProvider implements AIProvider {
    readonly id: ProviderId;
    readonly name: string;
    private responses;
    private defaultResponse;
    private onExecute?;
    constructor(responses?: Record<string, unknown | Error>, id?: string, sharedResponsesMap?: Map<string, unknown | Error>, onExecute?: (call: any) => void);
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    validateConfig(config: AIProviderConfig, env: ConductorEnv): boolean;
    getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null;
    setResponse(memberName: string, response: unknown | Error): void;
    getResponse(memberName: string): unknown | Error | undefined;
    clear(): void;
    getResponsesMap(): Map<string, unknown | Error>;
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