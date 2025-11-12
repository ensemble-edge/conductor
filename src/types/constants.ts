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
 * Storage backend types for Data agents
 */
export enum StorageType {
  KV = 'kv',
  D1 = 'd1',
  R2 = 'r2',
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

/**
 * Type aliases for string unions
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom'
export type StorageTypeString = 'kv' | 'd1' | 'r2'
