/**
 * SmsMember Tests
 *
 * Tests SMS agent with mocked providers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmsMember } from '../../../src/agents/sms/sms-agent';
import type { AgentConfig } from '../../../src/runtime/parser';
import type { ConductorEnv } from '../../../src/types/env';
import type { SmsProvider, SmsResult } from '../../../src/agents/sms/types/index';

// Mock SMS provider
class MockSmsProvider implements SmsProvider {
	name = 'mock';
	sendFn = vi.fn();
	validateFn = vi.fn();

	async send(...args: any[]): Promise<SmsResult> {
		return this.sendFn(...args);
	}

	async validateConfig() {
		return this.validateFn();
	}
}

describe('SmsMember', () => {
	let mockEnv: Partial<ConductorEnv>;
	let mockProvider: MockSmsProvider;

	beforeEach(() => {
		mockEnv = {
			TWILIO_ACCOUNT_SID: 'test-sid',
			TWILIO_AUTH_TOKEN: 'test-token',
			TWILIO_PHONE_NUMBER: '+1234567890',
		};

		mockProvider = new MockSmsProvider();
	});

	describe('Constructor and Configuration', () => {
		it('should initialize with Twilio provider config', () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const agent = new SmsMember(config);
			expect(agent).toBeDefined();
		});

		it.skip('should initialize with Vonage provider config', () => {
			// Vonage provider not yet implemented
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'vonage',
						vonage: {
							apiKey: 'test-key',
							apiSecret: 'test-secret',
						},
						from: 'Acme',
					},
				},
			};

			const agent = new SmsMember(config);
			expect(agent).toBeDefined();
		});

		it('should throw error without provider config', () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {},
			};

			expect(() => new SmsMember(config)).toThrow('SMS agent requires provider configuration');
		});

		it('should initialize with rate limiting', () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
					rateLimit: 3,
				},
			};

			const agent = new SmsMember(config);
			expect(agent).toBeDefined();
		});
	});

	describe('Single SMS Sending', () => {
		it('should send SMS with simple body', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			// Mock provider implementation
			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-123',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({
				valid: true,
			});

			// Inject mock provider
			const agent = new SmsMember(config);
			(agent as any).provider = {
				send: mockSend,
				validateConfig: mockValidate,
			};

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Hello World',
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

		it('should send SMS with body containing template syntax', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-456',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Your verification code is: {{code}}',
					data: {
						code: '123456',
					},
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			const data = result.data as any;
			expect(data.messageId).toBe('msg-456');

			// Note: Single SMS sending doesn't render templates - template rendering
			// only happens in batch sending via the recipients array
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					body: 'Your verification code is: {{code}}',
					to: '+1234567891',
				})
			);
		});

		it('should send SMS with MMS media URLs', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg-789',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Check out this image!',
					mediaUrl: ['https://example.com/image.jpg'],
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					mediaUrl: ['https://example.com/image.jpg'],
				})
			);
		});

		it('should send SMS to multiple recipients via batch', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn()
				.mockResolvedValueOnce({
					messageId: 'msg-1',
					status: 'sent',
					provider: 'twilio',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-2',
					status: 'sent',
					provider: 'twilio',
				});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Use recipients array for batch sending
			const result = await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891', data: {} },
						{ phone: '+1234567892', data: {} },
					],
					body: 'Hello everyone',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(mockSend).toHaveBeenCalledTimes(2);
		});
	});

	describe('Batch SMS Sending', () => {
		it('should send batch SMS', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
					rateLimit: 10,
				},
			};

			const mockSend = vi.fn()
				.mockResolvedValueOnce({
					messageId: 'msg-1',
					status: 'sent',
					provider: 'twilio',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-2',
					status: 'sent',
					provider: 'twilio',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-3',
					status: 'sent',
					provider: 'twilio',
				});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891', data: { name: 'Alice' } },
						{ phone: '+1234567892', data: { name: 'Bob' } },
						{ phone: '+1234567893', data: { name: 'Charlie' } },
					],
					body: 'Hi {{name}}, this is a test message.',
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
		});

		it('should handle partial batch failures', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
					rateLimit: 10,
				},
			};

			const mockSend = vi.fn()
				.mockResolvedValueOnce({
					messageId: 'msg-1',
					status: 'sent',
					provider: 'twilio',
				})
				.mockResolvedValueOnce({
					messageId: '',
					status: 'failed',
					provider: 'twilio',
					error: 'Invalid phone number',
				})
				.mockResolvedValueOnce({
					messageId: 'msg-3',
					status: 'sent',
					provider: 'twilio',
				});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891' },
						{ phone: 'invalid' },
						{ phone: '+1234567893' },
					],
					body: 'Test message',
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
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
					rateLimit: 2, // 2 SMS per second
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const startTime = Date.now();

			await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891' },
						{ phone: '+1234567892' },
						{ phone: '+1234567893' },
					],
					body: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Should take at least 1 second (3 SMS at 2/sec = ~1.5s with rate limiting)
			expect(duration).toBeGreaterThanOrEqual(900);
			expect(mockSend).toHaveBeenCalledTimes(3);
		});

		it('should use common data across all recipients', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
					rateLimit: 10,
				},
			};

			let capturedMessages: any[] = [];
			const mockSend = vi.fn().mockImplementation((msg) => {
				capturedMessages.push(msg);
				return Promise.resolve({
					messageId: 'msg-' + capturedMessages.length,
					status: 'sent',
					provider: 'twilio',
				});
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891', data: { name: 'Alice' } },
						{ phone: '+1234567892', data: { name: 'Bob' } },
					],
					body: 'Hi {{name}}, welcome to {{company}}!',
					commonData: {
						company: 'Acme Corp',
					},
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(capturedMessages[0].body).toContain('Acme Corp');
			expect(capturedMessages[1].body).toContain('Acme Corp');
			expect(capturedMessages[0].body).toContain('Alice');
			expect(capturedMessages[1].body).toContain('Bob');
		});
	});

	describe('Phone Number Validation', () => {
		it('should accept valid E.164 phone numbers', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Valid E.164 formats
			const validNumbers = [
				'+1234567890',     // US
				'+442071234567',   // UK
				'+33123456789',    // France
				'+81312345678',    // Japan
			];

			for (const number of validNumbers) {
				const result = await agent.execute({
					input: {
						to: number,
						body: 'Test',
					},
					env: mockEnv as ConductorEnv,
					ctx: {} as ExecutionContext,
				});

				expect(result.success).toBe(true);
			}
		});
	});

	describe('Template Rendering', () => {
		it('should render simple variables in batch mode', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Template rendering only works in batch mode with recipients array
			await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891', data: { name: 'Alice', amount: '1,234.56' } },
					],
					body: 'Hello {{name}}, your balance is ${{amount}}.',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					body: 'Hello Alice, your balance is $1,234.56.',
				})
			);
		});

		it('should handle missing variables gracefully in batch mode', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Template rendering only works in batch mode with recipients array
			await agent.execute({
				input: {
					recipients: [
						{ phone: '+1234567891', data: { name: 'Bob' } },
					],
					body: 'Hello {{name}}, your code is {{code}}.',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			// Missing variables are replaced with empty string
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					body: 'Hello Bob, your code is .',
				})
			);
		});
	});

	describe('Error Handling', () => {
		it('should handle provider validation errors', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockValidate = vi.fn().mockResolvedValue({
				valid: false,
				errors: ['Invalid credentials', 'Missing configuration'],
			});

			const agent = new SmsMember(config);
			(agent as any).provider = {
				validateConfig: mockValidate,
			};

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Provider validation failed');
		});

		it('should handle send failures', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: '',
				status: 'failed',
				provider: 'twilio',
				error: 'Rate limit exceeded',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('SMS send failed');
			expect(result.error).toContain('Rate limit exceeded');
		});

		it('should handle network errors', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockRejectedValue(new Error('Network timeout'));

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: 'Test',
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe('Message Length', () => {
		it('should handle long messages', async () => {
			const config: AgentConfig = {
				name: 'test-sms',
				type: 'sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
						from: '+1234567890',
					},
				},
			};

			const mockSend = vi.fn().mockResolvedValue({
				messageId: 'msg',
				status: 'sent',
				provider: 'twilio',
			});

			const mockValidate = vi.fn().mockResolvedValue({ valid: true });

			const agent = new SmsMember(config);
			(agent as any).provider = { send: mockSend, validateConfig: mockValidate };

			// Long message (will be sent as concatenated SMS)
			const longMessage = 'A'.repeat(500);

			const result = await agent.execute({
				input: {
					to: '+1234567891',
					body: longMessage,
				},
				env: mockEnv as ConductorEnv,
				ctx: {} as ExecutionContext,
			});

			expect(result.success).toBe(true);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					body: longMessage,
				})
			);
		});
	});
});
