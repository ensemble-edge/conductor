/**
 * ThinkAgent Tests with Dependency Injection
 *
 * Tests AI reasoning agent with mock providers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThinkAgent } from '../../../src/agents/think-agent';
import type { AgentConfig } from '../../../src/runtime/parser';
import type { AIProviderConfig, AIProviderResponse, AIMessage, AIProviderRequest } from '../../../src/agents/think-providers';
import { AIProvider } from '../../../src/types/constants';
import type { ConductorEnv } from '../../../src/types/env';
import { Operation } from '../../../src/types/constants';

// Mock Provider for testing
class MockAIProvider {
	private mockResponse: AIProviderResponse | Error;

	constructor(response: AIProviderResponse | Error) {
		this.mockResponse = response;
	}

	async execute(_request: AIProviderRequest): Promise<AIProviderResponse> {
		if (this.mockResponse instanceof Error) {
			throw this.mockResponse;
		}
		return this.mockResponse;
	}

	getConfigError(_config: AIProviderConfig, _env: ConductorEnv): string | null {
		return null;
	}
}

// Mock Provider Registry - minimal implementation for testing
class MockProviderRegistry {
	private providers = new Map<string, any>();

	register(id: string, provider: any): void {
		this.providers.set(id, provider);
	}

	get(id: string): any {
		return this.providers.get(id) || null;
	}

	getProviderIds(): string[] {
		return Array.from(this.providers.keys());
	}
}

describe('ThinkAgent', () => {
	let mockRegistry: MockProviderRegistry;
	let mockEnv: Partial<ConductorEnv>;

	beforeEach(() => {
		mockRegistry = new MockProviderRegistry();
		mockEnv = {
			AI: {} as any,
		};
	});

	describe('Constructor and Configuration', () => {
		it('should initialize with default config', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('claude-3-5-haiku-20241022');
			expect(thinkConfig.provider).toBe(AIProvider.Anthropic);
			expect(thinkConfig.temperature).toBe(0.7);
			expect(thinkConfig.maxTokens).toBe(1000);
		});

		it('should auto-detect Cloudflare provider from @cf/ model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					model: '@cf/meta/llama-3.1-8b-instruct',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('@cf/meta/llama-3.1-8b-instruct');
			expect(thinkConfig.provider).toBe(AIProvider.Cloudflare);
		});

		it('should auto-detect OpenAI provider from gpt- model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					model: 'gpt-4-turbo',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('gpt-4-turbo');
			expect(thinkConfig.provider).toBe(AIProvider.OpenAI);
		});

		it('should auto-detect Anthropic provider from claude- model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					model: 'claude-3-opus-20240229',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('claude-3-opus-20240229');
			expect(thinkConfig.provider).toBe(AIProvider.Anthropic);
		});

		it('should respect explicitly set provider even with auto-detection', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					model: '@cf/meta/llama-3.1-8b-instruct',
					provider: AIProvider.Custom, // Explicitly override
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('@cf/meta/llama-3.1-8b-instruct');
			expect(thinkConfig.provider).toBe(AIProvider.Custom); // Should use explicit value
		});

		it('should accept custom config', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					model: 'gpt-4',
					provider: AIProvider.OpenAI,
					temperature: 0.5,
					maxTokens: 2000,
					systemPrompt: 'You are a helpful assistant.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('gpt-4');
			expect(thinkConfig.provider).toBe(AIProvider.OpenAI);
			expect(thinkConfig.temperature).toBe(0.5);
			expect(thinkConfig.maxTokens).toBe(2000);
			expect(thinkConfig.systemPrompt).toBe('You are a helpful assistant.');
		});

		it('should use injected provider registry', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			expect(agent).toBeDefined();
		});
	});

	describe('Provider Execution', () => {
		it('should execute with mock provider successfully', async () => {
			const mockResponse: AIProviderResponse = {
				content: 'Hello, this is a test response!',
				model: 'claude-3-5-haiku-20241022',
				provider: 'anthropic',
				tokensUsed: 18,
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					provider: AIProvider.Anthropic,
					systemPrompt: 'You are a test assistant.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Hello!' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			// New output structure: content at top level, metadata in _meta
			expect(result.data).toHaveProperty('content', 'Hello, this is a test response!');
			expect(result.data).toHaveProperty('_meta');
			expect((result.data as any)._meta.model).toBe('claude-3-5-haiku-20241022');
			expect((result.data as any)._meta.provider).toBe('anthropic');
		});

		it('should map output to schema-defined field when schema has single field', async () => {
			const mockResponse: AIProviderResponse = {
				content: 'Hello Alice!',
				model: 'claude-3-5-haiku-20241022',
				provider: 'anthropic',
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					provider: AIProvider.Anthropic,
				},
				schema: {
					output: {
						greeting: 'string',  // Single field schema
					},
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Say hello' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			// Output should use schema-defined field name, not 'content'
			expect(result.data).toHaveProperty('greeting', 'Hello Alice!');
			expect(result.data).toHaveProperty('_meta');
			expect((result.data as any)._meta.model).toBe('claude-3-5-haiku-20241022');
		});

		it('should parse JSON response and spread fields', async () => {
			const mockResponse: AIProviderResponse = {
				content: '{"sentiment": "positive", "confidence": 0.95}',
				model: 'claude-3-5-haiku-20241022',
				provider: 'anthropic',
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Analyze sentiment' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			// JSON response should be parsed and spread to top level
			expect(result.data).toHaveProperty('sentiment', 'positive');
			expect(result.data).toHaveProperty('confidence', 0.95);
			expect(result.data).toHaveProperty('_meta');
		});

		it('should handle provider errors', async () => {
			const mockError = new Error('AI service unavailable');
			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockError));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Hello!' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('AI service unavailable');
		});

		it('should throw error for unknown provider', async () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					provider: 'unknown-provider' as AIProvider,
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Hello!' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unknown AI provider');
		});
	});

	describe('Message Building', () => {
		it('should build messages from simple prompt', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					systemPrompt: 'You are helpful.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: { prompt: 'What is 2+2?' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedMessages).toHaveLength(2);
			expect(capturedMessages[0].role).toBe('system');
			expect(capturedMessages[0].content).toBe('You are helpful.');
			expect(capturedMessages[1].role).toBe('user');
			expect(capturedMessages[1].content).toBe('What is 2+2?');
		});

		it('should build messages from messages array', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: {
					messages: [
						{ role: 'user', content: 'Hello' },
						{ role: 'assistant', content: 'Hi there!' },
						{ role: 'user', content: 'How are you?' },
					],
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedMessages).toHaveLength(3);
			expect(capturedMessages[0].content).toBe('Hello');
			expect(capturedMessages[1].content).toBe('Hi there!');
			expect(capturedMessages[2].content).toBe('How are you?');
		});

		it('should build messages from structured input', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: {
					name: 'Alice',
					age: 30,
					city: 'San Francisco',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedMessages).toHaveLength(1);
			expect(capturedMessages[0].role).toBe('user');
			expect(capturedMessages[0].content).toContain('name: Alice');
			expect(capturedMessages[0].content).toContain('age: 30');
			expect(capturedMessages[0].content).toContain('city: San Francisco');
		});
	});

	describe('Configuration Validation', () => {
		it('should validate provider config', async () => {
			const mockProvider = {
				async execute() {
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: (config: AIProviderConfig) => {
					// Custom validation - check for specific API key pattern
					if (config.apiKey && !config.apiKey.startsWith('sk-')) {
						return 'Invalid API key format';
					}
					return null;
				},
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					apiKey: 'invalid-key', // Invalid API key format
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Hello' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Invalid API key format');
		});
	});

	describe('Response Handling', () => {
		it('should return tokens used in _meta', async () => {
			const mockResponse: AIProviderResponse = {
				content: 'Test response',
				model: 'claude-3-5-haiku-20241022',
				provider: 'anthropic',
				tokensUsed: 150,
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Test' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty('_meta');
			expect((result.data as any)._meta.tokensUsed).toBe(150);
		});

		it('should handle responses without token metrics', async () => {
			const mockResponse: AIProviderResponse = {
				content: 'Test response',
				model: 'claude-3-5-haiku-20241022',
				provider: 'anthropic',
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			const result = await agent.execute({
				input: { prompt: 'Test' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty('content', 'Test response');
		});
	});

	describe('Template Rendering', () => {
		it('should render Handlebars templates in systemPrompt', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					systemPrompt: 'Hello {{input.name}}, your role is {{input.role}}!',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: { name: 'Alice', role: 'engineer' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			// System prompt should have rendered template variables
			expect(capturedMessages).toHaveLength(2);
			expect(capturedMessages[0].role).toBe('system');
			expect(capturedMessages[0].content).toBe('Hello Alice, your role is engineer!');
		});

		it('should handle nested properties in templates', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					systemPrompt: 'User: {{input.user.name}}, Email: {{input.user.email}}',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: {
					user: {
						name: 'Bob',
						email: 'bob@example.com',
					},
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedMessages[0].content).toBe('User: Bob, Email: bob@example.com');
		});

		it('should handle undefined variables gracefully', async () => {
			let capturedMessages: AIMessage[] = [];

			const mockProvider = {
				async execute(request: AIProviderRequest) {
					capturedMessages = request.messages;
					return { content: 'response', model: 'test', provider: 'test' };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: Operation.think,
				config: {
					systemPrompt: 'Hello {{input.name}}, optional: {{input.optional}}',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry as any);
			await agent.execute({
				input: { name: 'Charlie' }, // missing 'optional' field
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			// Should replace undefined with empty string
			expect(capturedMessages[0].content).toBe('Hello Charlie, optional: ');
		});
	});
});
