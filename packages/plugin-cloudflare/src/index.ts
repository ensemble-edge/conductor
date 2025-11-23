/**
 * @conductor/cloudflare
 *
 * Cloudflare API plugin for Conductor
 * Provides operations for R2, KV, D1, DNS, Workers, and more
 */

import type {
  LifecyclePlugin,
  PluginContext,
  OperationHandler,
} from '@ensemble-edge/conductor'

export interface CloudflarePluginConfig {
  /** Cloudflare API token */
  apiToken?: string
  /** Cloudflare Account ID */
  accountId?: string
  /** Cloudflare Zone ID (for DNS operations) */
  zoneId?: string
}

// R2 Operations
export interface R2PutConfig {
  /** R2 bucket binding name */
  bucket: string
  /** Object key */
  key: string
  /** Object value (string or ReadableStream) */
  value: string | ReadableStream | ArrayBuffer
  /** Content type */
  contentType?: string
  /** Custom metadata */
  metadata?: Record<string, string>
}

export interface R2GetConfig {
  /** R2 bucket binding name */
  bucket: string
  /** Object key */
  key: string
}

export interface R2DeleteConfig {
  /** R2 bucket binding name */
  bucket: string
  /** Object key */
  key: string
}

export interface R2ListConfig {
  /** R2 bucket binding name */
  bucket: string
  /** Prefix filter */
  prefix?: string
  /** Limit results */
  limit?: number
  /** Cursor for pagination */
  cursor?: string
}

// KV Operations
export interface KVPutConfig {
  /** KV namespace binding name */
  namespace: string
  /** Key */
  key: string
  /** Value */
  value: string
  /** Expiration TTL in seconds */
  expirationTtl?: number
  /** Metadata */
  metadata?: Record<string, any>
}

export interface KVGetConfig {
  /** KV namespace binding name */
  namespace: string
  /** Key */
  key: string
  /** Return type */
  type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
}

export interface KVDeleteConfig {
  /** KV namespace binding name */
  namespace: string
  /** Key */
  key: string
}

export interface KVListConfig {
  /** KV namespace binding name */
  namespace: string
  /** Prefix filter */
  prefix?: string
  /** Limit results */
  limit?: number
  /** Cursor for pagination */
  cursor?: string
}

// D1 Operations
export interface D1QueryConfig {
  /** D1 database binding name */
  database: string
  /** SQL query */
  query: string
  /** Query parameters */
  params?: any[]
}

export interface D1BatchConfig {
  /** D1 database binding name */
  database: string
  /** Array of statements with queries and params */
  statements: Array<{ query: string; params?: any[] }>
}

// Cloudflare API Operations
export interface CloudflareAPIRequestConfig {
  /** API endpoint path (e.g., /zones/:zoneId/dns_records) */
  endpoint: string
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request body */
  body?: Record<string, any>
  /** Query parameters */
  params?: Record<string, string>
}

export interface DNSRecordCreateConfig {
  /** DNS record type */
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'SRV'
  /** Record name */
  name: string
  /** Record content */
  content: string
  /** TTL (1 = automatic) */
  ttl?: number
  /** Proxied through Cloudflare */
  proxied?: boolean
  /** Priority (for MX/SRV records) */
  priority?: number
  /** Comment */
  comment?: string
}

// Cloudflare API Response types
interface CloudflareAPIResponse {
  success: boolean
  errors?: Array<{ code: number; message: string }>
  messages?: string[]
  result?: any
  result_info?: {
    page?: number
    per_page?: number
    count?: number
    total_count?: number
  }
}

/**
 * Cloudflare Plugin
 *
 * Provides operations for Cloudflare services:
 *
 * **R2 Storage:**
 * - cloudflare:r2:put - Upload object to R2
 * - cloudflare:r2:get - Get object from R2
 * - cloudflare:r2:delete - Delete object from R2
 * - cloudflare:r2:list - List objects in R2 bucket
 *
 * **KV Storage:**
 * - cloudflare:kv:put - Write key-value pair
 * - cloudflare:kv:get - Read key-value pair
 * - cloudflare:kv:delete - Delete key-value pair
 * - cloudflare:kv:list - List keys in namespace
 *
 * **D1 Database:**
 * - cloudflare:d1:query - Execute SQL query
 * - cloudflare:d1:batch - Execute batch queries
 *
 * **Cloudflare API:**
 * - cloudflare:api:request - Make Cloudflare API request
 * - cloudflare:dns:create - Create DNS record
 *
 * @example
 * ```typescript
 * import { cloudflarePlugin } from '@conductor/cloudflare'
 *
 * export default {
 *   plugins: [
 *     cloudflarePlugin({
 *       apiToken: env.CLOUDFLARE_API_TOKEN,
 *       accountId: env.CLOUDFLARE_ACCOUNT_ID,
 *       zoneId: env.CLOUDFLARE_ZONE_ID
 *     })
 *   ]
 * }
 * ```
 */
export const cloudflarePlugin: LifecyclePlugin = {
  name: 'cloudflare',
  version: '0.1.0',
  description: 'Cloudflare services integration (R2, KV, D1, API)',

  async initialize(context: PluginContext): Promise<void> {
    const config = context.config as CloudflarePluginConfig
    const { apiToken, accountId, zoneId } = config

    context.logger.info('[cloudflare] Plugin initialized', {
      hasApiToken: !!apiToken,
      hasAccountId: !!accountId,
      hasZoneId: !!zoneId,
    })

    // R2 Operations
    const r2PutHandler: OperationHandler = {
      async execute(operation) {
        const r2Config = operation.config as R2PutConfig

        if (!r2Config.bucket) {
          throw new Error('[cloudflare:r2:put] Missing bucket')
        }
        if (!r2Config.key) {
          throw new Error('[cloudflare:r2:put] Missing key')
        }
        if (r2Config.value === undefined) {
          throw new Error('[cloudflare:r2:put] Missing value')
        }

        try {
          const bucket = context.env[r2Config.bucket] as R2Bucket
          if (!bucket) {
            throw new Error(`[cloudflare:r2:put] R2 bucket binding "${r2Config.bucket}" not found`)
          }

          const options: Record<string, any> = {}
          if (r2Config.contentType) {
            options.httpMetadata = { contentType: r2Config.contentType }
          }
          if (r2Config.metadata) {
            options.customMetadata = r2Config.metadata
          }

          await bucket.put(r2Config.key, r2Config.value, options)

          return {
            success: true,
            key: r2Config.key,
            bucket: r2Config.bucket,
          }
        } catch (error) {
          context.logger.error('[cloudflare:r2:put] Upload error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:r2:put', r2PutHandler, {
      name: 'cloudflare:r2:put',
      description: 'Upload object to Cloudflare R2',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'r2', 'storage', 'upload'],
    })

    const r2GetHandler: OperationHandler = {
      async execute(operation) {
        const r2Config = operation.config as R2GetConfig

        if (!r2Config.bucket) {
          throw new Error('[cloudflare:r2:get] Missing bucket')
        }
        if (!r2Config.key) {
          throw new Error('[cloudflare:r2:get] Missing key')
        }

        try {
          const bucket = context.env[r2Config.bucket] as R2Bucket
          if (!bucket) {
            throw new Error(`[cloudflare:r2:get] R2 bucket binding "${r2Config.bucket}" not found`)
          }

          const object = await bucket.get(r2Config.key)

          if (!object) {
            return {
              found: false,
              key: r2Config.key,
            }
          }

          return {
            found: true,
            key: object.key,
            size: object.size,
            etag: object.etag,
            httpEtag: object.httpEtag,
            uploaded: object.uploaded.toISOString(),
            httpMetadata: object.httpMetadata,
            customMetadata: object.customMetadata,
            body: await object.text(),
          }
        } catch (error) {
          context.logger.error('[cloudflare:r2:get] Download error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:r2:get', r2GetHandler, {
      name: 'cloudflare:r2:get',
      description: 'Get object from Cloudflare R2',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'r2', 'storage', 'download'],
    })

    const r2DeleteHandler: OperationHandler = {
      async execute(operation) {
        const r2Config = operation.config as R2DeleteConfig

        if (!r2Config.bucket) {
          throw new Error('[cloudflare:r2:delete] Missing bucket')
        }
        if (!r2Config.key) {
          throw new Error('[cloudflare:r2:delete] Missing key')
        }

        try {
          const bucket = context.env[r2Config.bucket] as R2Bucket
          if (!bucket) {
            throw new Error(`[cloudflare:r2:delete] R2 bucket binding "${r2Config.bucket}" not found`)
          }

          await bucket.delete(r2Config.key)

          return {
            success: true,
            key: r2Config.key,
          }
        } catch (error) {
          context.logger.error('[cloudflare:r2:delete] Deletion error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:r2:delete', r2DeleteHandler, {
      name: 'cloudflare:r2:delete',
      description: 'Delete object from Cloudflare R2',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'r2', 'storage', 'delete'],
    })

    const r2ListHandler: OperationHandler = {
      async execute(operation) {
        const r2Config = operation.config as R2ListConfig

        if (!r2Config.bucket) {
          throw new Error('[cloudflare:r2:list] Missing bucket')
        }

        try {
          const bucket = context.env[r2Config.bucket] as R2Bucket
          if (!bucket) {
            throw new Error(`[cloudflare:r2:list] R2 bucket binding "${r2Config.bucket}" not found`)
          }

          const options: Record<string, any> = {}
          if (r2Config.prefix) options.prefix = r2Config.prefix
          if (r2Config.limit) options.limit = r2Config.limit
          if (r2Config.cursor) options.cursor = r2Config.cursor

          const listed = await bucket.list(options)

          return {
            objects: listed.objects.map(obj => ({
              key: obj.key,
              size: obj.size,
              etag: obj.etag,
              httpEtag: obj.httpEtag,
              uploaded: obj.uploaded.toISOString(),
            })),
            truncated: listed.truncated,
            cursor: listed.truncated ? listed.cursor : undefined,
            delimitedPrefixes: listed.delimitedPrefixes,
          }
        } catch (error) {
          context.logger.error('[cloudflare:r2:list] List error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:r2:list', r2ListHandler, {
      name: 'cloudflare:r2:list',
      description: 'List objects in Cloudflare R2 bucket',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'r2', 'storage', 'list'],
    })

    // KV Operations
    const kvPutHandler: OperationHandler = {
      async execute(operation) {
        const kvConfig = operation.config as KVPutConfig

        if (!kvConfig.namespace) {
          throw new Error('[cloudflare:kv:put] Missing namespace')
        }
        if (!kvConfig.key) {
          throw new Error('[cloudflare:kv:put] Missing key')
        }
        if (kvConfig.value === undefined) {
          throw new Error('[cloudflare:kv:put] Missing value')
        }

        try {
          const namespace = context.env[kvConfig.namespace] as KVNamespace
          if (!namespace) {
            throw new Error(`[cloudflare:kv:put] KV namespace binding "${kvConfig.namespace}" not found`)
          }

          const options: Record<string, any> = {}
          if (kvConfig.expirationTtl) options.expirationTtl = kvConfig.expirationTtl
          if (kvConfig.metadata) options.metadata = kvConfig.metadata

          await namespace.put(kvConfig.key, kvConfig.value, options)

          return {
            success: true,
            key: kvConfig.key,
            namespace: kvConfig.namespace,
          }
        } catch (error) {
          context.logger.error('[cloudflare:kv:put] Write error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:kv:put', kvPutHandler, {
      name: 'cloudflare:kv:put',
      description: 'Write key-value pair to Cloudflare KV',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'kv', 'storage', 'write'],
    })

    const kvGetHandler: OperationHandler = {
      async execute(operation) {
        const kvConfig = operation.config as KVGetConfig

        if (!kvConfig.namespace) {
          throw new Error('[cloudflare:kv:get] Missing namespace')
        }
        if (!kvConfig.key) {
          throw new Error('[cloudflare:kv:get] Missing key')
        }

        try {
          const namespace = context.env[kvConfig.namespace] as KVNamespace
          if (!namespace) {
            throw new Error(`[cloudflare:kv:get] KV namespace binding "${kvConfig.namespace}" not found`)
          }

          const type = kvConfig.type || 'text'
          let value

          if (type === 'json') {
            value = await namespace.get(kvConfig.key, 'json')
          } else if (type === 'arrayBuffer') {
            value = await namespace.get(kvConfig.key, 'arrayBuffer')
          } else if (type === 'stream') {
            value = await namespace.get(kvConfig.key, 'stream')
          } else {
            value = await namespace.get(kvConfig.key, 'text')
          }

          return {
            found: value !== null,
            key: kvConfig.key,
            value,
          }
        } catch (error) {
          context.logger.error('[cloudflare:kv:get] Read error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:kv:get', kvGetHandler, {
      name: 'cloudflare:kv:get',
      description: 'Read key-value pair from Cloudflare KV',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'kv', 'storage', 'read'],
    })

    const kvDeleteHandler: OperationHandler = {
      async execute(operation) {
        const kvConfig = operation.config as KVDeleteConfig

        if (!kvConfig.namespace) {
          throw new Error('[cloudflare:kv:delete] Missing namespace')
        }
        if (!kvConfig.key) {
          throw new Error('[cloudflare:kv:delete] Missing key')
        }

        try {
          const namespace = context.env[kvConfig.namespace] as KVNamespace
          if (!namespace) {
            throw new Error(`[cloudflare:kv:delete] KV namespace binding "${kvConfig.namespace}" not found`)
          }

          await namespace.delete(kvConfig.key)

          return {
            success: true,
            key: kvConfig.key,
          }
        } catch (error) {
          context.logger.error('[cloudflare:kv:delete] Delete error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:kv:delete', kvDeleteHandler, {
      name: 'cloudflare:kv:delete',
      description: 'Delete key-value pair from Cloudflare KV',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'kv', 'storage', 'delete'],
    })

    const kvListHandler: OperationHandler = {
      async execute(operation) {
        const kvConfig = operation.config as KVListConfig

        if (!kvConfig.namespace) {
          throw new Error('[cloudflare:kv:list] Missing namespace')
        }

        try {
          const namespace = context.env[kvConfig.namespace] as KVNamespace
          if (!namespace) {
            throw new Error(`[cloudflare:kv:list] KV namespace binding "${kvConfig.namespace}" not found`)
          }

          const options: Record<string, any> = {}
          if (kvConfig.prefix) options.prefix = kvConfig.prefix
          if (kvConfig.limit) options.limit = kvConfig.limit
          if (kvConfig.cursor) options.cursor = kvConfig.cursor

          const listed = await namespace.list(options)

          return {
            keys: listed.keys,
            list_complete: listed.list_complete,
            cursor: !listed.list_complete ? listed.cursor : undefined,
          }
        } catch (error) {
          context.logger.error('[cloudflare:kv:list] List error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:kv:list', kvListHandler, {
      name: 'cloudflare:kv:list',
      description: 'List keys in Cloudflare KV namespace',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'kv', 'storage', 'list'],
    })

    // D1 Operations
    const d1QueryHandler: OperationHandler = {
      async execute(operation) {
        const d1Config = operation.config as D1QueryConfig

        if (!d1Config.database) {
          throw new Error('[cloudflare:d1:query] Missing database')
        }
        if (!d1Config.query) {
          throw new Error('[cloudflare:d1:query] Missing query')
        }

        try {
          const db = context.env[d1Config.database] as D1Database
          if (!db) {
            throw new Error(`[cloudflare:d1:query] D1 database binding "${d1Config.database}" not found`)
          }

          const stmt = d1Config.params
            ? db.prepare(d1Config.query).bind(...d1Config.params)
            : db.prepare(d1Config.query)

          const result = await stmt.all()

          return {
            success: result.success,
            results: result.results,
            meta: result.meta,
          }
        } catch (error) {
          context.logger.error('[cloudflare:d1:query] Query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:d1:query', d1QueryHandler, {
      name: 'cloudflare:d1:query',
      description: 'Execute SQL query on Cloudflare D1',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'd1', 'database', 'sql'],
    })

    const d1BatchHandler: OperationHandler = {
      async execute(operation) {
        const d1Config = operation.config as D1BatchConfig

        if (!d1Config.database) {
          throw new Error('[cloudflare:d1:batch] Missing database')
        }
        if (!d1Config.statements || d1Config.statements.length === 0) {
          throw new Error('[cloudflare:d1:batch] Missing statements')
        }

        try {
          const db = context.env[d1Config.database] as D1Database
          if (!db) {
            throw new Error(`[cloudflare:d1:batch] D1 database binding "${d1Config.database}" not found`)
          }

          const statements = d1Config.statements.map(stmt =>
            stmt.params
              ? db.prepare(stmt.query).bind(...stmt.params)
              : db.prepare(stmt.query)
          )

          const results = await db.batch(statements)

          return {
            success: true,
            results: results.map(r => ({
              success: r.success,
              results: r.results,
              meta: r.meta,
            })),
          }
        } catch (error) {
          context.logger.error('[cloudflare:d1:batch] Batch error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:d1:batch', d1BatchHandler, {
      name: 'cloudflare:d1:batch',
      description: 'Execute batch SQL queries on Cloudflare D1',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'd1', 'database', 'sql', 'batch'],
    })

    // Cloudflare API Operations
    const apiRequestHandler: OperationHandler = {
      async execute(operation) {
        const apiConfig = operation.config as CloudflareAPIRequestConfig

        if (!apiConfig.endpoint) {
          throw new Error('[cloudflare:api:request] Missing endpoint')
        }
        if (!apiConfig.method) {
          throw new Error('[cloudflare:api:request] Missing method')
        }
        if (!apiToken) {
          throw new Error('[cloudflare:api:request] Missing CLOUDFLARE_API_TOKEN')
        }

        try {
          const url = new URL(`https://api.cloudflare.com/client/v4${apiConfig.endpoint}`)

          if (apiConfig.params) {
            Object.entries(apiConfig.params).forEach(([key, value]) => {
              url.searchParams.append(key, value)
            })
          }

          const headers: Record<string, string> = {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          }

          const response = await fetch(url.toString(), {
            method: apiConfig.method,
            headers,
            body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined,
          })

          const data: CloudflareAPIResponse = await response.json()

          if (!response.ok || !data.success) {
            const errorMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error'
            throw new Error(`[cloudflare:api:request] API error: ${errorMsg}`)
          }

          return {
            success: data.success,
            result: data.result,
            result_info: data.result_info,
          }
        } catch (error) {
          context.logger.error('[cloudflare:api:request] API request error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:api:request', apiRequestHandler, {
      name: 'cloudflare:api:request',
      description: 'Make Cloudflare API request',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'api', 'http'],
    })

    const dnsCreateHandler: OperationHandler = {
      async execute(operation) {
        const dnsConfig = operation.config as DNSRecordCreateConfig

        if (!dnsConfig.type) {
          throw new Error('[cloudflare:dns:create] Missing type')
        }
        if (!dnsConfig.name) {
          throw new Error('[cloudflare:dns:create] Missing name')
        }
        if (!dnsConfig.content) {
          throw new Error('[cloudflare:dns:create] Missing content')
        }
        if (!zoneId) {
          throw new Error('[cloudflare:dns:create] Missing CLOUDFLARE_ZONE_ID')
        }
        if (!apiToken) {
          throw new Error('[cloudflare:dns:create] Missing CLOUDFLARE_API_TOKEN')
        }

        try {
          const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`

          const body: Record<string, any> = {
            type: dnsConfig.type,
            name: dnsConfig.name,
            content: dnsConfig.content,
            ttl: dnsConfig.ttl || 1,
          }

          if (dnsConfig.proxied !== undefined) body.proxied = dnsConfig.proxied
          if (dnsConfig.priority) body.priority = dnsConfig.priority
          if (dnsConfig.comment) body.comment = dnsConfig.comment

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          const data: CloudflareAPIResponse = await response.json()

          if (!response.ok || !data.success) {
            const errorMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error'
            throw new Error(`[cloudflare:dns:create] API error: ${errorMsg}`)
          }

          return {
            success: true,
            record: data.result,
          }
        } catch (error) {
          context.logger.error('[cloudflare:dns:create] DNS creation error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('cloudflare:dns:create', dnsCreateHandler, {
      name: 'cloudflare:dns:create',
      description: 'Create DNS record in Cloudflare',
      version: '0.1.0',
      author: '@conductor/cloudflare',
      contexts: ['all'],
      tags: ['cloudflare', 'dns', 'create'],
    })

    context.logger.info('[cloudflare] Operations registered', {
      operations: [
        'cloudflare:r2:put',
        'cloudflare:r2:get',
        'cloudflare:r2:delete',
        'cloudflare:r2:list',
        'cloudflare:kv:put',
        'cloudflare:kv:get',
        'cloudflare:kv:delete',
        'cloudflare:kv:list',
        'cloudflare:d1:query',
        'cloudflare:d1:batch',
        'cloudflare:api:request',
        'cloudflare:dns:create',
      ],
    })
  },
}

/**
 * Create Cloudflare plugin with configuration
 *
 * @example
 * ```typescript
 * createCloudflarePlugin({
 *   apiToken: env.CLOUDFLARE_API_TOKEN,
 *   accountId: env.CLOUDFLARE_ACCOUNT_ID,
 *   zoneId: env.CLOUDFLARE_ZONE_ID
 * })
 * ```
 */
export function createCloudflarePlugin(config: CloudflarePluginConfig): LifecyclePlugin {
  return {
    ...cloudflarePlugin,
    async initialize(context: PluginContext) {
      // Merge config
      context.config = { ...context.config, ...config }
      return cloudflarePlugin.initialize(context)
    },
  }
}

export default cloudflarePlugin
