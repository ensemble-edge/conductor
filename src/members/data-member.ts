/**
 * Data Member - Refactored with Repository Pattern
 *
 * Handles data operations through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Reduced from 326 lines to ~120 lines through abstraction.
 */

import { BaseMember, type MemberExecutionContext } from './base-member.js'
import type { MemberConfig } from '../runtime/parser.js'
import type { Repository } from '../storage/index.js'
import { KVRepository, D1Repository, R2Repository, JSONSerializer } from '../storage/index.js'
import { StorageType } from '../types/constants.js'
import type { ConductorEnv } from '../types/env.js'
import { exportData, createStreamingExport, type ExportOptions, type ExportFormat } from './data/export-formats.js'

export interface DataConfig {
  storage: StorageType
  operation: 'get' | 'put' | 'delete' | 'list' | 'query' | 'export'
  binding?: string // Name of the binding in wrangler.toml
  // Options
  ttl?: number
  // Export options
  exportFormat?: ExportFormat
  exportOptions?: ExportOptions
}

export interface DataInput {
  key?: string
  value?: unknown
  prefix?: string
  limit?: number
  cursor?: string
  ttl?: number
  // Query options
  query?: string
  filter?: Record<string, unknown>
  sort?: string
  // Export options
  format?: ExportFormat
  exportOptions?: ExportOptions
  streaming?: boolean
}

/**
 * Data Member performs storage operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any storage backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export class DataMember extends BaseMember {
  private dataConfig: DataConfig

  constructor(
    config: MemberConfig,
    private readonly repository?: Repository<unknown, string>
  ) {
    super(config)

    const cfg = config.config as DataConfig | undefined
    this.dataConfig = {
      storage: cfg?.storage as StorageType,
      operation: cfg?.operation as 'get' | 'put' | 'delete' | 'list',
      binding: cfg?.binding,
      ttl: cfg?.ttl,
    }

    // Validate config
    if (!this.dataConfig.storage) {
      throw new Error(`Data member "${config.name}" requires storage type (kv, d1, or r2)`)
    }

    if (!this.dataConfig.operation) {
      throw new Error(`Data member "${config.name}" requires operation type`)
    }
  }

  /**
   * Execute data operation via repository
   */
  protected async run(context: MemberExecutionContext): Promise<unknown> {
    const { input, env } = context

    // Get or create repository
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

    const result = await repo.put(input.key, input.value, {
      ttl: input.ttl || this.dataConfig.ttl,
    })

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

    switch (this.dataConfig.storage) {
      case StorageType.KV:
        return new KVRepository(binding, new JSONSerializer())

      case StorageType.D1:
        return new D1Repository(
          binding,
          { tableName: 'data', idColumn: 'key', valueColumn: 'value' },
          new JSONSerializer()
        )

      case StorageType.R2:
        return new R2Repository(binding, new JSONSerializer())

      default:
        throw new Error(`Unknown storage type: ${this.dataConfig.storage}`)
    }
  }

  /**
   * Get binding name with sensible defaults
   */
  private getBindingName(): string {
    if (this.dataConfig.binding) {
      return this.dataConfig.binding
    }

    // Default binding names
    switch (this.dataConfig.storage) {
      case StorageType.KV:
        return 'CACHE'
      case StorageType.D1:
        return 'DB'
      case StorageType.R2:
        return 'STORAGE'
      default:
        return 'DATA'
    }
  }

  /**
   * Execute QUERY operation (D1 only)
   */
  private async executeQuery(repo: Repository<unknown, string>, input: DataInput): Promise<unknown> {
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
  private async executeExport(repo: Repository<unknown, string>, input: DataInput): Promise<unknown> {
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
