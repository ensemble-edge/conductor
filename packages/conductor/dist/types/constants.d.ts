/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for operation types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */
export { Operation, type OperationType, isOperation } from './operation.js';
/**
 * AI Provider types supported by Think agents
 */
export declare enum AIProvider {
    OpenAI = "openai",
    Anthropic = "anthropic",
    Cloudflare = "cloudflare",
    Custom = "custom"
}
/**
 * Storage backend types for Data agents
 */
export declare enum StorageType {
    KV = "kv",
    D1 = "d1",
    R2 = "r2"
}
/**
 * Type guards for runtime validation
 */
export declare const isAIProvider: (value: string) => value is AIProvider;
export declare const isStorageType: (value: string) => value is StorageType;
/**
 * Type aliases for string unions
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom';
export type StorageTypeString = 'kv' | 'd1' | 'r2';
//# sourceMappingURL=constants.d.ts.map