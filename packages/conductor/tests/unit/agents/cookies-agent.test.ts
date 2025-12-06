/**
 * Cookies Agent Tests
 *
 * Tests for cookie management operation with consent awareness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CookiesAgent } from '../../../src/agents/cookies/cookies-agent'
import type { AgentExecutionContext } from '../../../src/agents/base-agent'

// Mock the logger
vi.mock('../../../src/observability/index.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('CookiesAgent', () => {
  const createMockContext = (overrides: Partial<AgentExecutionContext> = {}): AgentExecutionContext => ({
    input: {},
    env: {} as any,
    ctx: {} as any,
    ...overrides,
  })

  describe('Configuration Validation', () => {
    it('should throw if action is missing', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: {},
        })
      }).toThrow('Cookies agent requires an action')
    })

    it('should throw if action is invalid', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'invalid' },
        })
      }).toThrow('Invalid cookies action')
    })

    it('should throw if name is missing for get action', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'get' },
        })
      }).toThrow('Cookies action "get" requires a name')
    })

    it('should throw if name is missing for set action', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'set' },
        })
      }).toThrow('Cookies action "set" requires a name')
    })

    it('should throw if value is missing for set action', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'set', name: 'session' },
        })
      }).toThrow('Cookies action "set" requires a value')
    })

    it('should not throw for valid getAll config', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'getAll' },
        })
      }).not.toThrow()
    })

    it('should not throw for valid get config', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'get', name: 'session' },
        })
      }).not.toThrow()
    })

    it('should not throw for valid set config', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'set', name: 'session', value: 'abc123' },
        })
      }).not.toThrow()
    })

    it('should not throw for valid delete config', () => {
      expect(() => {
        new CookiesAgent({
          name: 'test-cookies',
          operation: 'cookies' as any,
          config: { action: 'delete', name: 'session' },
        })
      }).not.toThrow()
    })
  })

  describe('get action', () => {
    it('should return cookie value from input.cookies', async () => {
      const agent = new CookiesAgent({
        name: 'get-session',
        operation: 'cookies' as any,
        config: { action: 'get', name: 'session_id' },
      })

      const ctx = createMockContext({
        input: {
          cookies: { session_id: 'abc123', other: 'value' },
        },
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        value: 'abc123',
        found: true,
      })
    })

    it('should return null for missing cookie', async () => {
      const agent = new CookiesAgent({
        name: 'get-session',
        operation: 'cookies' as any,
        config: { action: 'get', name: 'nonexistent' },
      })

      const ctx = createMockContext({
        input: {
          cookies: { session_id: 'abc123' },
        },
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        value: null,
        found: false,
      })
    })

    it('should return empty when no cookies in input', async () => {
      const agent = new CookiesAgent({
        name: 'get-session',
        operation: 'cookies' as any,
        config: { action: 'get', name: 'session' },
      })

      const ctx = createMockContext({
        input: {},
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        value: null,
        found: false,
      })
    })
  })

  describe('getAll action', () => {
    it('should return all cookies', async () => {
      const agent = new CookiesAgent({
        name: 'get-all',
        operation: 'cookies' as any,
        config: { action: 'getAll' },
      })

      const ctx = createMockContext({
        input: {
          cookies: { a: '1', b: '2', c: '3' },
        },
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        cookies: { a: '1', b: '2', c: '3' },
        count: 3,
      })
    })

    it('should return empty object when no cookies', async () => {
      const agent = new CookiesAgent({
        name: 'get-all',
        operation: 'cookies' as any,
        config: { action: 'getAll' },
      })

      const ctx = createMockContext({
        input: {},
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        cookies: {},
        count: 0,
      })
    })
  })

  describe('set action', () => {
    it('should skip when no HTTP context', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc123' },
      })

      const ctx = createMockContext({
        input: {
          _triggerType: 'cron',
        },
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: false,
        skipped: true,
        reason: 'no_http_context',
      })
    })

    it('should set cookie when HTTP context is present', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc123' },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
      }

      const ctx = createMockContext({ input })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: true,
      })
      expect((result.data as any).header).toContain('session=abc123')
      expect(input._setCookies).toHaveLength(1)
      expect(input._setCookies[0]).toContain('session=abc123')
    })

    it('should set cookie with all options', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: {
          action: 'set',
          name: 'session',
          value: 'abc123',
          maxAge: 3600,
          path: '/api',
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
        },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
      }

      const ctx = createMockContext({ input })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      const header = (result.data as any).header
      expect(header).toContain('session=abc123')
      expect(header).toContain('Max-Age=3600')
      expect(header).toContain('Path=/api')
      expect(header).toContain('Domain=example.com')
      expect(header).toContain('Secure')
      expect(header).toContain('HttpOnly')
      expect(header).toContain('SameSite=Strict')
    })

    it('should skip when consent required but not granted', async () => {
      const agent = new CookiesAgent({
        name: 'set-analytics',
        operation: 'cookies' as any,
        config: {
          action: 'set',
          name: '_analytics',
          value: 'track123',
          purpose: 'analytics',
        },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
        consents: { analytics: false },
      }

      const ctx = createMockContext({
        input,
        location: {
          requiresConsent: (purpose: string) => purpose === 'analytics',
        } as any,
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: false,
        skipped: true,
        reason: 'consent_required',
        purpose: 'analytics',
      })
      expect(input._setCookies).toHaveLength(0)
    })

    it('should set cookie when consent is granted', async () => {
      const agent = new CookiesAgent({
        name: 'set-analytics',
        operation: 'cookies' as any,
        config: {
          action: 'set',
          name: '_analytics',
          value: 'track123',
          purpose: 'analytics',
        },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
        consents: { analytics: true },
      }

      const ctx = createMockContext({
        input,
        location: {
          requiresConsent: (purpose: string) => purpose === 'analytics',
        } as any,
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: true,
      })
      expect(input._setCookies).toHaveLength(1)
    })

    it('should set cookie for essential purpose without consent check', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: {
          action: 'set',
          name: 'session',
          value: 'abc123',
          purpose: 'essential',
        },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
      }

      const ctx = createMockContext({
        input,
        location: {
          requiresConsent: () => true, // Would require consent for non-essential
        } as any,
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: true,
      })
      expect(input._setCookies).toHaveLength(1)
    })
  })

  describe('delete action', () => {
    it('should skip when no HTTP context', async () => {
      const agent = new CookiesAgent({
        name: 'delete-session',
        operation: 'cookies' as any,
        config: { action: 'delete', name: 'session' },
      })

      const ctx = createMockContext({
        input: {
          _triggerType: 'cron',
        },
      })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: false,
        skipped: true,
        reason: 'no_http_context',
      })
    })

    it('should delete cookie when HTTP context is present', async () => {
      const agent = new CookiesAgent({
        name: 'delete-session',
        operation: 'cookies' as any,
        config: { action: 'delete', name: 'session' },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
      }

      const ctx = createMockContext({ input })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        success: true,
      })
      const header = (result.data as any).header
      expect(header).toContain('session=')
      expect(header).toContain('Max-Age=0')
      expect(input._setCookies).toHaveLength(1)
    })

    it('should delete cookie with custom path', async () => {
      const agent = new CookiesAgent({
        name: 'delete-session',
        operation: 'cookies' as any,
        config: { action: 'delete', name: 'session', path: '/api' },
      })

      const input: any = {
        _triggerType: 'http',
        method: 'POST',
        headers: {},
        _setCookies: [],
      }

      const ctx = createMockContext({ input })

      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      const header = (result.data as any).header
      expect(header).toContain('Path=/api')
    })
  })

  describe('Trigger Type Detection', () => {
    it('should detect HTTP trigger type from _triggerType', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc' },
      })

      const input: any = { _triggerType: 'http', _setCookies: [] }
      const ctx = createMockContext({ input })
      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect((result.data as any).success).toBe(true)
    })

    it('should detect webhook trigger type', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc' },
      })

      const input: any = { _triggerType: 'webhook', _setCookies: [] }
      const ctx = createMockContext({ input })
      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect((result.data as any).success).toBe(true)
    })

    it('should detect MCP trigger type', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc' },
      })

      const input: any = { _triggerType: 'mcp', _setCookies: [] }
      const ctx = createMockContext({ input })
      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect((result.data as any).success).toBe(true)
    })

    it('should detect HTTP context from method and headers', async () => {
      const agent = new CookiesAgent({
        name: 'set-session',
        operation: 'cookies' as any,
        config: { action: 'set', name: 'session', value: 'abc' },
      })

      const input: any = { method: 'GET', headers: {}, _setCookies: [] }
      const ctx = createMockContext({ input })
      const result = await agent.execute(ctx)

      expect(result.success).toBe(true)
      expect((result.data as any).success).toBe(true)
    })
  })
})
