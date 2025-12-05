/**
 * Cloud Sync Endpoint
 *
 * POST /cloud/sync
 *
 * Triggers a sync/refresh operation. This can be called by Cloud
 * to notify the worker of configuration changes pushed via GitHub.
 */
import type { CloudEnv } from '../types.js';
/**
 * Handle sync request
 *
 * This endpoint is called by Ensemble Cloud when:
 * - GitHub push triggers a deploy
 * - Manual refresh is requested
 * - Component versions are updated
 *
 * In production, this might:
 * - Clear caches
 * - Reload configuration
 * - Notify connected clients
 */
export declare function handleSync(request: Request, _env: CloudEnv): Promise<Response>;
//# sourceMappingURL=sync.d.ts.map