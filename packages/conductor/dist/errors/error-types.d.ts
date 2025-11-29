/**
 * Error Type Hierarchy
 *
 * Strongly-typed errors for the Conductor framework.
 * All errors extend ConductorError for consistent handling.
 */
/**
 * Error codes for categorizing errors
 */
export declare enum ErrorCode {
    MEMBER_NOT_FOUND = "MEMBER_NOT_FOUND",
    MEMBER_INVALID_CONFIG = "MEMBER_INVALID_CONFIG",
    MEMBER_EXECUTION_FAILED = "MEMBER_EXECUTION_FAILED",
    MEMBER_VALIDATION_FAILED = "MEMBER_VALIDATION_FAILED",
    PROVIDER_NOT_FOUND = "PROVIDER_NOT_FOUND",
    PROVIDER_AUTH_FAILED = "PROVIDER_AUTH_FAILED",
    PROVIDER_API_ERROR = "PROVIDER_API_ERROR",
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT",
    PROVIDER_RATE_LIMIT = "PROVIDER_RATE_LIMIT",
    PLATFORM_UNSUPPORTED = "PLATFORM_UNSUPPORTED",
    PLATFORM_BINDING_MISSING = "PLATFORM_BINDING_MISSING",
    PLATFORM_VALIDATION_FAILED = "PLATFORM_VALIDATION_FAILED",
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    MODEL_DEPRECATED = "MODEL_DEPRECATED",
    MODEL_EOL = "MODEL_EOL",
    ENSEMBLE_NOT_FOUND = "ENSEMBLE_NOT_FOUND",
    ENSEMBLE_PARSE_FAILED = "ENSEMBLE_PARSE_FAILED",
    ENSEMBLE_VALIDATION_FAILED = "ENSEMBLE_VALIDATION_FAILED",
    ENSEMBLE_EXECUTION_FAILED = "ENSEMBLE_EXECUTION_FAILED",
    STATE_ACCESS_DENIED = "STATE_ACCESS_DENIED",
    STATE_INVALID_KEY = "STATE_INVALID_KEY",
    STORAGE_NOT_FOUND = "STORAGE_NOT_FOUND",
    STORAGE_ACCESS_DENIED = "STORAGE_ACCESS_DENIED",
    STORAGE_OPERATION_FAILED = "STORAGE_OPERATION_FAILED",
    VALIDATION_FAILED = "VALIDATION_FAILED",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
/**
 * Base error class for all Conductor errors
 */
export declare abstract class ConductorError extends Error {
    abstract readonly code: ErrorCode;
    abstract readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    constructor(message: string, details?: Record<string, unknown>);
    /**
     * Convert error to JSON for logging/serialization
     */
    toJSON(): ErrorJSON;
    /**
     * Convert error to user-friendly message
     */
    abstract toUserMessage(): string;
}
/**
 * Error JSON representation
 */
export interface ErrorJSON {
    name: string;
    code: ErrorCode;
    message: string;
    isOperational: boolean;
    details?: Record<string, unknown>;
    stack?: string;
}
/**
 * Agent not found in registry
 */
export declare class MemberNotFoundError extends ConductorError {
    readonly agentName: string;
    readonly code = ErrorCode.MEMBER_NOT_FOUND;
    readonly isOperational = true;
    constructor(agentName: string);
    toUserMessage(): string;
}
/**
 * Agent configuration is invalid
 */
export declare class MemberConfigurationError extends ConductorError {
    readonly agentName: string;
    readonly reason: string;
    readonly code = ErrorCode.MEMBER_INVALID_CONFIG;
    readonly isOperational = true;
    constructor(agentName: string, reason: string);
    toUserMessage(): string;
}
/**
 * Agent execution failed
 */
export declare class AgentExecutionError extends ConductorError {
    readonly agentName: string;
    readonly reason: string;
    readonly cause?: Error | undefined;
    readonly code = ErrorCode.MEMBER_EXECUTION_FAILED;
    readonly isOperational = true;
    constructor(agentName: string, reason: string, cause?: Error | undefined);
    toUserMessage(): string;
}
/**
 * Agent validation failed
 */
export declare class MemberValidationError extends ConductorError {
    readonly agentName: string;
    readonly errors: string[];
    readonly code = ErrorCode.MEMBER_VALIDATION_FAILED;
    readonly isOperational = true;
    constructor(agentName: string, errors: string[]);
    toUserMessage(): string;
}
/**
 * AI provider not found
 */
export declare class ProviderNotFoundError extends ConductorError {
    readonly providerId: string;
    readonly code = ErrorCode.PROVIDER_NOT_FOUND;
    readonly isOperational = true;
    constructor(providerId: string);
    toUserMessage(): string;
}
/**
 * Provider authentication failed
 */
export declare class ProviderAuthError extends ConductorError {
    readonly providerId: string;
    readonly reason: string;
    readonly code = ErrorCode.PROVIDER_AUTH_FAILED;
    readonly isOperational = true;
    constructor(providerId: string, reason: string);
    toUserMessage(): string;
}
/**
 * Provider API error
 */
export declare class ProviderAPIError extends ConductorError {
    readonly providerId: string;
    readonly statusCode: number;
    readonly response: string;
    readonly code = ErrorCode.PROVIDER_API_ERROR;
    readonly isOperational = true;
    constructor(providerId: string, statusCode: number, response: string);
    toUserMessage(): string;
}
/**
 * Provider request timeout
 */
export declare class ProviderTimeoutError extends ConductorError {
    readonly providerId: string;
    readonly timeoutMs: number;
    readonly code = ErrorCode.PROVIDER_TIMEOUT;
    readonly isOperational = true;
    constructor(providerId: string, timeoutMs: number);
    toUserMessage(): string;
}
/**
 * Provider rate limit exceeded
 */
export declare class ProviderRateLimitError extends ConductorError {
    readonly providerId: string;
    readonly retryAfter?: number | undefined;
    readonly code = ErrorCode.PROVIDER_RATE_LIMIT;
    readonly isOperational = true;
    constructor(providerId: string, retryAfter?: number | undefined);
    toUserMessage(): string;
}
/**
 * Platform not supported
 */
export declare class PlatformUnsupportedError extends ConductorError {
    readonly platformName: string;
    readonly code = ErrorCode.PLATFORM_UNSUPPORTED;
    readonly isOperational = true;
    constructor(platformName: string);
    toUserMessage(): string;
}
/**
 * Platform binding missing
 */
export declare class PlatformBindingMissingError extends ConductorError {
    readonly bindingName: string;
    readonly hint?: string | undefined;
    readonly code = ErrorCode.PLATFORM_BINDING_MISSING;
    readonly isOperational = true;
    constructor(bindingName: string, hint?: string | undefined);
    toUserMessage(): string;
}
/**
 * Model not found
 */
export declare class ModelNotFoundError extends ConductorError {
    readonly modelId: string;
    readonly code = ErrorCode.MODEL_NOT_FOUND;
    readonly isOperational = true;
    constructor(modelId: string);
    toUserMessage(): string;
}
/**
 * Model is deprecated
 */
export declare class ModelDeprecatedError extends ConductorError {
    readonly modelId: string;
    readonly reason?: string | undefined;
    readonly replacement?: string | undefined;
    readonly code = ErrorCode.MODEL_DEPRECATED;
    readonly isOperational = true;
    constructor(modelId: string, reason?: string | undefined, replacement?: string | undefined);
    toUserMessage(): string;
}
/**
 * Model has reached end of life
 */
export declare class ModelEOLError extends ConductorError {
    readonly modelId: string;
    readonly eolDate: string;
    readonly replacement?: string | undefined;
    readonly code = ErrorCode.MODEL_EOL;
    readonly isOperational = true;
    constructor(modelId: string, eolDate: string, replacement?: string | undefined);
    toUserMessage(): string;
}
/**
 * Ensemble not found
 */
export declare class EnsembleNotFoundError extends ConductorError {
    readonly ensembleName: string;
    readonly code = ErrorCode.ENSEMBLE_NOT_FOUND;
    readonly isOperational = true;
    constructor(ensembleName: string);
    toUserMessage(): string;
}
/**
 * Ensemble parse error
 */
export declare class EnsembleParseError extends ConductorError {
    readonly ensembleName: string;
    readonly reason: string;
    readonly code = ErrorCode.ENSEMBLE_PARSE_FAILED;
    readonly isOperational = true;
    constructor(ensembleName: string, reason: string);
    toUserMessage(): string;
}
/**
 * Ensemble validation error
 */
export declare class EnsembleValidationError extends ConductorError {
    readonly ensembleName: string;
    readonly errors: string[];
    readonly code = ErrorCode.ENSEMBLE_VALIDATION_FAILED;
    readonly isOperational = true;
    constructor(ensembleName: string, errors: string[]);
    toUserMessage(): string;
}
/**
 * Ensemble execution error
 */
export declare class EnsembleExecutionError extends ConductorError {
    readonly ensembleName: string;
    readonly step: string;
    readonly cause: Error;
    readonly code = ErrorCode.ENSEMBLE_EXECUTION_FAILED;
    readonly isOperational = true;
    constructor(ensembleName: string, step: string, cause: Error);
    toUserMessage(): string;
}
/**
 * Storage key not found
 */
export declare class StorageKeyNotFoundError extends ConductorError {
    readonly key: string;
    readonly storageType: string;
    readonly code = ErrorCode.STORAGE_NOT_FOUND;
    readonly isOperational = true;
    constructor(key: string, storageType: string);
    toUserMessage(): string;
}
/**
 * Storage operation failed
 */
export declare class StorageOperationError extends ConductorError {
    readonly operation: string;
    readonly key: string;
    readonly cause: Error;
    readonly code = ErrorCode.STORAGE_OPERATION_FAILED;
    readonly isOperational = true;
    constructor(operation: string, key: string, cause: Error);
    toUserMessage(): string;
}
/**
 * Configuration error
 */
export declare class ConfigurationError extends ConductorError {
    readonly reason: string;
    readonly code = ErrorCode.CONFIGURATION_ERROR;
    readonly isOperational = true;
    constructor(reason: string);
    toUserMessage(): string;
}
/**
 * Internal error (should not happen in production)
 */
export declare class InternalError extends ConductorError {
    readonly reason: string;
    readonly cause?: Error | undefined;
    readonly code = ErrorCode.INTERNAL_ERROR;
    readonly isOperational = false;
    constructor(reason: string, cause?: Error | undefined);
    toUserMessage(): string;
}
/**
 * Error factory for common error scenarios
 */
export declare const Errors: {
    /** @deprecated Use agentNotFound instead */
    memberNotFound: (name: string) => MemberNotFoundError;
    agentNotFound: (name: string) => MemberNotFoundError;
    agentConfig: (name: string, reason: string) => MemberConfigurationError;
    memberExecution: (name: string, reason: string, cause?: Error) => AgentExecutionError;
    providerNotFound: (id: string) => ProviderNotFoundError;
    providerAuth: (id: string, reason: string) => ProviderAuthError;
    providerAPI: (id: string, status: number, response: string) => ProviderAPIError;
    providerTimeout: (id: string, timeout: number) => ProviderTimeoutError;
    modelNotFound: (id: string) => ModelNotFoundError;
    modelDeprecated: (id: string, reason?: string, replacement?: string) => ModelDeprecatedError;
    modelEOL: (id: string, eolDate: string, replacement?: string) => ModelEOLError;
    ensembleNotFound: (name: string) => EnsembleNotFoundError;
    ensembleParse: (name: string, reason: string) => EnsembleParseError;
    ensembleExecution: (name: string, step: string, cause: Error) => EnsembleExecutionError;
    bindingMissing: (name: string, hint?: string) => PlatformBindingMissingError;
    storageNotFound: (key: string, storageType: string) => StorageKeyNotFoundError;
    config: (reason: string) => ConfigurationError;
    internal: (reason: string, cause?: Error) => InternalError;
};
//# sourceMappingURL=error-types.d.ts.map