/**
 * Repository Pattern for Storage Abstraction
 *
 * Provides a unified interface for all storage operations across
 * different storage backends (KV, D1, R2, etc.)
 */

import type { Result } from '../types/result'
import type { ConductorError } from '../errors/error-types'

/**
 * Generic repository interface for CRUD operations
 */
export interface Repository<T, ID = string> {
  /**
   * Get a value by ID
   */
  get(id: ID): Promise<Result<T, ConductorError>>

  /**
   * Store a value with an ID
   */
  put(id: ID, value: T, options?: PutOptions): Promise<Result<void, ConductorError>>

  /**
   * Delete a value by ID
   */
  delete(id: ID): Promise<Result<void, ConductorError>>

  /**
   * List values with optional filtering
   */
  list(options?: ListOptions): Promise<Result<T[], ConductorError>>

  /**
   * Check if a key exists
   */
  has(id: ID): Promise<Result<boolean, ConductorError>>
}

/**
 * Options for put operations
 */
export interface PutOptions {
  /**
   * Time-to-live in seconds
   */
  ttl?: number

  /**
   * Expiration timestamp (Unix timestamp)
   */
  expiration?: number

  /**
   * Custom metadata
   */
  metadata?: Record<string, string>
}

/**
 * Options for list operations
 */
export interface ListOptions {
  /**
   * Key prefix filter
   */
  prefix?: string

  /**
   * Maximum number of items to return
   */
  limit?: number

  /**
   * Pagination cursor
   */
  cursor?: string
}

/**
 * Result of list operation with pagination
 */
export interface ListResult<T> {
  items: T[]
  cursor?: string
  complete: boolean
}

/**
 * Serializer interface for converting values to/from storage format
 */
export interface Serializer<T> {
  serialize(value: T): string
  deserialize(raw: string): T
}

/**
 * JSON serializer - works for most objects
 */
export class JSONSerializer<T> implements Serializer<T> {
  serialize(value: T): string {
    return JSON.stringify(value)
  }

  deserialize(raw: string): T {
    return JSON.parse(raw) as T
  }
}

/**
 * String serializer - passthrough for string values
 */
export class StringSerializer implements Serializer<string> {
  serialize(value: string): string {
    return value
  }

  deserialize(raw: string): string {
    return raw
  }
}

/**
 * Binary serializer - for ArrayBuffer/Uint8Array
 */
export class BinarySerializer implements Serializer<ArrayBuffer> {
  serialize(value: ArrayBuffer): string {
    // Convert to base64 for storage
    const bytes = new Uint8Array(value)
    return btoa(String.fromCharCode(...bytes))
  }

  deserialize(raw: string): ArrayBuffer {
    // Convert from base64
    const binaryString = atob(raw)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
}
