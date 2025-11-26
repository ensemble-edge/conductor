/**
 * Signature Validator Tests
 *
 * Tests HMAC signature validation for webhook authentication.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SignatureValidator, createSignatureValidator, signaturePresets } from '../providers/signature.js'

/**
 * Helper to compute HMAC signature for tests
 */
async function computeHMAC(message: string, secret: string, algorithm: string = 'sha256'): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const algoMap: Record<string, string> = {
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  }

  const cryptoAlgorithm = algoMap[algorithm.toLowerCase()] || 'SHA-256'

  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: cryptoAlgorithm }, false, ['sign'])

  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('SignatureValidator', () => {
  const testSecret = 'webhook-secret-for-testing'
  let validator: SignatureValidator
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {}
    validator = new SignatureValidator({
      secret: testSecret,
      algorithm: 'sha256',
      signatureHeader: 'x-webhook-signature',
      timestampHeader: 'x-webhook-timestamp',
      timestampTolerance: 300,
      payloadFormat: 'timestamp.body',
    })
  })

  describe('extractToken', () => {
    it('should extract signature from header', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-webhook-signature': 'abc123def456' },
      })
      const token = validator.extractToken(request)
      expect(token).toBe('abc123def456')
    })

    it('should return null if no signature header', () => {
      const request = new Request('https://example.com')
      const token = validator.extractToken(request)
      expect(token).toBeNull()
    })

    it('should strip signature prefix if configured', () => {
      const prefixValidator = new SignatureValidator({
        secret: testSecret,
        signaturePrefix: 'sha256=',
      })

      const request = new Request('https://example.com', {
        headers: { 'x-webhook-signature': 'sha256=abc123def456' },
      })
      const token = prefixValidator.extractToken(request)
      expect(token).toBe('abc123def456')
    })
  })

  describe('validate', () => {
    it('should return invalid if no signature header', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        body: '{"event": "test"}',
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toContain('Missing signature header')
    })

    it('should return invalid if no timestamp header when tolerance > 0', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: { 'x-webhook-signature': 'somesignature' },
        body: '{"event": "test"}',
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toContain('Missing timestamp header')
    })

    it('should return expired if timestamp is too old', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 minutes ago
      const body = '{"event": "test"}'
      const payload = `${oldTimestamp}.${body}`
      const signature = await computeHMAC(payload, testSecret, 'sha256')

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'x-webhook-signature': signature,
          'x-webhook-timestamp': oldTimestamp.toString(),
        },
        body,
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('expired')
      expect(result.message).toContain('Timestamp outside tolerance')
    })

    it('should validate a correct signature', async () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const body = '{"event": "test"}'
      const payload = `${timestamp}.${body}`
      const signature = await computeHMAC(payload, testSecret, 'sha256')

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'x-webhook-signature': signature,
          'x-webhook-timestamp': timestamp.toString(),
        },
        body,
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(true)
      expect(result.context?.authenticated).toBe(true)
      expect(result.context?.custom?.signatureVerified).toBe(true)
    })

    it('should reject an incorrect signature', async () => {
      const timestamp = Math.floor(Date.now() / 1000)
      const body = '{"event": "test"}'

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'x-webhook-signature': 'invalid-signature-value',
          'x-webhook-timestamp': timestamp.toString(),
        },
        body,
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toContain('Invalid webhook signature')
    })

    it('should work with body-only payload format', async () => {
      const bodyOnlyValidator = new SignatureValidator({
        secret: testSecret,
        algorithm: 'sha256',
        payloadFormat: 'body',
        timestampTolerance: 0, // Disable timestamp check
      })

      const body = '{"event": "test"}'
      const signature = await computeHMAC(body, testSecret, 'sha256')

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'x-webhook-signature': signature,
        },
        body,
      })
      const result = await bodyOnlyValidator.validate(request, mockEnv)

      expect(result.valid).toBe(true)
    })
  })

  describe('createSignatureValidator', () => {
    it('should create a validator from config', () => {
      const validator = createSignatureValidator({
        secret: testSecret,
        algorithm: 'sha256',
      })
      expect(validator).toBeInstanceOf(SignatureValidator)
    })
  })

  describe('signaturePresets', () => {
    describe('github preset', () => {
      it('should configure for GitHub webhook format', () => {
        const config = signaturePresets.github(testSecret)
        expect(config.signatureHeader).toBe('x-hub-signature-256')
        expect(config.signaturePrefix).toBe('sha256=')
        expect(config.payloadFormat).toBe('body')
        expect(config.timestampTolerance).toBe(0) // GitHub doesn't use timestamps
      })

      it('should validate GitHub-style signature', async () => {
        const config = signaturePresets.github(testSecret)
        const validator = createSignatureValidator(config)

        const body = '{"action": "opened", "pull_request": {}}'
        const signature = await computeHMAC(body, testSecret, 'sha256')

        const request = new Request('https://example.com', {
          method: 'POST',
          headers: {
            'x-hub-signature-256': `sha256=${signature}`,
          },
          body,
        })
        const result = await validator.validate(request, mockEnv)

        expect(result.valid).toBe(true)
      })
    })

    describe('slack preset', () => {
      it('should configure for Slack webhook format', () => {
        const config = signaturePresets.slack(testSecret)
        expect(config.signatureHeader).toBe('x-slack-signature')
        expect(config.timestampHeader).toBe('x-slack-request-timestamp')
        expect(config.signaturePrefix).toBe('v0=')
        expect(config.payloadFormat).toBe('custom')
        expect(config.timestampTolerance).toBe(300)
      })

      it('should validate Slack-style signature', async () => {
        const config = signaturePresets.slack(testSecret)
        const validator = createSignatureValidator(config)

        const timestamp = Math.floor(Date.now() / 1000)
        const body = 'token=xxx&user_id=U123'
        // Slack format: v0:timestamp:body
        const payload = `v0:${timestamp}:${body}`
        const signature = await computeHMAC(payload, testSecret, 'sha256')

        const request = new Request('https://example.com', {
          method: 'POST',
          headers: {
            'x-slack-signature': `v0=${signature}`,
            'x-slack-request-timestamp': timestamp.toString(),
          },
          body,
        })
        const result = await validator.validate(request, mockEnv)

        expect(result.valid).toBe(true)
      })
    })

    describe('default preset', () => {
      it('should configure for standard webhook format', () => {
        const config = signaturePresets.default(testSecret)
        expect(config.signatureHeader).toBe('x-webhook-signature')
        expect(config.timestampHeader).toBe('x-webhook-timestamp')
        expect(config.signaturePrefix).toBe('sha256=')
        expect(config.payloadFormat).toBe('timestamp.body')
        expect(config.timestampTolerance).toBe(300)
      })
    })
  })
})
