/**
 * Ensemble Cloud Handler
 *
 * Main request handler for the /cloud/* endpoints.
 * Handles authentication and routes to specific handlers.
 *
 * Architecture:
 * - Cloud reads project state via /cloud endpoint
 * - Changes are pushed through GitHub (not direct API writes)
 * - Worker trusts Cloud (has the key)
 * - Worker doesn't know actual user identity - Cloud handles that
 */
import type { CloudEnv } from './types.js';
/**
 * Handle cloud request
 *
 * Routes /cloud/* requests to appropriate handlers after authentication.
 */
export declare function handleCloudRequest(request: Request, env: CloudEnv, _ctx: ExecutionContext): Promise<Response>;
/**
 * Check if a request is for the cloud endpoint
 */
export declare function isCloudRequest(request: Request): boolean;
//# sourceMappingURL=handler.d.ts.map