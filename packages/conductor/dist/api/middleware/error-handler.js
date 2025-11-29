/**
 * Error Handler Middleware
 *
 * Catches and formats errors for consistent API responses.
 */
import { ConductorError, ErrorCode } from '../../errors/error-types.js';
import { createLogger } from '../../observability/index.js';
import { isProductionEnvironment, DEFAULT_SECURITY_CONFIG } from '../../config/security.js';
const logger = createLogger({ serviceName: 'api-error-handler' });
export function errorHandler() {
    return async (c, next) => {
        try {
            await next();
        }
        catch (error) {
            logger.error('API error caught by error handler', error instanceof Error ? error : undefined, {
                requestId: c.get('requestId'),
            });
            // Get request ID if available
            const requestId = c.get('requestId');
            // Check if we're in production (don't leak internal error details)
            // Uses configurable productionEnvironments from security config
            const securityConfig = c.get('securityConfig') || DEFAULT_SECURITY_CONFIG;
            const environment = c.env?.ENVIRONMENT;
            const isProduction = isProductionEnvironment(securityConfig, environment);
            // Handle ConductorError
            if (error instanceof ConductorError) {
                const statusCode = getStatusCodeForError(error);
                const response = {
                    error: error.code,
                    message: error.message,
                    code: error.code,
                    // Only include details in non-production or for client errors (4xx)
                    ...((!isProduction || statusCode < 500) && error.details && { details: error.details }),
                    timestamp: Date.now(),
                    requestId,
                };
                return c.json(response, statusCode);
            }
            // Handle generic errors - sanitize message in production
            const genericError = error;
            const response = {
                error: 'InternalServerError',
                message: isProduction
                    ? 'An unexpected error occurred'
                    : genericError.message || 'An unexpected error occurred',
                timestamp: Date.now(),
                requestId,
            };
            return c.json(response, 500);
        }
    };
}
/**
 * Map error codes to HTTP status codes
 *
 * Uses the ErrorCode enum values to ensure type safety and correct mappings.
 * Errors not explicitly mapped default to 500 Internal Server Error.
 */
function getStatusCodeForError(error) {
    const errorCodeMap = {
        // 400 Bad Request - Client sent invalid data
        [ErrorCode.VALIDATION_FAILED]: 400,
        [ErrorCode.MEMBER_INVALID_CONFIG]: 400,
        [ErrorCode.MEMBER_VALIDATION_FAILED]: 400,
        [ErrorCode.ENSEMBLE_VALIDATION_FAILED]: 400,
        [ErrorCode.ENSEMBLE_PARSE_FAILED]: 400,
        [ErrorCode.PLATFORM_VALIDATION_FAILED]: 400,
        [ErrorCode.STATE_INVALID_KEY]: 400,
        // 401 Unauthorized - Authentication required or failed
        [ErrorCode.PROVIDER_AUTH_FAILED]: 401,
        // 403 Forbidden - Authenticated but not authorized
        [ErrorCode.STATE_ACCESS_DENIED]: 403,
        [ErrorCode.STORAGE_ACCESS_DENIED]: 403,
        // 404 Not Found - Resource doesn't exist
        [ErrorCode.MEMBER_NOT_FOUND]: 404,
        [ErrorCode.PROVIDER_NOT_FOUND]: 404,
        [ErrorCode.MODEL_NOT_FOUND]: 404,
        [ErrorCode.ENSEMBLE_NOT_FOUND]: 404,
        [ErrorCode.STORAGE_NOT_FOUND]: 404,
        // 410 Gone - Resource no longer available
        [ErrorCode.MODEL_EOL]: 410,
        // 429 Too Many Requests - Rate limit exceeded
        [ErrorCode.PROVIDER_RATE_LIMIT]: 429,
        // 500 Internal Server Error - Server-side failures (default)
        [ErrorCode.MEMBER_EXECUTION_FAILED]: 500,
        [ErrorCode.PROVIDER_API_ERROR]: 500,
        [ErrorCode.ENSEMBLE_EXECUTION_FAILED]: 500,
        [ErrorCode.STORAGE_OPERATION_FAILED]: 500,
        [ErrorCode.CONFIGURATION_ERROR]: 500,
        [ErrorCode.INTERNAL_ERROR]: 500,
        [ErrorCode.PLATFORM_BINDING_MISSING]: 500,
        // 501 Not Implemented - Platform not supported
        [ErrorCode.PLATFORM_UNSUPPORTED]: 501,
        // 504 Gateway Timeout - Upstream timeout
        [ErrorCode.PROVIDER_TIMEOUT]: 504,
    };
    return errorCodeMap[error.code] ?? 500;
}
