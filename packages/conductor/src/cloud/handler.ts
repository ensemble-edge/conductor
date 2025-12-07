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

import type { CloudEnv, CloudErrorResponse } from './types.js'
import { handleHealth } from './handlers/health.js'
import { handleStructure } from './handlers/structure.js'
import { handleExecutions } from './handlers/executions.js'
import { handleLogs } from './handlers/logs.js'
import { handleSync } from './handlers/sync.js'

/**
 * JSON error response helper
 */
function jsonError(error: string, status: number): Response {
  const body: CloudErrorResponse = { error }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Authenticate request using cloud key
 *
 * Security notes:
 * - Missing key returns 404 (endpoint not enabled, not 401)
 * - Invalid key returns 403 (not 401, to avoid enumeration)
 */
function authenticate(request: Request, env: CloudEnv): Response | null {
  // Check if cloud is enabled (key exists)
  if (!env.ENSEMBLE_CLOUD_KEY) {
    return jsonError('Cloud endpoint not enabled', 404)
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Missing authorization', 401)
  }

  // Validate key
  const providedKey = authHeader.slice(7) // Remove 'Bearer '
  if (providedKey !== env.ENSEMBLE_CLOUD_KEY) {
    return jsonError('Invalid cloud key', 403)
  }

  return null // Authenticated successfully
}

/**
 * Handle cloud request
 *
 * Routes /cloud/* requests to appropriate handlers after authentication.
 *
 * Note: /cloud/health is publicly accessible for CLI status checks by default.
 * When security.stealthMode is enabled in conductor.config.ts, /cloud/health
 * is hidden (returns 404) to prevent endpoint enumeration.
 */
export async function handleCloudRequest(
  request: Request,
  env: CloudEnv,
  _ctx: ExecutionContext
): Promise<Response> {
  // Route to handler based on path
  const url = new URL(request.url)
  const cloudPath = url.pathname.replace(/^\/cloud/, '') || '/'

  // Check if stealth mode is enabled
  const stealthMode = env.CONDUCTOR_STEALTH_MODE === 'true'

  // Allow unauthenticated GET to /health for CLI status checks
  // UNLESS stealth mode is enabled, which hides the health endpoint
  const isHealthCheck = (cloudPath === '/' || cloudPath === '/health') && request.method === 'GET'
  const allowPublicHealth = isHealthCheck && !stealthMode

  if (!allowPublicHealth) {
    // Authenticate all other requests (or health when stealth mode is on)
    const authError = authenticate(request, env)
    if (authError) {
      // In stealth mode, return generic 404 instead of auth errors
      if (stealthMode) {
        return jsonError('Not found', 404)
      }
      return authError
    }
  }

  // CORS headers for cloud requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://cloud.ensemble.ai',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle OPTIONS for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  let response: Response

  switch (cloudPath) {
    case '/':
    case '/health':
      response = await handleHealth(request, env)
      break

    case '/structure':
      response = await handleStructure(request, env)
      break

    case '/executions':
      response = await handleExecutions(request, env)
      break

    case '/logs':
      response = await handleLogs(request, env)
      break

    case '/sync':
      response = await handleSync(request, env)
      break

    default:
      response = jsonError('Not found', 404)
  }

  // Add CORS headers to response
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Check if a request is for the cloud endpoint
 *
 * Matches exactly /cloud or /cloud/* but not paths like /cloudflare
 */
export function isCloudRequest(request: Request): boolean {
  const url = new URL(request.url)
  const path = url.pathname
  return path === '/cloud' || path.startsWith('/cloud/')
}
