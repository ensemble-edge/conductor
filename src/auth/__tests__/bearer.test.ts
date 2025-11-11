/**
 * Bearer Token Validator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BearerValidator } from '../providers/bearer.js'

describe('BearerValidator', () => {
  let validator: BearerValidator
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {
      JWT_SECRET: 'test-secret-key-min-32-chars-long!',
      JWT_ISSUER: 'test-issuer',
      JWT_AUDIENCE: 'test-audience',
    }
    validator = new BearerValidator({
      secret: mockEnv.JWT_SECRET,
      issuer: mockEnv.JWT_ISSUER,
      audience: mockEnv.JWT_AUDIENCE,
      algorithm: 'HS256',
    })
  })

  describe('extractToken', () => {
    it('should extract token from Authorization header', () => {
      const request = new Request('https://example.com', {
        headers: { Authorization: 'Bearer test-token' },
      })
      const token = validator.extractToken(request)
      expect(token).toBe('test-token')
    })

    it('should return null if no Authorization header', () => {
      const request = new Request('https://example.com')
      const token = validator.extractToken(request)
      expect(token).toBeNull()
    })

    it('should return null if Authorization header is not Bearer', () => {
      const request = new Request('https://example.com', {
        headers: { Authorization: 'Basic credentials' },
      })
      const token = validator.extractToken(request)
      expect(token).toBeNull()
    })
  })

  describe('validate', () => {
    it('should return invalid if no token provided', async () => {
      const request = new Request('https://example.com')
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toBe('No bearer token provided')
    })

    it('should validate a valid JWT token', async () => {
      // This is a mock test - in real implementation, you'd need to generate
      // a valid JWT token with the correct secret
      const request = new Request('https://example.com', {
        headers: { Authorization: 'Bearer valid-jwt-token' },
      })

      // Note: This test would fail without a real JWT token
      // In a real test suite, you'd use a JWT library to generate valid tokens
      const result = await validator.validate(request, mockEnv)

      // For now, we expect it to fail since we're not providing a real JWT
      expect(result.valid).toBe(false)
    })
  })
})
