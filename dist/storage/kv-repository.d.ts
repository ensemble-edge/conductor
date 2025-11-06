/**
 * Cloudflare KV Repository Implementation
 *
 * Provides a Repository interface over Cloudflare KV namespace.
 */
import { Result } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
import type { Repository, PutOptions, ListOptions, Serializer } from './repository.js';
/**
 * Repository implementation for Cloudflare KV
 */
export declare class KVRepository<T> implements Repository<T, string> {
    private readonly binding;
    private readonly serializer;
    constructor(binding: KVNamespace, serializer?: Serializer<T>);
    /**
     * Get a value from KV
     */
    get(key: string): Promise<Result<T, ConductorError>>;
    /**
     * Store a value in KV
     */
    put(key: string, value: T, options?: PutOptions): Promise<Result<void, ConductorError>>;
    /**
     * Delete a value from KV
     */
    delete(key: string): Promise<Result<void, ConductorError>>;
    /**
     * List keys in KV
     */
    list(options?: ListOptions): Promise<Result<T[], ConductorError>>;
    /**
     * Check if a key exists in KV
     */
    has(key: string): Promise<Result<boolean, ConductorError>>;
    /**
     * Get value with metadata
     */
    getWithMetadata(key: string): Promise<Result<{
        value: T;
        metadata?: unknown;
    }, ConductorError>>;
}
//# sourceMappingURL=kv-repository.d.ts.map