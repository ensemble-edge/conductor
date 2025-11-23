/**
 * @conductor/attio
 *
 * Attio CRM plugin for Conductor
 * Provides operations for managing records, lists, and notes in Attio
 */

import type {
  LifecyclePlugin,
  PluginContext,
  OperationHandler,
} from '@ensemble-edge/conductor'

export interface AttioPluginConfig {
  /** Attio API base URL (default: https://api.attio.com/v2) */
  apiUrl?: string
  /** Attio access token */
  accessToken?: string
  /** Workspace ID */
  workspaceId?: string
  /** Enable request caching */
  cache?: boolean
  /** Cache TTL in seconds */
  cacheTtl?: number
}

export interface AttioQueryRecordsConfig {
  /** Object type (e.g., 'people', 'companies', custom objects) */
  object: string
  /** Filter conditions */
  filter?: Record<string, any>
  /** Limit results */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort configuration */
  sorts?: Array<{ attribute: string; direction: 'asc' | 'desc' }>
}

export interface AttioCreateRecordConfig {
  /** Object type */
  object: string
  /** Record data */
  data: Record<string, any>
}

export interface AttioUpdateRecordConfig {
  /** Object type */
  object: string
  /** Record ID */
  recordId: string
  /** Record data to update */
  data: Record<string, any>
}

export interface AttioDeleteRecordConfig {
  /** Object type */
  object: string
  /** Record ID */
  recordId: string
}

export interface AttioGetRecordConfig {
  /** Object type */
  object: string
  /** Record ID */
  recordId: string
}

export interface AttioCreateNoteConfig {
  /** Parent object type */
  parentObject: string
  /** Parent record ID */
  parentRecordId: string
  /** Note title */
  title?: string
  /** Note content */
  content: string
  /** Format (default: 'plaintext') */
  format?: 'plaintext' | 'html' | 'markdown'
}

export interface AttioListRecordsConfig {
  /** List ID or slug */
  list: string
  /** Limit results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

// Attio API Response Types
interface AttioQueryResponse {
  data: any[]
  next_offset?: number
}

interface AttioRecordResponse {
  data: any
}

interface AttioListResponse {
  data: any[]
  next_offset?: number
}

/**
 * Attio CRM Plugin
 *
 * Provides operations for Attio CRM:
 * - attio:queryRecords - Query records from an object
 * - attio:getRecord - Get a single record by ID
 * - attio:createRecord - Create a new record
 * - attio:updateRecord - Update an existing record
 * - attio:deleteRecord - Delete a record
 * - attio:createNote - Create a note on a record
 * - attio:listRecords - Get records from a list
 *
 * @example
 * ```typescript
 * import { attioPlugin } from '@conductor/attio'
 *
 * export default {
 *   plugins: [
 *     attioPlugin({
 *       accessToken: env.ATTIO_ACCESS_TOKEN,
 *       workspaceId: env.ATTIO_WORKSPACE_ID
 *     })
 *   ]
 * }
 * ```
 */
export const attioPlugin: LifecyclePlugin = {
  name: 'attio',
  version: '0.1.0',
  description: 'Attio CRM integration for managing records and relationships',

  requiredEnv: ['ATTIO_ACCESS_TOKEN'],

  async initialize(context: PluginContext): Promise<void> {
    const config = context.config as AttioPluginConfig
    const { accessToken, apiUrl = 'https://api.attio.com/v2', workspaceId } = config

    if (!accessToken) {
      throw new Error('[attio] Missing required ATTIO_ACCESS_TOKEN')
    }

    context.logger.info('[attio] Plugin initialized', {
      apiUrl,
      workspaceId,
      cacheEnabled: config.cache ?? false,
    })

    // Helper function to make Attio API requests
    const makeRequest = async (
      method: string,
      endpoint: string,
      body?: Record<string, any>
    ) => {
      const url = `${apiUrl}${endpoint}`

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`[attio] API error (${response.status}): ${errorText}`)
      }

      return await response.json()
    }

    // Register attio:queryRecords operation
    const queryRecordsHandler: OperationHandler = {
      async execute(operation) {
        const queryConfig = operation.config as AttioQueryRecordsConfig

        if (!queryConfig.object) {
          throw new Error('[attio:queryRecords] Missing object')
        }

        try {
          const body: Record<string, any> = {}

          if (queryConfig.filter) {
            body.filter = queryConfig.filter
          }
          if (queryConfig.limit) {
            body.limit = queryConfig.limit
          }
          if (queryConfig.offset) {
            body.offset = queryConfig.offset
          }
          if (queryConfig.sorts) {
            body.sorts = queryConfig.sorts
          }

          const result = await makeRequest(
            'POST',
            `/objects/${queryConfig.object}/records/query`,
            body
          ) as AttioQueryResponse

          return {
            data: result.data || [],
            next_offset: result.next_offset,
          }
        } catch (error) {
          context.logger.error('[attio:queryRecords] Query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:queryRecords', queryRecordsHandler, {
      name: 'attio:queryRecords',
      description: 'Query records from an Attio object',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'query', 'attio'],
      inputs: {
        object: 'string (object type)',
        filter: 'object (optional: filter conditions)',
        limit: 'number (optional: results limit)',
        offset: 'number (optional: pagination offset)',
        sorts: 'array (optional: sort configuration)',
      },
      outputs: {
        data: 'array (records)',
        next_offset: 'number (pagination offset)',
      },
    })

    // Register attio:getRecord operation
    const getRecordHandler: OperationHandler = {
      async execute(operation) {
        const getConfig = operation.config as AttioGetRecordConfig

        if (!getConfig.object) {
          throw new Error('[attio:getRecord] Missing object')
        }
        if (!getConfig.recordId) {
          throw new Error('[attio:getRecord] Missing recordId')
        }

        try {
          const result = await makeRequest(
            'GET',
            `/objects/${getConfig.object}/records/${getConfig.recordId}`
          ) as AttioRecordResponse

          return { data: result.data || result }
        } catch (error) {
          context.logger.error('[attio:getRecord] Query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:getRecord', getRecordHandler, {
      name: 'attio:getRecord',
      description: 'Get a single record by ID from Attio',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'query', 'attio'],
      inputs: {
        object: 'string (object type)',
        recordId: 'string (record ID)',
      },
      outputs: {
        data: 'object (record data)',
      },
    })

    // Register attio:createRecord operation
    const createRecordHandler: OperationHandler = {
      async execute(operation) {
        const createConfig = operation.config as AttioCreateRecordConfig

        if (!createConfig.object) {
          throw new Error('[attio:createRecord] Missing object')
        }
        if (!createConfig.data) {
          throw new Error('[attio:createRecord] Missing data')
        }

        try {
          const result = await makeRequest(
            'POST',
            `/objects/${createConfig.object}/records`,
            { data: createConfig.data }
          ) as AttioRecordResponse

          return { data: result.data || result }
        } catch (error) {
          context.logger.error('[attio:createRecord] Creation error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:createRecord', createRecordHandler, {
      name: 'attio:createRecord',
      description: 'Create a new record in Attio',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'create', 'attio'],
      inputs: {
        object: 'string (object type)',
        data: 'object (record data)',
      },
      outputs: {
        data: 'object (created record)',
      },
    })

    // Register attio:updateRecord operation
    const updateRecordHandler: OperationHandler = {
      async execute(operation) {
        const updateConfig = operation.config as AttioUpdateRecordConfig

        if (!updateConfig.object) {
          throw new Error('[attio:updateRecord] Missing object')
        }
        if (!updateConfig.recordId) {
          throw new Error('[attio:updateRecord] Missing recordId')
        }
        if (!updateConfig.data) {
          throw new Error('[attio:updateRecord] Missing data')
        }

        try {
          const result = await makeRequest(
            'PATCH',
            `/objects/${updateConfig.object}/records/${updateConfig.recordId}`,
            { data: updateConfig.data }
          ) as AttioRecordResponse

          return { data: result.data || result }
        } catch (error) {
          context.logger.error('[attio:updateRecord] Update error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:updateRecord', updateRecordHandler, {
      name: 'attio:updateRecord',
      description: 'Update an existing record in Attio',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'update', 'attio'],
      inputs: {
        object: 'string (object type)',
        recordId: 'string (record ID)',
        data: 'object (record data)',
      },
      outputs: {
        data: 'object (updated record)',
      },
    })

    // Register attio:deleteRecord operation
    const deleteRecordHandler: OperationHandler = {
      async execute(operation) {
        const deleteConfig = operation.config as AttioDeleteRecordConfig

        if (!deleteConfig.object) {
          throw new Error('[attio:deleteRecord] Missing object')
        }
        if (!deleteConfig.recordId) {
          throw new Error('[attio:deleteRecord] Missing recordId')
        }

        try {
          await makeRequest(
            'DELETE',
            `/objects/${deleteConfig.object}/records/${deleteConfig.recordId}`
          )

          return {
            success: true,
            recordId: deleteConfig.recordId,
          }
        } catch (error) {
          context.logger.error('[attio:deleteRecord] Deletion error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:deleteRecord', deleteRecordHandler, {
      name: 'attio:deleteRecord',
      description: 'Delete a record from Attio',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'delete', 'attio'],
      inputs: {
        object: 'string (object type)',
        recordId: 'string (record ID)',
      },
      outputs: {
        success: 'boolean',
        recordId: 'string (deleted record ID)',
      },
    })

    // Register attio:createNote operation
    const createNoteHandler: OperationHandler = {
      async execute(operation) {
        const noteConfig = operation.config as AttioCreateNoteConfig

        if (!noteConfig.parentObject) {
          throw new Error('[attio:createNote] Missing parentObject')
        }
        if (!noteConfig.parentRecordId) {
          throw new Error('[attio:createNote] Missing parentRecordId')
        }
        if (!noteConfig.content) {
          throw new Error('[attio:createNote] Missing content')
        }

        try {
          const body: Record<string, any> = {
            parent_object: noteConfig.parentObject,
            parent_record_id: noteConfig.parentRecordId,
            content: noteConfig.content,
            format: noteConfig.format || 'plaintext',
          }

          if (noteConfig.title) {
            body.title = noteConfig.title
          }

          const result = await makeRequest('POST', '/notes', body) as AttioRecordResponse

          return { data: result.data || result }
        } catch (error) {
          context.logger.error('[attio:createNote] Note creation error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:createNote', createNoteHandler, {
      name: 'attio:createNote',
      description: 'Create a note on an Attio record',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'notes', 'create', 'attio'],
      inputs: {
        parentObject: 'string (parent object type)',
        parentRecordId: 'string (parent record ID)',
        title: 'string (optional: note title)',
        content: 'string (note content)',
        format: 'string (optional: plaintext, html, markdown)',
      },
      outputs: {
        data: 'object (created note)',
      },
    })

    // Register attio:listRecords operation
    const listRecordsHandler: OperationHandler = {
      async execute(operation) {
        const listConfig = operation.config as AttioListRecordsConfig

        if (!listConfig.list) {
          throw new Error('[attio:listRecords] Missing list')
        }

        try {
          const params: string[] = []

          if (listConfig.limit) {
            params.push(`limit=${listConfig.limit}`)
          }
          if (listConfig.offset) {
            params.push(`offset=${listConfig.offset}`)
          }

          const queryString = params.length > 0 ? `?${params.join('&')}` : ''
          const result = await makeRequest(
            'GET',
            `/lists/${listConfig.list}/entries${queryString}`
          ) as AttioListResponse

          return {
            data: result.data || [],
            next_offset: result.next_offset,
          }
        } catch (error) {
          context.logger.error('[attio:listRecords] List query error', error as Error)
          throw error
        }
      },
    }

    context.operationRegistry.register('attio:listRecords', listRecordsHandler, {
      name: 'attio:listRecords',
      description: 'Get records from an Attio list',
      version: '0.1.0',
      author: '@conductor/attio',
      contexts: ['all'],
      tags: ['crm', 'data', 'list', 'attio'],
      inputs: {
        list: 'string (list ID or slug)',
        limit: 'number (optional: results limit)',
        offset: 'number (optional: pagination offset)',
      },
      outputs: {
        data: 'array (list entries)',
        next_offset: 'number (pagination offset)',
      },
    })

    context.logger.info('[attio] Operations registered', {
      operations: [
        'attio:queryRecords',
        'attio:getRecord',
        'attio:createRecord',
        'attio:updateRecord',
        'attio:deleteRecord',
        'attio:createNote',
        'attio:listRecords',
      ],
    })
  },
}

/**
 * Create Attio plugin with configuration
 *
 * @example
 * ```typescript
 * createAttioPlugin({
 *   accessToken: env.ATTIO_ACCESS_TOKEN,
 *   workspaceId: env.ATTIO_WORKSPACE_ID
 * })
 * ```
 */
export function createAttioPlugin(config: AttioPluginConfig): LifecyclePlugin {
  return {
    ...attioPlugin,
    async initialize(context: PluginContext) {
      // Merge config
      context.config = { ...context.config, ...config }
      return attioPlugin.initialize(context)
    },
  }
}

export default attioPlugin
