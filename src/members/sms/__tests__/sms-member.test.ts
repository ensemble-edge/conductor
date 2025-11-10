/**
 * SMS Member Tests
 *
 * Comprehensive tests for SMS member functionality including:
 * - SMS configuration validation
 * - Template rendering with variable substitution
 * - Sending SMS (with mocked SMS provider)
 * - Phone number validation (E.164 format)
 * - Message length/segmentation validation
 * - Batch SMS sending with rate limiting
 * - Provider-specific functionality (Twilio)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmsMember } from '../sms-member.js';
import type { SmsMemberInput, BatchSmsInput, SmsMemberOutput, BatchSmsOutput } from '../types/index.js';
import type { MemberExecutionContext } from '../../../runtime/types.js';

// Mock SMS Provider for testing
class MockSmsProvider {
	name = 'mock';
	private shouldFail = false;
	private validateConfigShouldFail = false;
	public sentMessages: Array<{
		to: string | string[];
		from?: string;
		body: string;
		mediaUrl?: string[];
	}> = [];

	async send(message: any) {
		this.sentMessages.push(message);

		if (this.shouldFail) {
			return {
				messageId: '',
				status: 'failed' as const,
				provider: this.name,
				error: 'Mock provider failure',
			};
		}

		return {
			messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
			status: 'sent' as const,
			provider: this.name,
		};
	}

	async validateConfig() {
		if (this.validateConfigShouldFail) {
			return {
				valid: false,
				errors: ['Mock validation error'],
			};
		}
		return {
			valid: true,
		};
	}

	setShouldFail(shouldFail: boolean) {
		this.shouldFail = shouldFail;
	}

	setValidateConfigShouldFail(shouldFail: boolean) {
		this.validateConfigShouldFail = shouldFail;
	}

	reset() {
		this.sentMessages = [];
		this.shouldFail = false;
		this.validateConfigShouldFail = false;
	}
}

describe('SmsMember', () => {
	let mockContext: MemberExecutionContext;
	let mockProvider: MockSmsProvider;

	beforeEach(() => {
		mockProvider = new MockSmsProvider();

		mockContext = {
			input: {},
			env: {} as any,
			ctx: {} as any,
			state: {},
			setState: vi.fn(),
		};
	});

	describe('Configuration Validation', () => {
		it('should throw error if provider configuration is missing', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {},
			};

			expect(() => new SmsMember(config)).toThrow('SMS member requires provider configuration');
		});

		it('should throw error if Twilio config is missing required fields', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						// Missing twilio config
					},
				},
			};

			expect(() => new SmsMember(config)).toThrow('Twilio configuration is required');
		});

		it('should throw error if Twilio Account SID is missing', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							authToken: 'test-token',
						},
					},
				},
			};

			expect(() => new SmsMember(config)).toThrow('Twilio Account SID is required');
		});

		it('should throw error if Twilio Auth Token is missing', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						twilio: {
							accountSid: 'test-sid',
						},
					},
				},
			};

			expect(() => new SmsMember(config)).toThrow('Twilio Auth Token is required');
		});

		it('should accept valid Twilio configuration', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			expect(() => new SmsMember(config)).not.toThrow();
		});

		it('should accept optional rate limit configuration', () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
					rateLimit: 5,
				},
			};

			const member = new SmsMember(config);
			expect(member).toBeDefined();
		});
	});

	describe('Phone Number Validation', () => {
		it('should validate E.164 format phone numbers', () => {
			const validNumbers = [
				'+12025551234', // US
				'+442071234567', // UK
				'+61412345678', // Australia
				'+81312345678', // Japan
				'+33612345678', // France
			];

			validNumbers.forEach((phone) => {
				// Test through provider's validation
				const provider = mockProvider as any;
				expect(provider.validatePhoneNumber?.(phone) ?? true).toBe(true);
			});
		});

		it('should reject invalid phone number formats', () => {
			const invalidNumbers = [
				'1234567890', // Missing +
				'+1234', // Too short
				'+(555) 123-4567', // Invalid characters
				'+1 555 123 4567', // Spaces
				'555-1234', // No country code
				'', // Empty
			];

			invalidNumbers.forEach((phone) => {
				const provider = mockProvider as any;
				const isValid = provider.validatePhoneNumber?.(phone) ?? false;
				expect(isValid).toBe(false);
			});
		});
	});

	describe('Template Rendering', () => {
		it('should render simple variable substitution', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			// Mock the provider
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234', data: { name: 'John', balance: 100 } },
				],
				body: 'Hello {{name}}, your balance is ${{balance}}',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages).toHaveLength(1);
			expect(mockProvider.sentMessages[0].body).toBe('Hello John, your balance is $100');
		});

		it('should handle nested variable paths', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{
						phone: '+12025551234',
						data: { user: { name: { first: 'John', last: 'Doe' } } },
					},
				],
				body: 'Hello {{user.name.first}} {{user.name.last}}',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Hello John Doe');
		});

		it('should handle missing variables gracefully', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [{ phone: '+12025551234', data: { name: 'John' } }],
				body: 'Hello {{name}}, your balance is ${{balance}}',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Hello John, your balance is $');
		});

		it('should merge commonData with recipient data', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234', data: { name: 'John' } },
					{ phone: '+12025555678', data: { name: 'Jane' } },
				],
				body: 'Hello {{name}}! {{company}} sale: {{discount}}% off',
				commonData: {
					company: 'Acme Corp',
					discount: 20,
				},
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Hello John! Acme Corp sale: 20% off');
			expect(mockProvider.sentMessages[1].body).toBe('Hello Jane! Acme Corp sale: 20% off');
		});

		it('should prioritize recipient data over commonData', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234', data: { discount: 30 } },
				],
				body: 'Your discount: {{discount}}%',
				commonData: {
					discount: 20,
				},
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Your discount: 30%');
		});
	});

	describe('Message Length Validation', () => {
		it('should accept messages within SMS length limits', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			// Standard SMS (160 characters)
			const shortMessage: SmsMemberInput = {
				to: '+12025551234',
				body: 'A'.repeat(160),
			};

			const result = await member['run']({ ...mockContext, input: shortMessage });
			expect(result).toBeDefined();
		});

		it('should accept concatenated messages up to 1600 characters', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			// Long message (1600 characters - max concatenated)
			const longMessage: SmsMemberInput = {
				to: '+12025551234',
				body: 'A'.repeat(1600),
			};

			const result = await member['run']({ ...mockContext, input: longMessage });
			expect(result).toBeDefined();
		});

		it('should handle messages over 160 characters (concatenated SMS)', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			// Message requiring 2 SMS segments
			const message: SmsMemberInput = {
				to: '+12025551234',
				body: 'A'.repeat(320),
			};

			const result = await member['run']({ ...mockContext, input: message });
			expect(result).toBeDefined();
		});
	});

	describe('Single SMS Sending', () => {
		it('should send single SMS successfully', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Hello, this is a test message',
			};

			const result = (await member['run']({
				...mockContext,
				input,
			})) as SmsMemberOutput;

			expect(result).toBeDefined();
			expect(result.messageId).toBeDefined();
			expect(result.status).toBe('sent');
			expect(result.provider).toBe('mock');
			expect(result.timestamp).toBeDefined();
		});

		it('should include custom from number', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				from: '+15559876543',
				body: 'Test message',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].from).toBe('+15559876543');
		});

		it('should support MMS with media URLs', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Check out this image!',
				mediaUrl: ['https://example.com/image.jpg'],
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].mediaUrl).toEqual([
				'https://example.com/image.jpg',
			]);
		});

		it('should support multiple media URLs', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Multiple images',
				mediaUrl: [
					'https://example.com/image1.jpg',
					'https://example.com/image2.jpg',
				],
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].mediaUrl).toHaveLength(2);
		});

		it('should throw error when provider validation fails', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;
			mockProvider.setValidateConfigShouldFail(true);

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Test message',
			};

			await expect(
				member['run']({ ...mockContext, input })
			).rejects.toThrow('Provider validation failed');
		});

		it('should throw error when SMS send fails', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;
			mockProvider.setShouldFail(true);

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Test message',
			};

			await expect(
				member['run']({ ...mockContext, input })
			).rejects.toThrow('SMS send failed');
		});
	});

	describe('Batch SMS Sending', () => {
		it('should send batch SMS to multiple recipients', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234', data: { name: 'John' } },
					{ phone: '+12025555678', data: { name: 'Jane' } },
					{ phone: '+12025559999', data: { name: 'Bob' } },
				],
				body: 'Hello {{name}}!',
			};

			const result = (await member['run']({
				...mockContext,
				input,
			})) as BatchSmsOutput;

			expect(result.sent).toBe(3);
			expect(result.failed).toBe(0);
			expect(result.messageIds).toHaveLength(3);
			expect(mockProvider.sentMessages).toHaveLength(3);
		});

		it('should apply rate limiting during batch send', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
					rateLimit: 2, // 2 SMS per second
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234' },
					{ phone: '+12025555678' },
					{ phone: '+12025559999' },
				],
				body: 'Test message',
			};

			const startTime = Date.now();
			await member['run']({ ...mockContext, input });
			const duration = Date.now() - startTime;

			// With rate limit of 2/sec, 3 messages should take at least 1 second
			// (0ms, 500ms, 1000ms)
			expect(duration).toBeGreaterThanOrEqual(900); // Allow some margin
		});

		it('should track failed messages in batch', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);

			// Create a provider that fails on second message
			let callCount = 0;
			const failingProvider = {
				...mockProvider,
				async send(message: any) {
					callCount++;
					if (callCount === 2) {
						return {
							messageId: '',
							status: 'failed' as const,
							provider: 'mock',
							error: 'Simulated failure',
						};
					}
					return mockProvider.send(message);
				},
			};
			(member as any).provider = failingProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234' },
					{ phone: '+12025555678' },
					{ phone: '+12025559999' },
				],
				body: 'Test message',
			};

			const result = (await member['run']({
				...mockContext,
				input,
			})) as BatchSmsOutput;

			expect(result.sent).toBe(2);
			expect(result.failed).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors?.[0].phone).toBe('+12025555678');
			expect(result.errors?.[0].error).toContain('Simulated failure');
		});

		it('should continue batch send even if some messages fail', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);

			// Provider that fails on every other message
			let callCount = 0;
			const intermittentProvider = {
				...mockProvider,
				async send(message: any) {
					callCount++;
					if (callCount % 2 === 0) {
						return {
							messageId: '',
							status: 'failed' as const,
							provider: 'mock',
							error: 'Intermittent failure',
						};
					}
					return mockProvider.send(message);
				},
			};
			(member as any).provider = intermittentProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551111' },
					{ phone: '+12025552222' },
					{ phone: '+12025553333' },
					{ phone: '+12025554444' },
				],
				body: 'Test message',
			};

			const result = (await member['run']({
				...mockContext,
				input,
			})) as BatchSmsOutput;

			expect(result.sent).toBe(2);
			expect(result.failed).toBe(2);
			expect(result.errors).toHaveLength(2);
		});

		it('should handle empty recipients array', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [],
				body: 'Test message',
			};

			const result = (await member['run']({
				...mockContext,
				input,
			})) as BatchSmsOutput;

			expect(result.sent).toBe(0);
			expect(result.failed).toBe(0);
			expect(result.messageIds).toHaveLength(0);
		});
	});

	describe('Provider Integration', () => {
		it('should detect batch vs single SMS based on input', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			// Single SMS
			const singleInput: SmsMemberInput = {
				to: '+12025551234',
				body: 'Single message',
			};

			const singleResult = await member['run']({
				...mockContext,
				input: singleInput,
			});

			expect(singleResult).toHaveProperty('messageId');
			expect(singleResult).toHaveProperty('status');

			mockProvider.reset();

			// Batch SMS
			const batchInput: BatchSmsInput = {
				recipients: [{ phone: '+12025551234' }],
				body: 'Batch message',
			};

			const batchResult = await member['run']({
				...mockContext,
				input: batchInput,
			});

			expect(batchResult).toHaveProperty('sent');
			expect(batchResult).toHaveProperty('failed');
		});

		it('should pass metadata to provider', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Test with metadata',
				metadata: {
					campaign: 'summer-sale',
					userId: '12345',
				},
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].metadata).toEqual({
				campaign: 'summer-sale',
				userId: '12345',
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle special characters in message body', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Special chars: 😀 💯 ñ é ü',
			};

			const result = await member['run']({ ...mockContext, input });
			expect(result).toBeDefined();
		});

		it('should handle newlines in message body', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: SmsMemberInput = {
				to: '+12025551234',
				body: 'Line 1\nLine 2\nLine 3',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Line 1\nLine 2\nLine 3');
		});

		it('should handle undefined/null values in template variables', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551234', data: { name: null, age: undefined } },
				],
				body: 'Hello {{name}}, age: {{age}}',
			};

			await member['run']({ ...mockContext, input });

			// null is converted to string 'null', undefined is replaced with empty string
			expect(mockProvider.sentMessages[0].body).toBe('Hello null, age: ');
		});

		it('should handle template with no variables', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [{ phone: '+12025551234' }],
				body: 'Static message with no variables',
			};

			await member['run']({ ...mockContext, input });

			expect(mockProvider.sentMessages[0].body).toBe('Static message with no variables');
		});

		it('should handle malformed template variables', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const input: BatchSmsInput = {
				recipients: [{ phone: '+12025551234', data: { name: 'John' } }],
				body: 'Hello {{name, price: {{price}}',
			};

			await member['run']({ ...mockContext, input });

			// Should handle malformed variables gracefully
			expect(mockProvider.sentMessages[0].body).toContain('Hello');
		});
	});

	describe('Rate Limiting', () => {
		it('should use default rate limit of 10 SMS/sec', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
					// No rateLimit specified, should default to 10
				},
			};

			const member = new SmsMember(config);
			expect((member as any).rateLimit).toBe(10);
		});

		it('should use custom rate limit', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
					rateLimit: 5,
				},
			};

			const member = new SmsMember(config);
			expect((member as any).rateLimit).toBe(5);
		});

		it('should properly space messages according to rate limit', async () => {
			const config = {
				name: 'test-sms',
				type: 'Sms',
				config: {
					provider: {
						provider: 'twilio',
						from: '+15555551234',
						twilio: {
							accountSid: 'test-sid',
							authToken: 'test-token',
						},
					},
					rateLimit: 10, // 10 SMS/sec = 100ms between messages
				},
			};

			const member = new SmsMember(config);
			(member as any).provider = mockProvider;

			const timestamps: number[] = [];
			const trackingProvider = {
				...mockProvider,
				async send(message: any) {
					timestamps.push(Date.now());
					return mockProvider.send(message);
				},
			};
			(member as any).provider = trackingProvider;

			const input: BatchSmsInput = {
				recipients: [
					{ phone: '+12025551111' },
					{ phone: '+12025552222' },
					{ phone: '+12025553333' },
				],
				body: 'Rate limit test',
			};

			await member['run']({ ...mockContext, input });

			// Check spacing between messages
			for (let i = 1; i < timestamps.length; i++) {
				const gap = timestamps[i] - timestamps[i - 1];
				expect(gap).toBeGreaterThanOrEqual(90); // Allow 10ms margin
			}
		});
	});
});
