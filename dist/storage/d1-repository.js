/**
 * Cloudflare D1 Repository Implementation
 *
 * Provides a Repository interface over Cloudflare D1 (SQL database).
 */
import { Result } from '../types/result.js';
import { Errors } from '../errors/error-types.js';
import { JSONSerializer } from './repository.js';
/**
 * Repository implementation for Cloudflare D1
 */
export class D1Repository {
    constructor(binding, config, serializer = new JSONSerializer()) {
        this.binding = binding;
        this.serializer = serializer;
        this.tableName = config.tableName;
        this.idColumn = config.idColumn || 'id';
        this.valueColumn = config.valueColumn || 'value';
        this.createdAtColumn = config.createdAtColumn || 'created_at';
        this.updatedAtColumn = config.updatedAtColumn || 'updated_at';
        this.expirationColumn = config.expirationColumn;
    }
    /**
     * Get a value from D1
     */
    async get(id) {
        try {
            const query = `
				SELECT ${this.valueColumn}, ${this.expirationColumn || 'NULL as expiration'}
				FROM ${this.tableName}
				WHERE ${this.idColumn} = ?
			`;
            const result = await this.binding.prepare(query).bind(id).first();
            if (!result) {
                return Result.err(Errors.storageNotFound(id, 'D1'));
            }
            // Check expiration if column exists
            if (this.expirationColumn && result.expiration) {
                const expiration = new Date(result.expiration).getTime();
                if (expiration < Date.now()) {
                    // Expired - delete and return not found
                    await this.delete(id);
                    return Result.err(Errors.storageNotFound(id, 'D1'));
                }
            }
            const value = this.serializer.deserialize(result[this.valueColumn]);
            return Result.ok(value);
        }
        catch (error) {
            return Result.err(Errors.internal(`D1 get operation failed for id "${id}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Store a value in D1
     */
    async put(id, value, options) {
        try {
            const serialized = this.serializer.serialize(value);
            const now = new Date().toISOString();
            let query;
            let params;
            if (this.expirationColumn && (options?.ttl || options?.expiration)) {
                const expiration = options.expiration
                    ? new Date(options.expiration * 1000).toISOString()
                    : new Date(Date.now() + options.ttl * 1000).toISOString();
                query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn}, ${this.expirationColumn})
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn},
						${this.expirationColumn} = excluded.${this.expirationColumn}
				`;
                params = [id, serialized, now, now, expiration];
            }
            else {
                query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn})
					VALUES (?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn}
				`;
                params = [id, serialized, now, now];
            }
            await this.binding
                .prepare(query)
                .bind(...params)
                .run();
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`D1 put operation failed for id "${id}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Delete a value from D1
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`;
            await this.binding.prepare(query).bind(id).run();
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`D1 delete operation failed for id "${id}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * List values from D1
     */
    async list(options) {
        try {
            let query = `SELECT ${this.valueColumn} FROM ${this.tableName}`;
            const params = [];
            // Add WHERE clause for prefix if needed
            if (options?.prefix) {
                query += ` WHERE ${this.idColumn} LIKE ?`;
                params.push(`${options.prefix}%`);
            }
            // Add expiration check
            if (this.expirationColumn) {
                const whereOrAnd = options?.prefix ? 'AND' : 'WHERE';
                query += ` ${whereOrAnd} (${this.expirationColumn} IS NULL OR ${this.expirationColumn} > datetime('now'))`;
            }
            // Add ORDER BY
            query += ` ORDER BY ${this.createdAtColumn} DESC`;
            // Add LIMIT
            if (options?.limit) {
                query += ` LIMIT ?`;
                params.push(options.limit);
            }
            const result = await this.binding
                .prepare(query)
                .bind(...params)
                .all();
            const values = result.results.map((row) => this.serializer.deserialize(row[this.valueColumn]));
            return Result.ok(values);
        }
        catch (error) {
            return Result.err(Errors.internal('D1 list operation failed', error instanceof Error ? error : undefined));
        }
    }
    /**
     * Check if an ID exists in D1
     */
    async has(id) {
        try {
            const query = `SELECT 1 FROM ${this.tableName} WHERE ${this.idColumn} = ? LIMIT 1`;
            const result = await this.binding.prepare(query).bind(id).first();
            return Result.ok(result !== null);
        }
        catch (error) {
            return Result.err(Errors.internal(`D1 has operation failed for id "${id}"`, error instanceof Error ? error : undefined));
        }
    }
    /**
     * Clean up expired entries
     */
    async cleanExpired() {
        if (!this.expirationColumn) {
            return Result.ok(0);
        }
        try {
            const query = `
				DELETE FROM ${this.tableName}
				WHERE ${this.expirationColumn} IS NOT NULL
				AND ${this.expirationColumn} <= datetime('now')
			`;
            const result = await this.binding.prepare(query).run();
            return Result.ok(result.meta.changes || 0);
        }
        catch (error) {
            return Result.err(Errors.internal('D1 cleanExpired operation failed', error instanceof Error ? error : undefined));
        }
    }
}
