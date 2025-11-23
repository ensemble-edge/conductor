/**
 * EmailAgent Tests
 *
 * Tests email agent with mocked providers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailAgent } from '../../../src/agents/email/email-agent';
import type { AgentConfig } from '../../../src/runtime/parser';
import type { ConductorEnv } from '../../../src/types/env';
import type { EmailProvider, EmailResult } from '../../../src/agents/email/types/index';

// Mock email provider
class MockEmailProvider implements EmailProvider {
	name = 'mock';
	sendFn = vi.fn();
	validateFn = vi.fn();

	async send(...args: any[]): Promise<EmailResult> {
		return this.sendFn(...args);
	}

	async validateConfig() {
		return this.validateFn();
	}
}

describe('EmailAgent', () => {
	let mockEnv: Partial<ConductorEnv>;
	let mockProvider: MockEmailProvider;

	beforeEach(() => {
		mockEnv = {
			RESEND_API_KEY: 'test-key',
		};

		mockProvider = new MockEmailProvider();
	});

	describe('Constructor and Configuration', () => {
		it('should initialize with Cloudflare provider config', () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'cloudflare',
						from: 'test@example.com',
						cloudflare: {
							binding: {} as any, // Mock Cloudflare Email binding
						},
					},
				},
			};

			const agent = new EmailAgent(config);
			expect(agent).toBeDefined();
		});

		it('should initialize with Resend provider config', () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'test@example.com',
					},
				},
			};

			const agent = new EmailAgent(config);
			expect(agent).toBeDefined();
		});

		it('should throw error without provider config', () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {},
			};

			expect(() => new EmailAgent(config)).toThrow('Email agent requires provider configuration');
		});

		it('should initialize with rate limiting', () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'test@example.com',
					},
					rateLimit: 5,
				},
			};

			const agent = new EmailAgent(config);
			expect(agent).toBeDefined();
		});

		it('should initialize with tracking enabled', () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'test@example.com',
					},
					tracking: true,
				},
			};

			const agent = new EmailAgent(config);
			expect(agent).toBeDefined();
		});
	});

	describe('Single Email Sending', () => {
		it('should send email with inline HTML', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			// Mock provider implementation
			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-123',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({
				valid: true,
			});

			// Inject mock provider
			const agent = new EmailAgent(config);
			(agent as any).provider = {
				send: mockSend,
				validateConfig: mockValidate,
			};

			const result = await agent.execute({
				input: {
					to: 'recipient@example.com',
					subject: 'Test Email',
					html: '<h1>Hello World</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.messageId).toBe('msg-123');
			expect(data.status).toBe('sent');
			expect(mockSend).toHaveBeenCalled();
		});

		it('should send email with plain text', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-456',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					to: 'recipient@example.com',
					subject: 'Test Email',
					text: 'Hello World',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.messageId).toBe('msg-456');
		});

		it('should send email with CC and BCC', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-789',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					to: 'recipient@example.com',
					cc: ['cc1@example.com', 'cc2@example.com'],
					bcc: 'bcc@example.com',
					subject: 'Test Email',
					html: '<h1>Test</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					to: 'recipient@example.com',
					cc: ['cc1@example.com', 'cc2@example.com'],
					bcc: 'bcc@example.com',
				})
			);
		});

		it('should send email with attachments', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-attach',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					to: 'recipient@example.com',
					subject: 'Test Email',
					html: '<h1>Test</h1>',
					attachments: [
						{
							filename: 'test.txt',
							content: 'Hello World',
						},
					],
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					attachments: [
						{
							filename: 'test.txt',
							content: 'Hello World',
						},
					],
				})
			);
		});
	});

	describe('Batch Email Sending', () => {
		it('should send batch emails', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
					rateLimit: 10,
				},
			};

			const mockSend = vi.fn()
				.mockResolvedValueOnce({
					messageId: 'msg-1',
					status: 'sent',
					provider: 'resend',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-2',
					status: 'sent',
					provider: 'resend',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-3',
					status: 'sent',
					provider: 'resend',
				});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Mock templateLoader to handle template rendering
			(agent as any).templateLoader = {
				render: vi.fn().mockImplementation(async (template, data) => {
					// Simple template rendering
					return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || '');
				}),
			};

			const result = await agent.execute({
				input: {
					recipients: [
						{ email: 'user1@example.com', data: { name: 'Alice' } },
						{ email: 'user2@example.com', data: { name: 'Bob' } },
						{ email: 'user3@example.com', data: { name: 'Charlie' } },
					],
					template: '<h1>Hello {{name}}</h1>',
					subject: 'Welcome',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.sent).toBe(3);
			expect(data.failed).toBe(0);
			expect(data.messageIds).toHaveLength(3);
			expect(mockSend).toHaveBeenCalledTimes(3);

			// Verify each email was personalized with template rendering
			expect(mockSend).toHaveBeenNthCalledWith(1, expect.objectContaining({
				html: '<h1>Hello Alice</h1>',
			}));
			expect(mockSend).toHaveBeenNthCalledWith(2, expect.objectContaining({
				html: '<h1>Hello Bob</h1>',
			}));
			expect(mockSend).toHaveBeenNthCalledWith(3, expect.objectContaining({
				html: '<h1>Hello Charlie</h1>',
			}));
		});

		it('should handle partial batch failures', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
					rateLimit: 10,
				},
			};

			// Mock provider validation first
			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const mockSend = vi.fn()
				.mockResolvedValueOnce({
					messageId: 'msg-1',
					status: 'sent',
					provider: 'resend',
				})
				.mockResolvedValueOnce({
					messageId: '',
					status: 'failed',
					provider: 'resend',
					error: 'Invalid email',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-3',
					status: 'sent',
					provider: 'resend',
				});

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Mock templateLoader to handle template rendering
			(agent as any).templateLoader = {
				render: vi.fn().mockImplementation(async (template, data) => {
					return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || '');
				}),
			};

			const result = await agent.execute({
				input: {
					recipients: [
						{ email: 'user1@example.com', data: {} },
						{ email: 'invalid', data: {} },
						{ email: 'user3@example.com', data: {} },
					],
					template: '<h1>Hello</h1>',
					subject: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.sent).toBe(2);
			expect(data.failed).toBe(1);
			expect(data.errors).toBeDefined();
			expect(data.errors).toHaveLength(1);
		});

		it('should respect rate limiting', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
					rateLimit: 2, // 2 emails per second
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Mock templateLoader to handle template rendering
			(agent as any).templateLoader = {
				render: vi.fn().mockImplementation(async (template, data) => {
					return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || '');
				}),
			};

			const startTime = Date.now();

			await agent.execute({
				input: {
					recipients: [
						{ email: 'user1@example.com', data: {} },
						{ email: 'user2@example.com', data: {} },
						{ email: 'user3@example.com', data: {} },
					],
					template: '<h1>Test</h1>',
					subject: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should take at least 1 second (3 emails at 2/sec = ~1.5s with rate limiting)
			expect(duration).toBeGreaterThanOrEqual(900);
			expect(mockSend).toHaveBeenCalledTimes(3);
		});
	});

	describe('Template Rendering', () => {
		it('should render Handlebars variables', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'resend',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Mock templateLoader to handle template rendering
			(agent as any).templateLoader = {
				render: vi.fn().mockImplementation(async (template, data) => {
					return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || '');
				}),
			};

			await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Welcome',
					template: '<h1>Hello {{name}}</h1><p>{{message}}</p>',
					data: {
						name: 'Alice',
						message: 'Welcome to our service!',
					},
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					html: '<h1>Hello Alice</h1><p>Welcome to our service!</p>',
					subject: 'Welcome',
				})
			);
		});

		it('should generate plain text from HTML', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			let capturedMessage: any;
			const mockSend = vi.fn().mockImplementation((msg) => {
				capturedMessage = msg;
				return Promise.resolve({
					messageId: 'msg',
					status: 'sent',
					provider: 'resend',
				});
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Mock templateLoader to handle template rendering
			(agent as any).templateLoader = {
				render: vi.fn().mockImplementation(async (template, data) => {
					return template; // Return as-is for this test
				}),
			};

			await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Test',
					template: '<h1>Hello</h1><p>This is a test</p>',
					data: {}, // Need to provide data for template rendering
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalled();
			expect(capturedMessage).toBeDefined();
			expect(capturedMessage.text).toBeDefined();
			expect(capturedMessage.text).toContain('Hello');
			expect(capturedMessage.text).toContain('This is a test');
			expect(capturedMessage.text).not.toContain('<');
		});
	});

	describe('Error Handling', () => {
		it('should handle provider validation errors', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockValidate = vi.fn().mockResolvedValue({
				valid: false,
				errors: ['Invalid API key', 'Missing configuration'],
			});

			const agent = new EmailAgent(config);
			(agent as any).provider = {
				validateConfig: mockValidate,
			};

			const result = await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Test',
					html: '<h1>Test</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Provider validation failed');
		});

		it('should handle send failures', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: '',
				status: 'failed',
				provider: 'resend',
				error: 'Rate limit exceeded',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Test',
					html: '<h1>Test</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Email send failed');
			expect(result.error).toContain('Rate limit exceeded');
		});
	});

	describe('Tracking Headers', () => {
		it('should add tracking headers when enabled', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
					tracking: true,
				},
			};

			let capturedMessage: any;
			const mockSend = vi.fn().mockImplementation((msg) => {
				capturedMessage = msg;
				return Promise.resolve({
					messageId: 'msg',
					status: 'sent',
					provider: 'resend',
				});
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Test',
					html: '<h1>Test</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
				state: { ensembleName: 'test-ensemble' },
			});

			expect(capturedMessage.headers).toBeDefined();
			expect(capturedMessage.headers['X-Conductor-Tracking']).toBe('enabled');
			expect(capturedMessage.headers['X-Conductor-Ensemble']).toBe('test-ensemble');
		});

		it('should not add tracking headers when disabled', async () => {
			const config: AgentConfig = {
				name: 'test-email',
				type: 'email',
				config: {
					provider: {
						provider: 'resend',
						resend: {
							apiKey: 'test-key',
						},
						from: 'sender@example.com',
					},
					tracking: false,
				},
			};

			let capturedMessage: any;
			const mockSend = vi.fn().mockImplementation((msg) => {
				capturedMessage = msg;
				return Promise.resolve({
					messageId: 'msg',
					status: 'sent',
					provider: 'resend',
				});
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new EmailAgent(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					to: 'user@example.com',
					subject: 'Test',
					html: '<h1>Test</h1>',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect((capturedMessage.headers || {})['X-Conductor-Tracking']).toBeUndefined();
		});
	});
});
