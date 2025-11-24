import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { PageLoader } from '../page-loader.js'
import { PageAgent } from '../../agents/page/page-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'

describe('PageLoader', () => {
  let app: Hono
  let loader: PageLoader

  beforeEach(() => {
    app = new Hono()
    loader = new PageLoader(app)
  })

  it('should convert page names to paths correctly', () => {
    const testCases = [
      { name: 'index', expected: '/' },
      { name: 'home', expected: '/' },
      { name: 'about', expected: '/about' },
      { name: 'blog.post', expected: '/blog/post' },
      { name: 'blog-index', expected: '/blog' },
      { name: 'products.[id]', expected: '/products/:id' },
    ]

    for (const { name, expected } of testCases) {
      const result = loader['pageNameToPath'](name)
      expect(result).toBe(expected)
    }
  })

  it('should discover and register pages', async () => {
    const config: AgentConfig = {
      name: 'home',
      operation: 'page',
      component: '<h1>Home</h1>',
    }

    const pagesMap = new Map([['home', { config, agent: new PageAgent(config) }]])

    await loader.discoverPages(pagesMap)

    // Page should be registered with bridge
    expect(loader['bridge']['pages'].has('home')).toBe(true)
  })

  it('should auto-generate routes for pages without route config', async () => {
    const config: AgentConfig = {
      name: 'about',
      operation: 'page',
      component: '<h1>About</h1>',
    }

    const pagesMap = new Map([['about', { config, agent: new PageAgent(config) }]])

    await loader.discoverPages(pagesMap)

    // Should auto-generate /about route
    expect(loader['bridge']['pages'].has('about')).toBe(true)
  })

  it('should handle pages with explicit route config', async () => {
    const config: any = {
      name: 'custom',
      operation: 'page',
      route: {
        path: '/custom-path',
        methods: ['GET', 'POST'],
      },
      component: '<h1>Custom</h1>',
    }

    const pagesMap = new Map([['custom', { config, agent: new PageAgent(config) }]])

    await loader.discoverPages(pagesMap)

    expect(loader['bridge']['pages'].has('custom')).toBe(true)
  })

  it('should register layouts', () => {
    const layoutConfig: AgentConfig = {
      name: 'main-layout',
      operation: 'page',
      component: '<html><body>{{ children }}</body></html>',
    }

    const layoutAgent = new PageAgent(layoutConfig)
    loader.registerLayout('main-layout', layoutAgent)

    expect(loader['bridge']['layouts'].has('main-layout')).toBe(true)
  })

  it('should handle errors gracefully when registering pages', async () => {
    const invalidConfig: any = {
      name: 'invalid',
      operation: 'page',
      component: '<h1>Invalid</h1>',
      // This will cause an error during route registration
      route: null,
    }

    const pagesMap = new Map([
      ['invalid', { config: invalidConfig, agent: new PageAgent(invalidConfig) }],
    ])

    // Should not throw - errors are caught and logged
    await expect(loader.discoverPages(pagesMap)).resolves.not.toThrow()
  })
})
