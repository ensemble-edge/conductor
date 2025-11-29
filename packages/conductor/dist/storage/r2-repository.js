/**
 * Cloudflare R2 Repository Implementation
 *
 * Provides a Repository interface over Cloudflare R2 (object storage).
 */
import { Result } from '../types/result.js';
import { Errors } from '../errors/error-types.js';
import { JSONSerializer } from './repository.js';
/**
 * Repository implementation for Cloudflare R2
 */
export class R2Repository {
    constructor(binding, serializer = new JSONSerializer()) {
        this.binding = binding;
        this.serializer = serializer;
    }
    /**
     * Get an object from R2
     */
    async get(key) {
        try {
            const object = await this.binding.get(key);
            if (object === null) {
                return Result.err(Errors.storageNotFound(key, 'R2'));
            }
            const text = await object.text();
            const value = this.serializer.deserialize(text);
            return Result.ok(value);
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 get operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Store an object in R2
     */
    async put(key, value, options) {
        try {
            const serialized = this.serializer.serialize(value);
            const r2Options = {};
            // R2 uses httpMetadata for custom headers
            if (options?.metadata) {
                r2Options.customMetadata = options.metadata;
            }
            // R2 doesn't have built-in TTL, but we can set custom metadata
            if (options?.ttl) {
                const expiration = Date.now() + options.ttl * 1000;
                r2Options.customMetadata = {
                    ...r2Options.customMetadata,
                    'x-expiration': expiration.toString(),
                };
            }
            if (options?.expiration) {
                r2Options.customMetadata = {
                    ...r2Options.customMetadata,
                    'x-expiration': (options.expiration * 1000).toString(),
                };
            }
            await this.binding.put(key, serialized, r2Options);
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 put operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Delete an object from R2
     */
    async delete(key) {
        try {
            await this.binding.delete(key);
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 delete operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * List objects in R2
     */
    async list(options) {
        try {
            const listOptions = {};
            if (options?.prefix) {
                listOptions.prefix = options.prefix;
            }
            if (options?.limit) {
                listOptions.limit = options.limit;
            }
            if (options?.cursor) {
                listOptions.cursor = options.cursor;
            }
            const result = await this.binding.list(listOptions);
            // Filter out expired objects first (using metadata from list, no extra API calls)
            const now = Date.now();
            const validObjects = [];
            const expiredKeys = [];
            for (const object of result.objects) {
                const expiration = object.customMetadata?.['x-expiration'];
                if (expiration) {
                    const expirationTime = parseInt(expiration, 10);
                    if (expirationTime < now) {
                        expiredKeys.push(object.key);
                        continue;
                    }
                }
                validObjects.push(object);
            }
            // Clean up expired objects in background (don't await - fire and forget)
            if (expiredKeys.length > 0) {
                Promise.all(expiredKeys.map((key) => this.binding.delete(key))).catch(() => {
                    // Ignore cleanup failures - they'll be retried on next list
                });
            }
            // Fetch all valid objects in parallel batches to avoid N+1 queries
            // Batch size of 10 balances parallelism vs. API rate limits
            const BATCH_SIZE = 10;
            const values = [];
            for (let i = 0; i < validObjects.length; i += BATCH_SIZE) {
                const batch = validObjects.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(batch.map((obj) => this.get(obj.key)));
                for (const getResult of batchResults) {
                    if (getResult.success) {
                        values.push(getResult.value);
                    }
                }
            }
            return Result.ok(values);
        }
        catch (error) {
            return Result.err(Errors.internal('R2 list operation failed', error instanceof Error ? error : undefined));
        }
    }
    /**
     * Check if an object exists in R2
     */
    async has(key) {
        try {
            const object = await this.binding.head(key);
            return Result.ok(object !== null);
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 has operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Get object with metadata
     */
    async getWithMetadata(key) {
        try {
            const object = await this.binding.get(key);
            if (object === null) {
                return Result.err(Errors.storageNotFound(key, 'R2'));
            }
            const text = await object.text();
            const value = this.serializer.deserialize(text);
            return Result.ok({
                value,
                metadata: object,
            });
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 getWithMetadata operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Get object metadata only (head request)
     */
    async getMetadata(key) {
        try {
            const metadata = await this.binding.head(key);
            return Result.ok(metadata);
        }
        catch (error) {
            return Result.err(Errors.internal(`R2 getMetadata operation failed for key "${key}"`, error instanceof Error ? error : undefined));
        }
    }
}
