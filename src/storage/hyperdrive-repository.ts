/**
 * Cloudflare Hyperdrive Repository Implementation
 *
 * Provides access to external databases (Postgres, MySQL, etc.) via Hyperdrive.
 * Hyperdrive provides connection pooling, query caching, and low-latency access.
 *
 * Note: Hyperdrive bindings return a D1Database interface for querying.
 */

import { Result } from '../types/result.js';
import { Errors, type ConductorError } from '../errors/error-types.js';

/**
 * Database type for dialect-specific SQL
 */
export type DatabaseType = 'postgres' | 'mysql' | 'mariadb';

/**
 * Configuration for Hyperdrive repository
 */
export interface HyperdriveConfig {
	/**
	 * Database type (for dialect-specific SQL)
	 */
	databaseType: DatabaseType;

	/**
	 * Schema name (optional, for Postgres)
	 */
	schema?: string;

	/**
	 * Connection options
	 */
	options?: {
		/**
		 * Query timeout (ms)
		 */
		timeout?: number;

		/**
		 * Read-only mode (prevent writes)
		 */
		readOnly?: boolean;

		/**
		 * Max rows to return
		 */
		maxRows?: number;
	};
}

/**
 * Query result metadata
 */
export interface QueryMetadata {
	/**
	 * Number of rows affected (for writes)
	 */
	rowsAffected?: number;

	/**
	 * Execution time (ms)
	 */
	executionTime: number;

	/**
	 * Column names
	 */
	columns: string[];

	/**
	 * Row count
	 */
	rowCount: number;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T = any> {
	/**
	 * Result rows
	 */
	rows: T[];

	/**
	 * Metadata
	 */
	metadata: QueryMetadata;
}

/**
 * Table metadata
 */
export interface TableMetadata {
	/**
	 * Table name
	 */
	name: string;

	/**
	 * Schema name
	 */
	schema?: string;

	/**
	 * Column definitions
	 */
	columns: Array<{
		name: string;
		type: string;
		nullable: boolean;
		defaultValue?: string;
	}>;

	/**
	 * Primary key columns
	 */
	primaryKey?: string[];

	/**
	 * Indexes
	 */
	indexes?: Array<{
		name: string;
		columns: string[];
		unique: boolean;
	}>;
}

/**
 * Transaction interface
 */
export interface HyperdriveTransaction {
	/**
	 * Execute a query in the transaction
	 */
	query<T = any>(sql: string, params?: any[]): Promise<Result<QueryResult<T>, ConductorError>>;

	/**
	 * Commit the transaction
	 */
	commit(): Promise<Result<void, ConductorError>>;

	/**
	 * Rollback the transaction
	 */
	rollback(): Promise<Result<void, ConductorError>>;
}

/**
 * Repository implementation for Cloudflare Hyperdrive
 *
 * Hyperdrive bindings provide a D1Database interface for querying.
 */
export class HyperdriveRepository {
	private readonly schema?: string;
	private readonly timeout: number;
	private readonly readOnly: boolean;
	private readonly maxRows?: number;

	constructor(
		private readonly hyperdrive: D1Database,
		private readonly config: HyperdriveConfig
	) {
		this.schema = config.schema;
		this.timeout = config.options?.timeout || 30000; // 30s default
		this.readOnly = config.options?.readOnly || false;
		this.maxRows = config.options?.maxRows;
	}

	/**
	 * Execute a raw SQL query
	 */
	async query<T = any>(sql: string, params?: any[]): Promise<Result<QueryResult<T>, ConductorError>> {
		try {
			// Validate if read-only
			if (this.readOnly && this.isWriteQuery(sql)) {
				return Result.err(Errors.internal('Write operations not allowed in read-only mode'));
			}

			const startTime = Date.now();

			// Prepare statement with parameters
			let stmt = this.hyperdrive.prepare(sql);
			if (params && params.length > 0) {
				stmt = stmt.bind(...params);
			}

			// Execute query
			const result = await stmt.all();
			const executionTime = Date.now() - startTime;

			// Apply row limit if configured
			let rows = result.results as T[];
			if (this.maxRows && rows.length > this.maxRows) {
				rows = rows.slice(0, this.maxRows);
			}

			// Extract column names from first row
			const columns = rows.length > 0
				? Object.keys(rows[0] as any)
				: result.meta?.columns
					? (result.meta.columns as any[]).map((c: any) => c.name)
					: [];

			return Result.ok({
				rows,
				metadata: {
					executionTime,
					columns,
					rowCount: rows.length,
					rowsAffected: result.meta?.changes
				}
			});
		} catch (error) {
			return Result.err(
				Errors.internal(`Hyperdrive query failed: ${sql}`, error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Execute a query with named parameters
	 * Converts named parameters (:name) to positional parameters based on database type
	 */
	async queryNamed<T = any>(
		sql: string,
		params: Record<string, any>
	): Promise<Result<QueryResult<T>, ConductorError>> {
		const { convertedSql, orderedParams } = this.convertNamedParams(sql, params);
		return this.query<T>(convertedSql, orderedParams);
	}

	/**
	 * Execute a write query (INSERT, UPDATE, DELETE)
	 */
	async execute(sql: string, params?: any[]): Promise<Result<{ rowsAffected: number }, ConductorError>> {
		if (this.readOnly) {
			return Result.err(Errors.internal('Write operations not allowed in read-only mode'));
		}

		try {
			const startTime = Date.now();

			let stmt = this.hyperdrive.prepare(sql);
			if (params && params.length > 0) {
				stmt = stmt.bind(...params);
			}

			const result = await stmt.run();

			return Result.ok({
				rowsAffected: result.meta.changes || 0
			});
		} catch (error) {
			return Result.err(
				Errors.internal(`Hyperdrive execute failed: ${sql}`, error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * Begin a transaction
	 * Note: D1/Hyperdrive transaction support is limited - this is a best-effort implementation
	 */
	async transaction<T>(
		callback: (tx: HyperdriveTransaction) => Promise<T>
	): Promise<Result<T, ConductorError>> {
		// Begin transaction
		const beginResult = await this.execute('BEGIN');
		if (!beginResult.success) {
			return Result.err(beginResult.error);
		}

		const tx: HyperdriveTransaction = {
			query: async <U = any>(sql: string, params?: any[]) => this.query<U>(sql, params),
			commit: async () => {
				const result = await this.execute('COMMIT');
				return result.success ? Result.ok(undefined) : Result.err(result.error);
			},
			rollback: async () => {
				const result = await this.execute('ROLLBACK');
				return result.success ? Result.ok(undefined) : Result.err(result.error);
			}
		};

		try {
			const result = await callback(tx);
			const commitResult = await tx.commit();
			if (!commitResult.success) {
				return Result.err(commitResult.error);
			}
			return Result.ok(result);
		} catch (error) {
			await tx.rollback();
			return Result.err(Errors.internal('Transaction failed', error instanceof Error ? error : undefined));
		}
	}

	/**
	 * Get table metadata
	 */
	async getTableInfo(tableName: string): Promise<Result<TableMetadata, ConductorError>> {
		try {
			let sql: string;

			switch (this.config.databaseType) {
				case 'postgres':
					sql = `
						SELECT
							column_name as name,
							data_type as type,
							is_nullable = 'YES' as nullable,
							column_default as default_value
						FROM information_schema.columns
						WHERE table_name = $1
						${this.schema ? 'AND table_schema = $2' : ''}
						ORDER BY ordinal_position
					`;
					break;

				case 'mysql':
				case 'mariadb':
					sql = `
						SELECT
							COLUMN_NAME as name,
							DATA_TYPE as type,
							IS_NULLABLE = 'YES' as nullable,
							COLUMN_DEFAULT as default_value
						FROM information_schema.columns
						WHERE TABLE_NAME = ?
						${this.schema ? 'AND TABLE_SCHEMA = ?' : ''}
						ORDER BY ORDINAL_POSITION
					`;
					break;
			}

			const params = this.schema ? [tableName, this.schema] : [tableName];
			const result = await this.query<any>(sql, params);

			if (!result.success) {
				return Result.err(result.error);
			}

			return Result.ok({
				name: tableName,
				schema: this.schema,
				columns: result.value.rows.map((row: any) => ({
					name: row.name,
					type: row.type,
					nullable: row.nullable,
					defaultValue: row.default_value
				}))
			});
		} catch (error) {
			return Result.err(
				Errors.internal(`Failed to get table info for ${tableName}`, error instanceof Error ? error : undefined)
			);
		}
	}

	/**
	 * List tables in schema
	 */
	async listTables(): Promise<Result<string[], ConductorError>> {
		try {
			let sql: string;

			switch (this.config.databaseType) {
				case 'postgres':
					sql = `
						SELECT table_name
						FROM information_schema.tables
						WHERE table_schema = $1
						ORDER BY table_name
					`;
					break;

				case 'mysql':
				case 'mariadb':
					sql = `
						SELECT TABLE_NAME as table_name
						FROM information_schema.tables
						WHERE TABLE_SCHEMA = ?
						ORDER BY TABLE_NAME
					`;
					break;
			}

			const params = [this.schema || 'public'];
			const result = await this.query<{ table_name: string }>(sql, params);

			if (!result.success) {
				return Result.err(result.error);
			}

			return Result.ok(result.value.rows.map((row: any) => row.table_name));
		} catch (error) {
			return Result.err(Errors.internal('Failed to list tables', error instanceof Error ? error : undefined));
		}
	}

	/**
	 * Check if a query is a write operation
	 */
	private isWriteQuery(sql: string): boolean {
		const upperSQL = sql.trim().toUpperCase();
		return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL);
	}

	/**
	 * Convert named parameters to positional parameters
	 */
	private convertNamedParams(
		sql: string,
		params: Record<string, any>
	): { convertedSql: string; orderedParams: any[] } {
		const orderedParams: any[] = [];
		let paramIndex = 1;

		// Replace :paramName with $1, $2, etc. (Postgres style) or ? (MySQL style)
		const convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
			if (!(paramName in params)) {
				throw new Error(`Missing parameter: ${paramName}`);
			}

			orderedParams.push(params[paramName]);

			// Use appropriate placeholder based on database type
			switch (this.config.databaseType) {
				case 'postgres':
					return `$${paramIndex++}`;
				case 'mysql':
				case 'mariadb':
					return '?';
				default:
					return '?';
			}
		});

		return { convertedSql, orderedParams };
	}

	/**
	 * Get database type
	 */
	getDatabaseType(): DatabaseType {
		return this.config.databaseType;
	}

	/**
	 * Check if repository is read-only
	 */
	isReadOnly(): boolean {
		return this.readOnly;
	}
}
