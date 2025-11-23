/**
 * @conductor/unkey
 *
 * Unkey authentication plugin for Conductor
 * Provides API key validation, creation, and management
 */

import { Unkey } from '@unkey/api'
import type {
  LifecyclePlugin,
  PluginContext,
  OperationHandler,
} from '@ensemble-edge/conductor'

export interface UnkeyPluginConfig {
  /** Unkey root key (for management operations) */
  rootKey?: string
  /** Unkey API ID (for validation) */
  apiId?: string
  /** Enable caching of validation results */
  cache?: boolean
  /** Cache TTL in seconds */
  cacheTtl?: number
}

export interface UnkeyValidateConfig {
  /** API key to validate */
  apiKey: string
  /** Optional: Unkey API ID (overrides plugin config) */
  apiId?: string
}

export interface UnkeyCreateConfig {
  /** Unkey API ID */
  apiId?: string
  /** Key prefix */
  prefix?: string
  /** Bytes of randomness (default: 16) */
  byteLength?: number
  /** Owner ID */
  ownerId?: string
  /** Metadata */
  meta?: Record<string, any>
  /** Expiration timestamp (ms) */
  expires?: number
  /** Remaining requests */
  remaining?: number
  /** Refill configuration */
  refill?: {
    interval: 'daily' | 'monthly'
    amount: number
  }
  /** Rate limit */
  ratelimit?: {
    type: 'fast' | 'consistent'
    limit: number
    duration: number
  }
}

export interface UnkeyRevokeConfig {
  /** Key ID to revoke */
  keyId: string
}

/**
 * Unkey Authentication Plugin
 *
 * Provides operations for API key management:
 * - unkey:validate - Validate API keys
 * - unkey:create - Create new API keys
 * - unkey:revoke - Revoke API keys
 *
 * @example
 * ```typescript
 * import { unkeyPlugin } from '@conductor/unkey'
 *
 * export default {
 *   plugins: [
 *     unkeyPlugin({
 *       rootKey: env.UNKEY_ROOT_KEY,
 *       apiId: env.UNKEY_API_ID
 *     })
 *   ]
 * }
 * ```
 */
export const unkeyPlugin: LifecyclePlugin = {
  name: 'unkey',
  version: '0.1.0',
  description: 'Unkey API key authentication and management',

  requiredEnv: ['UNKEY_ROOT_KEY'],

  async initialize(context: PluginContext): Promise<void> {
    const config = context.config as UnkeyPluginConfig
    const { rootKey, apiId } = config

    if (!rootKey) {
      throw new Error('[unkey] Missing required UNKEY_ROOT_KEY')
    }

    // Initialize Unkey client
    const unkey = new Unkey({ rootKey })

    context.logger.info('[unkey] Plugin initialized', {
      apiId,
      cacheEnabled: config.cache ?? false,
    })

    // Register unkey:validate operation
    const validateHandler: OperationHandler = {
      async execute(operation) {
        const validateConfig = operation.config as UnkeyValidateConfig
        const targetApiId = validateConfig.apiId || apiId

        if (!targetApiId) {
          throw new Error('[unkey:validate] Missing apiId')
        }

        if (!validateConfig.apiKey) {
          throw new Error('[unkey:validate] Missing apiKey')
        }

        try {
          const response = await unkey.keys.verify({
            key: validateConfig.apiKey,
            apiId: targetApiId,
          })

          if (response.error) {
            context.logger.error('[unkey:validate] API error', new Error(response.error.message))
            return {
              valid: false,
              keyId: null,
              ownerId: null,
              meta: null,
              remaining: null,
              error: response.error.message,
            }
          }

          const result = response.result

          return {
            valid: result.valid,
            keyId: result.valid ? (result.keyId ?? null) : null,
            ownerId: result.valid ? (result.ownerId ?? null) : null,
            meta: result.valid ? (result.meta ?? null) : null,
            remaining: result.valid ? (result.remaining ?? null) : null,
            error: result.valid ? null : (result.code ?? 'INVALID_KEY'),
          }
        } catch (error) {
          context.logger.error('[unkey:validate] Validation error', error as Error)
          return {
            valid: false,
            keyId: null,
            ownerId: null,
            meta: null,
            remaining: null,
            error: (error as Error).message,
          }
        }
      },
    }

    context.operationRegistry.register('unkey:validate', validateHandler, {
      name: 'unkey:validate',
      description: 'Validate API key with Unkey',
      version: '0.1.0',
      author: '@conductor/unkey',
      contexts: ['all'],
      tags: ['auth', 'security', 'validation', 'unkey'],
      inputs: {
        apiKey: 'string (API key to validate)',
        apiId: 'string (optional: Unkey API ID)',
      },
      outputs: {
        valid: 'boolean',
        keyId: 'string | null',
        ownerId: 'string | null',
        meta: 'object | null',
        remaining: 'number | null',
        error: 'string | null',
      },
    })

    // Register unkey:create operation
    const createHandler: OperationHandler = {
      async execute(operation) {
        const createConfig = operation.config as UnkeyCreateConfig
        const targetApiId = createConfig.apiId || apiId

        if (!targetApiId) {
          throw new Error('[unkey:create] Missing apiId')
        }

        try {
          const response = await unkey.keys.create({
            apiId: targetApiId,
            prefix: createConfig.prefix,
            byteLength: createConfig.byteLength || 16,
            ownerId: createConfig.ownerId,
            meta: createConfig.meta,
            expires: createConfig.expires,
            remaining: createConfig.remaining,
            refill: createConfig.refill,
            ratelimit: createConfig.ratelimit,
          })

          if (response.error) {
            context.logger.error('[unkey:create] API error', new Error(response.error.message))
            throw new Error(`[unkey:create] ${response.error.message}`)
          }

          return {
            key: response.result.key,
            keyId: response.result.keyId,
          }
        } catch (error) {
          context.logger.error('[unkey:create] Creation error', error as Error)
          throw new Error(`[unkey:create] ${(error as Error).message}`)
        }
      },
    }

    context.operationRegistry.register('unkey:create', createHandler, {
      name: 'unkey:create',
      description: 'Create new API key with Unkey',
      version: '0.1.0',
      author: '@conductor/unkey',
      contexts: ['all'],
      tags: ['auth', 'security', 'key-management', 'unkey'],
      inputs: {
        apiId: 'string (optional: Unkey API ID)',
        prefix: 'string (optional: key prefix)',
        byteLength: 'number (optional: bytes of randomness, default: 16)',
        ownerId: 'string (optional: owner ID)',
        meta: 'object (optional: metadata)',
        expires: 'number (optional: expiration timestamp in ms)',
        remaining: 'number (optional: remaining requests)',
        refill: 'object (optional: refill configuration)',
        ratelimit: 'object (optional: rate limit configuration)',
      },
      outputs: {
        key: 'string (the generated API key)',
        keyId: 'string (the key ID)',
      },
    })

    // Register unkey:revoke operation
    const revokeHandler: OperationHandler = {
      async execute(operation) {
        const revokeConfig = operation.config as UnkeyRevokeConfig

        if (!revokeConfig.keyId) {
          throw new Error('[unkey:revoke] Missing keyId')
        }

        try {
          const response = await unkey.keys.delete({
            keyId: revokeConfig.keyId,
          })

          if (response.error) {
            context.logger.error('[unkey:revoke] API error', new Error(response.error.message))
            throw new Error(`[unkey:revoke] ${response.error.message}`)
          }

          return {
            success: true,
            keyId: revokeConfig.keyId,
          }
        } catch (error) {
          context.logger.error('[unkey:revoke] Revocation error', error as Error)
          throw new Error(`[unkey:revoke] ${(error as Error).message}`)
        }
      },
    }

    context.operationRegistry.register('unkey:revoke', revokeHandler, {
      name: 'unkey:revoke',
      description: 'Revoke API key with Unkey',
      version: '0.1.0',
      author: '@conductor/unkey',
      contexts: ['all'],
      tags: ['auth', 'security', 'key-management', 'unkey'],
      inputs: {
        keyId: 'string (key ID to revoke)',
      },
      outputs: {
        success: 'boolean',
        keyId: 'string',
      },
    })

    context.logger.info('[unkey] Operations registered', {
      operations: ['unkey:validate', 'unkey:create', 'unkey:revoke'],
    })
  },
}

/**
 * Create Unkey plugin with configuration
 *
 * @example
 * ```typescript
 * createUnkeyPlugin({
 *   rootKey: env.UNKEY_ROOT_KEY,
 *   apiId: env.UNKEY_API_ID,
 *   cache: true
 * })
 * ```
 */
export function createUnkeyPlugin(config: UnkeyPluginConfig): LifecyclePlugin {
  return {
    ...unkeyPlugin,
    async initialize(context: PluginContext) {
      // Merge config
      context.config = { ...context.config, ...config }
      return unkeyPlugin.initialize(context)
    },
  }
}

export default unkeyPlugin
