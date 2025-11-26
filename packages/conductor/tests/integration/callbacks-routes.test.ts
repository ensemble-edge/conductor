/**
 * Callbacks Routes Integration Tests
 *
 * Tests for the /callback/* routes (HITL workflow resumption)
 *
 * Simplified design:
 * - POST /callback/:token - Resume with body { approved: true/false, ... }
 * - GET  /callback/:token - Get token metadata
 *
 * These routes use token-based auth (the token IS the authentication).
 * Base path is configurable via APIConfig.hitl.resumeBasePath
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import callbacks from '../../src/api/routes/callbacks.js'

// Create a test app with mock env
function createTestApp(env: Record<string, unknown> = {}) {
  const app = new Hono<{ Bindings: typeof env }>()

  // Mock env middleware
  app.use('*', async (c, next) => {
    // @ts-ignore - env binding for tests
    c.env = env
    await next()
  })

  // Mount callbacks routes at /callback (default base path)
  app.route('/callback', callbacks)

  return app
}

describe('Callbacks Routes', () => {
  describe('POST /callback/:token - Resume execution', () => {
    it('should return 500 when HITL_STATE binding not configured', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/test-token-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('HITLState Durable Object not configured')
      expect(body.message).toContain('HITL_STATE binding')
    })

    it('should accept empty body (defaults to approved)', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/test-token-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      // Should fail with 500 (not configured) not 400 (bad request)
      expect(res.status).toBe(500)
    })

    it('should accept approval with feedback', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/test-token-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          feedback: 'Looks good!',
          approver: 'jane@example.com',
        }),
      })

      // Should fail with 500 (not configured) showing it parsed the body
      expect(res.status).toBe(500)
    })

    it('should accept rejection with reason', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/test-token-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: false,
          reason: 'Does not meet quality standards',
          feedback: 'Please revise the introduction',
        }),
      })

      // Should fail with 500 (not configured) showing body was parsed
      expect(res.status).toBe(500)
    })
  })

  describe('GET /callback/:token - Get metadata', () => {
    it('should return 500 when HITL_STATE binding not configured', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/test-token-123', {
        method: 'GET',
      })

      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('HITLState Durable Object not configured')
    })

    it('should be a GET endpoint (no body required)', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/my-token', {
        method: 'GET',
      })

      // GET requests don't need body
      expect(res.status).toBe(500) // fails at DO binding check, not body parsing
    })
  })

  describe('Token-based authentication', () => {
    it('should not require API key authentication', async () => {
      const app = createTestApp({})

      // No Authorization header, no X-API-Key header
      const res = await app.request('/callback/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      // Should reach the handler (fail at DO binding), not 401
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).not.toBe('Unauthorized')
    })

    it('should use token from URL path', async () => {
      const app = createTestApp({})

      // Token is in the URL path, not headers
      const res = await app.request('/callback/my-secret-token-abc123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      // Reaches handler, fails at DO binding check
      expect(res.status).toBe(500)
      const body = await res.json()
      // Token extraction works (handler received request)
      expect(body.error).toBe('HITLState Durable Object not configured')
    })
  })

  describe('Route structure', () => {
    it('should have POST /callback/:token for resumption', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/token123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).not.toBe(404)
    })

    it('should have GET /callback/:token for metadata', async () => {
      const app = createTestApp({})

      const res = await app.request('/callback/token123', {
        method: 'GET',
      })

      expect(res.status).not.toBe(404)
    })

    it('should return 404 for nested paths', async () => {
      const app = createTestApp({})

      // The simplified design doesn't have /approve/token sub-paths
      // /callback/approve/token123 is a 404 since our route is /callback/:token (single segment)
      const res = await app.request('/callback/approve/token123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(404) // nested paths not supported
    })

    it('should accept various token formats', async () => {
      const app = createTestApp({})

      // UUID-style tokens
      const res1 = await app.request('/callback/resume_550e8400-e29b-41d4-a716-446655440000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      expect(res1.status).toBe(500) // not 404

      // Short tokens
      const res2 = await app.request('/callback/abc123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      expect(res2.status).toBe(500) // not 404
    })
  })

  describe('Configurable base path', () => {
    it('can be mounted at custom path (e.g., /resume)', async () => {
      const app = new Hono()
      app.use('*', async (c, next) => {
        // @ts-ignore
        c.env = {}
        await next()
      })
      // Mount at custom path
      app.route('/resume', callbacks)

      const res = await app.request('/resume/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      expect(res.status).toBe(500) // reaches handler, not 404
    })

    it('can be mounted at nested path (e.g., /api/callback)', async () => {
      const app = new Hono()
      app.use('*', async (c, next) => {
        // @ts-ignore
        c.env = {}
        await next()
      })
      // Mount at nested path
      app.route('/api/callback', callbacks)

      const res = await app.request('/api/callback/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      expect(res.status).toBe(500) // reaches handler, not 404
    })
  })
})
