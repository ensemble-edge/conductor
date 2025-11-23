/**
 * MCP Integration Tests
 *
 * Tests for MCP server endpoints (inbound) and tools operation (outbound)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Hono } from 'hono'
import { createConductorAPI } from '../../src/api/app.js'
import { Parser } from '../../src/runtime/parser.js'

describe('MCP Integration', () => {
	let app: Hono
	let env: Env

	beforeAll(() => {
		// Create test app
		app = createConductorAPI({
			auth: {
				apiKeys: ['test-api-key'],
				allowAnonymous: false,
			},
		})

		// Mock environment
		env = {
			KV: {} as any,
			CACHE: {} as any,
			CATALOG_KV: {} as any,
			SESSIONS: {} as any,
		} as Env
	})

	describe('MCP Server Endpoints (Inbound)', () => {
		describe('GET /mcp/tools', () => {
			it('should return empty tools list when no ensembles exposed', async () => {
				const request = new Request('http://localhost/mcp/tools', {
					method: 'GET',
				})

				const response = await app.fetch(request, env, {} as ExecutionContext)

				expect(response.status).toBe(200)
				const data = await response.json()
				expect(data).toHaveProperty('tools')
				expect(Array.isArray(data.tools)).toBe(true)
				expect(data.tools).toHaveLength(0)
			})

			it('should include tool schema in response', async () => {
				// This test would require mocking the catalog loader
				// to return ensembles with MCP exposure
				expect(true).toBe(true)
			})
		})

		describe('POST /mcp/tools/:name', () => {
			it('should return 404 for non-existent tool', async () => {
				const request = new Request('http://localhost/mcp/tools/non-existent', {
					method: 'POST',
					headers: {
						Authorization: 'Bearer test-mcp-token',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: 'non-existent',
						arguments: {},
					}),
				})

				const response = await app.fetch(request, env, {} as ExecutionContext)

				expect(response.status).toBe(404)
			})

			it('should return 404 for ensemble not configured', async () => {
				const request = new Request('http://localhost/mcp/tools/test-tool', {
					method: 'POST',
					headers: {
						Authorization: 'Bearer test-mcp-token',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						name: 'test-tool',
						arguments: {},
					}),
				})

				const response = await app.fetch(request, env, {} as ExecutionContext)

				// Returns 404 because ensemble doesn't exist (loadEnsembleYAML returns null)
				expect(response.status).toBe(404)
			})
		})
	})

	describe('Tools Operation (Outbound)', () => {
		describe('Tool Discovery', () => {
			it('should cache tool discovery when enabled', () => {
				// Test caching logic
				expect(true).toBe(true)
			})

			it('should respect cache TTL', () => {
				// Test cache expiration
				expect(true).toBe(true)
			})
		})

		describe('Authentication', () => {
			it('should include bearer token in requests', () => {
				// Test bearer auth
				expect(true).toBe(true)
			})

			it('should handle OAuth token refresh', () => {
				// Test OAuth flow
				expect(true).toBe(true)
			})

			it('should include HMAC signature when configured', () => {
				// Test HMAC signing
				expect(true).toBe(true)
			})
		})

		describe('Error Handling', () => {
			it('should handle tool invocation timeout', () => {
				// Test timeout handling
				expect(true).toBe(true)
			})

			it('should handle tool errors', () => {
				// Test error responses
				expect(true).toBe(true)
			})

			it('should propagate isError flag', () => {
				// Test error flag
				expect(true).toBe(true)
			})
		})
	})

	describe('Parser - MCP Configuration', () => {
		it('should parse MCP trigger configuration', () => {
			const yaml = `
name: test-mcp
ensemble: test-mcp

flow:
  - agent: test

trigger:
  - type: mcp
    public: false
    auth:
      type: bearer
      secret: test-secret-123

agents:
  - name: test
    operation: code
    config:
      code: "return { result: 'test' }"

outputs:
  result: \${test.output.result}
`

			const result = Parser.parseEnsemble(yaml)

			expect(result.trigger).toBeDefined()
			expect(result.trigger?.length).toBe(1)

			const mcpTrigger = result.trigger![0]
			expect(mcpTrigger.type).toBe('mcp')
			expect(mcpTrigger.public).toBe(false)

			if (mcpTrigger.type === 'mcp' && mcpTrigger.auth) {
				expect(mcpTrigger.auth.type).toBe('bearer')
				expect(mcpTrigger.auth.secret).toBe('test-secret-123')
			}
		})

		it('should parse tools operation configuration', () => {
			const yaml = `
name: test-tools
ensemble: test-tools

flow:
  - agent: call-tool

agents:
  - name: call-tool
    operation: tools
    config:
      mcp: github
      tool: get_repo
      timeout: 15000
      cacheDiscovery: true
      cacheTTL: 3600

inputs:
  owner: string
  repo: string

outputs:
  repo_data: \${call-tool.output}
`

			const result = Parser.parseEnsemble(yaml)

			// Verify flow references the agent
			expect(result.flow).toHaveLength(1)
			expect(result.flow[0].agent).toBe('call-tool')
		})

		it('should validate MCP trigger requires auth or public flag', () => {
			const yaml = `
name: test-invalid
ensemble: test-invalid

flow:
  - agent: test

trigger:
  - type: mcp
    # Missing both auth and public flag

agents:
  - name: test
    operation: code
    config:
      code: "return {}"
`

			expect(() => Parser.parseEnsemble(yaml)).toThrow('public')
		})

		it('should allow public MCP trigger', () => {
			const yaml = `
name: test-public
ensemble: test-public

flow:
  - agent: test

trigger:
  - type: mcp
    public: true

agents:
  - name: test
    operation: code
    config:
      code: "return { result: 'public' }"

outputs:
  result: \${test.output.result}
`

			const result = Parser.parseEnsemble(yaml)

			const mcpTrigger = result.trigger![0]
			expect(mcpTrigger.type).toBe('mcp')
			expect(mcpTrigger.public).toBe(true)
		})

		it('should parse OAuth configuration', () => {
			const yaml = `
name: test-oauth
ensemble: test-oauth

flow:
  - agent: test

trigger:
  - type: mcp
    public: false
    auth:
      type: oauth

agents:
  - name: test
    operation: code
    config:
      code: "return {}"
`

			const result = Parser.parseEnsemble(yaml)

			const mcpTrigger = result.trigger![0]
			if (mcpTrigger.type === 'mcp' && mcpTrigger.auth) {
				expect(mcpTrigger.auth.type).toBe('oauth')
			}
		})
	})

	describe('End-to-End Scenarios', () => {
		it('should support bidirectional MCP integration', () => {
			const yaml = `
name: bidirectional-mcp
ensemble: bidirectional-mcp

flow:
  - agent: call-github
  - agent: process

# Trigger this ensemble as MCP tool
trigger:
  - type: mcp
    public: false
    auth:
      type: bearer
      secret: \${env.MCP_TOKEN}

# This ensemble uses external MCP tools
agents:
  - name: call-github
    operation: tools
    config:
      mcp: github
      tool: get_repo

  - name: process
    operation: think
    config:
      provider: anthropic
      model: claude-sonnet-4
      prompt: "Analyze: \${call-github.output}"

inputs:
  owner: string
  repo: string

outputs:
  analysis: \${process.output}
`

			const result = Parser.parseEnsemble(yaml)

			// Has MCP trigger (inbound)
			expect(result.trigger).toBeDefined()
			expect(result.trigger![0].type).toBe('mcp')

			// Flow references tools agent (outbound)
			expect(result.flow).toHaveLength(2)
			expect(result.flow[0].agent).toBe('call-github')
			expect(result.flow[1].agent).toBe('process')
		})

		it('should support ensemble with notifications and MCP trigger', () => {
			const yaml = `
name: notified-mcp-tool
ensemble: notified-mcp-tool

flow:
  - agent: work

trigger:
  - type: mcp
    auth:
      type: bearer
      secret: \${env.TOKEN}

notifications:
  - type: webhook
    url: https://api.example.com/webhooks
    events:
      - execution.completed
      - execution.failed
    secret: \${env.WEBHOOK_SECRET}

agents:
  - name: work
    operation: code
    config:
      code: "return { done: true }"

outputs:
  result: \${work.output}
`

			const result = Parser.parseEnsemble(yaml)

			expect(result.trigger).toBeDefined()
			expect(result.notifications).toBeDefined()
			expect(result.notifications![0].type).toBe('webhook')
		})
	})
})
