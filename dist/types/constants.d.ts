/**
 * Constants and Enums - Eliminating Magic Strings
 *
 * Centralized constants for member types, providers, and storage types.
 * Eliminates magic strings and provides compile-time safety.
 */
/**
 * AI Provider types supported by Think members
 */
export declare enum AIProvider {
    OpenAI = "openai",
    Anthropic = "anthropic",
    Cloudflare = "cloudflare",
    Custom = "custom"
}
/**
 * Storage backend types for Data members
 */
export declare enum StorageType {
    KV = "kv",
    D1 = "d1",
    R2 = "r2"
}
/**
 * Member types in Conductor framework
 */
export declare enum MemberType {
    Think = "Think",
    Function = "Function",
    Data = "Data",
    API = "API",
    MCP = "MCP",
    Scoring = "Scoring"
}
/**
 * Type guards for runtime validation
 */
export declare const isAIProvider: (value: string) => value is AIProvider;
export declare const isStorageType: (value: string) => value is StorageType;
export declare const isMemberType: (value: string) => value is MemberType;
/**
 * Type aliases for string unions (backwards compatibility)
 */
export type AIProviderType = 'openai' | 'anthropic' | 'cloudflare' | 'custom';
export type StorageTypeString = 'kv' | 'd1' | 'r2';
export type MemberTypeString = 'Think' | 'Function' | 'Data' | 'API' | 'MCP' | 'Scoring';
//# sourceMappingURL=constants.d.ts.map