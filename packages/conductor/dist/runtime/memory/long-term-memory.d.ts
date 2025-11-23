/**
 * Long-Term Memory - D1 Database
 *
 * Stores persistent user data, preferences, and facts.
 * Data persists indefinitely until explicitly deleted.
 */
import type { ConductorEnv } from '../../types/env.js';
export declare class LongTermMemory {
    private readonly env;
    private readonly userId?;
    private readonly tableName;
    constructor(env: ConductorEnv, userId?: string | undefined);
    /**
     * Get a value by key
     */
    get(key: string): Promise<unknown>;
    /**
     * Set a value
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Delete a key
     */
    delete(key: string): Promise<void>;
    /**
     * Check if key exists
     */
    has(key: string): Promise<boolean>;
    /**
     * Get all keys for this user
     */
    keys(): Promise<string[]>;
    /**
     * Get all key-value pairs
     */
    getAll(): Promise<Record<string, unknown>>;
    /**
     * Get multiple values by keys
     */
    getMany(keys: string[]): Promise<Record<string, unknown>>;
    /**
     * Set multiple key-value pairs
     */
    setMany(data: Record<string, unknown>): Promise<void>;
    /**
     * Clear all data for this user
     */
    clear(): Promise<void>;
    /**
     * Count entries for this user
     */
    count(): Promise<number>;
    /**
     * Search keys by prefix
     */
    searchByPrefix(prefix: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=long-term-memory.d.ts.map