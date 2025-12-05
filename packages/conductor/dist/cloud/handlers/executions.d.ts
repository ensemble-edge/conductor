/**
 * Cloud Executions Endpoint
 *
 * GET /cloud/executions
 *
 * Returns recent execution history. In production, this would read from
 * D1, KV, or Durable Objects. Currently returns stubbed data.
 */
import type { CloudEnv } from '../types.js';
/**
 * Handle executions list request
 *
 * Query params:
 * - limit: number of records (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * - ensemble: filter by ensemble name
 * - status: filter by status (success, error, running)
 * - since: ISO timestamp to filter from
 */
export declare function handleExecutions(request: Request, _env: CloudEnv): Promise<Response>;
//# sourceMappingURL=executions.d.ts.map