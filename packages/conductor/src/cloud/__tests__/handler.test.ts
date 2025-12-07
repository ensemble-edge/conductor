/**
 * Cloud Handler Tests
 *
 * Tests for /cloud/* endpoint routing and authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCloudRequest, isCloudRequest } from '../handler.js'
import type { CloudEnv } from '../types.js'

// Mock ExecutionContext
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext

// Helper to create test request
function createRequest(path: string, options: RequestInit = {}): Request {
  return new Request(`https://example.com${path}`, options)
}

describe('isCloudRequest', () => {
  it('should return true for /cloud paths', () => {
    expect(isCloudRequest(createRequest('/cloud'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/health'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/structure'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/executions'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/logs'))).toBe(true)
    expect(isCloudRequest(createRequest('/cloud/sync'))).toBe(true)
  })

  it('should return false for non-cloud paths', () => {
    expect(isCloudRequest(createRequest('/'))).toBe(false)
    expect(isCloudRequest(createRequest('/api/v1/execute'))).toBe(false)
    expect(isCloudRequest(createRequest('/health'))).toBe(false)
    expect(isCloudRequest(createRequest('/cloudflare'))).toBe(false)
  })
})

describe('handleCloudRequest', () => {
  describe('authentication', () => {
    it('should return 404 when cloud key is not set', async () => {
      const env: CloudEnv = { AI: {} } as CloudEnv
      const request = createRequest('/cloud/health')

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(404)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Cloud endpoint not enabled')
    })

    it('should return 401 when Authorization header is missing', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      // Use /cloud/structure which requires authentication (not health which is public)
      const request = createRequest('/cloud/structure')

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(401)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Missing authorization')
    })

    it('should return 401 when Authorization header is not Bearer', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud/structure', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      })

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(401)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Missing authorization')
    })

    it('should return 403 when cloud key is invalid', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud/structure', {
        headers: { Authorization: 'Bearer wrong_key' },
      })

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(403)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Invalid cloud key')
    })

    it('should succeed with valid cloud key', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud/health', {
        headers: { Authorization: 'Bearer eck_live_secret123' },
      })

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
    })
  })

  describe('public health endpoint', () => {
    it('should allow unauthenticated GET to /cloud/health when cloud is enabled', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud/health')

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { status: string }
      expect(body.status).toBe('ok')
    })

    it('should allow unauthenticated GET to /cloud when cloud is enabled', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud')

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { status: string }
      expect(body.status).toBe('ok')
    })

    it('should return 404 for public health when cloud is not enabled', async () => {
      const env: CloudEnv = { AI: {} } as CloudEnv
      const request = createRequest('/cloud/health')

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(404)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Cloud endpoint not enabled')
    })

    it('should still require auth for POST to /cloud/health', async () => {
      const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_secret123' } as CloudEnv
      const request = createRequest('/cloud/health', { method: 'POST' })

      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(401)
    })
  })

  describe('routing', () => {
    const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_test' } as CloudEnv
    const authHeaders = { Authorization: 'Bearer eck_live_test' }

    it('should route /cloud to health endpoint', async () => {
      const request = createRequest('/cloud', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { status: string }
      expect(body.status).toBe('ok')
    })

    it('should route /cloud/health to health endpoint', async () => {
      const request = createRequest('/cloud/health', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { status: string; timestamp: string }
      expect(body.status).toBe('ok')
      expect(body.timestamp).toBeDefined()
    })

    it('should route /cloud/structure to structure endpoint', async () => {
      const request = createRequest('/cloud/structure', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { project: { name: string }; agents: unknown[] }
      expect(body.project).toBeDefined()
      expect(body.agents).toBeDefined()
    })

    it('should route /cloud/executions to executions endpoint', async () => {
      const request = createRequest('/cloud/executions', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: unknown[]; total: number }
      expect(body.items).toBeDefined()
      expect(body.total).toBeDefined()
    })

    it('should route /cloud/logs to logs endpoint', async () => {
      const request = createRequest('/cloud/logs', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { entries: unknown[] }
      expect(body.entries).toBeDefined()
    })

    it('should route /cloud/sync to sync endpoint with POST', async () => {
      const request = createRequest('/cloud/sync', {
        method: 'POST',
        headers: authHeaders,
      })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(200)
      const body = (await response.json()) as { status: string; message: string }
      expect(body.status).toBe('ok')
      expect(body.message).toContain('Sync triggered')
    })

    it('should return 405 for non-POST sync requests', async () => {
      const request = createRequest('/cloud/sync', {
        method: 'GET',
        headers: authHeaders,
      })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(405)
    })

    it('should return 404 for unknown cloud paths', async () => {
      const request = createRequest('/cloud/unknown', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(404)
      const body = (await response.json()) as { error: string }
      expect(body.error).toBe('Not found')
    })
  })

  describe('CORS', () => {
    const env: CloudEnv = { AI: {}, ENSEMBLE_CLOUD_KEY: 'eck_live_test' } as CloudEnv
    const authHeaders = { Authorization: 'Bearer eck_live_test' }

    it('should handle OPTIONS preflight requests', async () => {
      const request = createRequest('/cloud/health', {
        method: 'OPTIONS',
        headers: authHeaders,
      })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://cloud.ensemble.ai')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should include CORS headers in responses', async () => {
      const request = createRequest('/cloud/health', { headers: authHeaders })
      const response = await handleCloudRequest(request, env, mockCtx)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://cloud.ensemble.ai')
    })
  })
})
