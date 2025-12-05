/**
 * Cloud Health Endpoint
 *
 * GET /cloud/health
 *
 * Returns the health status of the cloud connection.
 */

import type { CloudEnv, CloudHealthResponse } from '../types.js'

/**
 * Handle health check request
 */
export async function handleHealth(
  _request: Request,
  env: CloudEnv
): Promise<Response> {
  const response: CloudHealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: env.CONDUCTOR_VERSION || '1.0.0',
  }

  return Response.json(response)
}
