/**
 * Request ID Middleware
 *
 * Generates unique request ID for tracing and debugging.
 * Uses branded RequestId type for compile-time safety.
 */
import { RequestId } from '../../types/branded.js';
export function requestId() {
    return async (c, next) => {
        // Check if request ID already exists in header
        const headerReqId = c.req.header('X-Request-ID');
        // Generate new ID if not present, or validate existing one
        let reqId;
        if (headerReqId && RequestId.isValid(headerReqId)) {
            reqId = RequestId.create(headerReqId);
        }
        else {
            reqId = RequestId.generate();
        }
        // Set in context (branded type)
        c.set('requestId', reqId);
        // Set in response header (unwrap to string for HTTP)
        c.header('X-Request-ID', RequestId.unwrap(reqId));
        await next();
    };
}
