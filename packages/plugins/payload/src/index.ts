/**
 * @conductor/payload
 *
 * Payload CMS plugin for Conductor
 * Provides operations for querying and mutating Payload collections
 */

import type {
  LifecyclePlugin,
  PluginContext,
  OperationHandler,
} from '@ensemble-edge/conductor'

export interface PayloadPluginConfig {
  /** Payload CMS API URL */
  apiUrl?: string
  /** Payload API Key */
  apiKey?: string
  /** Enable request caching */
  cache?: boolean
  /** Cache TTL in seconds */
  cacheTtl?: number
}

export interface PayloadFindConfig {
  /** Collection slug */
  collection: string
  /** Query parameters */
  where?: Record<string, any>
  /** Depth of population */
  depth?: number
  /** Limit results */
  limit?: number
  /** Page number */
  page?: number
  /** Sort field */
  sort?: string
  /** Select specific fields */
  select?: string[]
}

export interface PayloadCreateConfig {
  /** Collection slug */
  collection: string
  /** Document data */
  data: Record<string, any>
  /** Depth of population */
  depth?: number
  /** Draft status */
  draft?: boolean
}

export interface PayloadUpdateConfig {
  /** Collection slug */
  collection: string
  /** Document ID */
  id: string
  /** Document data */
  data: Record<string, any>
  /** Depth of population */
  depth?: number
  /** Draft status */
  draft?: boolean
}

export interface PayloadDeleteConfig {
  /** Collection slug */
  collection: string
  /** Document ID */
  id: string
}

// Payload API Response Types
interface PayloadFindResponse {
  docs: any[]
  totalDocs?: number
  limit?: number
  page?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

interface PayloadMutationResponse {
  doc?: any
  message?: string
}

export interface PayloadFindByIDConfig {
  /** Collection slug */
  collection: string
  /** Document ID */
  id: string
  /** Depth of population */
  depth?: number
}

/**
 * Payload CMS Plugin
 *
 * Provides operations for Payload CMS:
 * - payload:find - Query documents from a collection
 * - payload:findById - Get a single document by ID
 * - payload:create - Create a new document
 * - payload:update - Update an existing document
 * - payload:delete - Delete a document
 *
 * @example
 * ```typescript
 * import { payloadPlugin } from '@conductor/payload'
 *
 * export default {
 *   plugins: [
 *     payloadPlugin({
 *       apiUrl: env.PAYLOAD_API_URL,
 *       apiKey: env.PAYLOAD_API_KEY
 *     })
 *   ]
 * }
 * ```
 */
export const payloadPlugin: LifecyclePlugin = {
  name: 'payload',
  version: '0.1.0',
  description: 'Payload CMS integration for querying and mutating collections',

  requiredEnv: ['PAYLOAD_API_URL'],

  async initialize(context: PluginContext): Promise<void> {
    const config = context.config as PayloadPluginConfig
    const { apiUrl, apiKey } = config

    if (!apiUrl) {
      throw new Error('[payload] Missing required PAYLOAD_API_URL')
    }

    context.logger.info('[payload] Plugin initialized', {
      apiUrl,
      cacheEnabled: config.cache ?? false,
    })

    // Helper function to make Payload API requests
    const makeRequest = async (
      method: string,
      endpoint: string,
      body?: Record<string, any>,
      params?: Record<string, any>
    ) => {
      const url = new URL(`${apiUrl}${endpoint}`)

      // Add query parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value))
          }
        })
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (apiKey) {
        headers['Authorization'] = `users API-Key ${apiKey}`
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`[payload] API error (${response.status}): ${errorText}`)
      }

      return await response.json()
    }

    // Register payload:find operation
    const findHandler: OperationHandler = {
      async execute(operation) {
        const findConfig = operation.config as PayloadFindConfig

        if (!findConfig.collection) {
          throw new Error('[payload:find] Missing collection')
        }

        try {
          const params: Record<string, any> = {}

          if (findConfig.where) {
            params.where = JSON.stringify(findConfig.where)
          }
          if (findConfig.depth !== undefined) {
            params.depth = findConfig.depth
          }
          if (findConfig.limit) {
            params.limit = findConfig.limit
          }
          if (findConfig.page) {
            params.page = findConfig.page
          }
          if (findConfig.sort) {
            params.sort = findConfig.sort
          }
          if (findConfig.select) {
            params.select = findConfig.select.join(',')
          }

          const result = await makeRequest(
            'GET',
            `/${findConfig.collection}`,
            undefined,
            params
          ) as PayloadFindResponse

          return {
            docs: result.docs || [],
            totalDocs: result.totalDocs || 0,
            limit: result.limit,
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
          }
        } catch (error) {
          context.logger.error('[payload:find] Query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('payload:find', findHandler, {
      name: 'payload:find',
      description: 'Query documents from a Payload collection',
      version: '0.1.0',
      author: '@conductor/payload',
      contexts: ['all'],
      tags: ['cms', 'data', 'query', 'payload'],
      inputs: {
        collection: 'string (collection slug)',
        where: 'object (optional: query conditions)',
        depth: 'number (optional: population depth)',
        limit: 'number (optional: results limit)',
        page: 'number (optional: page number)',
        sort: 'string (optional: sort field)',
        select: 'array (optional: fields to select)',
      },
      outputs: {
        docs: 'array (documents)',
        totalDocs: 'number',
        limit: 'number',
        page: 'number',
        totalPages: 'number',
        hasNextPage: 'boolean',
        hasPrevPage: 'boolean',
      },
    })

    // Register payload:findById operation
    const findByIdHandler: OperationHandler = {
      async execute(operation) {
        const findByIdConfig = operation.config as PayloadFindByIDConfig

        if (!findByIdConfig.collection) {
          throw new Error('[payload:findById] Missing collection')
        }
        if (!findByIdConfig.id) {
          throw new Error('[payload:findById] Missing id')
        }

        try {
          const params: Record<string, any> = {}

          if (findByIdConfig.depth !== undefined) {
            params.depth = findByIdConfig.depth
          }

          const result = await makeRequest(
            'GET',
            `/${findByIdConfig.collection}/${findByIdConfig.id}`,
            undefined,
            params
          )

          return result
        } catch (error) {
          context.logger.error('[payload:findById] Query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('payload:findById', findByIdHandler, {
      name: 'payload:findById',
      description: 'Get a single document by ID from Payload',
      version: '0.1.0',
      author: '@conductor/payload',
      contexts: ['all'],
      tags: ['cms', 'data', 'query', 'payload'],
      inputs: {
        collection: 'string (collection slug)',
        id: 'string (document ID)',
        depth: 'number (optional: population depth)',
      },
      outputs: {
        doc: 'object (document data)',
      },
    })

    // Register payload:create operation
    const createHandler: OperationHandler = {
      async execute(operation) {
        const createConfig = operation.config as PayloadCreateConfig

        if (!createConfig.collection) {
          throw new Error('[payload:create] Missing collection')
        }
        if (!createConfig.data) {
          throw new Error('[payload:create] Missing data')
        }

        try {
          const params: Record<string, any> = {}

          if (createConfig.depth !== undefined) {
            params.depth = createConfig.depth
          }
          if (createConfig.draft !== undefined) {
            params.draft = createConfig.draft
          }

          const result = await makeRequest(
            'POST',
            `/${createConfig.collection}`,
            createConfig.data,
            params
          ) as PayloadMutationResponse

          return {
            doc: result.doc || result,
            message: result.message || 'Document created successfully',
          }
        } catch (error) {
          context.logger.error('[payload:create] Creation error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('payload:create', createHandler, {
      name: 'payload:create',
      description: 'Create a new document in Payload collection',
      version: '0.1.0',
      author: '@conductor/payload',
      contexts: ['all'],
      tags: ['cms', 'data', 'create', 'payload'],
      inputs: {
        collection: 'string (collection slug)',
        data: 'object (document data)',
        depth: 'number (optional: population depth)',
        draft: 'boolean (optional: create as draft)',
      },
      outputs: {
        doc: 'object (created document)',
        message: 'string',
      },
    })

    // Register payload:update operation
    const updateHandler: OperationHandler = {
      async execute(operation) {
        const updateConfig = operation.config as PayloadUpdateConfig

        if (!updateConfig.collection) {
          throw new Error('[payload:update] Missing collection')
        }
        if (!updateConfig.id) {
          throw new Error('[payload:update] Missing id')
        }
        if (!updateConfig.data) {
          throw new Error('[payload:update] Missing data')
        }

        try {
          const params: Record<string, any> = {}

          if (updateConfig.depth !== undefined) {
            params.depth = updateConfig.depth
          }
          if (updateConfig.draft !== undefined) {
            params.draft = updateConfig.draft
          }

          const result = await makeRequest(
            'PATCH',
            `/${updateConfig.collection}/${updateConfig.id}`,
            updateConfig.data,
            params
          ) as PayloadMutationResponse

          return {
            doc: result.doc || result,
            message: result.message || 'Document updated successfully',
          }
        } catch (error) {
          context.logger.error('[payload:update] Update error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('payload:update', updateHandler, {
      name: 'payload:update',
      description: 'Update an existing document in Payload',
      version: '0.1.0',
      author: '@conductor/payload',
      contexts: ['all'],
      tags: ['cms', 'data', 'update', 'payload'],
      inputs: {
        collection: 'string (collection slug)',
        id: 'string (document ID)',
        data: 'object (document data)',
        depth: 'number (optional: population depth)',
        draft: 'boolean (optional: save as draft)',
      },
      outputs: {
        doc: 'object (updated document)',
        message: 'string',
      },
    })

    // Register payload:delete operation
    const deleteHandler: OperationHandler = {
      async execute(operation) {
        const deleteConfig = operation.config as PayloadDeleteConfig

        if (!deleteConfig.collection) {
          throw new Error('[payload:delete] Missing collection')
        }
        if (!deleteConfig.id) {
          throw new Error('[payload:delete] Missing id')
        }

        try {
          const result = await makeRequest(
            'DELETE',
            `/${deleteConfig.collection}/${deleteConfig.id}`
          ) as PayloadMutationResponse

          return {
            id: deleteConfig.id,
            message: result.message || 'Document deleted successfully',
          }
        } catch (error) {
          context.logger.error('[payload:delete] Deletion error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('payload:delete', deleteHandler, {
      name: 'payload:delete',
      description: 'Delete a document from Payload collection',
      version: '0.1.0',
      author: '@conductor/payload',
      contexts: ['all'],
      tags: ['cms', 'data', 'delete', 'payload'],
      inputs: {
        collection: 'string (collection slug)',
        id: 'string (document ID)',
      },
      outputs: {
        id: 'string (deleted document ID)',
        message: 'string',
      },
    })

    context.logger.info('[payload] Operations registered', {
      operations: ['payload:find', 'payload:findById', 'payload:create', 'payload:update', 'payload:delete'],
    })
  },
}

/**
 * Create Payload plugin with configuration
 *
 * @example
 * ```typescript
 * createPayloadPlugin({
 *   apiUrl: env.PAYLOAD_API_URL,
 *   apiKey: env.PAYLOAD_API_KEY,
 *   cache: true
 * })
 * ```
 */
export function createPayloadPlugin(config: PayloadPluginConfig): LifecyclePlugin {
  return {
    ...payloadPlugin,
    async initialize(context: PluginContext) {
      // Merge config
      context.config = { ...context.config, ...config }
      return payloadPlugin.initialize(context)
    },
  }
}

export default payloadPlugin
