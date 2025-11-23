/**
 * APIAgent Tests with Mock Fetch
 *
 * Tests HTTP request agent with mocked fetch responses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIAgent } from '../../../src/agents/api-agent';
import type { AgentConfig } from '../../../src/runtime/parser';
import type { ConductorEnv } from '../../../src/types/env';

// Mock Response helper
class MockResponse {
	constructor(
		private body: any,
		private init: ResponseInit = {}
	) {}

	get ok() {
		const status = this.init.status || 200;
		return status >= 200 && status < 300;
	}

	get status() {
		return this.init.status || 200;
	}

	get statusText() {
		return this.init.statusText || 'OK';
	}

	get headers() {
		const headers = new Map(Object.entries(this.init.headers || {}));
		headers.set('content-type', this.init.headers?.['content-type'] || 'application/json');
		return {
			get: (key: string) => headers.get(key),
			entries: () => headers.entries(),
		};
	}

	async json() {
		return this.body;
	}

	async text() {
		return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
	}
}

describe('APIAgent', () => {
	let mockEnv: Partial<ConductorEnv>;
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		mockEnv = {
			API_KEY: 'test-api-key-123',
			API_SECRET: 'test-secret',
		};

		// Save original fetch
		originalFetch = global.fetch;
	});

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch;
	});

	describe('Constructor and Configuration', () => {
		it('should initialize with default config', () => {
			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
				},
			};

			const agent = new APIAgent(config);
			expect(agent).toBeDefined();
		});

		it('should use default method GET', () => {
			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
				},
			};

			const agent = new APIAgent(config);
			expect(agent).toBeDefined();
		});

		it('should accept custom config', () => {
			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					method: 'POST',
					headers: {
						'Authorization': 'Bearer token',
					},
					timeout: 5000,
				},
			};

			const agent = new APIAgent(config);
			expect(agent).toBeDefined();
		});
	});

	describe('GET Requests', () => {
		it('should make successful GET request', async () => {
			const mockData = { id: 1, name: 'Test' };
			global.fetch = vi.fn().mockResolvedValue(
				new MockResponse(mockData, { status: 200 })
			);

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/users/1',
					method: 'GET',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.status).toBe(200);
			expect(data.data).toEqual(mockData);
		});

		it('should handle URL from input', async () => {
			const mockData = { success: true };
			let capturedUrl = '';

			global.fetch = vi.fn().mockImplementation((url: string) => {
				capturedUrl = url;
				return Promise.resolve(new MockResponse(mockData));
			});

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: { url: 'https://dynamic.api.com/endpoint' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(capturedUrl).toBe('https://dynamic.api.com/endpoint');
		});

		it('should handle text responses', async () => {
			global.fetch = vi.fn().mockResolvedValue(
				new MockResponse('Plain text response', {
					status: 200,
					headers: { 'content-type': 'text/plain' },
				})
			);

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/text',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.data).toBe('Plain text response');
		});
	});

	describe('POST Requests', () => {
		it('should make POST request with JSON body', async () => {
			let capturedBody = '';
			let capturedHeaders: Record<string, string> = {};

			global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
				capturedBody = init?.body as string;
				capturedHeaders = init?.headers as Record<string, string>;
				return Promise.resolve(new MockResponse({ created: true, id: 123 }, { status: 201 }));
			});

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/users',
					method: 'POST',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {
					body: { name: 'Alice', email: 'alice@example.com' },
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(JSON.parse(capturedBody)).toEqual({ name: 'Alice', email: 'alice@example.com' });
			expect(capturedHeaders['content-type']).toBe('application/json');
		});

		it('should handle string body', async () => {
			let capturedBody = '';

			global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
				capturedBody = init?.body as string;
				return Promise.resolve(new MockResponse({ success: true }));
			});

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					method: 'POST',
				},
			};

			const agent = new APIAgent(config);
			await agent.execute({
				input: {
					body: 'raw string data',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedBody).toBe('raw string data');
		});
	});

	describe('Headers', () => {
		it('should send custom headers', async () => {
			let capturedHeaders: Record<string, string> = {};

			global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
				capturedHeaders = init?.headers as Record<string, string>;
				return Promise.resolve(new MockResponse({ success: true }));
			});

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					headers: {
						'Authorization': 'Bearer test-token',
						'X-Custom-Header': 'custom-value',
					},
				},
			};

			const agent = new APIAgent(config);
			await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedHeaders['Authorization']).toBe('Bearer test-token');
			expect(capturedHeaders['X-Custom-Header']).toBe('custom-value');
		});

		it('should resolve env variables in headers', async () => {
			let capturedHeaders: Record<string, string> = {};

			global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
				capturedHeaders = init?.headers as Record<string, string>;
				return Promise.resolve(new MockResponse({ success: true }));
			});

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					headers: {
						'Authorization': 'Bearer ${env.API_KEY}',
						'X-Secret': '${env.API_SECRET}',
					},
				},
			};

			const agent = new APIAgent(config);
			await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedHeaders['Authorization']).toBe('Bearer test-api-key-123');
			expect(capturedHeaders['X-Secret']).toBe('test-secret');
		});
	});

	describe('Error Handling', () => {
		it('should handle HTTP errors', async () => {
			global.fetch = vi.fn().mockResolvedValue(
				new MockResponse({ error: 'Not found' }, { status: 404, statusText: 'Not Found' })
			);

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/missing',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('404');
		});

		it('should handle network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					retries: 0,
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Network error');
		});

		it('should require URL', async () => {
			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('requires a URL');
		});
	});

	describe('Response Handling', () => {
		it('should include response headers', async () => {
			global.fetch = vi.fn().mockResolvedValue(
				new MockResponse({ data: 'test' }, {
					status: 200,
					headers: {
						'x-request-id': 'req-123',
						'x-rate-limit': '100',
					},
				})
			);

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: {},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.headers).toBeDefined();
			expect(data.headers['x-request-id']).toBe('req-123');
		});

		it('should include status code', async () => {
			global.fetch = vi.fn().mockResolvedValue(
				new MockResponse({ message: 'Created' }, { status: 201 })
			);

			const config: AgentConfig = {
				name: 'test-api',
				operation: 'http',
				config: {
					url: 'https://api.example.com/data',
					method: 'POST',
				},
			};

			const agent = new APIAgent(config);
			const result = await agent.execute({
				input: { body: { name: 'test' } },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.status).toBe(201);
		});
	});
});
