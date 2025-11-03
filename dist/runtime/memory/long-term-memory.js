/**
 * Long-Term Memory - D1 Database
 *
 * Stores persistent user data, preferences, and facts.
 * Data persists indefinitely until explicitly deleted.
 */
export class LongTermMemory {
    constructor(env, userId) {
        this.env = env;
        this.userId = userId;
        this.tableName = 'long_term_memory';
    }
    /**
     * Get a value by key
     */
    async get(key) {
        if (!this.userId || !this.env.DB) {
            return null;
        }
        const result = await this.env.DB.prepare(`SELECT value, updated_at FROM ${this.tableName} WHERE user_id = ? AND key = ?`)
            .bind(this.userId, key)
            .first();
        if (!result) {
            return null;
        }
        return JSON.parse(result.value);
    }
    /**
     * Set a value
     */
    async set(key, value) {
        if (!this.userId || !this.env.DB) {
            return;
        }
        await this.env.DB.prepare(`INSERT INTO ${this.tableName} (user_id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`)
            .bind(this.userId, key, JSON.stringify(value), Date.now())
            .run();
    }
    /**
     * Delete a key
     */
    async delete(key) {
        if (!this.userId || !this.env.DB) {
            return;
        }
        await this.env.DB.prepare(`DELETE FROM ${this.tableName} WHERE user_id = ? AND key = ?`)
            .bind(this.userId, key)
            .run();
    }
    /**
     * Check if key exists
     */
    async has(key) {
        if (!this.userId || !this.env.DB) {
            return false;
        }
        const result = await this.env.DB.prepare(`SELECT 1 FROM ${this.tableName} WHERE user_id = ? AND key = ? LIMIT 1`)
            .bind(this.userId, key)
            .first();
        return !!result;
    }
    /**
     * Get all keys for this user
     */
    async keys() {
        if (!this.userId || !this.env.DB) {
            return [];
        }
        const results = await this.env.DB.prepare(`SELECT key FROM ${this.tableName} WHERE user_id = ? ORDER BY updated_at DESC`)
            .bind(this.userId)
            .all();
        return results.results.map((row) => row.key);
    }
    /**
     * Get all key-value pairs
     */
    async getAll() {
        if (!this.userId || !this.env.DB) {
            return {};
        }
        const results = await this.env.DB.prepare(`SELECT key, value FROM ${this.tableName} WHERE user_id = ? ORDER BY updated_at DESC`)
            .bind(this.userId)
            .all();
        const data = {};
        for (const row of results.results) {
            data[row.key] = JSON.parse(row.value);
        }
        return data;
    }
    /**
     * Get multiple values by keys
     */
    async getMany(keys) {
        if (!this.userId || !this.env.DB || keys.length === 0) {
            return {};
        }
        const placeholders = keys.map(() => '?').join(',');
        const results = await this.env.DB.prepare(`SELECT key, value FROM ${this.tableName} WHERE user_id = ? AND key IN (${placeholders})`)
            .bind(this.userId, ...keys)
            .all();
        const data = {};
        for (const row of results.results) {
            data[row.key] = JSON.parse(row.value);
        }
        return data;
    }
    /**
     * Set multiple key-value pairs
     */
    async setMany(data) {
        if (!this.userId || !this.env.DB) {
            return;
        }
        const timestamp = Date.now();
        const batch = this.env.DB.batch(Object.entries(data).map(([key, value]) => this.env
            .DB.prepare(`INSERT INTO ${this.tableName} (user_id, key, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`)
            .bind(this.userId, key, JSON.stringify(value), timestamp)));
        await batch;
    }
    /**
     * Clear all data for this user
     */
    async clear() {
        if (!this.userId || !this.env.DB) {
            return;
        }
        await this.env.DB.prepare(`DELETE FROM ${this.tableName} WHERE user_id = ?`)
            .bind(this.userId)
            .run();
    }
    /**
     * Count entries for this user
     */
    async count() {
        if (!this.userId || !this.env.DB) {
            return 0;
        }
        const result = await this.env.DB.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`)
            .bind(this.userId)
            .first();
        return result?.count || 0;
    }
    /**
     * Search keys by prefix
     */
    async searchByPrefix(prefix) {
        if (!this.userId || !this.env.DB) {
            return {};
        }
        const results = await this.env.DB.prepare(`SELECT key, value FROM ${this.tableName}
       WHERE user_id = ? AND key LIKE ?
       ORDER BY updated_at DESC`)
            .bind(this.userId, `${prefix}%`)
            .all();
        const data = {};
        for (const row of results.results) {
            data[row.key] = JSON.parse(row.value);
        }
        return data;
    }
}
