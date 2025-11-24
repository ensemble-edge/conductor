/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for operation types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */

// Re-export Operation from operation.ts for backward compatibility with imports
export { Operation, type OperationType, isOperation } from './operation.js'

/**
 * AI Provider types supported by Think agents
 */
export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Cloudflare = 'cloudflare',
  Custom = 'custom',
}

/**
 * Storage backend types for Storage agents (key-value and object storage)
 */
export enum StorageType {
  KV = 'kv',
  R2 = 'r2',
  Cache = 'cache',
}

/**
 * Database backend types for Data agents (SQL and structured databases)
 */
export enum DatabaseType {
  D1 = 'd1',
  Hyperdrive = 'hyperdrive',
  Vectorize = 'vectorize',
  Supabase = 'supabase',
  Neon = 'neon',
  PlanetScale = 'planetscale',
}

/**
 * Type guards for runtime validation
 */
export const isAIProvider = (value: string): value is AIProvider => {
  return Object.values(AIProvider).includes(value as AIProvider)
}

export const isStorageType = (value: string): value is StorageType => {
  return Object.values(StorageType).includes(value as StorageType)
}

export const isDatabaseType = (value: string): value is DatabaseType => {
  return Object.values(DatabaseType).includes(value as DatabaseType)
}

/**
 * Type aliases for string unions
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom'
export type StorageTypeString = 'kv' | 'r2' | 'cache'
export type DatabaseTypeString = 'd1' | 'hyperdrive' | 'vectorize' | 'supabase' | 'neon' | 'planetscale'
