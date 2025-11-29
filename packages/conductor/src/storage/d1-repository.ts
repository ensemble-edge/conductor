/**
 * Cloudflare D1 Repository Implementation
 *
 * Provides a Repository interface over Cloudflare D1 (SQL database).
 */

import { Result } from '../types/result.js'
import { Errors, type ConductorError } from '../errors/error-types.js'
import type { Repository, PutOptions, ListOptions, Serializer } from './repository.js'
import { JSONSerializer } from './repository.js'

/**
 * Validate SQL identifier (table/column name) to prevent SQL injection
 *
 * SQL identifiers must:
 * - Start with a letter or underscore
 * - Contain only letters, numbers, and underscores
 * - Be no longer than 128 characters (reasonable limit)
 *
 * @throws Error if identifier is invalid
 */
function validateSqlIdentifier(identifier: string, type: 'table' | 'column'): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error(`Invalid ${type} name: must be a non-empty string`)
  }

  if (identifier.length > 128) {
    throw new Error(`Invalid ${type} name "${identifier}": exceeds maximum length of 128 characters`)
  }

  // SQL identifier pattern: starts with letter/underscore, contains only alphanumeric/underscore
  const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/

  if (!validIdentifierPattern.test(identifier)) {
    throw new Error(
      `Invalid ${type} name "${identifier}": must start with a letter or underscore and contain only letters, numbers, and underscores`
    )
  }

  return identifier
}

/**
 * Configuration for D1 repository
 */
export interface D1RepositoryConfig {
  /**
   * Table name
   */
  tableName: string

  /**
   * ID column name (default: 'id')
   */
  idColumn?: string

  /**
   * Value column name (default: 'value')
   */
  valueColumn?: string

  /**
   * Created at column name (default: 'created_at')
   */
  createdAtColumn?: string

  /**
   * Updated at column name (default: 'updated_at')
   */
  updatedAtColumn?: string

  /**
   * Expiration column name (optional)
   */
  expirationColumn?: string
}

/**
 * Repository implementation for Cloudflare D1
 */
export class D1Repository<T> implements Repository<T, string> {
  private readonly tableName: string
  private readonly idColumn: string
  private readonly valueColumn: string
  private readonly createdAtColumn: string
  private readonly updatedAtColumn: string
  private readonly expirationColumn?: string

  constructor(
    private readonly binding: D1Database,
    config: D1RepositoryConfig,
    private readonly serializer: Serializer<T> = new JSONSerializer<T>()
  ) {
    // Validate all SQL identifiers at construction time (fail-fast)
    this.tableName = validateSqlIdentifier(config.tableName, 'table')
    this.idColumn = validateSqlIdentifier(config.idColumn || 'id', 'column')
    this.valueColumn = validateSqlIdentifier(config.valueColumn || 'value', 'column')
    this.createdAtColumn = validateSqlIdentifier(config.createdAtColumn || 'created_at', 'column')
    this.updatedAtColumn = validateSqlIdentifier(config.updatedAtColumn || 'updated_at', 'column')
    this.expirationColumn = config.expirationColumn
      ? validateSqlIdentifier(config.expirationColumn, 'column')
      : undefined
  }

  /**
   * Get a value from D1
   */
  async get(id: string): Promise<Result<T, ConductorError>> {
    try {
      const query = `
				SELECT ${this.valueColumn}, ${this.expirationColumn || 'NULL as expiration'}
				FROM ${this.tableName}
				WHERE ${this.idColumn} = ?
			`

      const result = await this.binding.prepare(query).bind(id).first()

      if (!result) {
        return Result.err(Errors.storageNotFound(id, 'D1'))
      }

      // Check expiration if column exists
      if (this.expirationColumn && result.expiration) {
        const expiration = new Date(result.expiration as string).getTime()
        if (expiration < Date.now()) {
          // Expired - delete and return not found
          await this.delete(id)
          return Result.err(Errors.storageNotFound(id, 'D1'))
        }
      }

      const value = this.serializer.deserialize(result[this.valueColumn] as string)
      return Result.ok(value)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `D1 get operation failed for id "${id}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Store a value in D1
   */
  async put(id: string, value: T, options?: PutOptions): Promise<Result<void, ConductorError>> {
    try {
      const serialized = this.serializer.serialize(value)
      const now = new Date().toISOString()

      let query: string
      let params: unknown[]

      if (this.expirationColumn && (options?.ttl || options?.expiration)) {
        const expiration = options.expiration
          ? new Date(options.expiration * 1000).toISOString()
          : new Date(Date.now() + options.ttl! * 1000).toISOString()

        query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn}, ${this.expirationColumn})
					VALUES (?, ?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn},
						${this.expirationColumn} = excluded.${this.expirationColumn}
				`
        params = [id, serialized, now, now, expiration]
      } else {
        query = `
					INSERT INTO ${this.tableName}
					(${this.idColumn}, ${this.valueColumn}, ${this.createdAtColumn}, ${this.updatedAtColumn})
					VALUES (?, ?, ?, ?)
					ON CONFLICT(${this.idColumn})
					DO UPDATE SET
						${this.valueColumn} = excluded.${this.valueColumn},
						${this.updatedAtColumn} = excluded.${this.updatedAtColumn}
				`
        params = [id, serialized, now, now]
      }

      await this.binding
        .prepare(query)
        .bind(...params)
        .run()
      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `D1 put operation failed for id "${id}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Delete a value from D1
   */
  async delete(id: string): Promise<Result<void, ConductorError>> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE ${this.idColumn} = ?`
      await this.binding.prepare(query).bind(id).run()
      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `D1 delete operation failed for id "${id}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * List values from D1
   */
  async list(options?: ListOptions): Promise<Result<T[], ConductorError>> {
    try {
      let query = `SELECT ${this.valueColumn} FROM ${this.tableName}`
      const params: unknown[] = []

      // Add WHERE clause for prefix if needed
      if (options?.prefix) {
        query += ` WHERE ${this.idColumn} LIKE ?`
        params.push(`${options.prefix}%`)
      }

      // Add expiration check
      if (this.expirationColumn) {
        const whereOrAnd = options?.prefix ? 'AND' : 'WHERE'
        query += ` ${whereOrAnd} (${this.expirationColumn} IS NULL OR ${this.expirationColumn} > datetime('now'))`
      }

      // Add ORDER BY
      query += ` ORDER BY ${this.createdAtColumn} DESC`

      // Add LIMIT
      if (options?.limit) {
        query += ` LIMIT ?`
        params.push(options.limit)
      }

      const result = await this.binding
        .prepare(query)
        .bind(...params)
        .all()

      const values: T[] = result.results.map((row) =>
        this.serializer.deserialize(row[this.valueColumn] as string)
      )

      return Result.ok(values)
    } catch (error) {
      return Result.err(
        Errors.internal('D1 list operation failed', error instanceof Error ? error : undefined)
      )
    }
  }

  /**
   * Check if an ID exists in D1
   */
  async has(id: string): Promise<Result<boolean, ConductorError>> {
    try {
      const query = `SELECT 1 FROM ${this.tableName} WHERE ${this.idColumn} = ? LIMIT 1`
      const result = await this.binding.prepare(query).bind(id).first()
      return Result.ok(result !== null)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `D1 has operation failed for id "${id}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanExpired(): Promise<Result<number, ConductorError>> {
    if (!this.expirationColumn) {
      return Result.ok(0)
    }

    try {
      const query = `
				DELETE FROM ${this.tableName}
				WHERE ${this.expirationColumn} IS NOT NULL
				AND ${this.expirationColumn} <= datetime('now')
			`

      const result = await this.binding.prepare(query).run()
      return Result.ok(result.meta.changes || 0)
    } catch (error) {
      return Result.err(
        Errors.internal(
          'D1 cleanExpired operation failed',
          error instanceof Error ? error : undefined
        )
      )
    }
  }
}
