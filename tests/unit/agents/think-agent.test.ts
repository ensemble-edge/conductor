/**
 * ThinkAgent Tests with Dependency Injection
 *
 * Tests AI reasoning agent with mock providers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThinkAgent } from '../../../src/agents/think-agent';
import type { AgentConfig } from '../../../src/runtime/parser';
import type { ProviderRegistry, AIProvider as AIProviderInterface, AIProviderConfig, AIProviderResponse, AIMessage } from '../../../src/agents/think-providers';
import { AIProvider } from '../../../src/types/constants';
import type { ConductorEnv } from '../../../src/types/env';

// Mock Provider for testing
class MockAIProvider implements AIProviderInterface {
	private mockResponse: AIProviderResponse | Error;

	constructor(response: AIProviderResponse | Error) {
		this.mockResponse = response;
	}

	async execute(params: { messages: AIMessage[]; config: AIProviderConfig; env: ConductorEnv }): Promise<AIProviderResponse> {
		if (this.mockResponse instanceof Error) {
			throw this.mockResponse;
		}
		return this.mockResponse;
	}

	getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null {
		// Mock validation - check for required fields
		if (!config.model) {
			return 'Model is required';
		}
		return null;
	}
}

// Mock Provider Registry
class MockProviderRegistry implements ProviderRegistry {
	private providers = new Map<string, AIProviderInterface>();

	register(id: string, provider: AIProviderInterface): void {
		this.providers.set(id, provider);
	}

	get(id: string): AIProviderInterface | undefined {
		return this.providers.get(id);
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
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('claude-3-5-haiku-20241022');
			expect(thinkConfig.provider).toBe(AIProvider.Anthropic);
			expect(thinkConfig.temperature).toBe(0.7);
			expect(thinkConfig.maxTokens).toBe(1000);
		});

		it('should auto-detect Cloudflare provider from @cf/ model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					model: '@cf/meta/llama-3.1-8b-instruct',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('@cf/meta/llama-3.1-8b-instruct');
			expect(thinkConfig.provider).toBe(AIProvider.Cloudflare);
		});

		it('should auto-detect OpenAI provider from gpt- model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					model: 'gpt-4-turbo',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('gpt-4-turbo');
			expect(thinkConfig.provider).toBe(AIProvider.OpenAI);
		});

		it('should auto-detect Anthropic provider from claude- model prefix', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					model: 'claude-3-opus-20240229',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('claude-3-opus-20240229');
			expect(thinkConfig.provider).toBe(AIProvider.Anthropic);
		});

		it('should respect explicitly set provider even with auto-detection', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					model: '@cf/meta/llama-3.1-8b-instruct',
					provider: AIProvider.Custom, // Explicitly override
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const thinkConfig = agent.getThinkConfig();

			expect(thinkConfig.model).toBe('@cf/meta/llama-3.1-8b-instruct');
			expect(thinkConfig.provider).toBe(AIProvider.Custom); // Should use explicit value
		});

		it('should accept custom config', () => {
			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					model: 'gpt-4',
					provider: AIProvider.OpenAI,
					temperature: 0.5,
					maxTokens: 2000,
					systemPrompt: 'You are a helpful assistant.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
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
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
			expect(agent).toBeDefined();
		});
	});

	describe('Provider Execution', () => {
		it('should execute with mock provider successfully', async () => {
			const mockResponse: AIProviderResponse = {
				message: 'Hello, this is a test response!',
				usage: {
					inputTokens: 10,
					outputTokens: 8,
				},
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					provider: AIProvider.Anthropic,
					systemPrompt: 'You are a test assistant.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const result = await agent.execute({
				input: { prompt: 'Hello!' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockResponse);
		});

		it('should handle provider errors', async () => {
			const mockError = new Error('AI service unavailable');
			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockError));

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
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
				operation: 'think',
				config: {
					provider: 'unknown-provider' as AIProvider,
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
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

			const mockProvider: AIProviderInterface = {
				async execute(params) {
					capturedMessages = params.messages;
					return { message: 'response', usage: { inputTokens: 5, outputTokens: 3 } };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
				config: {
					systemPrompt: 'You are helpful.',
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
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

			const mockProvider: AIProviderInterface = {
				async execute(params) {
					capturedMessages = params.messages;
					return { message: 'response', usage: { inputTokens: 5, outputTokens: 3 } };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
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

			const mockProvider: AIProviderInterface = {
				async execute(params) {
					capturedMessages = params.messages;
					return { message: 'response', usage: { inputTokens: 5, outputTokens: 3 } };
				},
				getConfigError: () => null,
			};

			mockRegistry.register(AIProvider.Anthropic, mockProvider);

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
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
			const mockProvider: AIProviderInterface = {
				async execute() {
					return { message: 'response', usage: { inputTokens: 5, outputTokens: 3 } };
				},
				getConfigError: (config) => {
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
				operation: 'think',
				config: {
					apiKey: 'invalid-key', // Invalid API key format
				},
			};

			const agent = new ThinkAgent(config, mockRegistry);
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
		it('should return usage metrics', async () => {
			const mockResponse: AIProviderResponse = {
				message: 'Test response',
				usage: {
					inputTokens: 100,
					outputTokens: 50,
				},
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const result = await agent.execute({
				input: { prompt: 'Test' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty('usage');
			expect((result.data as AIProviderResponse).usage?.inputTokens).toBe(100);
			expect((result.data as AIProviderResponse).usage?.outputTokens).toBe(50);
		});

		it('should handle responses without usage metrics', async () => {
			const mockResponse: AIProviderResponse = {
				message: 'Test response',
			};

			mockRegistry.register(AIProvider.Anthropic, new MockAIProvider(mockResponse));

			const config: AgentConfig = {
				name: 'test-think',
				operation: 'think',
			};

			const agent = new ThinkAgent(config, mockRegistry);
			const result = await agent.execute({
				input: { prompt: 'Test' },
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty('message');
		});
	});
});
