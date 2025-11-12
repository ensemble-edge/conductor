/**
 * Cache Warming Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  warmCache,
  extractWarmableRoutes,
  scheduledCacheRefresh,
  type CacheWarmingConfig,
  type RouteToWarm,
  type WarmingResult,
} from '../cache-warming.js'

describe('Cache Warming', () => {
  let fetchMock: any

  beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('warmCache', () => {
    it('should warm single route successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['cf-cache-status', 'MISS']]),
      })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [{ path: '/', priority: 100 }],
      }

      const results = await warmCache(config)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(results[0].status).toBe(200)
      expect(results[0].route).toBe('/')
      expect(results[0].cacheStatus).toBe('MISS')
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'Conductor-Cache-Warmer',
          }),
        })
      )
    })

    it('should warm multiple routes with concurrency', async () => {
      // Mock 5 successful responses
      for (let i = 0; i < 5; i++) {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['cf-cache-status', 'MISS']]),
        })
      }

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [
          { path: '/', priority: 100 },
          { path: '/about', priority: 80 },
          { path: '/blog', priority: 70 },
          { path: '/contact', priority: 60 },
          { path: '/products', priority: 50 },
        ],
        concurrency: 2,
      }

      const results = await warmCache(config)

      expect(results).toHaveLength(5)
      expect(results.every((r) => r.success)).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(5)
    })

    it('should sort routes by priority', async () => {
      const calls: string[] = []

      fetchMock.mockImplementation((url: string) => {
        calls.push(url)
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map(),
        })
      })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [
          { path: '/low', priority: 10 },
          { path: '/high', priority: 100 },
          { path: '/medium', priority: 50 },
        ],
        concurrency: 1, // Sequential to test order
      }

      await warmCache(config)

      // Should be called in priority order (highest first)
      expect(calls[0]).toBe('https://example.com/high')
      expect(calls[1]).toBe('https://example.com/medium')
      expect(calls[2]).toBe('https://example.com/low')
    })

    it('should handle failed requests', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [{ path: '/error', priority: 100 }],
        retry: false,
      }

      const results = await warmCache(config)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
      expect(results[0].error).toBe('Network error')
    })

    it('should retry failed requests', async () => {
      // Fail first 2 times, succeed on 3rd
      fetchMock
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map(),
        })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [{ path: '/retry', priority: 100 }],
        retry: true,
        maxRetries: 3,
      }

      const results = await warmCache(config)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(3)
    }, 10000)

    it('should include query parameters', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [
          {
            path: '/search',
            priority: 100,
            query: { q: 'test', limit: '10' },
          },
        ],
      }

      await warmCache(config)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/search?q=test&limit=10',
        expect.any(Object)
      )
    })

    it('should include custom headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [
          {
            path: '/api/data',
            priority: 100,
            headers: {
              Authorization: 'Bearer token123',
              'X-Custom': 'value',
            },
          },
        ],
      }

      await warmCache(config)

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
            'X-Custom': 'value',
            'User-Agent': 'Conductor-Cache-Warmer',
          }),
        })
      )
    })

    it('should detect cache status from various headers', async () => {
      // Test cf-cache-status
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['cf-cache-status', 'HIT']]),
      })

      // Test x-cache
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['x-cache', 'HIT']]),
      })

      // Test no cache header
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const config: CacheWarmingConfig = {
        baseUrl: 'https://example.com',
        routes: [
          { path: '/cf', priority: 100 },
          { path: '/x-cache', priority: 90 },
          { path: '/none', priority: 80 },
        ],
      }

      const results = await warmCache(config)

      expect(results[0].cacheStatus).toBe('HIT')
      expect(results[1].cacheStatus).toBe('HIT')
      expect(results[2].cacheStatus).toBe('unknown')
    })
  })

  describe('extractWarmableRoutes', () => {
    it('should extract routes with warming enabled', () => {
      const pages = [
        {
          name: 'homepage',
          route: { path: '/' },
          cache: { enabled: true, warming: true },
        },
        {
          name: 'about',
          route: { path: '/about' },
          cache: { enabled: true, warming: false },
        },
        {
          name: 'blog',
          route: { path: '/blog' },
          cache: { enabled: true, prewarm: true },
        },
      ]

      const routes = extractWarmableRoutes(pages)

      expect(routes).toHaveLength(2)
      expect(routes.find((r) => r.path === '/')).toBeDefined()
      expect(routes.find((r) => r.path === '/blog')).toBeDefined()
      expect(routes.find((r) => r.path === '/about')).toBeUndefined()
    })

    it('should assign priorities based on route patterns', () => {
      const pages = [
        {
          name: 'homepage',
          route: { path: '/' },
          cache: { enabled: true, warming: true },
        },
        {
          name: 'api',
          route: { path: '/api/users' },
          cache: { enabled: true, warming: true },
        },
        {
          name: 'dynamic',
          route: { path: '/blog/:slug' },
          cache: { enabled: true, warming: true },
        },
      ]

      const routes = extractWarmableRoutes(pages)

      const homepage = routes.find((r) => r.path === '/')
      const api = routes.find((r) => r.path === '/api/users')
      const dynamic = routes.find((r) => r.path === '/blog/:slug')

      expect(homepage?.priority).toBe(100) // Homepage highest
      expect(api?.priority).toBe(30) // API routes lower
      expect(dynamic?.priority).toBe(20) // Dynamic routes lowest
    })

    it('should default path to /name if route.path missing', () => {
      const pages = [
        {
          name: 'dashboard',
          cache: { enabled: true, warming: true },
        },
      ]

      const routes = extractWarmableRoutes(pages)

      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/dashboard')
    })

    it('should skip pages without cache enabled', () => {
      const pages = [
        {
          name: 'no-cache',
          route: { path: '/no-cache' },
          cache: { enabled: false, warming: true },
        },
        {
          name: 'no-cache-config',
          route: { path: '/no-config' },
        },
      ]

      const routes = extractWarmableRoutes(pages)

      expect(routes).toHaveLength(0)
    })
  })

  describe('scheduledCacheRefresh', () => {
    it('should throw if BASE_URL not provided', async () => {
      const env = {}

      await expect(scheduledCacheRefresh(env)).rejects.toThrow(
        'BASE_URL or DEPLOYMENT_URL environment variable required'
      )
    })

    it('should use BASE_URL from environment', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const env = {
        BASE_URL: 'https://production.example.com',
      }

      // This will fail because loadPagesForWarming returns empty array
      // but it tests that BASE_URL is read correctly
      const results = await scheduledCacheRefresh(env)

      expect(results).toHaveLength(0)
    })

    it('should use DEPLOYMENT_URL as fallback', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const env = {
        DEPLOYMENT_URL: 'https://staging.example.com',
      }

      const results = await scheduledCacheRefresh(env)

      expect(results).toHaveLength(0)
    })

    it('should accept custom config', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
      })

      const env = {
        BASE_URL: 'https://example.com',
      }

      const config = {
        concurrency: 20,
        timeout: 5000,
      }

      const results = await scheduledCacheRefresh(env, config)

      expect(results).toHaveLength(0)
    })
  })
})
