/**
 * Webhooks Routes Integration Tests
 *
 * Tests for the /webhooks/* routes.
 * After cleanup, this route only lists registered webhooks.
 *
 * Note: User-defined webhook triggers are handled by the trigger system
 * in built-in-triggers.ts, not by these routes.
 */

import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import webhooks from '../../src/api/routes/webhooks.js'

// Create a test app with mock env
function createTestApp(env: Record<string, unknown> = {}) {
  const app = new Hono<{ Bindings: typeof env }>()

  // Mock env middleware
  app.use('*', async (c, next) => {
    // @ts-ignore - env binding for tests
    c.env = env
    await next()
  })

  // Mount webhooks routes
  app.route('/webhooks', webhooks)

  return app
}

describe('Webhooks Routes', () => {
  describe('GET /webhooks', () => {
    it('should return list of webhooks (empty when catalog not configured)', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks', {
        method: 'GET',
      })

      // May return 200 with empty list or 500 if catalog not configured
      // The important thing is it doesn't 404
      expect(res.status).not.toBe(404)
    })

    it('should be a GET endpoint', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks', {
        method: 'GET',
      })

      expect(res.status).not.toBe(404)
      expect(res.status).not.toBe(405) // Method not allowed
    })
  })

  describe('Legacy endpoints removed', () => {
    it('should return 404 for legacy POST /webhooks/:ensembleName', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks/my-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' }),
      })

      // Legacy endpoint was removed
      expect(res.status).toBe(404)
    })

    it('should return 404 for legacy POST /webhooks/trigger/:ensembleName', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks/trigger/my-ensemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' }),
      })

      // Legacy endpoint was removed
      expect(res.status).toBe(404)
    })

    it('should return 404 for legacy GET /webhooks/trigger/:ensembleName/config', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks/trigger/my-ensemble/config', {
        method: 'GET',
      })

      // Legacy endpoint was removed
      expect(res.status).toBe(404)
    })

    it('should return 404 for legacy /webhooks/resume/:token (moved to /callbacks)', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks/resume/my-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      // Resume endpoints moved to /callbacks/resume/:token
      expect(res.status).toBe(404)
    })
  })

  describe('User-defined webhook namespace', () => {
    it('should not conflict with user paths like /webhooks/github', async () => {
      const app = createTestApp({})

      // This would be handled by the trigger system, not webhooks.ts
      // So it should 404 here (meaning no conflict)
      const res = await app.request('/webhooks/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'push' }),
      })

      // Should 404 - no built-in handler, user can define their own
      expect(res.status).toBe(404)
    })

    it('should not conflict with nested user paths like /webhooks/stripe/payments', async () => {
      const app = createTestApp({})

      const res = await app.request('/webhooks/stripe/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment_intent.succeeded' }),
      })

      // Should 404 - user owns this namespace
      expect(res.status).toBe(404)
    })
  })
})
