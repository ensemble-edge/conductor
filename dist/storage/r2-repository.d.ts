/**
 * Cloudflare R2 Repository Implementation
 *
 * Provides a Repository interface over Cloudflare R2 (object storage).
 */
import { Result } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
import type { Repository, PutOptions, ListOptions, Serializer } from './repository.js';
/**
 * Repository implementation for Cloudflare R2
 */
export declare class R2Repository<T> implements Repository<T, string> {
    private readonly binding;
    private readonly serializer;
    constructor(binding: R2Bucket, serializer?: Serializer<T>);
    /**
     * Get an object from R2
     */
    get(key: string): Promise<Result<T, ConductorError>>;
    /**
     * Store an object in R2
     */
    put(key: string, value: T, options?: PutOptions): Promise<Result<void, ConductorError>>;
    /**
     * Delete an object from R2
     */
    delete(key: string): Promise<Result<void, ConductorError>>;
    /**
     * List objects in R2
     */
    list(options?: ListOptions): Promise<Result<T[], ConductorError>>;
    /**
     * Check if an object exists in R2
     */
    has(key: string): Promise<Result<boolean, ConductorError>>;
    /**
     * Get object with metadata
     */
    getWithMetadata(key: string): Promise<Result<{
        value: T;
        metadata?: R2ObjectBody;
    }, ConductorError>>;
    /**
     * Get object metadata only (head request)
     */
    getMetadata(key: string): Promise<Result<R2Object | null, ConductorError>>;
}
//# sourceMappingURL=r2-repository.d.ts.map