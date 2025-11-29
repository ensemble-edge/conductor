/**
 * Data Agent - SQL Databases and Structured Data
 *
 * Handles database operations through a unified Repository interface.
 * Database backend is injected, making it testable and platform-agnostic.
 *
 * Database types:
 * - D1: SQLite database (Cloudflare D1)
 * - Hyperdrive: PostgreSQL/MySQL connection pooling (Cloudflare Hyperdrive)
 * - Vectorize: Vector database for embeddings (Cloudflare Vectorize)
 * - External: Supabase, Neon, PlanetScale, etc.
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import type { Repository } from '../storage/index.js'
import {
  D1Repository,
  JSONSerializer,
  HyperdriveRepository,
  type HyperdriveConfig,
  type DatabaseType as HyperdriveDatabaseType,
} from '../storage/index.js'
import { DatabaseType } from '../types/constants.js'
import type { ConductorEnv } from '../types/env.js'
import {
  exportData,
  createStreamingExport,
  type ExportOptions,
  type ExportFormat,
} from './data/export-formats.js'

export interface DataConfig {
  database: DatabaseType
  operation: 'get' | 'put' | 'delete' | 'list' | 'query' | 'export'
  binding?: string // Name of the binding in wrangler.toml
  // Database options
  tableName?: string
  // Hyperdrive options
  databaseType?: HyperdriveDatabaseType // 'postgres' | 'mysql' | 'mariadb'
  schema?: string // Schema name (for Postgres)
  readOnly?: boolean // Prevent write operations
  // Export options
  exportFormat?: ExportFormat
  exportOptions?: ExportOptions
}

export interface DataInput {
  // Record operations
  key?: string
  value?: unknown
  // List/Query options
  prefix?: string
  limit?: number
  cursor?: string
  // SQL query options
  query?: string
  params?: unknown[]
  filter?: Record<string, unknown>
  sort?: string
  // Export options
  format?: ExportFormat
  exportOptions?: ExportOptions
  streaming?: boolean
}

/**
 * Data Agent performs database operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any database backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export class DataAgent extends BaseAgent {
  private dataConfig: DataConfig
  private hyperdriveRepo?: HyperdriveRepository

  constructor(
    config: AgentConfig,
    private readonly repository?: Repository<unknown, string>
  ) {
    super(config)

    const cfg = config.config as DataConfig | undefined
    this.dataConfig = {
      database: cfg?.database as DatabaseType,
      operation: cfg?.operation as 'get' | 'put' | 'delete' | 'list' | 'query' | 'export',
      binding: cfg?.binding,
      tableName: cfg?.tableName,
      // Hyperdrive options
      databaseType: cfg?.databaseType,
      schema: cfg?.schema,
      readOnly: cfg?.readOnly,
      // Export options
      exportFormat: cfg?.exportFormat,
      exportOptions: cfg?.exportOptions,
    }

    // Validate config
    if (!this.dataConfig.database) {
      throw new Error(
        `Data agent "${config.name}" requires database type (d1, hyperdrive, vectorize, etc.)`
      )
    }

    if (!this.dataConfig.operation) {
      throw new Error(`Data agent "${config.name}" requires operation type`)
    }
  }

  /**
   * Execute data operation via repository
   */
  protected async run(context: AgentExecutionContext): Promise<unknown> {
    const { input, env } = context

    // Handle Hyperdrive separately (SQL-native, not key-value)
    if (this.dataConfig.database === DatabaseType.Hyperdrive) {
      return await this.executeHyperdriveOperation(env, input)
    }

    // Get or create repository for KV-style databases
    const repo = this.repository || this.createRepository(env)

    switch (this.dataConfig.operation) {
      case 'get':
        return await this.executeGet(repo, input)

      case 'put':
        return await this.executePut(repo, input)

      case 'delete':
        return await this.executeDelete(repo, input)

      case 'list':
        return await this.executeList(repo, input)

      case 'query':
        return await this.executeQuery(repo, input)

      case 'export':
        return await this.executeExport(repo, input)

      default:
        throw new Error(`Unknown operation: ${this.dataConfig.operation}`)
    }
  }

  /**
   * Execute Hyperdrive operation (SQL-native)
   */
  private async executeHyperdriveOperation(env: ConductorEnv, input: DataInput): Promise<unknown> {
    // Create or get cached Hyperdrive repository
    if (!this.hyperdriveRepo) {
      this.hyperdriveRepo = this.createHyperdriveRepository(env)
    }

    switch (this.dataConfig.operation) {
      case 'query': {
        // Execute SQL query
        if (!input.query) {
          return {
            success: false,
            error: 'SQL query is required for Hyperdrive query operation',
          }
        }

        const result = await this.hyperdriveRepo.query(input.query, input.params)
        if (result.success) {
          return {
            rows: result.value.rows,
            metadata: result.value.metadata,
            success: true,
          }
        } else {
          return {
            rows: [],
            success: false,
            error: result.error.message,
          }
        }
      }

      case 'get': {
        // Simple get by key - requires tableName and key
        if (!input.key) {
          return { value: null, success: false, error: 'Key is required for get operation' }
        }
        const tableName = this.dataConfig.tableName || 'data'
        const sql =
          this.dataConfig.databaseType === 'postgres'
            ? `SELECT * FROM ${tableName} WHERE id = $1 LIMIT 1`
            : `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`

        const result = await this.hyperdriveRepo.query(sql, [input.key])
        if (result.success && result.value.rows.length > 0) {
          return { value: result.value.rows[0], found: true, success: true }
        }
        return { value: null, found: false, success: true }
      }

      case 'put': {
        // Upsert operation
        if (!input.key || input.value === undefined) {
          return { success: false, error: 'Key and value are required for put operation' }
        }
        const tableName = this.dataConfig.tableName || 'data'
        const valueJson = JSON.stringify(input.value)

        let sql: string
        if (this.dataConfig.databaseType === 'postgres') {
          sql = `INSERT INTO ${tableName} (id, value) VALUES ($1, $2)
                 ON CONFLICT (id) DO UPDATE SET value = $2`
        } else {
          sql = `INSERT INTO ${tableName} (id, value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE value = VALUES(value)`
        }

        const result = await this.hyperdriveRepo.execute(sql, [input.key, valueJson])
        return result.success
          ? { success: true, rowsAffected: result.value.rowsAffected }
          : { success: false, error: result.error.message }
      }

      case 'delete': {
        if (!input.key) {
          return { success: false, error: 'Key is required for delete operation' }
        }
        const tableName = this.dataConfig.tableName || 'data'
        const sql =
          this.dataConfig.databaseType === 'postgres'
            ? `DELETE FROM ${tableName} WHERE id = $1`
            : `DELETE FROM ${tableName} WHERE id = ?`

        const result = await this.hyperdriveRepo.execute(sql, [input.key])
        return result.success
          ? { success: true, rowsAffected: result.value.rowsAffected }
          : { success: false, error: result.error.message }
      }

      case 'list': {
        const tableName = this.dataConfig.tableName || 'data'
        const limit = input.limit || 100
        const sql =
          this.dataConfig.databaseType === 'postgres'
            ? `SELECT * FROM ${tableName} LIMIT $1`
            : `SELECT * FROM ${tableName} LIMIT ?`

        const result = await this.hyperdriveRepo.query(sql, [limit])
        return result.success
          ? { items: result.value.rows, count: result.value.rows.length, success: true }
          : { items: [], success: false, error: result.error.message }
      }

      default:
        return {
          success: false,
          error: `Operation ${this.dataConfig.operation} not supported for Hyperdrive`,
        }
    }
  }

  /**
   * Create Hyperdrive repository from environment bindings
   */
  private createHyperdriveRepository(env: ConductorEnv): HyperdriveRepository {
    const bindingName = this.getBindingName()
    const binding = env[bindingName as keyof ConductorEnv]

    if (!binding) {
      throw new Error(
        `Hyperdrive binding "${bindingName}" not found. ` +
          `Add [[hyperdrive]] to wrangler.toml with binding = "${bindingName}".`
      )
    }

    const config: HyperdriveConfig = {
      databaseType: this.dataConfig.databaseType || 'postgres',
      schema: this.dataConfig.schema,
      options: {
        readOnly: this.dataConfig.readOnly,
      },
    }

    return new HyperdriveRepository(binding as D1Database, config)
  }

  /**
   * Execute GET operation
   */
  private async executeGet(repo: Repository<unknown, string>, input: DataInput): Promise<unknown> {
    if (!input.key) {
      throw new Error('GET operation requires "key" in input')
    }

    const result = await repo.get(input.key)

    if (result.success) {
      return {
        key: input.key,
        value: result.value,
        found: true,
      }
    } else {
      return {
        key: input.key,
        value: null,
        found: false,
        error: result.error.message,
      }
    }
  }

  /**
   * Execute PUT operation
   */
  private async executePut(repo: Repository<unknown, string>, input: DataInput): Promise<unknown> {
    if (!input.key || input.value === undefined) {
      throw new Error('PUT operation requires "key" and "value" in input')
    }

    const result = await repo.put(input.key, input.value)

    if (result.success) {
      return {
        key: input.key,
        success: true,
      }
    } else {
      return {
        key: input.key,
        success: false,
        error: result.error.message,
      }
    }
  }

  /**
   * Execute DELETE operation
   */
  private async executeDelete(
    repo: Repository<unknown, string>,
    input: DataInput
  ): Promise<unknown> {
    if (!input.key) {
      throw new Error('DELETE operation requires "key" in input')
    }

    const result = await repo.delete(input.key)

    if (result.success) {
      return {
        key: input.key,
        success: true,
      }
    } else {
      return {
        key: input.key,
        success: false,
        error: result.error.message,
      }
    }
  }

  /**
   * Execute LIST operation
   */
  private async executeList(repo: Repository<unknown, string>, input: DataInput): Promise<unknown> {
    const result = await repo.list({
      prefix: input.prefix,
      limit: input.limit,
      cursor: input.cursor,
    })

    if (result.success) {
      return {
        items: result.value,
        success: true,
      }
    } else {
      return {
        items: [],
        success: false,
        error: result.error.message,
      }
    }
  }

  /**
   * Create repository from environment bindings
   * Falls back to original behavior if no repository injected
   */
  private createRepository(env: ConductorEnv): Repository<unknown, string> {
    const bindingName = this.getBindingName()
    const binding = env[bindingName as keyof ConductorEnv]

    if (!binding) {
      throw new Error(
        `Binding "${bindingName}" not found. ` +
          `Add it to wrangler.toml or inject a repository in constructor.`
      )
    }

    switch (this.dataConfig.database) {
      case DatabaseType.D1:
        return new D1Repository(
          binding,
          {
            tableName: this.dataConfig.tableName || 'data',
            idColumn: 'key',
            valueColumn: 'value',
          },
          new JSONSerializer()
        )

      case DatabaseType.Hyperdrive:
        // Hyperdrive is handled separately in executeHyperdriveOperation()
        // This should never be reached due to the check in run()
        throw new Error('Hyperdrive uses SQL-native operations, not Repository pattern')

      case DatabaseType.Vectorize:
        // Vectorize requires embeddings and semantic operations
        // Use the RAG agent instead: operation: rag with config.operation: search/index
        throw new Error(
          'Vectorize is not supported via the data agent. Use the RAG agent (operation: rag) for vector operations.'
        )

      case DatabaseType.Supabase:
      case DatabaseType.Neon:
      case DatabaseType.PlanetScale:
        // TODO: Implement external database repositories
        throw new Error(`${this.dataConfig.database} repository not yet implemented`)

      default:
        throw new Error(`Unknown database type: ${this.dataConfig.database}`)
    }
  }

  /**
   * Get binding name with sensible defaults
   */
  private getBindingName(): string {
    if (this.dataConfig.binding) {
      return this.dataConfig.binding
    }

    // Default binding names for databases
    switch (this.dataConfig.database) {
      case DatabaseType.D1:
        return 'DB'
      case DatabaseType.Hyperdrive:
        return 'HYPERDRIVE'
      case DatabaseType.Vectorize:
        return 'VECTORIZE'
      case DatabaseType.Supabase:
        return 'SUPABASE_URL'
      case DatabaseType.Neon:
        return 'NEON_URL'
      case DatabaseType.PlanetScale:
        return 'PLANETSCALE_URL'
      default:
        return 'DATABASE'
    }
  }

  /**
   * Execute QUERY operation (D1 only)
   */
  private async executeQuery(
    repo: Repository<unknown, string>,
    input: DataInput
  ): Promise<unknown> {
    // Query operations are storage-specific
    // For now, use list with filtering
    const listResult = await repo.list({
      prefix: input.prefix,
      limit: input.limit,
      cursor: input.cursor,
    })

    if (!listResult.success) {
      return {
        items: [],
        success: false,
        error: listResult.error.message,
      }
    }

    let items = listResult.value

    // Apply filters if provided
    if (input.filter) {
      items = items.filter((item: any) => {
        return Object.entries(input.filter!).every(([key, value]) => {
          return item[key] === value
        })
      })
    }

    // Apply sorting if provided
    if (input.sort) {
      const [field, order = 'asc'] = input.sort.split(':')
      items = items.sort((a: any, b: any) => {
        const aVal = a[field]
        const bVal = b[field]
        if (order === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      })
    }

    return {
      items,
      count: items.length,
      success: true,
    }
  }

  /**
   * Execute EXPORT operation
   */
  private async executeExport(
    repo: Repository<unknown, string>,
    input: DataInput
  ): Promise<unknown> {
    // Get data to export
    const listResult = await repo.list({
      prefix: input.prefix,
      limit: input.limit || 10000, // Default to large limit for exports
      cursor: input.cursor,
    })

    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error.message,
      }
    }

    let items = listResult.value

    // Apply filters if provided
    if (input.filter) {
      items = items.filter((item: any) => {
        return Object.entries(input.filter!).every(([key, value]) => {
          return item[key] === value
        })
      })
    }

    // Prepare export options
    const exportOptions: ExportOptions = {
      format: input.format || this.dataConfig.exportFormat || 'json',
      ...this.dataConfig.exportOptions,
      ...input.exportOptions,
    }

    // Handle streaming export for large datasets
    if (input.streaming || items.length > 1000) {
      // Create async iterable for streaming
      async function* dataSource() {
        const batchSize = exportOptions.batchSize || 100
        for (let i = 0; i < items.length; i += batchSize) {
          yield items.slice(i, i + batchSize)
        }
      }

      const exportResult = createStreamingExport(dataSource(), exportOptions)

      return {
        success: true,
        streaming: true,
        stream: exportResult.data,
        contentType: exportResult.contentType,
        extension: exportResult.extension,
        count: items.length,
      }
    }

    // Non-streaming export
    const exportResult = await exportData(items, exportOptions)

    return {
      success: true,
      streaming: false,
      data: exportResult.data,
      contentType: exportResult.contentType,
      extension: exportResult.extension,
      size: exportResult.size,
      count: items.length,
    }
  }

  /**
   * Get Data configuration
   */
  getDataConfig(): DataConfig {
    return { ...this.dataConfig }
  }
}
