/**
 * Error Handler Middleware
 *
 * Catches and formats errors for consistent API responses.
 */
import { ConductorError } from '../../errors/error-types.js';
import { createLogger } from '../../observability/index.js';
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
            // Handle ConductorError
            if (error instanceof ConductorError) {
                const conductorError = error;
                const response = {
                    error: conductorError.code,
                    message: conductorError.message,
                    code: conductorError.code,
                    details: conductorError.details,
                    timestamp: Date.now(),
                    requestId,
                };
                const statusCode = getStatusCodeForError(conductorError);
                return c.json(response, statusCode);
            }
            // Handle generic errors
            const response = {
                error: 'InternalServerError',
                message: error.message || 'An unexpected error occurred',
                timestamp: Date.now(),
                requestId,
            };
            return c.json(response, 500);
        }
    };
}
/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(error) {
    const errorCodeMap = {
        ValidationError: 400,
        MemberNotFound: 404,
        ExecutionError: 500,
        TimeoutError: 504,
        RateLimitExceeded: 429,
        Unauthorized: 401,
        Forbidden: 403,
    };
    return errorCodeMap[error.code] || 500;
}
