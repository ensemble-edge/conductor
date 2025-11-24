/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for operation types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */
// Re-export Operation from operation.ts for backward compatibility with imports
export { Operation, isOperation } from './operation.js';
/**
 * AI Provider types supported by Think agents
 */
export var AIProvider;
(function (AIProvider) {
    AIProvider["OpenAI"] = "openai";
    AIProvider["Anthropic"] = "anthropic";
    AIProvider["Cloudflare"] = "cloudflare";
    AIProvider["Custom"] = "custom";
})(AIProvider || (AIProvider = {}));
/**
 * Storage backend types for Storage agents (key-value and object storage)
 */
export var StorageType;
(function (StorageType) {
    StorageType["KV"] = "kv";
    StorageType["R2"] = "r2";
    StorageType["Cache"] = "cache";
})(StorageType || (StorageType = {}));
/**
 * Database backend types for Data agents (SQL and structured databases)
 */
export var DatabaseType;
(function (DatabaseType) {
    DatabaseType["D1"] = "d1";
    DatabaseType["Hyperdrive"] = "hyperdrive";
    DatabaseType["Vectorize"] = "vectorize";
    DatabaseType["Supabase"] = "supabase";
    DatabaseType["Neon"] = "neon";
    DatabaseType["PlanetScale"] = "planetscale";
})(DatabaseType || (DatabaseType = {}));
/**
 * Type guards for runtime validation
 */
export const isAIProvider = (value) => {
    return Object.values(AIProvider).includes(value);
};
export const isStorageType = (value) => {
    return Object.values(StorageType).includes(value);
};
export const isDatabaseType = (value) => {
    return Object.values(DatabaseType).includes(value);
};
