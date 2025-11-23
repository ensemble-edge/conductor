/**
 * CSRF token utilities for form security
 */

import type { CsrfConfig } from '../types/index.js'

/**
 * Generate a CSRF token
 */
export async function generateCsrfToken(
  config: CsrfConfig,
  env: { [key: string]: unknown }
): Promise<string> {
  const secret = config.secret || 'default-csrf-secret'
  const expiresIn = config.expiresIn || 3600 // Default 1 hour

  // Generate random token value
  const tokenValue = generateRandomString(32)
  const expiresAt = Date.now() + expiresIn * 1000

  // Create token payload
  const payload = {
    value: tokenValue,
    expiresAt,
  }

  // Sign the token
  const signature = await signData(JSON.stringify(payload), secret)
  const token = btoa(JSON.stringify({ ...payload, signature }))

  // Store token in KV if available (for server-side validation)
  const kv = env.CSRF_TOKENS as KVNamespace | undefined
  if (kv) {
    await kv.put(tokenValue, JSON.stringify(payload), {
      expirationTtl: expiresIn,
    })
  }

  return token
}

/**
 * Validate a CSRF token
 */
export async function validateCsrfToken(
  token: string,
  config: CsrfConfig,
  env: { [key: string]: unknown }
): Promise<boolean> {
  if (!token) {
    return false
  }

  try {
    const secret = config.secret || 'default-csrf-secret'

    // Decode token
    const decoded = JSON.parse(atob(token))
    const { value, expiresAt, signature } = decoded

    // Check expiration
    if (Date.now() > expiresAt) {
      return false
    }

    // Verify signature
    const payload = { value, expiresAt }
    const expectedSignature = await signData(JSON.stringify(payload), secret)
    if (signature !== expectedSignature) {
      return false
    }

    // Check KV storage if available (additional verification)
    const kv = env.CSRF_TOKENS as KVNamespace | undefined
    if (kv) {
      const stored = await kv.get(value)
      if (!stored) {
        return false
      }

      // Delete token after use (one-time use)
      await kv.delete(value)
    }

    return true
  } catch (error) {
    // Invalid token format or other error
    return false
  }
}

/**
 * Generate a random string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // Use crypto.getRandomValues if available (browser/Worker)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback to Math.random (less secure, for development only)
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }

  return result
}

/**
 * Sign data using HMAC-SHA256
 */
async function signData(data: string, secret: string): Promise<string> {
  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Sign
    const signature = await crypto.subtle.sign('HMAC', key, messageData)

    // Convert to hex string
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Fallback: simple hash (less secure, for development only)
  return simpleHash(data + secret)
}

/**
 * Simple hash function (fallback for environments without crypto.subtle)
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}
