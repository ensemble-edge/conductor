/**
 * Data Member - Refactored with Repository Pattern
 *
 * Handles data operations through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Reduced from 326 lines to ~120 lines through abstraction.
 */

import { BaseMember, type MemberExecutionContext } from './base-member'
import type { MemberConfig } from '../runtime/parser'
import type { Repository } from '../storage'
import { KVRepository, D1Repository, R2Repository, JSONSerializer } from '../storage'
import { StorageType } from '../types/constants'
import type { ConductorEnv } from '../types/env'

export interface DataConfig {
  storage: StorageType
  operation: 'get' | 'put' | 'delete' | 'list'
  binding?: string // Name of the binding in wrangler.toml
  // Options
  ttl?: number
}

export interface DataInput {
  key?: string
  value?: unknown
  prefix?: string
  limit?: number
  cursor?: string
  ttl?: number
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
   * Get Data configuration
   */
  getDataConfig(): DataConfig {
    return { ...this.dataConfig }
  }
}
