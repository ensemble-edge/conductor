/**
 * Error Type Hierarchy
 *
 * Strongly-typed errors for the Conductor framework.
 * All errors extend ConductorError for consistent handling.
 */
/**
 * Error codes for categorizing errors
 */
export var ErrorCode;
(function (ErrorCode) {
    // Agent errors (1xxx)
    ErrorCode["MEMBER_NOT_FOUND"] = "MEMBER_NOT_FOUND";
    ErrorCode["MEMBER_INVALID_CONFIG"] = "MEMBER_INVALID_CONFIG";
    ErrorCode["MEMBER_EXECUTION_FAILED"] = "MEMBER_EXECUTION_FAILED";
    ErrorCode["MEMBER_VALIDATION_FAILED"] = "MEMBER_VALIDATION_FAILED";
    // Provider errors (2xxx)
    ErrorCode["PROVIDER_NOT_FOUND"] = "PROVIDER_NOT_FOUND";
    ErrorCode["PROVIDER_AUTH_FAILED"] = "PROVIDER_AUTH_FAILED";
    ErrorCode["PROVIDER_API_ERROR"] = "PROVIDER_API_ERROR";
    ErrorCode["PROVIDER_TIMEOUT"] = "PROVIDER_TIMEOUT";
    ErrorCode["PROVIDER_RATE_LIMIT"] = "PROVIDER_RATE_LIMIT";
    // Platform errors (3xxx)
    ErrorCode["PLATFORM_UNSUPPORTED"] = "PLATFORM_UNSUPPORTED";
    ErrorCode["PLATFORM_BINDING_MISSING"] = "PLATFORM_BINDING_MISSING";
    ErrorCode["PLATFORM_VALIDATION_FAILED"] = "PLATFORM_VALIDATION_FAILED";
    // Model errors (4xxx)
    ErrorCode["MODEL_NOT_FOUND"] = "MODEL_NOT_FOUND";
    ErrorCode["MODEL_DEPRECATED"] = "MODEL_DEPRECATED";
    ErrorCode["MODEL_EOL"] = "MODEL_EOL";
    // Ensemble errors (5xxx)
    ErrorCode["ENSEMBLE_NOT_FOUND"] = "ENSEMBLE_NOT_FOUND";
    ErrorCode["ENSEMBLE_PARSE_FAILED"] = "ENSEMBLE_PARSE_FAILED";
    ErrorCode["ENSEMBLE_VALIDATION_FAILED"] = "ENSEMBLE_VALIDATION_FAILED";
    ErrorCode["ENSEMBLE_EXECUTION_FAILED"] = "ENSEMBLE_EXECUTION_FAILED";
    // State errors (6xxx)
    ErrorCode["STATE_ACCESS_DENIED"] = "STATE_ACCESS_DENIED";
    ErrorCode["STATE_INVALID_KEY"] = "STATE_INVALID_KEY";
    // Storage errors (7xxx)
    ErrorCode["STORAGE_NOT_FOUND"] = "STORAGE_NOT_FOUND";
    ErrorCode["STORAGE_ACCESS_DENIED"] = "STORAGE_ACCESS_DENIED";
    ErrorCode["STORAGE_OPERATION_FAILED"] = "STORAGE_OPERATION_FAILED";
    // Generic errors (9xxx)
    ErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    ErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * Base error class for all Conductor errors
 */
export class ConductorError extends Error {
    constructor(message, details) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        // Use type guard to safely check for V8-specific captureStackTrace
        if ('captureStackTrace' in Error && typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Convert error to JSON for logging/serialization
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            isOperational: this.isOperational,
            ...(this.details && { details: this.details }),
            stack: this.stack,
        };
    }
}
// ============================================================================
// Agent Errors
// ============================================================================
/**
 * Agent not found in registry
 */
export class MemberNotFoundError extends ConductorError {
    constructor(agentName) {
        super(`Agent "${agentName}" not found in registry`);
        this.agentName = agentName;
        this.code = ErrorCode.MEMBER_NOT_FOUND;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The agent "${this.agentName}" does not exist. Check your ensemble configuration.`;
    }
}
/**
 * Agent configuration is invalid
 */
export class MemberConfigurationError extends ConductorError {
    constructor(agentName, reason) {
        super(`Invalid configuration for agent "${agentName}": ${reason}`);
        this.agentName = agentName;
        this.reason = reason;
        this.code = ErrorCode.MEMBER_INVALID_CONFIG;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Configuration error in agent "${this.agentName}": ${this.reason}`;
    }
}
/**
 * Agent execution failed
 */
export class AgentExecutionError extends ConductorError {
    constructor(agentName, reason, cause) {
        super(`Agent "${agentName}" execution failed: ${reason}`);
        this.agentName = agentName;
        this.reason = reason;
        this.cause = cause;
        this.code = ErrorCode.MEMBER_EXECUTION_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Execution failed for agent "${this.agentName}": ${this.reason}`;
    }
}
/**
 * Agent validation failed
 */
export class MemberValidationError extends ConductorError {
    constructor(agentName, errors) {
        super(`Validation failed for agent "${agentName}": ${errors.join(', ')}`);
        this.agentName = agentName;
        this.errors = errors;
        this.code = ErrorCode.MEMBER_VALIDATION_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Agent "${this.agentName}" has validation errors:\n${this.errors.map((e) => `  - ${e}`).join('\n')}`;
    }
}
// ============================================================================
// Provider Errors
// ============================================================================
/**
 * AI provider not found
 */
export class ProviderNotFoundError extends ConductorError {
    constructor(providerId) {
        super(`AI provider "${providerId}" not found`);
        this.providerId = providerId;
        this.code = ErrorCode.PROVIDER_NOT_FOUND;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The AI provider "${this.providerId}" is not available. Check your provider configuration.`;
    }
}
/**
 * Provider authentication failed
 */
export class ProviderAuthError extends ConductorError {
    constructor(providerId, reason) {
        super(`Authentication failed for provider "${providerId}": ${reason}`);
        this.providerId = providerId;
        this.reason = reason;
        this.code = ErrorCode.PROVIDER_AUTH_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Authentication error with "${this.providerId}": ${this.reason}. Check your API keys.`;
    }
}
/**
 * Provider API error
 */
export class ProviderAPIError extends ConductorError {
    constructor(providerId, statusCode, response) {
        super(`API error from provider "${providerId}": ${statusCode} - ${response}`);
        this.providerId = providerId;
        this.statusCode = statusCode;
        this.response = response;
        this.code = ErrorCode.PROVIDER_API_ERROR;
        this.isOperational = true;
    }
    toUserMessage() {
        return `API error from "${this.providerId}" (HTTP ${this.statusCode}): ${this.response}`;
    }
}
/**
 * Provider request timeout
 */
export class ProviderTimeoutError extends ConductorError {
    constructor(providerId, timeoutMs) {
        super(`Request to provider "${providerId}" timed out after ${timeoutMs}ms`);
        this.providerId = providerId;
        this.timeoutMs = timeoutMs;
        this.code = ErrorCode.PROVIDER_TIMEOUT;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Request to "${this.providerId}" timed out. The service may be slow or unavailable.`;
    }
}
/**
 * Provider rate limit exceeded
 */
export class ProviderRateLimitError extends ConductorError {
    constructor(providerId, retryAfter) {
        super(`Rate limit exceeded for provider "${providerId}"` +
            (retryAfter ? ` (retry after ${retryAfter}s)` : ''));
        this.providerId = providerId;
        this.retryAfter = retryAfter;
        this.code = ErrorCode.PROVIDER_RATE_LIMIT;
        this.isOperational = true;
    }
    toUserMessage() {
        const retryMsg = this.retryAfter ? ` Please retry after ${this.retryAfter} seconds.` : '';
        return `Rate limit exceeded for "${this.providerId}".${retryMsg}`;
    }
}
// ============================================================================
// Platform Errors
// ============================================================================
/**
 * Platform not supported
 */
export class PlatformUnsupportedError extends ConductorError {
    constructor(platformName) {
        super(`Platform "${platformName}" is not supported`);
        this.platformName = platformName;
        this.code = ErrorCode.PLATFORM_UNSUPPORTED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The platform "${this.platformName}" is not supported.`;
    }
}
/**
 * Platform binding missing
 */
export class PlatformBindingMissingError extends ConductorError {
    constructor(bindingName, hint) {
        super(`Binding "${bindingName}" not found` + (hint ? `: ${hint}` : ''));
        this.bindingName = bindingName;
        this.hint = hint;
        this.code = ErrorCode.PLATFORM_BINDING_MISSING;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Required binding "${this.bindingName}" is not configured. ${this.hint || 'Add it to wrangler.toml'}`;
    }
}
// ============================================================================
// Model Errors
// ============================================================================
/**
 * Model not found
 */
export class ModelNotFoundError extends ConductorError {
    constructor(modelId) {
        super(`Model "${modelId}" not found in platform data`);
        this.modelId = modelId;
        this.code = ErrorCode.MODEL_NOT_FOUND;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The model "${this.modelId}" is not available. Check the model ID or use a different model.`;
    }
}
/**
 * Model is deprecated
 */
export class ModelDeprecatedError extends ConductorError {
    constructor(modelId, reason, replacement) {
        super(`Model "${modelId}" is deprecated` +
            (reason ? `: ${reason}` : '') +
            (replacement ? `. Use "${replacement}" instead` : ''));
        this.modelId = modelId;
        this.reason = reason;
        this.replacement = replacement;
        this.code = ErrorCode.MODEL_DEPRECATED;
        this.isOperational = true;
    }
    toUserMessage() {
        let msg = `The model "${this.modelId}" is deprecated`;
        if (this.reason)
            msg += `: ${this.reason}`;
        if (this.replacement)
            msg += `. Please migrate to "${this.replacement}"`;
        return msg;
    }
}
/**
 * Model has reached end of life
 */
export class ModelEOLError extends ConductorError {
    constructor(modelId, eolDate, replacement) {
        super(`Model "${modelId}" reached end of life on ${eolDate}` +
            (replacement ? `. Use "${replacement}" instead` : ''));
        this.modelId = modelId;
        this.eolDate = eolDate;
        this.replacement = replacement;
        this.code = ErrorCode.MODEL_EOL;
        this.isOperational = true;
    }
    toUserMessage() {
        let msg = `The model "${this.modelId}" is no longer available (EOL: ${this.eolDate})`;
        if (this.replacement)
            msg += `. Please use "${this.replacement}" instead`;
        return msg;
    }
}
// ============================================================================
// Ensemble Errors
// ============================================================================
/**
 * Ensemble not found
 */
export class EnsembleNotFoundError extends ConductorError {
    constructor(ensembleName) {
        super(`Ensemble "${ensembleName}" not found`);
        this.ensembleName = ensembleName;
        this.code = ErrorCode.ENSEMBLE_NOT_FOUND;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The ensemble "${this.ensembleName}" does not exist.`;
    }
}
/**
 * Ensemble parse error
 */
export class EnsembleParseError extends ConductorError {
    constructor(ensembleName, reason) {
        super(`Failed to parse ensemble "${ensembleName}": ${reason}`);
        this.ensembleName = ensembleName;
        this.reason = reason;
        this.code = ErrorCode.ENSEMBLE_PARSE_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Syntax error in ensemble "${this.ensembleName}": ${this.reason}`;
    }
}
/**
 * Ensemble validation error
 */
export class EnsembleValidationError extends ConductorError {
    constructor(ensembleName, errors) {
        super(`Validation failed for ensemble "${ensembleName}": ${errors.join(', ')}`);
        this.ensembleName = ensembleName;
        this.errors = errors;
        this.code = ErrorCode.ENSEMBLE_VALIDATION_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Ensemble "${this.ensembleName}" has validation errors:\n${this.errors.map((e) => `  - ${e}`).join('\n')}`;
    }
}
/**
 * Ensemble execution error
 */
export class EnsembleExecutionError extends ConductorError {
    constructor(ensembleName, step, cause) {
        super(`Ensemble "${ensembleName}" failed at step "${step}": ${cause.message}`);
        this.ensembleName = ensembleName;
        this.step = step;
        this.cause = cause;
        this.code = ErrorCode.ENSEMBLE_EXECUTION_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Execution failed in ensemble "${this.ensembleName}" at step "${this.step}": ${this.cause.message}`;
    }
}
// ============================================================================
// Storage Errors
// ============================================================================
/**
 * Storage key not found
 */
export class StorageKeyNotFoundError extends ConductorError {
    constructor(key, storageType) {
        super(`Key "${key}" not found in ${storageType}`);
        this.key = key;
        this.storageType = storageType;
        this.code = ErrorCode.STORAGE_NOT_FOUND;
        this.isOperational = true;
    }
    toUserMessage() {
        return `The key "${this.key}" does not exist in ${this.storageType} storage.`;
    }
}
/**
 * Storage operation failed
 */
export class StorageOperationError extends ConductorError {
    constructor(operation, key, cause) {
        super(`Storage operation "${operation}" failed for key "${key}": ${cause.message}`);
        this.operation = operation;
        this.key = key;
        this.cause = cause;
        this.code = ErrorCode.STORAGE_OPERATION_FAILED;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Storage operation failed: ${this.operation} on "${this.key}"`;
    }
}
// ============================================================================
// Generic Errors
// ============================================================================
/**
 * Configuration error
 */
export class ConfigurationError extends ConductorError {
    constructor(reason) {
        super(`Configuration error: ${reason}`);
        this.reason = reason;
        this.code = ErrorCode.CONFIGURATION_ERROR;
        this.isOperational = true;
    }
    toUserMessage() {
        return `Configuration error: ${this.reason}`;
    }
}
/**
 * Internal error (should not happen in production)
 */
export class InternalError extends ConductorError {
    constructor(reason, cause) {
        super(`Internal error: ${reason}`);
        this.reason = reason;
        this.cause = cause;
        this.code = ErrorCode.INTERNAL_ERROR;
        this.isOperational = false; // Non-operational - indicates a bug
    }
    toUserMessage() {
        return `An unexpected error occurred. Please contact support.`;
    }
}
/**
 * Error factory for common error scenarios
 */
export const Errors = {
    /** @deprecated Use agentNotFound instead */
    memberNotFound: (name) => new MemberNotFoundError(name),
    agentNotFound: (name) => new MemberNotFoundError(name),
    agentConfig: (name, reason) => new MemberConfigurationError(name, reason),
    memberExecution: (name, reason, cause) => new AgentExecutionError(name, reason, cause),
    providerNotFound: (id) => new ProviderNotFoundError(id),
    providerAuth: (id, reason) => new ProviderAuthError(id, reason),
    providerAPI: (id, status, response) => new ProviderAPIError(id, status, response),
    providerTimeout: (id, timeout) => new ProviderTimeoutError(id, timeout),
    modelNotFound: (id) => new ModelNotFoundError(id),
    modelDeprecated: (id, reason, replacement) => new ModelDeprecatedError(id, reason, replacement),
    modelEOL: (id, eolDate, replacement) => new ModelEOLError(id, eolDate, replacement),
    ensembleNotFound: (name) => new EnsembleNotFoundError(name),
    ensembleParse: (name, reason) => new EnsembleParseError(name, reason),
    ensembleExecution: (name, step, cause) => new EnsembleExecutionError(name, step, cause),
    bindingMissing: (name, hint) => new PlatformBindingMissingError(name, hint),
    storageNotFound: (key, storageType) => new StorageKeyNotFoundError(key, storageType),
    config: (reason) => new ConfigurationError(reason),
    internal: (reason, cause) => new InternalError(reason, cause),
};
