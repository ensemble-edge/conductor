/**
 * Cloudflare KV Repository Implementation
 *
 * Provides a Repository interface over Cloudflare KV namespace.
 */

import { Result } from '../types/result'
import { Errors, type ConductorError } from '../errors/error-types'
import type { Repository, PutOptions, ListOptions, Serializer, ListResult } from './repository'
import { JSONSerializer } from './repository'

/**
 * Repository implementation for Cloudflare KV
 */
export class KVRepository<T> implements Repository<T, string> {
  constructor(
    private readonly binding: KVNamespace,
    private readonly serializer: Serializer<T> = new JSONSerializer<T>()
  ) {}

  /**
   * Get a value from KV
   */
  async get(key: string): Promise<Result<T, ConductorError>> {
    try {
      const raw = await this.binding.get(key)

      if (raw === null) {
        return Result.err(Errors.storageNotFound(key, 'KV'))
      }

      const value = this.serializer.deserialize(raw)
      return Result.ok(value)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `KV get operation failed for key "${key}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Store a value in KV
   */
  async put(key: string, value: T, options?: PutOptions): Promise<Result<void, ConductorError>> {
    try {
      const serialized = this.serializer.serialize(value)

      const kvOptions: KVNamespacePutOptions = {}

      if (options?.ttl) {
        kvOptions.expirationTtl = options.ttl
      }

      if (options?.expiration) {
        kvOptions.expiration = options.expiration
      }

      if (options?.metadata) {
        kvOptions.metadata = options.metadata
      }

      await this.binding.put(key, serialized, kvOptions)
      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `KV put operation failed for key "${key}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Delete a value from KV
   */
  async delete(key: string): Promise<Result<void, ConductorError>> {
    try {
      await this.binding.delete(key)
      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `KV delete operation failed for key "${key}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * List keys in KV
   */
  async list(options?: ListOptions): Promise<Result<T[], ConductorError>> {
    try {
      const listOptions: KVNamespaceListOptions = {}

      if (options?.prefix) {
        listOptions.prefix = options.prefix
      }

      if (options?.limit) {
        listOptions.limit = options.limit
      }

      if (options?.cursor) {
        listOptions.cursor = options.cursor
      }

      const result = await this.binding.list(listOptions)

      // Fetch all values for the keys
      const values: T[] = []
      for (const key of result.keys) {
        const getResult = await this.get(key.name)
        if (getResult.success) {
          values.push(getResult.value)
        }
      }

      return Result.ok(values)
    } catch (error) {
      return Result.err(
        Errors.internal('KV list operation failed', error instanceof Error ? error : undefined)
      )
    }
  }

  /**
   * Check if a key exists in KV
   */
  async has(key: string): Promise<Result<boolean, ConductorError>> {
    try {
      const value = await this.binding.get(key)
      return Result.ok(value !== null)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `KV has operation failed for key "${key}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Get value with metadata
   */
  async getWithMetadata(
    key: string
  ): Promise<Result<{ value: T; metadata?: unknown }, ConductorError>> {
    try {
      const result = await this.binding.getWithMetadata(key)

      if (result.value === null) {
        return Result.err(Errors.storageNotFound(key, 'KV'))
      }

      const value = this.serializer.deserialize(result.value)
      return Result.ok({
        value,
        metadata: result.metadata,
      })
    } catch (error) {
      return Result.err(
        Errors.internal(
          `KV getWithMetadata operation failed for key "${key}"`,
          error instanceof Error ? error : undefined
        )
      )
    }
  }
}
