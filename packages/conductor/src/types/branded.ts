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

declare const brand: unique symbol

/**
 * Brand a primitive type with a unique identifier
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [brand]: TBrand
}

/**
 * Model ID - uniquely identifies an AI model
 * Examples: '@cf/meta/llama-3.1-8b-instruct', 'gpt-4o', 'claude-3-5-sonnet-20241022'
 */
export type ModelId = Brand<string, 'ModelId'>

/**
 * Agent name - identifies an agent in the system
 * Format: lowercase alphanumeric with hyphens
 * Examples: 'analyze-company', 'fetch-data', 'greet-user'
 */
export type AgentName = Brand<string, 'AgentName'>

/**
 * Ensemble name - identifies an ensemble workflow
 * Format: lowercase alphanumeric with hyphens
 * Examples: 'company-intelligence', 'user-onboarding', 'data-pipeline'
 */
export type EnsembleName = Brand<string, 'EnsembleName'>

/**
 * Provider ID - identifies an AI provider
 * Examples: 'openai', 'anthropic', 'workers-ai', 'groq'
 */
export type ProviderId = Brand<string, 'ProviderId'>

/**
 * Platform name - identifies a cloud platform
 * Examples: 'cloudflare', 'vercel', 'aws'
 */
export type PlatformName = Brand<string, 'PlatformName'>

/**
 * Binding name - identifies a Cloudflare binding
 * Examples: 'AI', 'CACHE', 'DB', 'STORAGE'
 */
export type BindingName = Brand<string, 'BindingName'>

/**
 * Version string - semantic version or tag
 * Examples: 'v1.0.0', 'production', 'latest'
 */
export type VersionString = Brand<string, 'VersionString'>

/**
 * Execution ID - uniquely identifies an execution
 * Format: exec_<uuid>
 * Examples: 'exec_550e8400-e29b-41d4-a716-446655440000'
 */
export type ExecutionId = Brand<string, 'ExecutionId'>

/**
 * Request ID - uniquely identifies an API request
 * Format: req_<uuid>
 * Examples: 'req_550e8400-e29b-41d4-a716-446655440000'
 */
export type RequestId = Brand<string, 'RequestId'>

/**
 * Resume Token - uniquely identifies a suspended execution
 * Format: resume_<uuid>
 * Examples: 'resume_550e8400-e29b-41d4-a716-446655440000'
 */
export type ResumeToken = Brand<string, 'ResumeToken'>

/**
 * Cache Key - identifies a cached value
 * Examples: 'agent:analyze:a1b2c3', 'query:d4e5f6'
 */
export type CacheKey = Brand<string, 'CacheKey'>

/**
 * Model ID validation and creation
 */
export const ModelId = {
  /**
   * Create a ModelId from a string
   * @throws {Error} if the model ID is invalid
   */
  create(value: string): ModelId {
    if (!value || value.trim().length === 0) {
      throw new Error('Model ID cannot be empty')
    }

    // Model IDs should not contain spaces
    if (value.includes(' ')) {
      throw new Error(`Invalid model ID format: "${value}" (contains spaces)`)
    }

    return value.trim() as ModelId
  },

  /**
   * Check if a string is a valid ModelId
   */
  isValid(value: string): boolean {
    return !!value && value.trim().length > 0 && !value.includes(' ')
  },

  /**
   * Safely create a ModelId, returning null if invalid
   */
  tryCreate(value: string): ModelId | null {
    try {
      return ModelId.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a ModelId back to a string
   */
  unwrap(modelId: ModelId): string {
    return modelId as string
  },
}

/**
 * Agent name validation and creation
 */
export const AgentName = {
  /**
   * Create an AgentName from a string
   * @throws {Error} if the agent name is invalid
   */
  create(value: string): AgentName {
    if (!value || value.trim().length === 0) {
      throw new Error('Agent name cannot be empty')
    }

    // Agent names must be lowercase alphanumeric with hyphens
    const normalized = value.trim()
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      throw new Error(
        `Invalid agent name format: "${value}" ` + `(must be lowercase alphanumeric with hyphens)`
      )
    }

    return normalized as AgentName
  },

  /**
   * Check if a string is a valid AgentName
   */
  isValid(value: string): boolean {
    return !!value && /^[a-z0-9-]+$/.test(value.trim())
  },

  /**
   * Safely create an AgentName, returning null if invalid
   */
  tryCreate(value: string): AgentName | null {
    try {
      return AgentName.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap an AgentName back to a string
   */
  unwrap(agentName: AgentName): string {
    return agentName as string
  },
}

/**
 * Ensemble name validation and creation
 */
export const EnsembleName = {
  /**
   * Create an EnsembleName from a string
   * @throws {Error} if the ensemble name is invalid
   */
  create(value: string): EnsembleName {
    if (!value || value.trim().length === 0) {
      throw new Error('Ensemble name cannot be empty')
    }

    // Ensemble names must be lowercase alphanumeric with hyphens
    const normalized = value.trim()
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      throw new Error(
        `Invalid ensemble name format: "${value}" ` +
          `(must be lowercase alphanumeric with hyphens)`
      )
    }

    return normalized as EnsembleName
  },

  /**
   * Check if a string is a valid EnsembleName
   */
  isValid(value: string): boolean {
    return !!value && /^[a-z0-9-]+$/.test(value.trim())
  },

  /**
   * Safely create an EnsembleName, returning null if invalid
   */
  tryCreate(value: string): EnsembleName | null {
    try {
      return EnsembleName.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap an EnsembleName back to a string
   */
  unwrap(ensembleName: EnsembleName): string {
    return ensembleName as string
  },
}

/**
 * Provider ID validation and creation
 */
export const ProviderId = {
  /**
   * Create a ProviderId from a string
   * @throws {Error} if the provider ID is invalid
   */
  create(value: string): ProviderId {
    if (!value || value.trim().length === 0) {
      throw new Error('Provider ID cannot be empty')
    }

    // Provider IDs must be lowercase alphanumeric with hyphens
    const normalized = value.trim().toLowerCase()
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      throw new Error(
        `Invalid provider ID format: "${value}" ` + `(must be lowercase alphanumeric with hyphens)`
      )
    }

    return normalized as ProviderId
  },

  /**
   * Check if a string is a valid ProviderId
   */
  isValid(value: string): boolean {
    return !!value && /^[a-z0-9-]+$/.test(value.trim().toLowerCase())
  },

  /**
   * Safely create a ProviderId, returning null if invalid
   */
  tryCreate(value: string): ProviderId | null {
    try {
      return ProviderId.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a ProviderId back to a string
   */
  unwrap(providerId: ProviderId): string {
    return providerId as string
  },
}

/**
 * Platform name validation and creation
 */
export const PlatformName = {
  /**
   * Create a PlatformName from a string
   * @throws {Error} if the platform name is invalid
   */
  create(value: string): PlatformName {
    if (!value || value.trim().length === 0) {
      throw new Error('Platform name cannot be empty')
    }

    const normalized = value.trim().toLowerCase()
    return normalized as PlatformName
  },

  /**
   * Check if a string is a valid PlatformName
   */
  isValid(value: string): boolean {
    return !!value && value.trim().length > 0
  },

  /**
   * Safely create a PlatformName, returning null if invalid
   */
  tryCreate(value: string): PlatformName | null {
    try {
      return PlatformName.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a PlatformName back to a string
   */
  unwrap(platformName: PlatformName): string {
    return platformName as string
  },
}

/**
 * Binding name validation and creation
 */
export const BindingName = {
  /**
   * Create a BindingName from a string
   * @throws {Error} if the binding name is invalid
   */
  create(value: string): BindingName {
    if (!value || value.trim().length === 0) {
      throw new Error('Binding name cannot be empty')
    }

    // Binding names are typically UPPER_CASE
    const normalized = value.trim()
    if (!/^[A-Z_][A-Z0-9_]*$/.test(normalized)) {
      throw new Error(
        `Invalid binding name format: "${value}" ` + `(must be UPPER_CASE with underscores)`
      )
    }

    return normalized as BindingName
  },

  /**
   * Check if a string is a valid BindingName
   */
  isValid(value: string): boolean {
    return !!value && /^[A-Z_][A-Z0-9_]*$/.test(value.trim())
  },

  /**
   * Safely create a BindingName, returning null if invalid
   */
  tryCreate(value: string): BindingName | null {
    try {
      return BindingName.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a BindingName back to a string
   */
  unwrap(bindingName: BindingName): string {
    return bindingName as string
  },
}

/**
 * Version string validation and creation
 */
export const VersionString = {
  /**
   * Create a VersionString from a string
   * @throws {Error} if the version string is invalid
   */
  create(value: string): VersionString {
    if (!value || value.trim().length === 0) {
      throw new Error('Version string cannot be empty')
    }

    return value.trim() as VersionString
  },

  /**
   * Check if a string is a valid VersionString
   */
  isValid(value: string): boolean {
    return !!value && value.trim().length > 0
  },

  /**
   * Safely create a VersionString, returning null if invalid
   */
  tryCreate(value: string): VersionString | null {
    try {
      return VersionString.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a VersionString back to a string
   */
  unwrap(versionString: VersionString): string {
    return versionString as string
  },
}

/**
 * Execution ID validation and creation
 */
export const ExecutionId = {
  /**
   * Create an ExecutionId from a string
   * @throws {Error} if the execution ID is invalid
   */
  create(value: string): ExecutionId {
    if (!value || value.trim().length === 0) {
      throw new Error('Execution ID cannot be empty')
    }

    const normalized = value.trim()
    if (!normalized.startsWith('exec_')) {
      throw new Error(`Invalid execution ID format: "${value}" (must start with 'exec_')`)
    }

    return normalized as ExecutionId
  },

  /**
   * Generate a new unique execution ID
   */
  generate(): ExecutionId {
    return `exec_${crypto.randomUUID()}` as ExecutionId
  },

  /**
   * Check if a string is a valid ExecutionId
   */
  isValid(value: string): boolean {
    return !!value && value.trim().startsWith('exec_')
  },

  /**
   * Safely create an ExecutionId, returning null if invalid
   */
  tryCreate(value: string): ExecutionId | null {
    try {
      return ExecutionId.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap an ExecutionId back to a string
   */
  unwrap(executionId: ExecutionId): string {
    return executionId as string
  },
}

/**
 * Request ID validation and creation
 */
export const RequestId = {
  /**
   * Create a RequestId from a string
   * @throws {Error} if the request ID is invalid
   */
  create(value: string): RequestId {
    if (!value || value.trim().length === 0) {
      throw new Error('Request ID cannot be empty')
    }

    const normalized = value.trim()
    if (!normalized.startsWith('req_')) {
      throw new Error(`Invalid request ID format: "${value}" (must start with 'req_')`)
    }

    return normalized as RequestId
  },

  /**
   * Generate a new unique request ID
   */
  generate(): RequestId {
    return `req_${crypto.randomUUID()}` as RequestId
  },

  /**
   * Check if a string is a valid RequestId
   */
  isValid(value: string): boolean {
    return !!value && value.trim().startsWith('req_')
  },

  /**
   * Safely create a RequestId, returning null if invalid
   */
  tryCreate(value: string): RequestId | null {
    try {
      return RequestId.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a RequestId back to a string
   */
  unwrap(requestId: RequestId): string {
    return requestId as string
  },
}

/**
 * Resume Token validation and creation
 */
export const ResumeToken = {
  /**
   * Create a ResumeToken from a string
   * @throws {Error} if the resume token is invalid
   */
  create(value: string): ResumeToken {
    if (!value || value.trim().length === 0) {
      throw new Error('Resume token cannot be empty')
    }

    const normalized = value.trim()
    if (!normalized.startsWith('resume_')) {
      throw new Error(`Invalid resume token format: "${value}" (must start with 'resume_')`)
    }

    return normalized as ResumeToken
  },

  /**
   * Generate a new unique resume token
   */
  generate(): ResumeToken {
    return `resume_${crypto.randomUUID()}` as ResumeToken
  },

  /**
   * Check if a string is a valid ResumeToken
   */
  isValid(value: string): boolean {
    return !!value && value.trim().startsWith('resume_')
  },

  /**
   * Safely create a ResumeToken, returning null if invalid
   */
  tryCreate(value: string): ResumeToken | null {
    try {
      return ResumeToken.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a ResumeToken back to a string
   */
  unwrap(resumeToken: ResumeToken): string {
    return resumeToken as string
  },
}

/**
 * Cache Key validation and creation
 */
export const CacheKey = {
  /**
   * Create a CacheKey from a string
   * @throws {Error} if the cache key is invalid
   */
  create(value: string): CacheKey {
    if (!value || value.trim().length === 0) {
      throw new Error('Cache key cannot be empty')
    }

    return value.trim() as CacheKey
  },

  /**
   * Generate a cache key from components
   */
  generate(prefix: string, ...parts: string[]): CacheKey {
    const key = [prefix, ...parts].join(':')
    return key as CacheKey
  },

  /**
   * Check if a string is a valid CacheKey
   */
  isValid(value: string): boolean {
    return !!value && value.trim().length > 0
  },

  /**
   * Safely create a CacheKey, returning null if invalid
   */
  tryCreate(value: string): CacheKey | null {
    try {
      return CacheKey.create(value)
    } catch {
      return null
    }
  },

  /**
   * Unwrap a CacheKey back to a string
   */
  unwrap(cacheKey: CacheKey): string {
    return cacheKey as string
  },
}
