/**
 * Error Type Hierarchy
 *
 * Strongly-typed errors for the Conductor framework.
 * All errors extend ConductorError for consistent handling.
 */

import type { MemberName, ModelId, ProviderId, EnsembleName } from '../types/branded'

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  // Member errors (1xxx)
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  MEMBER_INVALID_CONFIG = 'MEMBER_INVALID_CONFIG',
  MEMBER_EXECUTION_FAILED = 'MEMBER_EXECUTION_FAILED',
  MEMBER_VALIDATION_FAILED = 'MEMBER_VALIDATION_FAILED',

  // Provider errors (2xxx)
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
  PROVIDER_API_ERROR = 'PROVIDER_API_ERROR',
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  PROVIDER_RATE_LIMIT = 'PROVIDER_RATE_LIMIT',

  // Platform errors (3xxx)
  PLATFORM_UNSUPPORTED = 'PLATFORM_UNSUPPORTED',
  PLATFORM_BINDING_MISSING = 'PLATFORM_BINDING_MISSING',
  PLATFORM_VALIDATION_FAILED = 'PLATFORM_VALIDATION_FAILED',

  // Model errors (4xxx)
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_DEPRECATED = 'MODEL_DEPRECATED',
  MODEL_EOL = 'MODEL_EOL',

  // Ensemble errors (5xxx)
  ENSEMBLE_NOT_FOUND = 'ENSEMBLE_NOT_FOUND',
  ENSEMBLE_PARSE_FAILED = 'ENSEMBLE_PARSE_FAILED',
  ENSEMBLE_VALIDATION_FAILED = 'ENSEMBLE_VALIDATION_FAILED',
  ENSEMBLE_EXECUTION_FAILED = 'ENSEMBLE_EXECUTION_FAILED',

  // State errors (6xxx)
  STATE_ACCESS_DENIED = 'STATE_ACCESS_DENIED',
  STATE_INVALID_KEY = 'STATE_INVALID_KEY',

  // Storage errors (7xxx)
  STORAGE_NOT_FOUND = 'STORAGE_NOT_FOUND',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_OPERATION_FAILED = 'STORAGE_OPERATION_FAILED',

  // Generic errors (9xxx)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Base error class for all Conductor errors
 */
export abstract class ConductorError extends Error {
  abstract readonly code: ErrorCode
  abstract readonly isOperational: boolean
  readonly details?: Record<string, unknown>

  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if ((Error as any).captureStackTrace) {
      ;(Error as any).captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): ErrorJSON {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      isOperational: this.isOperational,
      stack: this.stack,
    }
  }

  /**
   * Convert error to user-friendly message
   */
  abstract toUserMessage(): string
}

/**
 * Error JSON representation
 */
export interface ErrorJSON {
  name: string
  code: ErrorCode
  message: string
  isOperational: boolean
  stack?: string
}

// ============================================================================
// Member Errors
// ============================================================================

/**
 * Member not found in registry
 */
export class MemberNotFoundError extends ConductorError {
  readonly code = ErrorCode.MEMBER_NOT_FOUND
  readonly isOperational = true

  constructor(public readonly memberName: string) {
    super(`Member "${memberName}" not found in registry`)
  }

  toUserMessage(): string {
    return `The member "${this.memberName}" does not exist. Check your ensemble configuration.`
  }
}

/**
 * Member configuration is invalid
 */
export class MemberConfigurationError extends ConductorError {
  readonly code = ErrorCode.MEMBER_INVALID_CONFIG
  readonly isOperational = true

  constructor(
    public readonly memberName: string,
    public readonly reason: string
  ) {
    super(`Invalid configuration for member "${memberName}": ${reason}`)
  }

  toUserMessage(): string {
    return `Configuration error in member "${this.memberName}": ${this.reason}`
  }
}

/**
 * Member execution failed
 */
export class MemberExecutionError extends ConductorError {
  readonly code = ErrorCode.MEMBER_EXECUTION_FAILED
  readonly isOperational = true

  constructor(
    public readonly memberName: string,
    public readonly reason: string,
    public readonly cause?: Error
  ) {
    super(`Member "${memberName}" execution failed: ${reason}`)
  }

  toUserMessage(): string {
    return `Execution failed for member "${this.memberName}": ${this.reason}`
  }
}

/**
 * Member validation failed
 */
export class MemberValidationError extends ConductorError {
  readonly code = ErrorCode.MEMBER_VALIDATION_FAILED
  readonly isOperational = true

  constructor(
    public readonly memberName: string,
    public readonly errors: string[]
  ) {
    super(`Validation failed for member "${memberName}": ${errors.join(', ')}`)
  }

  toUserMessage(): string {
    return `Member "${this.memberName}" has validation errors:\n${this.errors.map((e) => `  - ${e}`).join('\n')}`
  }
}

// ============================================================================
// Provider Errors
// ============================================================================

/**
 * AI provider not found
 */
export class ProviderNotFoundError extends ConductorError {
  readonly code = ErrorCode.PROVIDER_NOT_FOUND
  readonly isOperational = true

  constructor(public readonly providerId: string) {
    super(`AI provider "${providerId}" not found`)
  }

  toUserMessage(): string {
    return `The AI provider "${this.providerId}" is not available. Check your provider configuration.`
  }
}

/**
 * Provider authentication failed
 */
export class ProviderAuthError extends ConductorError {
  readonly code = ErrorCode.PROVIDER_AUTH_FAILED
  readonly isOperational = true

  constructor(
    public readonly providerId: string,
    public readonly reason: string
  ) {
    super(`Authentication failed for provider "${providerId}": ${reason}`)
  }

  toUserMessage(): string {
    return `Authentication error with "${this.providerId}": ${this.reason}. Check your API keys.`
  }
}

/**
 * Provider API error
 */
export class ProviderAPIError extends ConductorError {
  readonly code = ErrorCode.PROVIDER_API_ERROR
  readonly isOperational = true

  constructor(
    public readonly providerId: string,
    public readonly statusCode: number,
    public readonly response: string
  ) {
    super(`API error from provider "${providerId}": ${statusCode} - ${response}`)
  }

  toUserMessage(): string {
    return `API error from "${this.providerId}" (HTTP ${this.statusCode}): ${this.response}`
  }
}

/**
 * Provider request timeout
 */
export class ProviderTimeoutError extends ConductorError {
  readonly code = ErrorCode.PROVIDER_TIMEOUT
  readonly isOperational = true

  constructor(
    public readonly providerId: string,
    public readonly timeoutMs: number
  ) {
    super(`Request to provider "${providerId}" timed out after ${timeoutMs}ms`)
  }

  toUserMessage(): string {
    return `Request to "${this.providerId}" timed out. The service may be slow or unavailable.`
  }
}

/**
 * Provider rate limit exceeded
 */
export class ProviderRateLimitError extends ConductorError {
  readonly code = ErrorCode.PROVIDER_RATE_LIMIT
  readonly isOperational = true

  constructor(
    public readonly providerId: string,
    public readonly retryAfter?: number
  ) {
    super(
      `Rate limit exceeded for provider "${providerId}"` +
        (retryAfter ? ` (retry after ${retryAfter}s)` : '')
    )
  }

  toUserMessage(): string {
    const retryMsg = this.retryAfter ? ` Please retry after ${this.retryAfter} seconds.` : ''
    return `Rate limit exceeded for "${this.providerId}".${retryMsg}`
  }
}

// ============================================================================
// Platform Errors
// ============================================================================

/**
 * Platform not supported
 */
export class PlatformUnsupportedError extends ConductorError {
  readonly code = ErrorCode.PLATFORM_UNSUPPORTED
  readonly isOperational = true

  constructor(public readonly platformName: string) {
    super(`Platform "${platformName}" is not supported`)
  }

  toUserMessage(): string {
    return `The platform "${this.platformName}" is not supported.`
  }
}

/**
 * Platform binding missing
 */
export class PlatformBindingMissingError extends ConductorError {
  readonly code = ErrorCode.PLATFORM_BINDING_MISSING
  readonly isOperational = true

  constructor(
    public readonly bindingName: string,
    public readonly hint?: string
  ) {
    super(`Binding "${bindingName}" not found` + (hint ? `: ${hint}` : ''))
  }

  toUserMessage(): string {
    return `Required binding "${this.bindingName}" is not configured. ${this.hint || 'Add it to wrangler.toml'}`
  }
}

// ============================================================================
// Model Errors
// ============================================================================

/**
 * Model not found
 */
export class ModelNotFoundError extends ConductorError {
  readonly code = ErrorCode.MODEL_NOT_FOUND
  readonly isOperational = true

  constructor(public readonly modelId: string) {
    super(`Model "${modelId}" not found in platform data`)
  }

  toUserMessage(): string {
    return `The model "${this.modelId}" is not available. Check the model ID or use a different model.`
  }
}

/**
 * Model is deprecated
 */
export class ModelDeprecatedError extends ConductorError {
  readonly code = ErrorCode.MODEL_DEPRECATED
  readonly isOperational = true

  constructor(
    public readonly modelId: string,
    public readonly reason?: string,
    public readonly replacement?: string
  ) {
    super(
      `Model "${modelId}" is deprecated` +
        (reason ? `: ${reason}` : '') +
        (replacement ? `. Use "${replacement}" instead` : '')
    )
  }

  toUserMessage(): string {
    let msg = `The model "${this.modelId}" is deprecated`
    if (this.reason) msg += `: ${this.reason}`
    if (this.replacement) msg += `. Please migrate to "${this.replacement}"`
    return msg
  }
}

/**
 * Model has reached end of life
 */
export class ModelEOLError extends ConductorError {
  readonly code = ErrorCode.MODEL_EOL
  readonly isOperational = true

  constructor(
    public readonly modelId: string,
    public readonly eolDate: string,
    public readonly replacement?: string
  ) {
    super(
      `Model "${modelId}" reached end of life on ${eolDate}` +
        (replacement ? `. Use "${replacement}" instead` : '')
    )
  }

  toUserMessage(): string {
    let msg = `The model "${this.modelId}" is no longer available (EOL: ${this.eolDate})`
    if (this.replacement) msg += `. Please use "${this.replacement}" instead`
    return msg
  }
}

// ============================================================================
// Ensemble Errors
// ============================================================================

/**
 * Ensemble not found
 */
export class EnsembleNotFoundError extends ConductorError {
  readonly code = ErrorCode.ENSEMBLE_NOT_FOUND
  readonly isOperational = true

  constructor(public readonly ensembleName: string) {
    super(`Ensemble "${ensembleName}" not found`)
  }

  toUserMessage(): string {
    return `The ensemble "${this.ensembleName}" does not exist.`
  }
}

/**
 * Ensemble parse error
 */
export class EnsembleParseError extends ConductorError {
  readonly code = ErrorCode.ENSEMBLE_PARSE_FAILED
  readonly isOperational = true

  constructor(
    public readonly ensembleName: string,
    public readonly reason: string
  ) {
    super(`Failed to parse ensemble "${ensembleName}": ${reason}`)
  }

  toUserMessage(): string {
    return `Syntax error in ensemble "${this.ensembleName}": ${this.reason}`
  }
}

/**
 * Ensemble validation error
 */
export class EnsembleValidationError extends ConductorError {
  readonly code = ErrorCode.ENSEMBLE_VALIDATION_FAILED
  readonly isOperational = true

  constructor(
    public readonly ensembleName: string,
    public readonly errors: string[]
  ) {
    super(`Validation failed for ensemble "${ensembleName}": ${errors.join(', ')}`)
  }

  toUserMessage(): string {
    return `Ensemble "${this.ensembleName}" has validation errors:\n${this.errors.map((e) => `  - ${e}`).join('\n')}`
  }
}

/**
 * Ensemble execution error
 */
export class EnsembleExecutionError extends ConductorError {
  readonly code = ErrorCode.ENSEMBLE_EXECUTION_FAILED
  readonly isOperational = true

  constructor(
    public readonly ensembleName: string,
    public readonly step: string,
    public readonly cause: Error
  ) {
    super(`Ensemble "${ensembleName}" failed at step "${step}": ${cause.message}`)
  }

  toUserMessage(): string {
    return `Execution failed in ensemble "${this.ensembleName}" at step "${this.step}": ${this.cause.message}`
  }
}

// ============================================================================
// Storage Errors
// ============================================================================

/**
 * Storage key not found
 */
export class StorageKeyNotFoundError extends ConductorError {
  readonly code = ErrorCode.STORAGE_NOT_FOUND
  readonly isOperational = true

  constructor(
    public readonly key: string,
    public readonly storageType: string
  ) {
    super(`Key "${key}" not found in ${storageType}`)
  }

  toUserMessage(): string {
    return `The key "${this.key}" does not exist in ${this.storageType} storage.`
  }
}

/**
 * Storage operation failed
 */
export class StorageOperationError extends ConductorError {
  readonly code = ErrorCode.STORAGE_OPERATION_FAILED
  readonly isOperational = true

  constructor(
    public readonly operation: string,
    public readonly key: string,
    public readonly cause: Error
  ) {
    super(`Storage operation "${operation}" failed for key "${key}": ${cause.message}`)
  }

  toUserMessage(): string {
    return `Storage operation failed: ${this.operation} on "${this.key}"`
  }
}

// ============================================================================
// Generic Errors
// ============================================================================

/**
 * Configuration error
 */
export class ConfigurationError extends ConductorError {
  readonly code = ErrorCode.CONFIGURATION_ERROR
  readonly isOperational = true

  constructor(public readonly reason: string) {
    super(`Configuration error: ${reason}`)
  }

  toUserMessage(): string {
    return `Configuration error: ${this.reason}`
  }
}

/**
 * Internal error (should not happen in production)
 */
export class InternalError extends ConductorError {
  readonly code = ErrorCode.INTERNAL_ERROR
  readonly isOperational = false // Non-operational - indicates a bug

  constructor(
    public readonly reason: string,
    public readonly cause?: Error
  ) {
    super(`Internal error: ${reason}`)
  }

  toUserMessage(): string {
    return `An unexpected error occurred. Please contact support.`
  }
}

/**
 * Error factory for common error scenarios
 */
export const Errors = {
  memberNotFound: (name: string) => new MemberNotFoundError(name),
  memberConfig: (name: string, reason: string) => new MemberConfigurationError(name, reason),
  memberExecution: (name: string, reason: string, cause?: Error) =>
    new MemberExecutionError(name, reason, cause),

  providerNotFound: (id: string) => new ProviderNotFoundError(id),
  providerAuth: (id: string, reason: string) => new ProviderAuthError(id, reason),
  providerAPI: (id: string, status: number, response: string) =>
    new ProviderAPIError(id, status, response),
  providerTimeout: (id: string, timeout: number) => new ProviderTimeoutError(id, timeout),

  modelNotFound: (id: string) => new ModelNotFoundError(id),
  modelDeprecated: (id: string, reason?: string, replacement?: string) =>
    new ModelDeprecatedError(id, reason, replacement),
  modelEOL: (id: string, eolDate: string, replacement?: string) =>
    new ModelEOLError(id, eolDate, replacement),

  ensembleNotFound: (name: string) => new EnsembleNotFoundError(name),
  ensembleParse: (name: string, reason: string) => new EnsembleParseError(name, reason),
  ensembleExecution: (name: string, step: string, cause: Error) =>
    new EnsembleExecutionError(name, step, cause),

  bindingMissing: (name: string, hint?: string) => new PlatformBindingMissingError(name, hint),

  storageNotFound: (key: string, storageType: string) =>
    new StorageKeyNotFoundError(key, storageType),

  config: (reason: string) => new ConfigurationError(reason),
  internal: (reason: string, cause?: Error) => new InternalError(reason, cause),
}
