/**
 * Cloud Logs Endpoint
 *
 * GET /cloud/logs
 *
 * Returns runtime logs. In production, this would read from
 * actual log storage. Currently returns stubbed data.
 */
import type { CloudEnv } from '../types.js';
/**
 * Handle logs request
 *
 * Query params:
 * - execution: filter by execution ID
 * - tail: if 'true', return only recent logs (for live tailing)
 * - level: filter by log level (debug, info, warn, error)
 * - limit: number of entries (default: 100, max: 500)
 */
export declare function handleLogs(request: Request, _env: CloudEnv): Promise<Response>;
//# sourceMappingURL=logs.d.ts.map