import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HonoConductorBridge } from '../hono-bridge.js'
import { PageAgent } from '../../agents/page/page-agent.js'
import type { PageRouteConfig } from '../hono-bridge.js'

describe('HonoConductorBridge', () => {
  let app: Hono
  let bridge: HonoConductorBridge

  beforeEach(() => {
    app = new Hono()
    bridge = new HonoConductorBridge(app)
  })

  it('should register page with basic route', () => {
    const config: PageRouteConfig = {
      name: 'home',
      operation: 'page',
      route: {
        path: '/',
        methods: ['GET'],
      },
      component: '<h1>Home</h1>',
    }

    const agent = new PageAgent(config)
    bridge.registerPage(config, agent)

    // Test that route was registered
    expect(bridge['pages'].has('home')).toBe(true)
  })

  it('should normalize paths correctly', () => {
    const testCases = [
      { input: '/foo', expected: '/foo' },
      { input: 'foo', expected: '/foo' },
      { input: '/foo/', expected: '/foo' },
      { input: '/', expected: '/' },
    ]

    for (const { input, expected } of testCases) {
      const result = bridge['normalizePath'](input)
      expect(result).toBe(expected)
    }
  })

  it('should handle dynamic route params', () => {
    const config: PageRouteConfig = {
      name: 'blog-post',
      operation: 'page',
      route: {
        path: '/blog/:slug',
        methods: ['GET'],
      },
      component: '<article>{{ params.slug }}</article>',
    }

    const agent = new PageAgent(config)
    bridge.registerPage(config, agent)

    expect(bridge['pages'].has('blog-post')).toBe(true)
  })

  it('should register multiple HTTP methods', () => {
    const config: PageRouteConfig = {
      name: 'api-endpoint',
      operation: 'page',
      route: {
        path: '/api/users',
        methods: ['GET', 'POST', 'PUT'],
      },
      component: '{}',
    }

    const agent = new PageAgent(config)
    bridge.registerPage(config, agent)

    expect(bridge['pages'].has('api-endpoint')).toBe(true)
  })

  it('should handle pages with operations', () => {
    const config: PageRouteConfig = {
      name: 'product',
      operation: 'page',
      route: {
        path: '/product/:id',
      },
      beforeRender: [
        {
          name: 'fetch-product',
          operation: 'custom:fetch',
          config: {
            collection: 'products',
            id: '${params.id}',
          },
        },
      ],
      component: '<div>{{ fetch-product.name }}</div>',
    }

    const agent = new PageAgent(config)
    bridge.registerPage(config, agent)

    expect(bridge['pages'].has('product')).toBe(true)
  })

  it('should register layout', () => {
    const layoutConfig: PageRouteConfig = {
      name: 'main-layout',
      operation: 'page',
      route: { path: '/_layout' },
      component: '<html><body>{{ children }}</body></html>',
    }

    const layoutAgent = new PageAgent(layoutConfig)
    bridge.registerLayout('main-layout', layoutAgent)

    expect(bridge['layouts'].has('main-layout')).toBe(true)
  })

  it('should generate cache keys correctly', () => {
    const path = '/blog/post-1'
    const query = { page: '2', sort: 'date' }

    const cacheKey = bridge['generateCacheKey'](path, query)

    // Should include path and sorted query params
    expect(cacheKey).toContain('/blog/post-1')
    expect(cacheKey).toContain('page=2')
    expect(cacheKey).toContain('sort=date')
  })
})
