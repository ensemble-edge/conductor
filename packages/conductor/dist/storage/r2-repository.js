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
            // Fetch all objects
            const values = [];
            for (const object of result.objects) {
                const getResult = await this.get(object.key);
                if (getResult.success) {
                    // Check expiration from custom metadata
                    const expiration = object.customMetadata?.['x-expiration'];
                    if (expiration) {
                        const expirationTime = parseInt(expiration, 10);
                        if (expirationTime < Date.now()) {
                            // Expired - skip
                            await this.delete(object.key);
                            continue;
                        }
                    }
                    values.push(getResult.value);
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
