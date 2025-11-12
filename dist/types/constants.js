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
 * Storage backend types for Data agents
 */
export var StorageType;
(function (StorageType) {
    StorageType["KV"] = "kv";
    StorageType["D1"] = "d1";
    StorageType["R2"] = "r2";
})(StorageType || (StorageType = {}));
/**
 * Type guards for runtime validation
 */
export const isAIProvider = (value) => {
    return Object.values(AIProvider).includes(value);
};
export const isStorageType = (value) => {
    return Object.values(StorageType).includes(value);
};
