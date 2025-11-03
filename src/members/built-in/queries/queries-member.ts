/**
 * Queries Member
 *
 * Execute SQL queries across Hyperdrive-connected databases.
 * Queries can be loaded from catalog (like prompts) or executed inline.
 */

import { BaseMember, type MemberExecutionContext } from '../../base-member.js'
import type { MemberConfig } from '../../../runtime/parser.js'
import type { ConductorEnv } from '../../../types/env.js'

/**
 * Query input - either from catalog or inline SQL
 */
export interface QueriesInput {
  /**
   * Query name from catalog (mutually exclusive with sql)
   */
  queryName?: string

  /**
   * Inline SQL query (mutually exclusive with queryName)
   */
  sql?: string

  /**
   * Query parameters (named or positional)
   */
  input?: Record<string, unknown> | unknown[]

  /**
   * Database alias (overrides default)
   */
  database?: string
}

/**
 * Queries configuration
 */
export interface QueriesConfig {
  /**
   * Default database alias
   */
  defaultDatabase?: string

  /**
   * Cache TTL for query results (seconds)
   */
  cacheTTL?: number

  /**
   * Max rows to return
   */
  maxRows?: number

  /**
   * Query timeout (ms)
   */
  timeout?: number

  /**
   * Read-only mode (prevent writes)
   */
  readOnly?: boolean

  /**
   * Transform column names
   */
  transform?: 'none' | 'camelCase' | 'snakeCase'

  /**
   * Return metadata with results
   */
  includeMetadata?: boolean
}

/**
 * Queries output
 */
export interface QueriesOutput {
  /**
   * Query results
   */
  rows: unknown[]

  /**
   * Row count
   */
  count: number

  /**
   * Execution metadata
   */
  metadata: {
    /**
     * Columns returned
     */
    columns: string[]

    /**
     * Execution time (ms)
     */
    executionTime: number

    /**
     * Cache hit?
     */
    cached: boolean

    /**
     * Database used
     */
    database: string

    /**
     * Query that was executed
     */
    query?: string
  }
}

/**
 * Catalog query definition
 */
interface CatalogQuery {
  name: string
  sql: string
  description?: string
  database?: string
  params?: Record<string, unknown>
}

/**
 * Queries Member - SQL Query Execution
 *
 * Executes SQL queries across Hyperdrive-connected databases.
 * Queries can be stored in catalog like prompts or executed inline.
 */
export class QueriesMember extends BaseMember {
  private queriesConfig: QueriesConfig

  constructor(
    config: MemberConfig,
    private readonly env: ConductorEnv
  ) {
    super(config)

    const cfg = config.config as QueriesConfig | undefined

    // Extract queries-specific config
    this.queriesConfig = {
      defaultDatabase: cfg?.defaultDatabase,
      cacheTTL: cfg?.cacheTTL,
      maxRows: cfg?.maxRows,
      timeout: cfg?.timeout,
      readOnly: cfg?.readOnly !== undefined ? cfg.readOnly : false,
      transform: cfg?.transform || 'none',
      includeMetadata: cfg?.includeMetadata !== undefined ? cfg.includeMetadata : true,
    }
  }

  protected async run(context: MemberExecutionContext): Promise<QueriesOutput> {
    const input = context.input as QueriesInput

    // 1. Validate input
    if (!input.queryName && !input.sql) {
      throw new Error('Either queryName or sql must be provided')
    }

    if (input.queryName && input.sql) {
      throw new Error('Cannot specify both queryName and sql')
    }

    // 2. Resolve query (from catalog or inline)
    const query = input.queryName
      ? await this.loadQueryFromCatalog(input.queryName)
      : { sql: input.sql!, params: {}, database: input.database }

    // 3. Determine database
    const database = input.database || query.database || this.queriesConfig.defaultDatabase
    if (!database) {
      throw new Error('No database specified and no default database configured')
    }

    // 4. Get Hyperdrive binding (it's actually a D1Database)
    const hyperdrive = (this.env as unknown as Record<string, unknown>)[database] as D1Database
    if (!hyperdrive) {
      throw new Error(`Hyperdrive binding not found: ${database}`)
    }

    // 5. Validate read-only mode
    if (this.queriesConfig.readOnly && this.isWriteQuery(query.sql)) {
      throw new Error('Write operations not allowed in read-only mode')
    }

    // 6. Prepare parameters
    const { sql, params } = this.prepareQuery(query.sql, input.input || query.params || {})

    // 7. Execute query
    const startTime = Date.now()
    const result = await this.executeQuery(hyperdrive, sql, params)
    const executionTime = Date.now() - startTime

    // 8. Transform results
    let rows = result.rows
    if (this.queriesConfig.transform === 'camelCase') {
      rows = this.toCamelCase(rows)
    } else if (this.queriesConfig.transform === 'snakeCase') {
      rows = this.toSnakeCase(rows)
    }

    // 9. Apply row limit
    if (this.queriesConfig.maxRows && rows.length > this.queriesConfig.maxRows) {
      rows = rows.slice(0, this.queriesConfig.maxRows)
    }

    // 10. Return result
    const output: QueriesOutput = {
      rows,
      count: rows.length,
      metadata: {
        columns: result.columns || [],
        executionTime,
        cached: false, // TODO: Implement caching
        database,
        ...(this.queriesConfig.includeMetadata && { query: sql }),
      },
    }

    return output
  }

  /**
   * Load query from catalog
   */
  private async loadQueryFromCatalog(queryName: string): Promise<CatalogQuery> {
    // TODO: Implement catalog integration
    // For now, throw error - this will be implemented when catalog system is ready
    throw new Error(
      `Query catalog not yet implemented. Use inline SQL with 'sql' parameter instead of 'queryName'.`
    )
  }

  /**
   * Prepare query with parameters
   */
  private prepareQuery(
    sql: string,
    input: Record<string, unknown> | unknown[]
  ): { sql: string; params: unknown[] } {
    // If input is an array, assume positional parameters
    if (Array.isArray(input)) {
      return { sql, params: input }
    }

    // Convert named parameters to positional
    const params: unknown[] = []
    let paramIndex = 1

    const convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
      if (!(paramName in input)) {
        throw new Error(`Missing parameter: ${paramName}`)
      }

      params.push(input[paramName])
      return `$${paramIndex++}`
    })

    return { sql: convertedSql, params }
  }

  /**
   * Execute query via Hyperdrive/D1
   */
  private async executeQuery(
    hyperdrive: D1Database,
    sql: string,
    params: unknown[]
  ): Promise<{ rows: unknown[]; columns?: string[] }> {
    // Prepare statement
    let stmt = hyperdrive.prepare(sql)
    if (params.length > 0) {
      stmt = stmt.bind(...params)
    }

    // Execute with timeout if configured
    const executePromise = stmt.all()
    const result = this.queriesConfig.timeout
      ? await Promise.race([
          executePromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.queriesConfig.timeout)
          ),
        ])
      : await executePromise

    // Extract columns from result
    const columns =
      result.results.length > 0
        ? Object.keys(result.results[0])
        : result.meta?.columns
          ? (result.meta.columns as Array<{ name: string }>).map((c) => c.name)
          : []

    return {
      rows: result.results,
      columns,
    }
  }

  /**
   * Check if query is a write operation
   */
  private isWriteQuery(sql: string): boolean {
    const upperSQL = sql.trim().toUpperCase()
    return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL)
  }

  /**
   * Transform object keys to camelCase
   */
  private toCamelCase(rows: unknown[]): unknown[] {
    return rows.map((row) => {
      const transformed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        transformed[camelKey] = value
      }
      return transformed
    })
  }

  /**
   * Transform object keys to snake_case
   */
  private toSnakeCase(rows: unknown[]): unknown[] {
    return rows.map((row) => {
      const transformed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        transformed[snakeKey] = value
      }
      return transformed
    })
  }
}
