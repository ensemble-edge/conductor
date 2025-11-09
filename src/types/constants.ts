/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for member types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */

/**
 * AI Provider types supported by Think members
 */
export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Cloudflare = 'cloudflare',
  Custom = 'custom',
}

/**
 * Storage backend types for Data members
 */
export enum StorageType {
  KV = 'kv',
  D1 = 'd1',
  R2 = 'r2',
}

/**
 * Member types in Conductor framework
 */
export enum MemberType {
  Think = 'Think',
  Function = 'Function',
  Data = 'Data',
  API = 'API',
  MCP = 'MCP',
  Scoring = 'Scoring',
  Email = 'Email',
  SMS = 'SMS',
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

export const isMemberType = (value: string): value is MemberType => {
  return Object.values(MemberType).includes(value as MemberType)
}

/**
 * Type aliases for string unions (backwards compatibility)
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom'
export type StorageTypeString = 'kv' | 'd1' | 'r2'
export type MemberTypeString = 'Think' | 'Function' | 'Data' | 'API' | 'MCP' | 'Scoring' | 'Email' | 'SMS'
