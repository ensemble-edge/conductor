/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for member types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */
/**
 * AI Provider types supported by Think members
 */
export var AIProvider;
(function (AIProvider) {
    AIProvider["OpenAI"] = "openai";
    AIProvider["Anthropic"] = "anthropic";
    AIProvider["Cloudflare"] = "cloudflare";
    AIProvider["Custom"] = "custom";
})(AIProvider || (AIProvider = {}));
/**
 * Storage backend types for Data members
 */
export var StorageType;
(function (StorageType) {
    StorageType["KV"] = "kv";
    StorageType["D1"] = "d1";
    StorageType["R2"] = "r2";
})(StorageType || (StorageType = {}));
/**
 * Member types in Conductor framework
 */
export var MemberType;
(function (MemberType) {
    MemberType["Think"] = "Think";
    MemberType["Function"] = "Function";
    MemberType["Data"] = "Data";
    MemberType["API"] = "API";
    MemberType["MCP"] = "MCP";
    MemberType["Scoring"] = "Scoring";
    MemberType["Email"] = "Email";
    MemberType["SMS"] = "SMS";
    MemberType["HTML"] = "HTML";
    MemberType["PDF"] = "PDF";
})(MemberType || (MemberType = {}));
/**
 * Type guards for runtime validation
 */
export const isAIProvider = (value) => {
    return Object.values(AIProvider).includes(value);
};
export const isStorageType = (value) => {
    return Object.values(StorageType).includes(value);
};
export const isMemberType = (value) => {
    return Object.values(MemberType).includes(value);
};
