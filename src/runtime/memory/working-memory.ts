/**
 * Working Memory - In-Memory Storage
 *
 * Stores current execution context, intermediate results, and variables.
 * Lives only for the duration of the current execution.
 */

export class WorkingMemory {
	private memory = new Map<string, any>();

	/**
	 * Set a value in working memory
	 */
	set(key: string, value: any): void {
		this.memory.set(key, value);
	}

	/**
	 * Get a value from working memory
	 */
	get(key: string): any {
		return this.memory.get(key);
	}

	/**
	 * Check if key exists
	 */
	has(key: string): boolean {
		return this.memory.has(key);
	}

	/**
	 * Delete a key
	 */
	delete(key: string): boolean {
		return this.memory.delete(key);
	}

	/**
	 * Get all keys
	 */
	keys(): string[] {
		return Array.from(this.memory.keys());
	}

	/**
	 * Get all values as object
	 */
	getAll(): Record<string, any> {
		return Object.fromEntries(this.memory);
	}

	/**
	 * Clear all memory
	 */
	clear(): void {
		this.memory.clear();
	}

	/**
	 * Get memory size
	 */
	size(): number {
		return this.memory.size;
	}

	/**
	 * Merge another object into working memory
	 */
	merge(data: Record<string, any>): void {
		for (const [key, value] of Object.entries(data)) {
			this.memory.set(key, value);
		}
	}

	/**
	 * Create a snapshot of working memory
	 */
	snapshot(): Record<string, any> {
		return { ...this.getAll() };
	}

	/**
	 * Restore from a snapshot
	 */
	restore(snapshot: Record<string, any>): void {
		this.memory.clear();
		this.merge(snapshot);
	}
}
