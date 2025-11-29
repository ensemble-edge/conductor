/**
 * Branded Types for Domain Concepts
 *
 * Branded types provide compile-time type safety for domain concepts,
 * preventing accidental misuse of primitive types.
 *
 * @example
 * ```typescript
 * const modelId = ModelId.create('@cf/meta/llama-3.1-8b-instruct');
 * const agentId = AgentName.create('analyze-company');
 *
 * // Type error! Can't pass AgentName where ModelId is expected
 * platform.validateModel(agentId); // ❌ Compile error
 * platform.validateModel(modelId);  // ✅ Works
 * ```
 */
declare const brand: unique symbol;
/**
 * Brand a primitive type with a unique identifier
 */
export type Brand<T, TBrand extends string> = T & {
    readonly [brand]: TBrand;
};
/**
 * Model ID - uniquely identifies an AI model
 * Examples: '@cf/meta/llama-3.1-8b-instruct', 'gpt-4o', 'claude-3-5-sonnet-20241022'
 */
export type ModelId = Brand<string, 'ModelId'>;
/**
 * Agent name - identifies an agent in the system
 * Format: lowercase alphanumeric with hyphens
 * Examples: 'analyze-company', 'fetch-data', 'greet-user'
 */
export type AgentName = Brand<string, 'AgentName'>;
/**
 * Ensemble name - identifies an ensemble workflow
 * Format: lowercase alphanumeric with hyphens
 * Examples: 'company-intelligence', 'user-onboarding', 'data-pipeline'
 */
export type EnsembleName = Brand<string, 'EnsembleName'>;
/**
 * Provider ID - identifies an AI provider
 * Examples: 'openai', 'anthropic', 'workers-ai', 'groq'
 */
export type ProviderId = Brand<string, 'ProviderId'>;
/**
 * Platform name - identifies a cloud platform
 * Examples: 'cloudflare', 'vercel', 'aws'
 */
export type PlatformName = Brand<string, 'PlatformName'>;
/**
 * Binding name - identifies a Cloudflare binding
 * Examples: 'AI', 'CACHE', 'DB', 'STORAGE'
 */
export type BindingName = Brand<string, 'BindingName'>;
/**
 * Version string - semantic version or tag
 * Examples: 'v1.0.0', 'production', 'latest'
 */
export type VersionString = Brand<string, 'VersionString'>;
/**
 * Execution ID - uniquely identifies an execution
 * Format: exec_<uuid>
 * Examples: 'exec_550e8400-e29b-41d4-a716-446655440000'
 */
export type ExecutionId = Brand<string, 'ExecutionId'>;
/**
 * Request ID - uniquely identifies an API request
 * Format: req_<uuid>
 * Examples: 'req_550e8400-e29b-41d4-a716-446655440000'
 */
export type RequestId = Brand<string, 'RequestId'>;
/**
 * Resume Token - uniquely identifies a suspended execution
 * Format: resume_<uuid>
 * Examples: 'resume_550e8400-e29b-41d4-a716-446655440000'
 */
export type ResumeToken = Brand<string, 'ResumeToken'>;
/**
 * Cache Key - identifies a cached value
 * Examples: 'agent:analyze:a1b2c3', 'query:d4e5f6'
 */
export type CacheKey = Brand<string, 'CacheKey'>;
/**
 * Model ID validation and creation
 */
export declare const ModelId: {
    /**
     * Create a ModelId from a string
     * @throws {Error} if the model ID is invalid
     */
    create(value: string): ModelId;
    /**
     * Check if a string is a valid ModelId
     */
    isValid(value: string): boolean;
    /**
     * Safely create a ModelId, returning null if invalid
     */
    tryCreate(value: string): ModelId | null;
    /**
     * Unwrap a ModelId back to a string
     */
    unwrap(modelId: ModelId): string;
};
/**
 * Agent name validation and creation
 */
export declare const AgentName: {
    /**
     * Create an AgentName from a string
     * @throws {Error} if the agent name is invalid
     */
    create(value: string): AgentName;
    /**
     * Check if a string is a valid AgentName
     */
    isValid(value: string): boolean;
    /**
     * Safely create an AgentName, returning null if invalid
     */
    tryCreate(value: string): AgentName | null;
    /**
     * Unwrap an AgentName back to a string
     */
    unwrap(agentName: AgentName): string;
};
/**
 * Ensemble name validation and creation
 */
export declare const EnsembleName: {
    /**
     * Create an EnsembleName from a string
     * @throws {Error} if the ensemble name is invalid
     */
    create(value: string): EnsembleName;
    /**
     * Check if a string is a valid EnsembleName
     */
    isValid(value: string): boolean;
    /**
     * Safely create an EnsembleName, returning null if invalid
     */
    tryCreate(value: string): EnsembleName | null;
    /**
     * Unwrap an EnsembleName back to a string
     */
    unwrap(ensembleName: EnsembleName): string;
};
/**
 * Provider ID validation and creation
 */
export declare const ProviderId: {
    /**
     * Create a ProviderId from a string
     * @throws {Error} if the provider ID is invalid
     */
    create(value: string): ProviderId;
    /**
     * Check if a string is a valid ProviderId
     */
    isValid(value: string): boolean;
    /**
     * Safely create a ProviderId, returning null if invalid
     */
    tryCreate(value: string): ProviderId | null;
    /**
     * Unwrap a ProviderId back to a string
     */
    unwrap(providerId: ProviderId): string;
};
/**
 * Platform name validation and creation
 */
export declare const PlatformName: {
    /**
     * Create a PlatformName from a string
     * @throws {Error} if the platform name is invalid
     */
    create(value: string): PlatformName;
    /**
     * Check if a string is a valid PlatformName
     */
    isValid(value: string): boolean;
    /**
     * Safely create a PlatformName, returning null if invalid
     */
    tryCreate(value: string): PlatformName | null;
    /**
     * Unwrap a PlatformName back to a string
     */
    unwrap(platformName: PlatformName): string;
};
/**
 * Binding name validation and creation
 */
export declare const BindingName: {
    /**
     * Create a BindingName from a string
     * @throws {Error} if the binding name is invalid
     */
    create(value: string): BindingName;
    /**
     * Check if a string is a valid BindingName
     */
    isValid(value: string): boolean;
    /**
     * Safely create a BindingName, returning null if invalid
     */
    tryCreate(value: string): BindingName | null;
    /**
     * Unwrap a BindingName back to a string
     */
    unwrap(bindingName: BindingName): string;
};
/**
 * Version string validation and creation
 */
export declare const VersionString: {
    /**
     * Create a VersionString from a string
     * @throws {Error} if the version string is invalid
     */
    create(value: string): VersionString;
    /**
     * Check if a string is a valid VersionString
     */
    isValid(value: string): boolean;
    /**
     * Safely create a VersionString, returning null if invalid
     */
    tryCreate(value: string): VersionString | null;
    /**
     * Unwrap a VersionString back to a string
     */
    unwrap(versionString: VersionString): string;
};
/**
 * Execution ID validation and creation
 */
export declare const ExecutionId: {
    /**
     * Create an ExecutionId from a string
     * @throws {Error} if the execution ID is invalid
     */
    create(value: string): ExecutionId;
    /**
     * Generate a new unique execution ID
     */
    generate(): ExecutionId;
    /**
     * Check if a string is a valid ExecutionId
     */
    isValid(value: string): boolean;
    /**
     * Safely create an ExecutionId, returning null if invalid
     */
    tryCreate(value: string): ExecutionId | null;
    /**
     * Unwrap an ExecutionId back to a string
     */
    unwrap(executionId: ExecutionId): string;
};
/**
 * Request ID validation and creation
 */
export declare const RequestId: {
    /**
     * Create a RequestId from a string
     * @throws {Error} if the request ID is invalid
     */
    create(value: string): RequestId;
    /**
     * Generate a new unique request ID
     */
    generate(): RequestId;
    /**
     * Check if a string is a valid RequestId
     */
    isValid(value: string): boolean;
    /**
     * Safely create a RequestId, returning null if invalid
     */
    tryCreate(value: string): RequestId | null;
    /**
     * Unwrap a RequestId back to a string
     */
    unwrap(requestId: RequestId): string;
};
/**
 * Resume Token validation and creation
 */
export declare const ResumeToken: {
    /**
     * Create a ResumeToken from a string
     * @throws {Error} if the resume token is invalid
     */
    create(value: string): ResumeToken;
    /**
     * Generate a new unique resume token
     */
    generate(): ResumeToken;
    /**
     * Check if a string is a valid ResumeToken
     */
    isValid(value: string): boolean;
    /**
     * Safely create a ResumeToken, returning null if invalid
     */
    tryCreate(value: string): ResumeToken | null;
    /**
     * Unwrap a ResumeToken back to a string
     */
    unwrap(resumeToken: ResumeToken): string;
};
/**
 * Cache Key validation and creation
 */
export declare const CacheKey: {
    /**
     * Create a CacheKey from a string
     * @throws {Error} if the cache key is invalid
     */
    create(value: string): CacheKey;
    /**
     * Generate a cache key from components
     */
    generate(prefix: string, ...parts: string[]): CacheKey;
    /**
     * Check if a string is a valid CacheKey
     */
    isValid(value: string): boolean;
    /**
     * Safely create a CacheKey, returning null if invalid
     */
    tryCreate(value: string): CacheKey | null;
    /**
     * Unwrap a CacheKey back to a string
     */
    unwrap(cacheKey: CacheKey): string;
};
export {};
//# sourceMappingURL=branded.d.ts.map