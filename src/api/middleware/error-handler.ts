/**
 * Error Handler Middleware
 *
 * Catches and formats errors for consistent API responses.
 */

import type { MiddlewareHandler } from 'hono';
import type { ConductorContext, ErrorResponse } from '../types';
import { ConductorError } from '../../errors/error-types';
import { createLogger } from '../../observability';

const logger = createLogger({ serviceName: 'api-error-handler' });

export function errorHandler(): MiddlewareHandler {
	return async (c: ConductorContext, next) => {
		try {
			await next();
		} catch (error) {
			logger.error('API error caught by error handler', error instanceof Error ? error : undefined, {
				requestId: c.get('requestId')
			});

			// Get request ID if available
			const requestId = c.get('requestId');

			// Handle ConductorError
			if ((error as any) instanceof ConductorError) {
				const conductorError = error as ConductorError;
				const response: ErrorResponse = {
					error: conductorError.code,
					message: conductorError.message,
					code: conductorError.code,
					details: (conductorError as any).details,
					timestamp: Date.now(),
					requestId
				};

				const statusCode = getStatusCodeForError(conductorError);
				return c.json(response, statusCode as any);
			}

			// Handle generic errors
			const response: ErrorResponse = {
				error: 'InternalServerError',
				message: (error as Error).message || 'An unexpected error occurred',
				timestamp: Date.now(),
				requestId
			};

			return c.json(response, 500 as any);
		}
	};
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(error: ConductorError): number {
	const errorCodeMap: Record<string, number> = {
		ValidationError: 400,
		MemberNotFound: 404,
		ExecutionError: 500,
		TimeoutError: 504,
		RateLimitExceeded: 429,
		Unauthorized: 401,
		Forbidden: 403
	};

	return errorCodeMap[error.code] || 500;
}
