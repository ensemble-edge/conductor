/**
 * Working Memory - In-Memory Storage
 *
 * Stores current execution context, intermediate results, and variables.
 * Lives only for the duration of the current execution.
 */
export declare class WorkingMemory {
    private memory;
    /**
     * Set a value in working memory
     */
    set(key: string, value: unknown): void;
    /**
     * Get a value from working memory
     */
    get(key: string): unknown;
    /**
     * Check if key exists
     */
    has(key: string): boolean;
    /**
     * Delete a key
     */
    delete(key: string): boolean;
    /**
     * Get all keys
     */
    keys(): string[];
    /**
     * Get all values as object
     */
    getAll(): Record<string, unknown>;
    /**
     * Clear all memory
     */
    clear(): void;
    /**
     * Get memory size
     */
    size(): number;
    /**
     * Merge another object into working memory
     */
    merge(data: Record<string, unknown>): void;
    /**
     * Create a snapshot of working memory
     */
    snapshot(): Record<string, unknown>;
    /**
     * Restore from a snapshot
     */
    restore(snapshot: Record<string, unknown>): void;
}
//# sourceMappingURL=working-memory.d.ts.map