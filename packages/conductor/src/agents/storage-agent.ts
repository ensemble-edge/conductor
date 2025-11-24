/**
 * Storage Agent - Key-Value and Object Storage
 *
 * Handles storage operations for KV, R2, and Cache API through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Storage types:
 * - KV: Key-value store (Cloudflare Workers KV)
 * - R2: Object storage (Cloudflare R2)
 * - Cache: Cache API (browser-compatible caching)
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import type { Repository } from '../storage/index.js'
import { KVRepository, R2Repository, JSONSerializer } from '../storage/index.js'
import { StorageType } from '../types/constants.js'
import type { ConductorEnv } from '../types/env.js'

export interface StorageConfig {
  backend: StorageType
  operation: 'get' | 'put' | 'delete' | 'list'
  binding?: string // Name of the binding in wrangler.toml
  ttl?: number // Time-to-live for stored values
}

export interface StorageInput {
  key?: string
  value?: unknown
  prefix?: string
  limit?: number
  cursor?: string
  ttl?: number
}

/**
 * Storage Agent performs key-value and object storage operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any storage backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export class StorageAgent extends BaseAgent {
  private storageConfig: StorageConfig

  constructor(
    config: AgentConfig,
    private readonly repository?: Repository<unknown, string>
  ) {
    super(config)

    const cfg = config.config as StorageConfig | undefined
    this.storageConfig = {
      backend: cfg?.backend as StorageType,
      operation: cfg?.operation as 'get' | 'put' | 'delete' | 'list',
      binding: cfg?.binding,
      ttl: cfg?.ttl,
    }

    // Validate config
    if (!this.storageConfig.backend) {
      throw new Error(`Storage agent "${config.name}" requires backend type (kv, r2, or cache)`)
    }

    if (!this.storageConfig.operation) {
      throw new Error(`Storage agent "${config.name}" requires operation type`)
    }
  }

  /**
   * Execute storage operation via repository
   */
  protected async run(context: AgentExecutionContext): Promise<unknown> {
    const { input, env } = context

    // Get or create repository
    const repo = this.repository || this.createRepository(env)

    switch (this.storageConfig.operation) {
      case 'get':
        return await this.executeGet(repo, input)

      case 'put':
        return await this.executePut(repo, input)

      case 'delete':
        return await this.executeDelete(repo, input)

      case 'list':
        return await this.executeList(repo, input)

      default:
        throw new Error(`Unknown operation: ${this.storageConfig.operation}`)
    }
  }

  /**
   * Execute GET operation
   */
  private async executeGet(repo: Repository<unknown, string>, input: StorageInput): Promise<unknown> {
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
  private async executePut(repo: Repository<unknown, string>, input: StorageInput): Promise<unknown> {
    if (!input.key || input.value === undefined) {
      throw new Error('PUT operation requires "key" and "value" in input')
    }

    const result = await repo.put(input.key, input.value, {
      ttl: input.ttl || this.storageConfig.ttl,
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
    input: StorageInput
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
  private async executeList(repo: Repository<unknown, string>, input: StorageInput): Promise<unknown> {
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

    switch (this.storageConfig.backend) {
      case StorageType.KV:
        return new KVRepository(binding, new JSONSerializer())

      case StorageType.R2:
        return new R2Repository(binding, new JSONSerializer())

      case StorageType.Cache:
        // Cache API doesn't have a Repository implementation yet
        // TODO: Implement CacheRepository in storage/repositories/
        throw new Error('Cache API repository not yet implemented')

      default:
        throw new Error(`Unknown storage backend: ${this.storageConfig.backend}`)
    }
  }

  /**
   * Get binding name with sensible defaults
   */
  private getBindingName(): string {
    if (this.storageConfig.binding) {
      return this.storageConfig.binding
    }

    // Default binding names
    switch (this.storageConfig.backend) {
      case StorageType.KV:
        return 'CACHE'
      case StorageType.R2:
        return 'STORAGE'
      case StorageType.Cache:
        return 'CACHE_API'
      default:
        return 'STORAGE'
    }
  }

  /**
   * Get Storage configuration
   */
  getStorageConfig(): StorageConfig {
    return { ...this.storageConfig }
  }
}
