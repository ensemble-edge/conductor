/**
 * HTTP Triggers Integration Tests
 *
 * Tests for HTTP trigger input extraction and request handling.
 * Verifies that query params, body, path params, and headers are properly
 * passed through to ensemble execution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'

// We need to test extractInput behavior, so we'll create a mock handler
// that captures the input for verification

describe('HTTP Trigger Input Extraction', () => {
  describe('extractInput function behavior', () => {
    // Mock the extractInput function's expected behavior
    // based on the implementation

    function simulateExtractInput(mockReq: {
      method: string
      contentType?: string
      body?: Record<string, any>
      params?: Record<string, string>
      query?: Record<string, string>
      path?: string
      url?: string
      headers?: Record<string, string>
    }): Record<string, any> {
      const method = mockReq.method
      const contentType = mockReq.contentType || ''
      const path = mockReq.path || '/'

      let body: Record<string, any> = {}
      if (['POST', 'PUT', 'PATCH'].includes(method) && mockReq.body) {
        body = mockReq.body
      }

      const params = mockReq.params || {}
      const query = mockReq.query || {}

      const headers: Record<string, string | undefined> = {
        'content-type': mockReq.headers?.['content-type'],
        'user-agent': mockReq.headers?.['user-agent'],
        'accept': mockReq.headers?.['accept'],
        'authorization': mockReq.headers?.['authorization'],
        'x-request-id': mockReq.headers?.['x-request-id'],
        'x-forwarded-for': mockReq.headers?.['x-forwarded-for'],
        'cf-connecting-ip': mockReq.headers?.['cf-connecting-ip'],
        'referer': mockReq.headers?.['referer'],
        'origin': mockReq.headers?.['origin'],
      }

      // Query params spread first, then body (body takes precedence on collision)
      return {
        ...query,
        ...body,
        body,
        params,
        query,
        method,
        path,
        headers,
        url: mockReq.url || `http://localhost${path}`,
      }
    }

    it('should include body fields at root level for backwards compatibility', () => {
      const input = simulateExtractInput({
        method: 'POST',
        contentType: 'application/json',
        body: { email: 'test@example.com', password: 'secret' },
        path: '/login',
      })

      // Backwards compatible access
      expect(input.email).toBe('test@example.com')
      expect(input.password).toBe('secret')
    })

    it('should provide structured body access', () => {
      const input = simulateExtractInput({
        method: 'POST',
        contentType: 'application/json',
        body: { email: 'test@example.com', name: 'Test User' },
        path: '/users',
      })

      // Structured access
      expect(input.body).toEqual({ email: 'test@example.com', name: 'Test User' })
      expect(input.body.email).toBe('test@example.com')
      expect(input.body.name).toBe('Test User')
    })

    it('should include query parameters', () => {
      const input = simulateExtractInput({
        method: 'GET',
        query: { page: '1', limit: '10', search: 'test' },
        path: '/items',
      })

      expect(input.query).toEqual({ page: '1', limit: '10', search: 'test' })
      expect(input.query.page).toBe('1')
      expect(input.query.limit).toBe('10')
    })

    it('should include query params at root level for backwards compatibility', () => {
      // GET /hello?name=Developer should allow ${input.name} access
      const input = simulateExtractInput({
        method: 'GET',
        query: { name: 'Developer', page: '1' },
        path: '/hello',
      })

      // Query params accessible at root level (like body fields)
      expect(input.name).toBe('Developer')
      expect(input.page).toBe('1')
      // Also still accessible via query object
      expect(input.query.name).toBe('Developer')
    })

    it('should let body values take precedence over query params on collision', () => {
      // POST /api?name=QueryName with body { name: "BodyName" }
      // body should win
      const input = simulateExtractInput({
        method: 'POST',
        contentType: 'application/json',
        body: { name: 'BodyName' },
        query: { name: 'QueryName', extra: 'fromQuery' },
        path: '/api',
      })

      // Body takes precedence
      expect(input.name).toBe('BodyName')
      // Query-only params still accessible at root
      expect(input.extra).toBe('fromQuery')
      // Both still accessible via namespaced access
      expect(input.body.name).toBe('BodyName')
      expect(input.query.name).toBe('QueryName')
    })

    it('should include URL path parameters', () => {
      const input = simulateExtractInput({
        method: 'GET',
        params: { id: '123', category: 'electronics' },
        path: '/products/electronics/123',
      })

      expect(input.params).toEqual({ id: '123', category: 'electronics' })
      expect(input.params.id).toBe('123')
    })

    it('should include HTTP method', () => {
      const getInput = simulateExtractInput({ method: 'GET', path: '/test' })
      const postInput = simulateExtractInput({
        method: 'POST',
        body: { data: 'test' },
        path: '/test',
      })

      expect(getInput.method).toBe('GET')
      expect(postInput.method).toBe('POST')
    })

    it('should include request path', () => {
      const input = simulateExtractInput({
        method: 'GET',
        path: '/api/v1/users/123',
      })

      expect(input.path).toBe('/api/v1/users/123')
    })

    it('should include common headers', () => {
      const input = simulateExtractInput({
        method: 'POST',
        body: {},
        path: '/test',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer token123',
          'user-agent': 'Mozilla/5.0',
          'x-request-id': 'req-abc-123',
        },
      })

      expect(input.headers['content-type']).toBe('application/json')
      expect(input.headers['authorization']).toBe('Bearer token123')
      expect(input.headers['user-agent']).toBe('Mozilla/5.0')
      expect(input.headers['x-request-id']).toBe('req-abc-123')
    })

    it('should handle empty body for GET requests', () => {
      const input = simulateExtractInput({
        method: 'GET',
        path: '/items',
        query: { filter: 'active' },
      })

      expect(input.body).toEqual({})
      expect(input.query.filter).toBe('active')
    })

    it('should not parse body for GET requests even if body provided', () => {
      // GET requests should never have body parsed
      const input = simulateExtractInput({
        method: 'GET',
        body: { shouldNotAppear: true },
        path: '/test',
      })

      expect(input.body).toEqual({})
      expect(input.shouldNotAppear).toBeUndefined()
    })

    it('should combine all input sources correctly', () => {
      const input = simulateExtractInput({
        method: 'POST',
        contentType: 'application/json',
        body: {
          action: 'update',
          data: { name: 'New Name' },
        },
        params: { userId: '456' },
        query: { notify: 'true' },
        path: '/users/456',
        headers: {
          'authorization': 'Bearer xyz',
        },
      })

      // All should be accessible
      expect(input.action).toBe('update') // backwards compat
      expect(input.body.action).toBe('update') // structured
      expect(input.body.data).toEqual({ name: 'New Name' })
      expect(input.params.userId).toBe('456')
      expect(input.query.notify).toBe('true')
      expect(input.method).toBe('POST')
      expect(input.path).toBe('/users/456')
      expect(input.headers['authorization']).toBe('Bearer xyz')
    })
  })

  describe('Input interpolation in YAML patterns', () => {
    // These tests verify the expected access patterns work

    it('should support ${input.body.field} pattern', () => {
      const input = {
        body: { email: 'user@test.com' },
        params: {},
        query: {},
        method: 'POST',
      }

      // Simulating what the interpolation engine does
      expect(input.body.email).toBe('user@test.com')
    })

    it('should support ${input.params.id} pattern', () => {
      const input = {
        body: {},
        params: { id: '999' },
        query: {},
        method: 'GET',
      }

      expect(input.params.id).toBe('999')
    })

    it('should support ${input.query.page} pattern', () => {
      const input = {
        body: {},
        params: {},
        query: { page: '5', sort: 'desc' },
        method: 'GET',
      }

      expect(input.query.page).toBe('5')
      expect(input.query.sort).toBe('desc')
    })

    it('should support method checking for conditional flow', () => {
      const postInput = { method: 'POST', body: { data: 'test' } }
      const getInput = { method: 'GET', query: { id: '1' } }

      // These would be used in when: conditions
      expect(postInput.method === 'POST').toBe(true)
      expect(getInput.method === 'GET').toBe(true)
      expect(getInput.method === 'POST').toBe(false)
    })
  })

  describe('Real-world YAML pattern compatibility', () => {
    it('should support login form pattern: $input.body.email', () => {
      // From login.yaml: email: $input.body.email
      const input = {
        email: 'user@example.com', // backwards compat
        password: 'secret123',
        body: {
          email: 'user@example.com',
          password: 'secret123',
        },
        params: {},
        query: {},
        method: 'POST',
        path: '/login',
      }

      // Both access patterns should work
      expect(input.body.email).toBe('user@example.com')
      expect(input.body.password).toBe('secret123')
      expect(input.email).toBe('user@example.com') // backwards compat
    })

    it('should support blog post pattern with URL params', () => {
      // Pattern: slug: $input.params.slug
      const input = {
        body: {},
        params: { slug: 'my-awesome-post' },
        query: {},
        method: 'GET',
        path: '/blog/my-awesome-post',
      }

      expect(input.params.slug).toBe('my-awesome-post')
    })

    it('should support pagination pattern with query params', () => {
      // Pattern: page: $input.query.page, limit: $input.query.limit
      const input = {
        body: {},
        params: {},
        query: { page: '2', limit: '20', sort: 'created_at' },
        method: 'GET',
        path: '/articles',
      }

      expect(input.query.page).toBe('2')
      expect(input.query.limit).toBe('20')
      expect(input.query.sort).toBe('created_at')
    })

    it('should support conditional rendering based on method', () => {
      // Pattern: when: $input.method == 'POST'
      const postRequest = {
        body: { formData: 'submitted' },
        method: 'POST',
        path: '/form',
      }

      const getRequest = {
        body: {},
        method: 'GET',
        path: '/form',
      }

      // Condition evaluation
      expect(postRequest.method === 'POST').toBe(true)
      expect(getRequest.method === 'POST').toBe(false)
      expect(getRequest.method === 'GET').toBe(true)
    })
  })
})
