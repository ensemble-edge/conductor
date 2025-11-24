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
 * Storage backend types for Storage agents (key-value and object storage)
 */
export declare enum StorageType {
    KV = "kv",
    R2 = "r2",
    Cache = "cache"
}
/**
 * Database backend types for Data agents (SQL and structured databases)
 */
export declare enum DatabaseType {
    D1 = "d1",
    Hyperdrive = "hyperdrive",
    Vectorize = "vectorize",
    Supabase = "supabase",
    Neon = "neon",
    PlanetScale = "planetscale"
}
/**
 * Type guards for runtime validation
 */
export declare const isAIProvider: (value: string) => value is AIProvider;
export declare const isStorageType: (value: string) => value is StorageType;
export declare const isDatabaseType: (value: string) => value is DatabaseType;
/**
 * Type aliases for string unions
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom';
export type StorageTypeString = 'kv' | 'r2' | 'cache';
export type DatabaseTypeString = 'd1' | 'hyperdrive' | 'vectorize' | 'supabase' | 'neon' | 'planetscale';
//# sourceMappingURL=constants.d.ts.map