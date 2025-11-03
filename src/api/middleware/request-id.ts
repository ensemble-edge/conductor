/**
 * Request ID Middleware
 *
 * Generates unique request ID for tracing and debugging.
 */

import type { MiddlewareHandler } from 'hono';
import type { ConductorContext } from '../types';

export function requestId(): MiddlewareHandler {
	return async (c: ConductorContext, next) => {
		// Check if request ID already exists in header
		let reqId = c.req.header('X-Request-ID');

		// Generate new ID if not present
		if (!reqId) {
			reqId = generateRequestId();
		}

		// Set in context
		c.set('requestId', reqId);

		// Set in response header
		c.header('X-Request-ID', reqId);

		await next();
	};
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 9);
	return `req_${timestamp}${random}`;
}
