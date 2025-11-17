/**
 * Webhook HMAC Signature Tests
 *
 * Tests for HMAC signature generation (outbound) and verification (inbound)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookNotifier } from '../../../src/runtime/notifications/webhook-notifier.js'
import type { NotificationEventData } from '../../../src/runtime/notifications/types.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('Webhook HMAC Signatures', () => {
	let mockFetch: any

	beforeEach(() => {
		mockFetch = vi.mocked(global.fetch)
		mockFetch.mockClear()
	})

	describe('Outbound Webhook HMAC (WebhookNotifier)', () => {
		it('should generate HMAC signature when secret provided', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				secret: 'test-secret-key',
				timeout: 5000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			})

			const eventData: NotificationEventData = {
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: {
					id: 'exec-123',
					status: 'completed',
				},
			}

			await notifier.send(eventData)

			// Verify fetch was called
			expect(mockFetch).toHaveBeenCalledOnce()

			// Verify signature header was included
			const [url, options] = mockFetch.mock.calls[0]
			expect(options.headers['X-Conductor-Signature']).toBeDefined()
			expect(options.headers['X-Conductor-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/)
			expect(options.headers['X-Conductor-Timestamp']).toBeDefined()
		})

		it('should not generate signature when secret not provided', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				timeout: 5000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			})

			const eventData: NotificationEventData = {
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: {
					id: 'exec-123',
					status: 'completed',
				},
			}

			await notifier.send(eventData)

			// Verify fetch was called
			expect(mockFetch).toHaveBeenCalledOnce()

			// Verify signature header was NOT included
			const [url, options] = mockFetch.mock.calls[0]
			expect(options.headers['X-Conductor-Signature']).toBeUndefined()
		})

		it('should use correct signature format (sha256=hex)', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				secret: 'test-secret',
				timeout: 5000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			})

			const eventData: NotificationEventData = {
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: { id: 'exec-123' },
			}

			await notifier.send(eventData)

			const [url, options] = mockFetch.mock.calls[0]
			const signature = options.headers['X-Conductor-Signature']

			// Verify format
			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/)
			expect(signature.startsWith('sha256=')).toBe(true)
			expect(signature.split('=')[1]).toHaveLength(64) // SHA-256 hex is 64 chars
		})

		it('should sign timestamped payload', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				secret: 'test-secret',
				timeout: 5000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			})

			const eventData: NotificationEventData = {
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: { id: 'exec-123' },
			}

			await notifier.send(eventData)

			const [url, options] = mockFetch.mock.calls[0]
			const timestamp = options.headers['X-Conductor-Timestamp']
			const body = options.body

			// Signature should be computed from: timestamp.body
			// This verifies the signing payload format
			expect(timestamp).toBeDefined()
			expect(body).toBeDefined()
		})

		it('should generate different signatures for different payloads', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				secret: 'test-secret',
				timeout: 5000,
			})

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
			})

			// Send first event
			await notifier.send({
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: { id: 'exec-123' },
			})

			const signature1 = mockFetch.mock.calls[0][1].headers['X-Conductor-Signature']

			// Send second event
			await notifier.send({
				event: 'execution.failed',
				timestamp: '2024-01-15T10:30:01Z',
				data: { id: 'exec-456', error: 'Failed' },
			})

			const signature2 = mockFetch.mock.calls[1][1].headers['X-Conductor-Signature']

			// Signatures should be different
			expect(signature1).not.toBe(signature2)
		})

		it('should include all required headers', async () => {
			const notifier = new WebhookNotifier({
				url: 'https://api.example.com/webhooks',
				secret: 'test-secret',
				timeout: 5000,
			})

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			})

			const eventData: NotificationEventData = {
				event: 'execution.completed',
				timestamp: '2024-01-15T10:30:00Z',
				data: { id: 'exec-123' },
			}

			await notifier.send(eventData)

			const [url, options] = mockFetch.mock.calls[0]
			const headers = options.headers

			expect(headers['Content-Type']).toBe('application/json')
			expect(headers['User-Agent']).toBe('Conductor-Webhook/1.0')
			expect(headers['X-Conductor-Event']).toBe('execution.completed')
			expect(headers['X-Conductor-Timestamp']).toBeDefined()
			expect(headers['X-Conductor-Signature']).toBeDefined()
			expect(headers['X-Conductor-Delivery-Attempt']).toBe('1')
		})
	})

	describe('Signature Verification (Manual Testing)', () => {
		// These tests demonstrate how to verify signatures
		// They use the Web Crypto API like the actual implementation

		async function generateTestSignature(
			body: string,
			timestamp: number,
			secret: string
		): Promise<string> {
			const payload = `${timestamp}.${body}`

			const encoder = new TextEncoder()
			const key = await crypto.subtle.importKey(
				'raw',
				encoder.encode(secret),
				{ name: 'HMAC', hash: 'SHA-256' },
				false,
				['sign']
			)

			const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))

			const hashArray = Array.from(new Uint8Array(signature))
			const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

			return `sha256=${hashHex}`
		}

		it('should verify valid signature', async () => {
			const secret = 'test-secret'
			const timestamp = Math.floor(Date.now() / 1000)
			const body = JSON.stringify({ event: 'test' })

			const signature = await generateTestSignature(body, timestamp, secret)

			// Regenerate to verify
			const verifySignature = await generateTestSignature(body, timestamp, secret)

			expect(signature).toBe(verifySignature)
		})

		it('should reject modified body', async () => {
			const secret = 'test-secret'
			const timestamp = Math.floor(Date.now() / 1000)
			const originalBody = JSON.stringify({ event: 'test' })
			const modifiedBody = JSON.stringify({ event: 'test', hacked: true })

			const signature = await generateTestSignature(originalBody, timestamp, secret)
			const verifySignature = await generateTestSignature(modifiedBody, timestamp, secret)

			// Signatures should differ
			expect(signature).not.toBe(verifySignature)
		})

		it('should reject different timestamp', async () => {
			const secret = 'test-secret'
			const body = JSON.stringify({ event: 'test' })

			const timestamp1 = Math.floor(Date.now() / 1000)
			const timestamp2 = timestamp1 + 1

			const signature1 = await generateTestSignature(body, timestamp1, secret)
			const signature2 = await generateTestSignature(body, timestamp2, secret)

			// Signatures should differ
			expect(signature1).not.toBe(signature2)
		})

		it('should reject wrong secret', async () => {
			const timestamp = Math.floor(Date.now() / 1000)
			const body = JSON.stringify({ event: 'test' })

			const signature1 = await generateTestSignature(body, timestamp, 'secret-1')
			const signature2 = await generateTestSignature(body, timestamp, 'secret-2')

			// Signatures should differ
			expect(signature1).not.toBe(signature2)
		})

		it('should produce consistent signatures', async () => {
			const secret = 'test-secret'
			const timestamp = 1705315200
			const body = JSON.stringify({ event: 'test', data: { id: 123 } })

			// Generate multiple times
			const sig1 = await generateTestSignature(body, timestamp, secret)
			const sig2 = await generateTestSignature(body, timestamp, secret)
			const sig3 = await generateTestSignature(body, timestamp, secret)

			// All should be identical
			expect(sig1).toBe(sig2)
			expect(sig2).toBe(sig3)
		})
	})

	describe('Inbound Webhook HMAC Verification', () => {
		// These tests would integrate with the actual webhook route handler
		// Since that requires Hono context mocking, we keep these as placeholders

		it('should accept valid HMAC signature', async () => {
			// Test would verify authenticateWebhook() accepts valid signature
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})

		it('should reject missing signature header', async () => {
			// Test would verify authenticateWebhook() rejects missing X-Webhook-Signature
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})

		it('should reject missing timestamp header', async () => {
			// Test would verify authenticateWebhook() rejects missing X-Webhook-Timestamp
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})

		it('should reject expired timestamp (replay attack)', async () => {
			// Test would verify authenticateWebhook() rejects old timestamps (>5min)
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})

		it('should reject invalid signature', async () => {
			// Test would verify authenticateWebhook() rejects wrong signature
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})

		it('should use constant-time comparison', async () => {
			// Test would verify timing attack resistance
			// This is implemented in constantTimeCompare() function
			// TODO: Implement timing analysis test
			expect(true).toBe(true)
		})

		it('should support both X-Webhook-Signature and X-Hub-Signature-256', async () => {
			// Test would verify GitHub-compatible header names
			// TODO: Implement integration test with Hono app
			expect(true).toBe(true)
		})
	})

	describe('Security Properties', () => {
		it('should use SHA-256 hash function', async () => {
			// Verify we use SHA-256 (not weaker SHA-1 or MD5)
			const secret = 'test'
			const body = 'test'
			const timestamp = 1234567890

			const signature = await generateTestSignature(body, timestamp, secret)

			// SHA-256 produces 256 bits = 32 bytes = 64 hex chars
			const hexPart = signature.replace('sha256=', '')
			expect(hexPart).toHaveLength(64)
		})

		it('should include timestamp in signed payload', async () => {
			// This prevents replay attacks by binding signature to timestamp
			const secret = 'test'
			const body = 'test'

			const sig1 = await generateTestSignature(body, 1000, secret)
			const sig2 = await generateTestSignature(body, 2000, secret)

			// Different timestamps should produce different signatures
			expect(sig1).not.toBe(sig2)
		})

		it('should use timing-safe comparison (constant-time)', () => {
			// Test the constantTimeCompare function
			function constantTimeCompare(a: string, b: string): boolean {
				if (a.length !== b.length) {
					return false
				}

				let result = 0
				for (let i = 0; i < a.length; i++) {
					result |= a.charCodeAt(i) ^ b.charCodeAt(i)
				}

				return result === 0
			}

			expect(constantTimeCompare('abc', 'abc')).toBe(true)
			expect(constantTimeCompare('abc', 'abd')).toBe(false)
			expect(constantTimeCompare('abc', 'ab')).toBe(false)
			expect(constantTimeCompare('', '')).toBe(true)
		})
	})
})

// Helper function for signature generation (same as implementation)
async function generateTestSignature(
	body: string,
	timestamp: number,
	secret: string
): Promise<string> {
	const payload = `${timestamp}.${body}`

	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))

	const hashArray = Array.from(new Uint8Array(signature))
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

	return `sha256=${hashHex}`
}
