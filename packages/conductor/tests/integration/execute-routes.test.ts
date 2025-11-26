/**
 * Execute Routes Integration Tests
 *
 * Tests for the /api/v1/execute/* routes including:
 * - POST /api/v1/execute/ensemble/:name
 * - POST /api/v1/execute/agent/:name
 * - POST /api/v1/execute (legacy body-based)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import execute from '../../src/api/routes/execute.js'
import { initSecurityConfig } from '../../src/config/security.js'

// Create a test app
function createTestApp() {
  const app = new Hono()

  // Mock requestId middleware
  app.use('*', async (c, next) => {
    c.set('requestId', 'test-request-id')
    await next()
  })

  // Mount execute routes at /api/v1/execute
  app.route('/api/v1/execute', execute)

  return app
}

describe('Execute Routes', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    app = createTestApp()
    // Reset security config to defaults
    initSecurityConfig({
      requireAuth: true,
      allowDirectAgentExecution: true,
      autoPermissions: false,
    })
  })

  describe('POST /api/v1/execute/ensemble/:name', () => {
    it('should return 503 when ensemble loader not initialized', async () => {
      const res = await app.request('/api/v1/execute/ensemble/test-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })

      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('NotInitialized')
    })

    it('should accept empty body for ensembles', async () => {
      const res = await app.request('/api/v1/execute/ensemble/test-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      // Should fail with 503 (not initialized) not 400 (bad request)
      expect(res.status).toBe(503)
    })
  })

  describe('POST /api/v1/execute/agent/:name', () => {
    it('should return 400 when input is missing', async () => {
      const res = await app.request('/api/v1/execute/agent/http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('ValidationError')
      expect(body.message).toBe('Input is required')
    })

    it('should return 403 when direct agent execution is disabled', async () => {
      initSecurityConfig({ allowDirectAgentExecution: false })

      const res = await app.request('/api/v1/execute/agent/http', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { url: 'https://example.com' } }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('Forbidden')
      expect(body.message).toContain('Direct agent execution is disabled')
    })
  })

  describe('POST /api/v1/execute (legacy)', () => {
    it('should return 400 when neither agent nor ensemble provided', async () => {
      const res = await app.request('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('ValidationError')
      expect(body.message).toBe('Either agent or ensemble name is required')
    })

    it('should return 400 when agent specified without input', async () => {
      const res = await app.request('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'http' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('ValidationError')
      expect(body.message).toBe('Input is required')
    })

    it('should delegate to ensemble execution when ensemble provided', async () => {
      const res = await app.request('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensemble: 'test-ensemble', input: {} }),
      })

      // Should fail with 503 (not initialized) showing it reached ensemble execution
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('NotInitialized')
    })
  })

  describe('POST /api/v1/execute/:ensembleName (legacy URL pattern)', () => {
    it('should return 400 for invalid ensemble name (empty via /ensemble route)', async () => {
      // POST /api/v1/execute/ensemble hits /ensemble/:name where :name would be empty
      // This is handled by the /ensemble/:name route which returns 400 for invalid names
      const res = await app.request('/api/v1/execute/ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })

      // The route returns 400 because no ensemble name is provided in the path
      expect(res.status).toBe(400)
    })

    it('should execute ensemble by name in URL', async () => {
      const res = await app.request('/api/v1/execute/my-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      })

      // Should fail with 503 (not initialized) showing it reached ensemble execution
      expect(res.status).toBe(503)
    })
  })
})
