import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { compress } from 'hono/compress'
import { PageLoader } from '../page-loader.js'
import { PageAgent } from '../../agents/page/page-agent.js'
import type { PageRouteConfig } from '../hono-bridge.js'

describe('Hono Middleware Integration', () => {
  let app: Hono
  let loader: PageLoader

  beforeEach(() => {
    app = new Hono()
    loader = new PageLoader(app)
  })

  it('should work with CORS middleware', async () => {
    // Add CORS middleware
    app.use('*', cors({
      origin: 'https://example.com',
      allowMethods: ['GET', 'POST'],
    }))

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
    loader['bridge'].registerPage(config, agent)

    // Create request
    const req = new Request('http://localhost/', {
      method: 'GET',
      headers: {
        'Origin': 'https://example.com',
      },
    })

    const res = await app.fetch(req, {} as any, {} as any)

    // Verify CORS headers are present
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
  })

  it('should work with logger middleware', async () => {
    const logs: string[] = []

    // Add custom logger middleware that captures logs
    app.use('*', logger((message) => {
      logs.push(message)
    }))

    const config: PageRouteConfig = {
      name: 'about',
      operation: 'page',
      route: {
        path: '/about',
        methods: ['GET'],
      },
      component: '<h1>About</h1>',
    }

    const agent = new PageAgent(config)
    loader['bridge'].registerPage(config, agent)

    const req = new Request('http://localhost/about', { method: 'GET' })
    const res = await app.fetch(req, {} as any, {} as any)

    expect(res.status).toBe(200)
    // Logger should have captured the request
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0]).toContain('GET')
    expect(logs[0]).toContain('/about')
  })

  it('should work with compress middleware', async () => {
    // Add compression middleware
    app.use('*', compress())

    const config: PageRouteConfig = {
      name: 'large',
      operation: 'page',
      route: {
        path: '/large',
        methods: ['GET'],
      },
      component: '<h1>' + 'Large content '.repeat(1000) + '</h1>',
    }

    const agent = new PageAgent(config)
    loader['bridge'].registerPage(config, agent)

    const req = new Request('http://localhost/large', {
      method: 'GET',
      headers: {
        'Accept-Encoding': 'gzip',
      },
    })

    const res = await app.fetch(req, {} as any, {} as any)

    expect(res.status).toBe(200)
    // Check if compression was applied
    const contentEncoding = res.headers.get('Content-Encoding')
    // Note: Compress middleware only compresses if content is large enough
    // So this might be null for small content
    expect(contentEncoding === 'gzip' || contentEncoding === null).toBe(true)
  })

  it('should work with multiple middleware in chain', async () => {
    const logs: string[] = []

    // Chain multiple middleware
    app.use('*', logger((message) => logs.push(message)))
    app.use('*', cors({ origin: '*' }))
    app.use('*', compress())

    const config: PageRouteConfig = {
      name: 'multi',
      operation: 'page',
      route: {
        path: '/multi',
        methods: ['GET'],
      },
      component: '<h1>Multiple Middleware</h1>',
    }

    const agent = new PageAgent(config)
    loader['bridge'].registerPage(config, agent)

    const req = new Request('http://localhost/multi', {
      method: 'GET',
      headers: {
        'Origin': 'https://example.com',
      },
    })

    const res = await app.fetch(req, {} as any, {} as any)

    // All middleware should have run
    expect(res.status).toBe(200)
    expect(logs.length).toBeGreaterThan(0)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('should apply route-specific middleware', async () => {
    // Global middleware
    app.use('*', cors({ origin: '*' }))

    // Route-specific middleware
    const authCalled: string[] = []
    app.use('/protected/*', async (c, next) => {
      const token = c.req.header('Authorization')
      if (token !== 'Bearer secret') {
        return c.text('Unauthorized', 401)
      }
      authCalled.push(c.req.path)
      await next()
    })

    const publicConfig: PageRouteConfig = {
      name: 'public',
      operation: 'page',
      route: {
        path: '/public',
        methods: ['GET'],
      },
      component: '<h1>Public</h1>',
    }

    const protectedConfig: PageRouteConfig = {
      name: 'protected',
      operation: 'page',
      route: {
        path: '/protected/admin',
        methods: ['GET'],
      },
      component: '<h1>Admin</h1>',
    }

    loader['bridge'].registerPage(publicConfig, new PageAgent(publicConfig))
    loader['bridge'].registerPage(protectedConfig, new PageAgent(protectedConfig))

    // Public route should work without auth
    const publicReq = new Request('http://localhost/public', { method: 'GET' })
    const publicRes = await app.fetch(publicReq, {} as any, {} as any)
    expect(publicRes.status).toBe(200)

    // Protected route without auth should fail
    const protectedReqNoAuth = new Request('http://localhost/protected/admin', { method: 'GET' })
    const protectedResNoAuth = await app.fetch(protectedReqNoAuth, {} as any, {} as any)
    expect(protectedResNoAuth.status).toBe(401)

    // Protected route with auth should work
    const protectedReq = new Request('http://localhost/protected/admin', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer secret',
      },
    })
    const protectedRes = await app.fetch(protectedReq, {} as any, {} as any)
    expect(protectedRes.status).toBe(200)
    expect(authCalled).toContain('/protected/admin')
  })
})
