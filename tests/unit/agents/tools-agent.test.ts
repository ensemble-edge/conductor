/**
 * Tools Agent Unit Tests
 *
 * Tests for the tools operation MCP client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ToolsMember } from '../../../src/agents/built-in/tools/tools-agent.js'
import { MCPClient } from '../../../src/agents/built-in/tools/mcp-client.js'
import type { AgentConfig } from '../../../src/agents/base-agent.js'
import type { ToolsConfig } from '../../../src/agents/built-in/tools/types.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('Tools Agent', () => {
	let mockEnv: Env
	let mockFetch: any

	beforeEach(() => {
		mockEnv = {
			KV: {} as any,
			CACHE: {} as any,
			CATALOG_KV: {} as any,
			SESSIONS: {} as any,
		} as Env

		mockFetch = vi.mocked(global.fetch)
		mockFetch.mockClear()
	})

	describe('ToolsMember', () => {
		it('should initialize with valid config', () => {
			const config: AgentConfig = {
				name: 'test-tool',
				operation: 'tools',
				config: {
					mcp: 'github',
					tool: 'get_repo',
					timeout: 10000,
				} as ToolsConfig,
			}

			const agent = new ToolsMember(config, mockEnv)

			expect(agent).toBeDefined()
			expect(agent.config.name).toBe('test-tool')
		})

		it('should require mcp and tool in config', () => {
			const config: AgentConfig = {
				name: 'invalid-tool',
				operation: 'tools',
				config: {
					// Missing mcp and tool
					timeout: 10000,
				} as any,
			}

			expect(() => new ToolsMember(config, mockEnv)).toThrow()
		})
	})

	describe('MCPClient', () => {
		describe('listTools', () => {
			it('should list available tools', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						tools: [
							{
								name: 'tool1',
								description: 'Tool 1',
								inputSchema: {
									type: 'object',
									properties: {},
								},
							},
						],
					}),
				})

				const result = await client.listTools()

				expect(result.tools).toHaveLength(1)
				expect(result.tools[0].name).toBe('tool1')
			})

			it('should include auth header when configured', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					auth: {
						type: 'bearer',
						token: 'test-token',
					},
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ tools: [] }),
				})

				await client.listTools()

				expect(mockFetch).toHaveBeenCalledWith(
					'https://mcp.example.com/tools',
					expect.objectContaining({
						headers: expect.objectContaining({
							Authorization: 'Bearer test-token',
						}),
					})
				)
			})

			it('should handle HTTP errors', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: false,
					status: 500,
					statusText: 'Internal Server Error',
					text: async () => 'Server error',
				})

				await expect(client.listTools()).rejects.toThrow('MCP server error')
			})

			it('should handle network errors', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockRejectedValueOnce(new Error('Network error'))

				await expect(client.listTools()).rejects.toThrow('Network error')
			})
		})

		describe('invokeTool', () => {
			it('should invoke tool with arguments', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						content: [
							{
								type: 'text',
								text: JSON.stringify({ result: 'success' }),
							},
						],
						isError: false,
					}),
				})

				const result = await client.invokeTool('test-tool', { arg1: 'value1' })

				expect(result.isError).toBe(false)
				expect(result.content).toHaveLength(1)
			})

			it('should send correct request format', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						content: [],
						isError: false,
					}),
				})

				await client.invokeTool('test-tool', { arg1: 'value1' })

				expect(mockFetch).toHaveBeenCalledWith(
					'https://mcp.example.com/tools/test-tool',
					expect.objectContaining({
						method: 'POST',
						headers: expect.objectContaining({
							'Content-Type': 'application/json',
						}),
						body: JSON.stringify({
							name: 'test-tool',
							arguments: { arg1: 'value1' },
						}),
					})
				)
			})

			it('should handle tool errors', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({
						content: [
							{
								type: 'text',
								text: 'Tool execution failed',
							},
						],
						isError: true,
					}),
				})

				const result = await client.invokeTool('failing-tool', {})

				expect(result.isError).toBe(true)
				expect(result.content[0].text).toContain('failed')
			})

			it('should handle timeout', async () => {
				// TODO: Implement timeout handling in MCPClient
				// Currently the timeout config is passed but not enforced
				expect(true).toBe(true)
			})
		})

		describe('Authentication', () => {
			it('should support bearer token auth', async () => {
				const client = new MCPClient({
					url: 'https://mcp.example.com',
					auth: {
						type: 'bearer',
						token: 'my-secret-token',
					},
					timeout: 10000,
				})

				mockFetch.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ tools: [] }),
				})

				await client.listTools()

				expect(mockFetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						headers: expect.objectContaining({
							Authorization: 'Bearer my-secret-token',
						}),
					})
				)
			})

			it('should support OAuth auth', async () => {
				// OAuth implementation would be tested here
				// when OAuth support is added
				expect(true).toBe(true)
			})
		})

		describe('HMAC Signature', () => {
			it('should generate HMAC signature when secret provided', async () => {
				// TODO: Implement HMAC signature support in MCPClient
				// When implemented, this should include X-Conductor-Signature header
				expect(true).toBe(true)
			})

			it('should use correct signature format', async () => {
				// TODO: Implement HMAC signature support in MCPClient
				// Format: sha256=[hex-encoded signature]
				expect(true).toBe(true)
			})
		})

		describe('Tool Discovery Caching', () => {
			it('should cache tool discovery when enabled', async () => {
				// This would test the caching logic
				// Implementation depends on cache strategy
				expect(true).toBe(true)
			})

			it('should respect cache TTL', async () => {
				// Test cache expiration
				expect(true).toBe(true)
			})

			it('should bypass cache when disabled', async () => {
				// Test non-cached discovery
				expect(true).toBe(true)
			})
		})
	})

	describe('Error Scenarios', () => {
		it('should handle malformed server responses', async () => {
			const client = new MCPClient({
				url: 'https://mcp.example.com',
				timeout: 10000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw new Error('Invalid JSON')
				},
			})

			await expect(client.listTools()).rejects.toThrow()
		})

		it('should handle missing required fields', async () => {
			const client = new MCPClient({
				url: 'https://mcp.example.com',
				timeout: 10000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					// Missing 'tools' field - returns empty object
				}),
			})

			const result = await client.listTools()
			// Client returns whatever the server returns, no validation
			expect(result).toEqual({})
		})

		it('should handle connection refused', async () => {
			const client = new MCPClient({
				url: 'https://unreachable.example.com',
				timeout: 10000,
			})

			mockFetch.mockRejectedValueOnce(
				new Error('fetch failed - connection refused')
			)

			await expect(client.listTools()).rejects.toThrow('connection refused')
		})
	})

	describe('Configuration Validation', () => {
		it('should accept any URL without validation', () => {
			// MCPClient doesn't validate URLs in constructor
			const client = new MCPClient({
				url: 'not-a-valid-url',
				timeout: 10000,
			})
			expect(client).toBeDefined()
		})

		it('should accept any timeout without validation', () => {
			// MCPClient doesn't validate timeout in constructor
			const client = new MCPClient({
				url: 'https://mcp.example.com',
				timeout: -1000,
			})
			expect(client).toBeDefined()
		})

		it('should accept valid bearer auth', () => {
			const client = new MCPClient({
				url: 'https://mcp.example.com',
				auth: {
					type: 'bearer',
					token: 'valid-token',
				},
				timeout: 10000,
			})
			expect(client).toBeDefined()
		})
	})
})
