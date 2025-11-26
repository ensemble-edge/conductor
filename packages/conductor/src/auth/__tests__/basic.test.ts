/**
 * Basic Auth Validator Tests
 *
 * Tests HTTP Basic Authentication validation.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BasicAuthValidator, createBasicValidator } from '../providers/basic.js'

/**
 * Helper to encode credentials for Basic auth
 */
function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

describe('BasicAuthValidator', () => {
  const testUsername = 'testuser'
  const testPassword = 'testpassword123'
  const testCredentials = `${testUsername}:${testPassword}`
  let validator: BasicAuthValidator
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {}
    validator = new BasicAuthValidator({
      credentials: testCredentials,
      realm: 'Test Realm',
    })
  })

  describe('extractToken', () => {
    it('should extract credentials from Authorization header', () => {
      const encoded = encodeBasicAuth(testUsername, testPassword)
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const token = validator.extractToken(request)
      expect(token).toBe(encoded)
    })

    it('should return null if no Authorization header', () => {
      const request = new Request('https://example.com')
      const token = validator.extractToken(request)
      expect(token).toBeNull()
    })

    it('should return null if Authorization header is not Basic', () => {
      const request = new Request('https://example.com', {
        headers: { Authorization: 'Bearer some-token' },
      })
      const token = validator.extractToken(request)
      expect(token).toBeNull()
    })
  })

  describe('validate', () => {
    it('should return invalid if no Authorization header', async () => {
      const request = new Request('https://example.com')
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toContain('Missing or invalid Authorization header')
    })

    it('should return invalid if credentials cannot be decoded', async () => {
      const request = new Request('https://example.com', {
        headers: { Authorization: 'Basic not-valid-base64!!!' },
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
    })

    it('should validate correct credentials', async () => {
      const encoded = encodeBasicAuth(testUsername, testPassword)
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(true)
      expect(result.context?.authenticated).toBe(true)
      expect(result.context?.method).toBe('basic')
      expect(result.context?.user?.id).toBe(testUsername)
    })

    it('should reject incorrect credentials', async () => {
      const encoded = encodeBasicAuth('wronguser', 'wrongpass')
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('invalid_token')
      expect(result.message).toContain('Invalid username or password')
    })

    it('should reject incorrect password for correct username', async () => {
      const encoded = encodeBasicAuth(testUsername, 'wrongpass')
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(false)
    })
  })

  describe('multiple credentials', () => {
    it('should accept any valid credential from array', async () => {
      const multiValidator = new BasicAuthValidator({
        credentials: ['user1:pass1', 'user2:pass2', 'user3:pass3'],
      })

      // Test first credential
      const encoded1 = encodeBasicAuth('user1', 'pass1')
      const request1 = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded1}` },
      })
      const result1 = await multiValidator.validate(request1, mockEnv)
      expect(result1.valid).toBe(true)
      expect(result1.context?.user?.id).toBe('user1')

      // Test second credential
      const encoded2 = encodeBasicAuth('user2', 'pass2')
      const request2 = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded2}` },
      })
      const result2 = await multiValidator.validate(request2, mockEnv)
      expect(result2.valid).toBe(true)
      expect(result2.context?.user?.id).toBe('user2')

      // Test third credential
      const encoded3 = encodeBasicAuth('user3', 'pass3')
      const request3 = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded3}` },
      })
      const result3 = await multiValidator.validate(request3, mockEnv)
      expect(result3.valid).toBe(true)
      expect(result3.context?.user?.id).toBe('user3')
    })

    it('should reject credentials not in array', async () => {
      const multiValidator = new BasicAuthValidator({
        credentials: ['user1:pass1', 'user2:pass2'],
      })

      const encoded = encodeBasicAuth('user3', 'pass3')
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await multiValidator.validate(request, mockEnv)
      expect(result.valid).toBe(false)
    })
  })

  describe('getWWWAuthenticateHeader', () => {
    it('should return header with configured realm', () => {
      const header = validator.getWWWAuthenticateHeader()
      expect(header).toBe('Basic realm="Test Realm", charset="UTF-8"')
    })

    it('should use default realm if not configured', () => {
      const noRealmValidator = new BasicAuthValidator({
        credentials: testCredentials,
      })
      const header = noRealmValidator.getWWWAuthenticateHeader()
      expect(header).toBe('Basic realm="Conductor API", charset="UTF-8"')
    })
  })

  describe('createBasicValidator', () => {
    it('should create a validator from config', () => {
      const validator = createBasicValidator({
        credentials: testCredentials,
      })
      expect(validator).toBeInstanceOf(BasicAuthValidator)
    })

    it('should create a working validator', async () => {
      const validator = createBasicValidator({
        credentials: 'admin:secret',
        realm: 'Admin Area',
      })

      const encoded = encodeBasicAuth('admin', 'secret')
      const request = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await validator.validate(request, mockEnv)

      expect(result.valid).toBe(true)
      expect(result.context?.user?.id).toBe('admin')
    })
  })
})
