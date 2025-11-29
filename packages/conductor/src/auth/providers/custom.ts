/**
 * Custom Authentication Validators
 *
 * Custom validators for webhook signature verification and other use cases
 *
 * Includes:
 * - Stripe webhook signature validation
 * - GitHub webhook signature validation
 * - Twilio webhook signature validation
 * - Custom validator interface
 */

import type { AuthValidator, AuthValidationResult, AuthContext } from '../types.js'
import type { ConductorEnv } from '../../types/env.js'
import { createLogger } from '../../observability/index.js'

const logger = createLogger({ serviceName: 'auth-custom' })

/**
 * Stripe Webhook Signature Validator
 */
export class StripeSignatureValidator implements AuthValidator {
  constructor(private webhookSecret: string) {}

  extractToken(request: Request): string | null {
    return request.headers.get('stripe-signature')
  }

  async validate(request: Request, _env: ConductorEnv): Promise<AuthValidationResult> {
    const signature = this.extractToken(request)
    if (!signature) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Missing Stripe signature',
      }
    }

    const body = await request.text()
    const isValid = await this.verifyStripeSignature(body, signature)

    if (!isValid) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid Stripe signature',
      }
    }

    return {
      valid: true,
      context: {
        authenticated: true,
        method: 'custom',
        custom: {
          provider: 'stripe',
          signature,
        },
      },
    }
  }

  private async verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // Parse signature header
      const elements = signature.split(',')
      const signatureData: Record<string, string> = {}

      for (const element of elements) {
        const [key, value] = element.split('=')
        signatureData[key] = value
      }

      const timestamp = signatureData['t']
      const signatures = [signatureData['v1']]

      if (!timestamp || !signatures[0]) {
        return false
      }

      // Check timestamp (prevent replay attacks)
      const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp)
      if (timestampAge > 300) {
        // 5 minutes
        return false
      }

      // Compute expected signature
      const signedPayload = `${timestamp}.${payload}`
      const expectedSignature = await this.computeHMAC(signedPayload, this.webhookSecret)

      // Compare signatures
      return signatures.some((sig) => this.secureCompare(sig, expectedSignature))
    } catch (error) {
      logger.error('Stripe signature verification error', error instanceof Error ? error : undefined)
      return false
    }
  }

  private async computeHMAC(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

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

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

/**
 * GitHub Webhook Signature Validator
 */
export class GitHubSignatureValidator implements AuthValidator {
  constructor(private webhookSecret: string) {}

  extractToken(request: Request): string | null {
    return request.headers.get('x-hub-signature-256')
  }

  async validate(request: Request, _env: ConductorEnv): Promise<AuthValidationResult> {
    const signature = this.extractToken(request)
    if (!signature) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Missing GitHub signature',
      }
    }

    const body = await request.text()
    const isValid = await this.verifyGitHubSignature(body, signature)

    if (!isValid) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid GitHub signature',
      }
    }

    return {
      valid: true,
      context: {
        authenticated: true,
        method: 'custom',
        custom: {
          provider: 'github',
          signature,
        },
      },
    }
  }

  private async verifyGitHubSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // GitHub signature format: sha256=<hex>
      if (!signature.startsWith('sha256=')) {
        return false
      }

      const receivedSignature = signature.substring(7)
      const expectedSignature = await this.computeHMAC(payload, this.webhookSecret)

      return this.secureCompare(receivedSignature, expectedSignature)
    } catch (error) {
      logger.error('GitHub signature verification error', error instanceof Error ? error : undefined)
      return false
    }
  }

  private async computeHMAC(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

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

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

/**
 * Twilio Webhook Signature Validator
 */
export class TwilioSignatureValidator implements AuthValidator {
  constructor(private authToken: string) {}

  extractToken(request: Request): string | null {
    return request.headers.get('x-twilio-signature')
  }

  async validate(request: Request, _env: ConductorEnv): Promise<AuthValidationResult> {
    const signature = this.extractToken(request)
    if (!signature) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Missing Twilio signature',
      }
    }

    const url = request.url
    const body = await request.text()
    const isValid = await this.verifyTwilioSignature(url, body, signature)

    if (!isValid) {
      return {
        valid: false,
        error: 'invalid_token',
        message: 'Invalid Twilio signature',
      }
    }

    return {
      valid: true,
      context: {
        authenticated: true,
        method: 'custom',
        custom: {
          provider: 'twilio',
          signature,
        },
      },
    }
  }

  private async verifyTwilioSignature(
    url: string,
    body: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Twilio signature: base64(hmac-sha1(url + params))
      const params = new URLSearchParams(body)
      const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))

      let data = url
      for (const [key, value] of sortedParams) {
        data += key + value
      }

      const expectedSignature = await this.computeHMAC(data, this.authToken)

      return this.secureCompare(signature, expectedSignature)
    } catch (error) {
      logger.error('Twilio signature verification error', error instanceof Error ? error : undefined)
      return false
    }
  }

  private async computeHMAC(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, messageData)

    // Convert to base64
    const bytes = new Uint8Array(signature)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}

/**
 * Custom Validator Registry
 */
export class CustomValidatorRegistry {
  private validators: Map<string, AuthValidator> = new Map()

  /**
   * Register a custom validator
   */
  register(name: string, validator: AuthValidator): void {
    this.validators.set(name, validator)
  }

  /**
   * Get a validator by name
   */
  get(name: string): AuthValidator | undefined {
    return this.validators.get(name)
  }

  /**
   * Check if validator exists
   */
  has(name: string): boolean {
    return this.validators.has(name)
  }

  /**
   * Register built-in validators from environment
   */
  registerBuiltIn(env: ConductorEnv): void {
    // Stripe
    if (env.STRIPE_WEBHOOK_SECRET) {
      this.register('stripe-signature', new StripeSignatureValidator(env.STRIPE_WEBHOOK_SECRET))
    }

    // GitHub
    if (env.GITHUB_WEBHOOK_SECRET) {
      this.register('github-signature', new GitHubSignatureValidator(env.GITHUB_WEBHOOK_SECRET))
    }

    // Twilio
    if (env.TWILIO_AUTH_TOKEN) {
      this.register('twilio-signature', new TwilioSignatureValidator(env.TWILIO_AUTH_TOKEN))
    }
  }
}

/**
 * Create custom validator registry
 */
export function createCustomValidatorRegistry(env: ConductorEnv): CustomValidatorRegistry {
  const registry = new CustomValidatorRegistry()
  registry.registerBuiltIn(env)
  return registry
}
