/**
 * Tests for dynamic pages with handler functions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PageAgent } from '../page-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import type { HandlerContext } from '../types/index.js'

describe('Dynamic Pages', () => {
  let mockEnv: any
  let mockCtx: ExecutionContext

  beforeEach(() => {
    mockEnv = {}
    mockCtx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as ExecutionContext
  })

  describe('Handler Functions', () => {
    it('should call handler and merge data into template', async () => {
      const config: AgentConfig = {
        name: 'test-page',
        type: 'Page',
        component: '<h1>{{title}}</h1><p>{{content}}</p>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          return {
            title: 'Test Title',
            content: 'Test Content',
          }
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {},
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('Test Title')
      expect(output?.html).toContain('Test Content')
    })

    it('should pass route params to handler', async () => {
      let receivedParams: Record<string, string> = {}

      const config: AgentConfig = {
        name: 'blog-post',
        type: 'Page',
        component: '<h1>Slug: {{params.slug}}</h1>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          receivedParams = context.params
          return {
            post: {
              title: `Post: ${context.params.slug}`,
            },
          }
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {
          params: { slug: 'hello-world' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      expect(receivedParams.slug).toBe('hello-world')
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('hello-world')
    })

    it('should pass query parameters to handler', async () => {
      let receivedQuery: Record<string, string> = {}

      const config: AgentConfig = {
        name: 'search-page',
        type: 'Page',
        component: '<p>Query: {{query.q}}</p>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          receivedQuery = context.query
          return {
            results: `Searching for: ${context.query.q}`,
          }
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {
          query: { q: 'conductor', page: '2' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      expect(receivedQuery.q).toBe('conductor')
      expect(receivedQuery.page).toBe('2')
    })

    it('should pass headers to handler', async () => {
      let receivedHeaders: Record<string, string> = {}

      const config: AgentConfig = {
        name: 'auth-page',
        type: 'Page',
        component: '<p>Auth: {{authorized}}</p>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          receivedHeaders = context.headers
          const authorized = context.headers.authorization === 'Bearer token123'
          return { authorized }
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {
          headers: {
            authorization: 'Bearer token123',
            'user-agent': 'test-agent',
          },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      expect(receivedHeaders.authorization).toBe('Bearer token123')
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('true')
    })

    it('should handle handler errors gracefully', async () => {
      const config: AgentConfig = {
        name: 'error-page',
        type: 'Page',
        component: '<p>Default content</p>',
        templateEngine: 'liquid',
        handler: async () => {
          throw new Error('Handler failed')
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {},
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      // Should still render with empty handler data
      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('Default content')
    })

    it('should access env bindings in handler', async () => {
      mockEnv.DB = {
        prepare: () => ({
          bind: () => ({
            first: async () => ({ id: 1, title: 'From DB' }),
          }),
        }),
      }

      const config: AgentConfig = {
        name: 'db-page',
        type: 'Page',
        component: '<h1>{{post.title}}</h1>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          const post = await context.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
            .bind(1)
            .first()
          return { post }
        },
      }

      const page = new PageAgent(config)
      const result = await page.execute({
        input: {},
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('From DB')
    })
  })

  describe('Route Parameters', () => {
    it('should extract route params and pass to page', async () => {
      const config: AgentConfig = {
        name: 'blog-post',
        type: 'Page',
        component: '<h1>{{params.slug}}</h1>',
        templateEngine: 'liquid',
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          params: { slug: 'hello-world' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('hello-world')
    })

    it('should extract query params and pass to page', async () => {
      const config: AgentConfig = {
        name: 'search',
        type: 'Page',
        component: '<p>{{query.q}}</p>',
        templateEngine: 'liquid',
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          query: { q: 'conductor', page: '2' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('conductor')
    })

    it('should extract headers and pass to page', async () => {
      const config: AgentConfig = {
        name: 'user-agent-page',
        type: 'Page',
        component: '<p>{{headers.user-agent}}</p>',
        templateEngine: 'liquid',
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          headers: { 'user-agent': 'TestBot/1.0' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('TestBot/1.0')
    })

    it('should handle multiple route parameters', async () => {
      const config: AgentConfig = {
        name: 'nested-page',
        type: 'Page',
        component: '<p>{{params.category}}/{{params.id}}</p>',
        templateEngine: 'liquid',
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          params: { category: 'electronics', id: '123' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('electronics')
      expect(output?.html).toContain('123')
    })
  })

  describe('Handler with Route Data', () => {
    it('should combine route params with handler data', async () => {
      const config: AgentConfig = {
        name: 'dynamic-blog',
        type: 'Page',
        component: '<h1>{{post.title}}</h1><p>Slug: {{params.slug}}</p>',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          // Simulate fetching from database
          const mockPosts: Record<string, any> = {
            'first-post': { title: 'First Post', content: 'Content 1' },
            'second-post': { title: 'Second Post', content: 'Content 2' },
          }
          return {
            post: mockPosts[context.params.slug] || null,
          }
        },
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          params: { slug: 'first-post' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('First Post')
      expect(output?.html).toContain('first-post')
    })

    it('should handle null data from handler gracefully', async () => {
      const config: AgentConfig = {
        name: 'dynamic-blog',
        type: 'Page',
        component: '{% if post %}<h1>{{post.title}}</h1>{% else %}<p>Not found</p>{% endif %}',
        templateEngine: 'liquid',
        handler: async (context: HandlerContext) => {
          // Simulate post not found
          return { post: null }
        },
      }

      const page = new PageAgent(config)

      const result = await page.execute({
        input: {
          params: { slug: 'nonexistent' },
        },
        env: mockEnv,
        ctx: mockCtx,
        state: {},
        previousOutputs: {},
      })

      expect(result.success).toBe(true)
      const output = (result.data || result.output) as any
      expect(output?.html).toContain('Not found')
    })
  })
})
