/**
 * Working Memory - In-Memory Storage
 *
 * Stores current execution context, intermediate results, and variables.
 * Lives only for the duration of the current execution.
 */
export class WorkingMemory {
    constructor() {
        this.memory = new Map();
    }
    /**
     * Set a value in working memory
     */
    set(key, value) {
        this.memory.set(key, value);
    }
    /**
     * Get a value from working memory
     */
    get(key) {
        return this.memory.get(key);
    }
    /**
     * Check if key exists
     */
    has(key) {
        return this.memory.has(key);
    }
    /**
     * Delete a key
     */
    delete(key) {
        return this.memory.delete(key);
    }
    /**
     * Get all keys
     */
    keys() {
        return Array.from(this.memory.keys());
    }
    /**
     * Get all values as object
     */
    getAll() {
        return Object.fromEntries(this.memory);
    }
    /**
     * Clear all memory
     */
    clear() {
        this.memory.clear();
    }
    /**
     * Get memory size
     */
    size() {
        return this.memory.size;
    }
    /**
     * Merge another object into working memory
     */
    merge(data) {
        for (const [key, value] of Object.entries(data)) {
            this.memory.set(key, value);
        }
    }
    /**
     * Create a snapshot of working memory
     */
    snapshot() {
        return { ...this.getAll() };
    }
    /**
     * Restore from a snapshot
     */
    restore(snapshot) {
        this.memory.clear();
        this.merge(snapshot);
    }
}
