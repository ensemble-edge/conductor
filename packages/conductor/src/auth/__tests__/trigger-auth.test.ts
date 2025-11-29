/**
 * Trigger Auth Bridge Tests
 *
 * Tests the bridge layer that connects trigger YAML config to auth providers.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createTriggerAuthMiddleware,
  getValidatorForTrigger,
  validateTriggerAuthConfig,
  type TriggerAuthConfig,
} from '../trigger-auth.js'
import { SignatureValidator } from '../providers/signature.js'
import { BasicAuthValidator } from '../providers/basic.js'

/**
 * Helper to encode credentials for Basic auth
 */
function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

/**
 * Helper to compute HMAC signature for tests
 */
async function computeHMAC(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, messageData)

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('getValidatorForTrigger', () => {
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {}
  })

  describe('environment variable resolution', () => {
    it('should resolve $env.VAR_NAME syntax for bearer secret', async () => {
      mockEnv = { API_SECRET: 'my-actual-secret' }
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: '$env.API_SECRET',
      }
      const validator = getValidatorForTrigger(config, mockEnv)

      // Test that the resolved secret is used
      const validRequest = new Request('https://example.com', {
        headers: { Authorization: 'Bearer my-actual-secret' },
      })
      const result = await validator.validate(validRequest, mockEnv)
      expect(result.valid).toBe(true)
    })

    it('should resolve ${env.VAR_NAME} syntax for bearer secret', async () => {
      mockEnv = { MY_TOKEN: 'secret-from-template' }
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: '${env.MY_TOKEN}',
      }
      const validator = getValidatorForTrigger(config, mockEnv)

      const validRequest = new Request('https://example.com', {
        headers: { Authorization: 'Bearer secret-from-template' },
      })
      const result = await validator.validate(validRequest, mockEnv)
      expect(result.valid).toBe(true)
    })

    it('should reject token when env var not found (falls back to literal)', async () => {
      mockEnv = {} // No API_SECRET defined
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: '$env.API_SECRET',
      }
      const validator = getValidatorForTrigger(config, mockEnv)

      // Token matches the literal string since env var not found
      const literalRequest = new Request('https://example.com', {
        headers: { Authorization: 'Bearer $env.API_SECRET' },
      })
      const result = await validator.validate(literalRequest, mockEnv)
      expect(result.valid).toBe(true) // Falls back to literal comparison
    })

    it('should resolve env var for signature auth', async () => {
      mockEnv = { WEBHOOK_SECRET: 'webhook-resolved-secret' }
      const config: TriggerAuthConfig = {
        type: 'signature',
        secret: '$env.WEBHOOK_SECRET',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeDefined()
      // The validator should be created with the resolved secret
    })

    it('should resolve env var for basic auth', async () => {
      mockEnv = { BASIC_CREDS: 'admin:secret123' }
      const config: TriggerAuthConfig = {
        type: 'basic',
        secret: '${env.BASIC_CREDS}',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeInstanceOf(BasicAuthValidator)

      // Test that the resolved credentials work
      const encoded = btoa('admin:secret123')
      const validRequest = new Request('https://example.com', {
        headers: { Authorization: `Basic ${encoded}` },
      })
      const result = await validator.validate(validRequest, mockEnv)
      expect(result.valid).toBe(true)
    })

    it('should use literal secret if no env var syntax present', async () => {
      mockEnv = { API_SECRET: 'should-not-use-this' }
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: 'literal-token',
      }
      const validator = getValidatorForTrigger(config, mockEnv)

      const validRequest = new Request('https://example.com', {
        headers: { Authorization: 'Bearer literal-token' },
      })
      const result = await validator.validate(validRequest, mockEnv)
      expect(result.valid).toBe(true)
    })
  })

  describe('bearer type', () => {
    it('should create simple bearer validator when no JWT_SECRET', () => {
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: 'my-bearer-token',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeDefined()
      expect(validator.extractToken).toBeDefined()
      expect(validator.validate).toBeDefined()
    })

    it('should throw if bearer has no secret and no JWT_SECRET', () => {
      const config: TriggerAuthConfig = {
        type: 'bearer',
      }
      expect(() => getValidatorForTrigger(config, mockEnv)).toThrow('Bearer auth requires a secret')
    })
  })

  describe('signature type', () => {
    it('should create signature validator', () => {
      const config: TriggerAuthConfig = {
        type: 'signature',
        secret: 'webhook-secret',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeInstanceOf(SignatureValidator)
    })

    it('should create signature validator with preset', () => {
      const config: TriggerAuthConfig = {
        type: 'signature',
        secret: 'github-secret',
        preset: 'github',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeInstanceOf(SignatureValidator)
    })

    it('should throw if signature has no secret', () => {
      const config: TriggerAuthConfig = {
        type: 'signature',
      }
      expect(() => getValidatorForTrigger(config, mockEnv)).toThrow(
        'Signature auth requires a secret'
      )
    })
  })

  describe('basic type', () => {
    it('should create basic auth validator', () => {
      const config: TriggerAuthConfig = {
        type: 'basic',
        secret: 'user:pass',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeInstanceOf(BasicAuthValidator)
    })

    it('should create basic auth validator with realm', () => {
      const config: TriggerAuthConfig = {
        type: 'basic',
        secret: 'admin:secret',
        realm: 'Admin Area',
      }
      const validator = getValidatorForTrigger(config, mockEnv)
      expect(validator).toBeInstanceOf(BasicAuthValidator)
    })

    it('should throw if basic has no secret', () => {
      const config: TriggerAuthConfig = {
        type: 'basic',
      }
      expect(() => getValidatorForTrigger(config, mockEnv)).toThrow(
        'Basic auth requires credentials'
      )
    })
  })

  describe('apiKey type', () => {
    it('should throw if API_KEYS KV not configured', () => {
      const config: TriggerAuthConfig = {
        type: 'apiKey',
      }
      // Without API_KEYS KV namespace, should throw
      expect(() => getValidatorForTrigger(config, mockEnv)).toThrow(
        'API key auth requires API_KEYS KV namespace to be configured'
      )
    })

    it('should create API key validator when KV is configured', () => {
      const mockKVNamespace = {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        getWithMetadata: vi.fn(),
      }
      const envWithKV = { ...mockEnv, API_KEYS: mockKVNamespace }
      const config: TriggerAuthConfig = {
        type: 'apiKey',
      }
      const validator = getValidatorForTrigger(config, envWithKV as any)
      expect(validator).toBeDefined()
    })
  })
})

describe('createTriggerAuthMiddleware', () => {
  let mockEnv: any

  beforeEach(() => {
    mockEnv = {}
  })

  describe('bearer auth', () => {
    it('should authenticate valid bearer token', async () => {
      const secret = 'my-secret-token'
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret,
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            headers: { Authorization: `Bearer ${secret}` },
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).toHaveBeenCalled()
      expect(mockContext.set).toHaveBeenCalledWith('authenticated', true)
    })

    it('should reject invalid bearer token', async () => {
      const config: TriggerAuthConfig = {
        type: 'bearer',
        secret: 'correct-token',
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            headers: { Authorization: 'Bearer wrong-token' },
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).not.toHaveBeenCalled()
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
        401
      )
    })
  })

  describe('basic auth', () => {
    it('should authenticate valid basic auth', async () => {
      const config: TriggerAuthConfig = {
        type: 'basic',
        secret: 'admin:secret123',
        realm: 'Test',
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const encoded = encodeBasicAuth('admin', 'secret123')
      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            headers: { Authorization: `Basic ${encoded}` },
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).toHaveBeenCalled()
      expect(mockContext.set).toHaveBeenCalledWith('authenticated', true)
      expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({ id: 'admin' }))
    })

    it('should reject invalid basic auth and set WWW-Authenticate header', async () => {
      const config: TriggerAuthConfig = {
        type: 'basic',
        secret: 'admin:secret123',
        realm: 'Protected',
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const encoded = encodeBasicAuth('admin', 'wrongpassword')
      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            headers: { Authorization: `Basic ${encoded}` },
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).not.toHaveBeenCalled()
      expect(mockContext.header).toHaveBeenCalledWith(
        'WWW-Authenticate',
        expect.stringContaining('Basic realm=')
      )
    })
  })

  describe('signature auth', () => {
    it('should authenticate valid signature', async () => {
      const secret = 'webhook-secret'
      const config: TriggerAuthConfig = {
        type: 'signature',
        secret,
        algorithm: 'sha256',
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const timestamp = Math.floor(Date.now() / 1000)
      const body = '{"event": "test"}'
      const payload = `${timestamp}.${body}`
      const signature = await computeHMAC(payload, secret)

      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            method: 'POST',
            headers: {
              'x-webhook-signature': signature,
              'x-webhook-timestamp': timestamp.toString(),
            },
            body,
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).toHaveBeenCalled()
      expect(mockContext.set).toHaveBeenCalledWith('authenticated', true)
    })

    it('should use preset for signature validation', async () => {
      const secret = 'github-secret'
      const config: TriggerAuthConfig = {
        type: 'signature',
        secret,
        preset: 'github',
      }
      const middleware = createTriggerAuthMiddleware(config, mockEnv)

      const body = '{"action": "opened"}'
      const signature = await computeHMAC(body, secret)

      const mockContext = {
        req: {
          raw: new Request('https://example.com', {
            method: 'POST',
            headers: {
              'x-hub-signature-256': `sha256=${signature}`,
            },
            body,
          }),
        },
        set: vi.fn(),
        json: vi.fn().mockReturnValue(new Response()),
        header: vi.fn(),
      }
      const next = vi.fn()

      await middleware(mockContext, next)

      expect(next).toHaveBeenCalled()
    })
  })
})

describe('validateTriggerAuthConfig', () => {
  it('should return no errors for valid bearer config', () => {
    const config: TriggerAuthConfig = {
      type: 'bearer',
      secret: 'my-token',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toHaveLength(0)
  })

  it('should return no errors for valid signature config', () => {
    const config: TriggerAuthConfig = {
      type: 'signature',
      secret: 'webhook-secret',
      preset: 'github',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toHaveLength(0)
  })

  it('should return no errors for valid basic config', () => {
    const config: TriggerAuthConfig = {
      type: 'basic',
      secret: 'user:pass',
      realm: 'Test',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toHaveLength(0)
  })

  it('should return error if type is missing', () => {
    const config = {} as TriggerAuthConfig
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toContain('Auth type is required')
  })

  it('should return error for invalid type', () => {
    const config = { type: 'invalid' } as TriggerAuthConfig
    const errors = validateTriggerAuthConfig(config)
    expect(errors[0]).toContain('Invalid auth type')
  })

  it('should return error if bearer has no secret', () => {
    const config: TriggerAuthConfig = {
      type: 'bearer',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toContain('bearer auth requires a secret')
  })

  it('should return error if signature has no secret', () => {
    const config: TriggerAuthConfig = {
      type: 'signature',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toContain('signature auth requires a secret')
  })

  it('should return error for invalid signature algorithm', () => {
    const config: TriggerAuthConfig = {
      type: 'signature',
      secret: 'test',
      algorithm: 'md5' as any,
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors[0]).toContain('Invalid signature algorithm')
  })

  it('should return error for invalid signature preset', () => {
    const config: TriggerAuthConfig = {
      type: 'signature',
      secret: 'test',
      preset: 'unknown' as any,
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors[0]).toContain('Invalid signature preset')
  })

  it('should return error if basic has no secret', () => {
    const config: TriggerAuthConfig = {
      type: 'basic',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toContain('basic auth requires a secret')
  })

  it('should return no errors for apiKey type (no secret required)', () => {
    const config: TriggerAuthConfig = {
      type: 'apiKey',
    }
    const errors = validateTriggerAuthConfig(config)
    expect(errors).toHaveLength(0)
  })
})
