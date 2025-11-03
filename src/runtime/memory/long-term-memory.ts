/**
 * Long-Term Memory - D1 Database
 *
 * Stores persistent user data, preferences, and facts.
 * Data persists indefinitely until explicitly deleted.
 */

export class LongTermMemory {
	private readonly tableName = 'long_term_memory';

	constructor(
		private readonly env: Env,
		private readonly userId?: string
	) {}

	/**
	 * Get a value by key
	 */
	async get(key: string): Promise<any> {
		if (!this.userId || !(this.env as any).DB) {
			return null;
		}

		const result = await (this.env as any).DB.prepare(
			`SELECT value, updated_at FROM ${this.tableName} WHERE user_id = ? AND key = ?`
		)
			.bind(this.userId, key)
			.first();

		if (!result) {
			return null;
		}

		return JSON.parse(result.value as string);
	}

	/**
	 * Set a value
	 */
	async set(key: string, value: any): Promise<void> {
		if (!this.userId || !(this.env as any).DB) {
			return;
		}

		await (this.env as any).DB.prepare(
			`INSERT INTO ${this.tableName} (user_id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`
		)
			.bind(this.userId, key, JSON.stringify(value), Date.now())
			.run();
	}

	/**
	 * Delete a key
	 */
	async delete(key: string): Promise<void> {
		if (!this.userId || !(this.env as any).DB) {
			return;
		}

		await (this.env as any).DB.prepare(`DELETE FROM ${this.tableName} WHERE user_id = ? AND key = ?`)
			.bind(this.userId, key)
			.run();
	}

	/**
	 * Check if key exists
	 */
	async has(key: string): Promise<boolean> {
		if (!this.userId || !(this.env as any).DB) {
			return false;
		}

		const result = await (this.env as any).DB.prepare(
			`SELECT 1 FROM ${this.tableName} WHERE user_id = ? AND key = ? LIMIT 1`
		)
			.bind(this.userId, key)
			.first();

		return !!result;
	}

	/**
	 * Get all keys for this user
	 */
	async keys(): Promise<string[]> {
		if (!this.userId || !(this.env as any).DB) {
			return [];
		}

		const results = await (this.env as any).DB.prepare(
			`SELECT key FROM ${this.tableName} WHERE user_id = ? ORDER BY updated_at DESC`
		)
			.bind(this.userId)
			.all();

		return results.results.map((row: any) => row.key);
	}

	/**
	 * Get all key-value pairs
	 */
	async getAll(): Promise<Record<string, any>> {
		if (!this.userId || !(this.env as any).DB) {
			return {};
		}

		const results = await (this.env as any).DB.prepare(
			`SELECT key, value FROM ${this.tableName} WHERE user_id = ? ORDER BY updated_at DESC`
		)
			.bind(this.userId)
			.all();

		const data: Record<string, any> = {};
		for (const row of results.results) {
			data[(row as any).key] = JSON.parse((row as any).value);
		}

		return data;
	}

	/**
	 * Get multiple values by keys
	 */
	async getMany(keys: string[]): Promise<Record<string, any>> {
		if (!this.userId || !(this.env as any).DB || keys.length === 0) {
			return {};
		}

		const placeholders = keys.map(() => '?').join(',');
		const results = await (this.env as any).DB.prepare(
			`SELECT key, value FROM ${this.tableName} WHERE user_id = ? AND key IN (${placeholders})`
		)
			.bind(this.userId, ...keys)
			.all();

		const data: Record<string, any> = {};
		for (const row of results.results) {
			data[(row as any).key] = JSON.parse((row as any).value);
		}

		return data;
	}

	/**
	 * Set multiple key-value pairs
	 */
	async setMany(data: Record<string, any>): Promise<void> {
		if (!this.userId || !(this.env as any).DB) {
			return;
		}

		const timestamp = Date.now();
		const batch = (this.env as any).DB.batch(
			Object.entries(data).map(([key, value]) =>
				(this.env as any).DB!.prepare(
					`INSERT INTO ${this.tableName} (user_id, key, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`
				).bind(this.userId, key, JSON.stringify(value), timestamp)
			)
		);

		await batch;
	}

	/**
	 * Clear all data for this user
	 */
	async clear(): Promise<void> {
		if (!this.userId || !(this.env as any).DB) {
			return;
		}

		await (this.env as any).DB.prepare(`DELETE FROM ${this.tableName} WHERE user_id = ?`)
			.bind(this.userId)
			.run();
	}

	/**
	 * Count entries for this user
	 */
	async count(): Promise<number> {
		if (!this.userId || !(this.env as any).DB) {
			return 0;
		}

		const result = await (this.env as any).DB.prepare(
			`SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`
		)
			.bind(this.userId)
			.first();

		return (result?.count as number) || 0;
	}

	/**
	 * Search keys by prefix
	 */
	async searchByPrefix(prefix: string): Promise<Record<string, any>> {
		if (!this.userId || !(this.env as any).DB) {
			return {};
		}

		const results = await (this.env as any).DB.prepare(
			`SELECT key, value FROM ${this.tableName}
       WHERE user_id = ? AND key LIKE ?
       ORDER BY updated_at DESC`
		)
			.bind(this.userId, `${prefix}%`)
			.all();

		const data: Record<string, any> = {};
		for (const row of results.results) {
			data[(row as any).key] = JSON.parse((row as any).value);
		}

		return data;
	}
}
