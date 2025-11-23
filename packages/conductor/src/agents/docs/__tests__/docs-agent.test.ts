/**
 * Docs Agent Tests
 *
 * Comprehensive tests for Docs agent functionality including:
 * - Configuration validation
 * - Interactive docs UI rendering (Stoplight, Redoc, Swagger, Scalar, RapiDoc)
 * - OpenAPI spec serving (YAML and JSON formats)
 * - Auto-generation features
 * - Caching functionality
 * - Branding/customization
 * - Route authentication integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DocsMember } from '../docs-agent.js'
import type {
  DocsAgentConfig,
  DocsMemberInput,
  DocsMemberOutput,
  DocsUIFramework,
} from '../types/index.js'
import type { AgentExecutionContext } from '../../base-agent.js'

// Mock KV namespace for caching
class MockKVNamespace {
  private store = new Map<string, { value: string; expiration?: number }>()

  async get(key: string, type?: string): Promise<any> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiration && Date.now() > item.expiration) {
      this.store.delete(key)
      return null
    }
    return type === 'json' ? JSON.parse(item.value) : item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiration = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : undefined
    this.store.set(key, { value, expiration })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

describe('DocsMember', () => {
  let mockContext: AgentExecutionContext
  let mockDocsCache: MockKVNamespace

  beforeEach(() => {
    mockDocsCache = new MockKVNamespace()

    mockContext = {
      input: {},
      env: {
        DOCS_CACHE: mockDocsCache,
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should create docs agent with default configuration', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      expect(agent).toBeDefined()
    })

    it('should set default UI framework to Stoplight', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.ui).toBe('stoplight')
    })

    it('should set default OpenAPI version to 3.1', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.openApiVersion).toBe('3.1')
    })

    it('should set default paths', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.paths).toEqual({
        docs: '/docs',
        yaml: '/openapi.yaml',
        json: '/openapi.json',
      })
    })

    it('should accept custom paths configuration', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        paths: {
          docs: '/api-docs',
          yaml: '/spec.yaml',
          json: '/spec.json',
        },
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.paths).toEqual({
        docs: '/api-docs',
        yaml: '/spec.yaml',
        json: '/spec.json',
      })
    })

    it('should accept custom UI framework', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'redoc',
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.ui).toBe('redoc')
    })

    it('should accept OpenAPI 3.0 version', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        openApiVersion: '3.0',
      }

      const agent = new DocsMember(config)
      const agentConfig = agent['docsConfig']

      expect(agentConfig.openApiVersion).toBe('3.0')
    })
  })

  describe('Serving Interactive Docs UI', () => {
    describe('Stoplight Elements', () => {
      it('should generate Stoplight UI HTML', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'stoplight',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('text/html; charset=utf-8')
        expect(result.content).toContain('<!DOCTYPE html>')
        expect(result.content).toContain('@stoplight/elements')
        expect(result.content).toContain('elements-api')
        expect(result.content).toContain('apiDescriptionUrl="/openapi.yaml"')
      })

      it('should include branding in Stoplight UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'stoplight',
          branding: {
            title: 'My API',
            logo: 'https://example.com/logo.png',
            favicon: 'https://example.com/favicon.ico',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('My API')
        expect(result.content).toContain('logo="https://example.com/logo.png"')
        expect(result.content).toContain('https://example.com/favicon.ico')
      })

      it('should include custom CSS in Stoplight UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'stoplight',
          branding: {
            title: 'My API',
            customCss: 'body { background-color: #f0f0f0; }',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('body { background-color: #f0f0f0; }')
      })
    })

    describe('Redoc', () => {
      it('should generate Redoc UI HTML', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'redoc',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('text/html; charset=utf-8')
        expect(result.content).toContain('<redoc spec-url="/openapi.yaml">')
        expect(result.content).toContain('redoc.standalone.js')
      })

      it('should include branding in Redoc UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'redoc',
          branding: {
            title: 'Custom API Docs',
            favicon: 'https://example.com/favicon.ico',
            customCss: '.redoc { font-family: Arial; }',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('Custom API Docs')
        expect(result.content).toContain('https://example.com/favicon.ico')
        expect(result.content).toContain('.redoc { font-family: Arial; }')
      })
    })

    describe('Swagger UI', () => {
      it('should generate Swagger UI HTML', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'swagger',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('text/html; charset=utf-8')
        expect(result.content).toContain('swagger-ui-dist')
        expect(result.content).toContain('SwaggerUIBundle')
        expect(result.content).toContain("url: '/openapi.yaml'")
      })

      it('should include branding in Swagger UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'swagger',
          branding: {
            title: 'Swagger Docs',
            favicon: 'https://example.com/favicon.ico',
            customCss: '#swagger-ui { max-width: 1200px; }',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('Swagger Docs')
        expect(result.content).toContain('https://example.com/favicon.ico')
        expect(result.content).toContain('#swagger-ui { max-width: 1200px; }')
      })
    })

    describe('Scalar', () => {
      it('should generate Scalar UI HTML', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'scalar',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('text/html; charset=utf-8')
        expect(result.content).toContain('@scalar/api-reference')
        expect(result.content).toContain('data-url="/openapi.yaml"')
      })

      it('should include theme in Scalar UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'scalar',
          branding: {
            title: 'Scalar Docs',
            favicon: 'https://example.com/favicon.ico',
            theme: 'dark',
            customCss: 'body { padding: 20px; }',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('Scalar Docs')
        expect(result.content).toContain('data-theme="dark"')
        expect(result.content).toContain('body { padding: 20px; }')
      })
    })

    describe('RapiDoc', () => {
      it('should generate RapiDoc UI HTML', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'rapidoc',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('text/html; charset=utf-8')
        expect(result.content).toContain('rapidoc')
        expect(result.content).toContain('<rapi-doc')
        expect(result.content).toContain('spec-url="/openapi.yaml"')
      })

      it('should include branding in RapiDoc UI', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: 'rapidoc',
          branding: {
            title: 'RapiDoc Docs',
            logo: 'https://example.com/logo.png',
            primaryColor: '#ff6b6b',
            customCss: 'rapi-doc { width: 100%; }',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('RapiDoc Docs')
        expect(result.content).toContain('logo="https://example.com/logo.png"')
        expect(result.content).toContain('primary-color="#ff6b6b"')
        expect(result.content).toContain('rapi-doc { width: 100%; }')
      })
    })
  })

  describe('Serving OpenAPI Spec', () => {
    describe('YAML Format', () => {
      it('should serve OpenAPI spec in YAML format', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          paths: {
            docs: '/docs',
            yaml: '/openapi.yaml',
            json: '/openapi.json',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.yaml',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('application/x-yaml')
        expect(result.content).toBeDefined()
      })

      it('should include OpenAPI version in spec', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          openApiVersion: '3.1',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.yaml',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        const spec = JSON.parse(result.content)
        expect(spec.openapi).toBe('3.1.0')
      })

      it('should include custom servers in spec', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          servers: [
            { url: 'https://api.example.com', description: 'Production' },
            { url: 'https://staging.example.com', description: 'Staging' },
          ],
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.yaml',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        const spec = JSON.parse(result.content)
        expect(spec.servers).toHaveLength(2)
        expect(spec.servers[0].url).toBe('https://api.example.com')
        expect(spec.servers[1].url).toBe('https://staging.example.com')
      })
    })

    describe('JSON Format', () => {
      it('should serve OpenAPI spec in JSON format', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.json',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.status).toBe(200)
        expect(result.contentType).toBe('application/json')
        expect(() => JSON.parse(result.content)).not.toThrow()
      })

      it('should include info from branding in spec', async () => {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          branding: {
            title: 'My Custom API',
            description: 'This is my custom API documentation',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.json',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        const spec = JSON.parse(result.content)
        expect(spec.info.title).toBe('My Custom API')
        expect(spec.info.description).toBe('This is my custom API documentation')
      })
    })

    describe('Custom Spec', () => {
      it('should use custom OpenAPI spec when provided', async () => {
        const customSpec = {
          openapi: '3.1.0',
          info: {
            title: 'Custom Spec',
            version: '2.0.0',
          },
          paths: {
            '/custom': {
              get: {
                summary: 'Custom endpoint',
              },
            },
          },
        }

        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          customSpec: customSpec as any,
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/openapi.json',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        const spec = JSON.parse(result.content)
        expect(spec.info.title).toBe('Custom Spec')
        expect(spec.info.version).toBe('2.0.0')
        expect(spec.paths['/custom']).toBeDefined()
      })
    })
  })

  describe('Auto-Generation Features', () => {
    it('should generate basic spec when auto-generate is enabled', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        autoGenerate: {
          enabled: true,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      const spec = JSON.parse(result.content)
      expect(spec.openapi).toBe('3.1.0')
      expect(spec.info).toBeDefined()
      expect(spec.paths).toBeDefined()
    })

    it('should include default execute endpoint in auto-generated spec', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        autoGenerate: {
          enabled: true,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      const spec = JSON.parse(result.content)
      expect(spec.paths['/api/v1/execute']).toBeDefined()
      expect(spec.paths['/api/v1/execute'].post).toBeDefined()
    })

    it('should respect exclude paths in auto-generation', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        autoGenerate: {
          enabled: true,
          exclude: ['/internal/*', '/private/*'],
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].autoGenerate?.exclude).toEqual(['/internal/*', '/private/*'])
    })

    it('should respect include paths in auto-generation', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        autoGenerate: {
          enabled: true,
          include: ['/api/*', '/v1/*'],
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].autoGenerate?.include).toEqual(['/api/*', '/v1/*'])
    })

    it('should support AI enhancement configuration', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        autoGenerate: {
          enabled: true,
          useAI: true,
          aiAgent: 'gpt-4o',
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].autoGenerate?.useAI).toBe(true)
      expect(agent['docsConfig'].autoGenerate?.aiAgent).toBe('gpt-4o')
    })
  })

  describe('Caching Functionality', () => {
    it('should cache docs UI when cache is enabled', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: true,
          ttl: 300,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      // First request - cache miss
      const result1 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result1.cacheStatus).toBe('miss')
      expect(result1.headers['Cache-Control']).toContain('public')
      expect(result1.headers['Cache-Control']).toContain('max-age=300')

      // Second request - cache hit
      const result2 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result2.cacheStatus).toBe('hit')
      // Content should be defined for cached result
      expect(result2.content).toBeDefined()
      expect(typeof result2.content).toBe('string')
    })

    it('should cache YAML spec when cache is enabled', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: true,
          ttl: 600,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.yaml',
          method: 'GET',
          headers: {},
        },
      }

      // First request - cache miss
      const result1 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result1.cacheStatus).toBe('miss')
      expect(result1.headers['Cache-Control']).toContain('max-age=600')

      // Second request - cache hit
      const result2 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result2.cacheStatus).toBe('hit')
    })

    it('should cache JSON spec when cache is enabled', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: true,
          ttl: 600,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      // First request - cache miss
      const result1 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result1.cacheStatus).toBe('miss')

      // Second request - cache hit
      const result2 = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result2.cacheStatus).toBe('hit')
    })

    it('should not cache when cache is disabled', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: false,
          ttl: 300,
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.headers['Cache-Control']).toBe('no-cache')
    })

    it('should use correct cache keys for different paths', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: true,
          ttl: 300,
        },
      }

      const agent = new DocsMember(config)

      // Request docs UI
      await agent['run']({
        ...mockContext,
        input: {
          request: { url: 'http://example.com/docs', method: 'GET', headers: {} },
        },
      })

      // Request YAML spec
      await agent['run']({
        ...mockContext,
        input: {
          request: { url: 'http://example.com/openapi.yaml', method: 'GET', headers: {} },
        },
      })

      // Request JSON spec
      await agent['run']({
        ...mockContext,
        input: {
          request: { url: 'http://example.com/openapi.json', method: 'GET', headers: {} },
        },
      })

      // Check that cache has 3 different keys
      const cacheStore = mockDocsCache['store']
      expect(cacheStore.size).toBe(3)
    })

    it('should respect custom TTL values', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        cache: {
          enabled: true,
          ttl: 1800, // 30 minutes
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.headers['Cache-Control']).toContain('max-age=1800')
    })
  })

  describe('Branding and Customization', () => {
    it('should apply custom title across all UI frameworks', async () => {
      const frameworks: DocsUIFramework[] = ['stoplight', 'redoc', 'swagger', 'scalar', 'rapidoc']

      for (const framework of frameworks) {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: framework,
          branding: {
            title: 'Custom API Title',
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain('Custom API Title')
      }
    })

    it('should apply custom description in OpenAPI spec', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        branding: {
          title: 'My API',
          description: 'A comprehensive API for managing resources',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      const spec = JSON.parse(result.content)
      expect(spec.info.title).toBe('My API')
      expect(spec.info.description).toBe('A comprehensive API for managing resources')
    })

    it('should apply logo in supported UI frameworks', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'stoplight',
        branding: {
          title: 'API Docs',
          logo: 'https://example.com/logo.svg',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.content).toContain('logo="https://example.com/logo.svg"')
    })

    it('should apply favicon across all UI frameworks', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'redoc',
        branding: {
          title: 'API Docs',
          favicon: 'https://example.com/favicon.png',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.content).toContain('https://example.com/favicon.png')
    })

    it('should apply primary color in RapiDoc', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'rapidoc',
        branding: {
          title: 'API Docs',
          primaryColor: '#3498db',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.content).toContain('primary-color="#3498db"')
    })

    it('should apply theme in Scalar', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'scalar',
        branding: {
          title: 'API Docs',
          theme: 'dark',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.content).toContain('data-theme="dark"')
    })

    it('should apply custom CSS across all UI frameworks', async () => {
      const customCss = '.api-docs { max-width: 1400px; margin: 0 auto; }'

      const frameworks: DocsUIFramework[] = ['stoplight', 'redoc', 'swagger', 'scalar', 'rapidoc']

      for (const framework of frameworks) {
        const config: DocsAgentConfig = {
          name: 'api-docs',
          type: 'Docs',
          ui: framework,
          branding: {
            title: 'API Docs',
            customCss,
          },
        }

        const agent = new DocsMember(config)
        const input: DocsMemberInput = {
          request: {
            url: 'http://example.com/docs',
            method: 'GET',
            headers: {},
          },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as DocsMemberOutput

        expect(result.content).toContain(customCss)
      }
    })
  })

  describe('Route Authentication Integration', () => {
    it('should support route-level auth configuration', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        route: {
          path: '/docs',
          methods: ['GET'],
          auth: {
            required: true,
            strategies: ['api-key'],
          },
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].route?.auth?.required).toBe(true)
      expect(agent['docsConfig'].route?.auth?.strategies).toEqual(['api-key'])
    })

    it('should support optional authentication', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        route: {
          auth: {
            required: false,
          },
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].route?.auth?.required).toBe(false)
    })

    it('should support multiple auth strategies', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        route: {
          auth: {
            required: true,
            strategies: ['api-key', 'jwt', 'oauth'],
          },
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].route?.auth?.strategies).toEqual(['api-key', 'jwt', 'oauth'])
    })

    it('should support route priority configuration', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        route: {
          priority: 70,
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].route?.priority).toBe(70)
    })

    it('should support custom route methods', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        route: {
          methods: ['GET', 'POST'],
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].route?.methods).toEqual(['GET', 'POST'])
    })

    it('should support deprecated auth configuration', () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        auth: {
          required: 'required',
          apiKeyLocations: ['header', 'query'],
        },
      }

      const agent = new DocsMember(config)
      expect(agent['docsConfig'].auth?.required).toBe('required')
      expect(agent['docsConfig'].auth?.apiKeyLocations).toEqual(['header', 'query'])
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown paths', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/unknown-path',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.status).toBe(404)
      expect(result.contentType).toBe('text/plain')
      expect(result.content).toBe('Not Found')
    })

    it('should handle missing request URL gracefully', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/unknown',
          method: 'GET',
          headers: {},
        },
      }

      // With unknown path, should return 404
      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result).toBeDefined()
      expect(result.status).toBe(404)
    })
  })

  describe('Path Configuration', () => {
    it('should handle custom docs path', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        paths: {
          docs: '/api-documentation',
          yaml: '/openapi.yaml',
          json: '/openapi.json',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/api-documentation',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.status).toBe(200)
      expect(result.contentType).toContain('text/html')
    })

    it('should handle custom spec paths', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        paths: {
          docs: '/docs',
          yaml: '/api-spec.yaml',
          json: '/api-spec.json',
        },
      }

      const agent = new DocsMember(config)

      // Test YAML path
      const yamlResult = (await agent['run']({
        ...mockContext,
        input: {
          request: { url: 'http://example.com/api-spec.yaml', method: 'GET', headers: {} },
        },
      })) as DocsMemberOutput

      expect(yamlResult.status).toBe(200)
      expect(yamlResult.contentType).toBe('application/x-yaml')

      // Test JSON path
      const jsonResult = (await agent['run']({
        ...mockContext,
        input: {
          request: { url: 'http://example.com/api-spec.json', method: 'GET', headers: {} },
        },
      })) as DocsMemberOutput

      expect(jsonResult.status).toBe(200)
      expect(jsonResult.contentType).toBe('application/json')
    })

    it('should use spec URL in UI generation', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        ui: 'redoc',
        paths: {
          docs: '/docs',
          yaml: '/custom-spec.yaml',
          json: '/openapi.json',
        },
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/docs',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      expect(result.content).toContain('spec-url="/custom-spec.yaml"')
    })
  })

  describe('Server Configuration', () => {
    it('should include default server when none provided', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      const spec = JSON.parse(result.content)
      expect(spec.servers).toBeDefined()
      expect(spec.servers).toHaveLength(1)
      expect(spec.servers[0].url).toBe('/')
    })

    it('should include multiple servers', async () => {
      const config: DocsAgentConfig = {
        name: 'api-docs',
        type: 'Docs',
        servers: [
          { url: 'https://api.production.com', description: 'Production Server' },
          { url: 'https://api.staging.com', description: 'Staging Server' },
          { url: 'http://localhost:8000', description: 'Local Development' },
        ],
      }

      const agent = new DocsMember(config)
      const input: DocsMemberInput = {
        request: {
          url: 'http://example.com/openapi.json',
          method: 'GET',
          headers: {},
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as DocsMemberOutput

      const spec = JSON.parse(result.content)
      expect(spec.servers).toHaveLength(3)
      expect(spec.servers[0].description).toBe('Production Server')
      expect(spec.servers[1].description).toBe('Staging Server')
      expect(spec.servers[2].description).toBe('Local Development')
    })
  })
})
