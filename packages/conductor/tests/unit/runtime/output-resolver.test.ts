/**
 * Output Resolver Unit Tests
 *
 * Tests conditional output resolution, HTTP response building,
 * redirects, headers, and raw body responses.
 */

import { describe, it, expect } from 'vitest'
import {
  resolveOutput,
  buildHttpResponse,
  isRedirectOutput,
  isRawBodyOutput,
  type ResolvedOutput,
} from '../../../src/runtime/output-resolver.js'

describe('resolveOutput', () => {
  describe('basic output resolution', () => {
    it('should return 200 when no output defined', () => {
      const result = resolveOutput(undefined, {})
      expect(result.status).toBe(200)
    })

    it('should resolve simple body output', () => {
      const output = {
        message: '${greeting}',
      }

      const result = resolveOutput(output, { greeting: 'Hello, World!' })

      expect(result.status).toBe(200)
      expect(result.body).toEqual({ message: 'Hello, World!' })
    })

    it('should resolve nested object interpolations', () => {
      const output = {
        user: {
          name: '${user.name}',
          email: '${user.email}',
        },
        status: '${status}',
      }

      const context = {
        user: { name: 'Alice', email: 'alice@example.com' },
        status: 'active',
      }

      const result = resolveOutput(output, context)

      expect(result.body).toEqual({
        user: {
          name: 'Alice',
          email: 'alice@example.com',
        },
        status: 'active',
      })
    })
  })

  describe('conditional output blocks', () => {
    it('should match first block without when clause', () => {
      const output = [{ status: 200, body: { result: 'default' } }]

      const result = resolveOutput(output, {})

      expect(result.status).toBe(200)
      expect(result.body).toEqual({ result: 'default' })
    })

    it('should match when condition is true', () => {
      const output = [
        { when: '${found}', status: 200, body: { data: '${result}' } },
        { status: 404, body: { error: 'not_found' } },
      ]

      const result = resolveOutput(output, { found: true, result: 'data' })

      expect(result.status).toBe(200)
      expect(result.body).toEqual({ data: 'data' })
    })

    it('should fall through to default when condition is false', () => {
      const output = [
        { when: '${found}', status: 200, body: { data: '${result}' } },
        { status: 404, body: { error: 'not_found' } },
      ]

      const result = resolveOutput(output, { found: false })

      expect(result.status).toBe(404)
      expect(result.body).toEqual({ error: 'not_found' })
    })

    it('should evaluate string equality conditions', () => {
      const output = [
        { when: "${status} == 'active'", status: 200, body: { active: true } },
        { when: "${status} == 'pending'", status: 202, body: { pending: true } },
        { status: 400, body: { unknown: true } },
      ]

      const result = resolveOutput(output, { status: 'pending' })

      expect(result.status).toBe(202)
      expect(result.body).toEqual({ pending: true })
    })

    it('should evaluate numeric comparisons', () => {
      const output = [
        { when: '${count} > 0', status: 200, body: { hasItems: true } },
        { status: 204, body: { empty: true } },
      ]

      const result1 = resolveOutput(output, { count: 5 })
      expect(result1.status).toBe(200)

      const result2 = resolveOutput(output, { count: 0 })
      expect(result2.status).toBe(204)
    })

    it('should evaluate inequality conditions', () => {
      const output = [
        { when: "${status} != 'deleted'", status: 200, body: { exists: true } },
        { status: 410, body: { deleted: true } },
      ]

      const result1 = resolveOutput(output, { status: 'active' })
      expect(result1.status).toBe(200)

      const result2 = resolveOutput(output, { status: 'deleted' })
      expect(result2.status).toBe(410)
    })
  })

  describe('status codes', () => {
    it('should use specified status code', () => {
      const output = [{ status: 201, body: { created: true } }]

      const result = resolveOutput(output, {})

      expect(result.status).toBe(201)
    })

    it('should default to 200 when status not specified', () => {
      const output = [{ body: { data: 'test' } }]

      const result = resolveOutput(output, {})

      expect(result.status).toBe(200)
    })

    it('should support all HTTP status codes', () => {
      const testCases = [
        { status: 200, name: 'OK' },
        { status: 201, name: 'Created' },
        { status: 204, name: 'No Content' },
        { status: 301, name: 'Moved Permanently' },
        { status: 400, name: 'Bad Request' },
        { status: 401, name: 'Unauthorized' },
        { status: 403, name: 'Forbidden' },
        { status: 404, name: 'Not Found' },
        { status: 500, name: 'Internal Server Error' },
      ]

      for (const { status } of testCases) {
        const output = [{ status, body: {} }]
        const result = resolveOutput(output, {})
        expect(result.status).toBe(status)
      }
    })
  })

  describe('headers', () => {
    it('should resolve custom headers', () => {
      const output = [
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'max-age=3600',
          },
          body: '<h1>Hello</h1>',
        },
      ]

      const result = resolveOutput(output, {})

      expect(result.headers).toEqual({
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=3600',
      })
    })

    it('should interpolate header values', () => {
      const output = [
        {
          status: 200,
          headers: {
            'X-Request-Id': '${requestId}',
            'X-User-Id': '${user.id}',
          },
          body: {},
        },
      ]

      const context = { requestId: 'req-123', user: { id: 'user-456' } }
      const result = resolveOutput(output, context)

      expect(result.headers).toEqual({
        'X-Request-Id': 'req-123',
        'X-User-Id': 'user-456',
      })
    })
  })

  describe('redirects', () => {
    it('should resolve redirect output', () => {
      const output = [
        {
          redirect: {
            url: '/new-location',
            status: 301,
          },
        },
      ]

      const result = resolveOutput(output, {})

      expect(result.redirect).toBeDefined()
      expect(result.redirect!.url).toBe('/new-location')
      expect(result.redirect!.status).toBe(301)
    })

    it('should interpolate redirect URL', () => {
      const output = [
        {
          redirect: {
            url: '/users/${userId}/profile',
          },
        },
      ]

      const result = resolveOutput(output, { userId: '123' })

      expect(result.redirect!.url).toBe('/users/123/profile')
    })

    it('should default redirect status to 302', () => {
      const output = [
        {
          redirect: {
            url: '/temp-redirect',
          },
        },
      ]

      const result = resolveOutput(output, {})

      expect(result.redirect!.status).toBeUndefined()
      // The buildHttpResponse function defaults to 302
    })
  })

  describe('raw body', () => {
    it('should resolve raw body output', () => {
      const output = [
        {
          status: 200,
          rawBody: 'Plain text response',
        },
      ]

      const result = resolveOutput(output, {})

      expect(result.rawBody).toBe('Plain text response')
      expect(result.body).toBeUndefined()
    })

    it('should interpolate raw body', () => {
      const output = [
        {
          status: 200,
          rawBody: 'Hello, ${name}!',
        },
      ]

      const result = resolveOutput(output, { name: 'World' })

      expect(result.rawBody).toBe('Hello, World!')
    })
  })
})

describe('buildHttpResponse', () => {
  it('should build JSON response', () => {
    const output: ResolvedOutput = {
      status: 200,
      body: { message: 'Hello' },
    }

    const response = buildHttpResponse(output)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should build response with custom headers', () => {
    const output: ResolvedOutput = {
      status: 200,
      headers: {
        'X-Custom': 'value',
        'Cache-Control': 'no-cache',
      },
      body: {},
    }

    const response = buildHttpResponse(output)

    expect(response.headers.get('X-Custom')).toBe('value')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
  })

  it('should build redirect response', () => {
    const output: ResolvedOutput = {
      status: 200,
      redirect: {
        url: '/new-location',
        status: 301,
      },
    }

    const response = buildHttpResponse(output)

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe('/new-location')
  })

  it('should default redirect to 302', () => {
    const output: ResolvedOutput = {
      status: 200,
      redirect: {
        url: '/temp',
      },
    }

    const response = buildHttpResponse(output)

    expect(response.status).toBe(302)
  })

  it('should build raw body response', () => {
    const output: ResolvedOutput = {
      status: 200,
      rawBody: '<html><body>Hello</body></html>',
    }

    const response = buildHttpResponse(output)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/plain')
  })

  it('should use custom content-type for raw body', () => {
    const output: ResolvedOutput = {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      rawBody: '<html><body>Hello</body></html>',
    }

    const response = buildHttpResponse(output)

    expect(response.headers.get('Content-Type')).toBe('text/html')
  })

  it('should build empty JSON body when body is undefined', async () => {
    const output: ResolvedOutput = {
      status: 200, // 204 cannot have a body per HTTP spec
    }

    const response = buildHttpResponse(output)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toBe('{}')
  })
})

describe('helper functions', () => {
  describe('isRedirectOutput', () => {
    it('should return true for redirect output', () => {
      const output: ResolvedOutput = {
        status: 200,
        redirect: { url: '/redirect' },
      }
      expect(isRedirectOutput(output)).toBe(true)
    })

    it('should return false for non-redirect output', () => {
      const output: ResolvedOutput = {
        status: 200,
        body: {},
      }
      expect(isRedirectOutput(output)).toBe(false)
    })
  })

  describe('isRawBodyOutput', () => {
    it('should return true for raw body output', () => {
      const output: ResolvedOutput = {
        status: 200,
        rawBody: 'plain text',
      }
      expect(isRawBodyOutput(output)).toBe(true)
    })

    it('should return false for JSON body output', () => {
      const output: ResolvedOutput = {
        status: 200,
        body: { json: true },
      }
      expect(isRawBodyOutput(output)).toBe(false)
    })
  })
})

describe('complex conditional scenarios', () => {
  it('should handle error handling pattern', () => {
    const output = [
      { when: '${agent.output.success}', status: 200, body: '${agent.output.data}' },
      {
        when: "${agent.output.error} == 'not_found'",
        status: 404,
        body: { error: 'Resource not found' },
      },
      {
        when: "${agent.output.error} == 'unauthorized'",
        status: 401,
        body: { error: 'Authentication required' },
      },
      { status: 500, body: { error: 'Internal server error' } },
    ]

    // Success case
    const success = resolveOutput(output, {
      agent: { output: { success: true, data: { id: 1 } } },
    })
    expect(success.status).toBe(200)

    // Not found case
    const notFound = resolveOutput(output, {
      agent: { output: { success: false, error: 'not_found' } },
    })
    expect(notFound.status).toBe(404)

    // Unauthorized case
    const unauthorized = resolveOutput(output, {
      agent: { output: { success: false, error: 'unauthorized' } },
    })
    expect(unauthorized.status).toBe(401)

    // Fallback case
    const fallback = resolveOutput(output, {
      agent: { output: { success: false, error: 'database_error' } },
    })
    expect(fallback.status).toBe(500)
  })

  it('should handle conditional redirect pattern', () => {
    const output = [
      {
        when: '${authenticated}',
        redirect: { url: '/dashboard' },
      },
      {
        redirect: { url: '/login' },
      },
    ]

    const authenticated = resolveOutput(output, { authenticated: true })
    expect(authenticated.redirect!.url).toBe('/dashboard')

    const unauthenticated = resolveOutput(output, { authenticated: false })
    expect(unauthenticated.redirect!.url).toBe('/login')
  })
})
