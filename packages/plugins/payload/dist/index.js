/**
 * @conductor/payload
 *
 * Payload CMS plugin for Conductor
 * Provides operations for querying and mutating Payload collections
 */
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
export const payloadPlugin = {
    name: 'payload',
    version: '0.1.0',
    description: 'Payload CMS integration for querying and mutating collections',
    requiredEnv: ['PAYLOAD_API_URL'],
    async initialize(context) {
        const config = context.config;
        const { apiUrl, apiKey } = config;
        if (!apiUrl) {
            throw new Error('[payload] Missing required PAYLOAD_API_URL');
        }
        context.logger.info('[payload] Plugin initialized', {
            apiUrl,
            cacheEnabled: config.cache ?? false,
        });
        // Helper function to make Payload API requests
        const makeRequest = async (method, endpoint, body, params) => {
            const url = new URL(`${apiUrl}${endpoint}`);
            // Add query parameters
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        url.searchParams.append(key, String(value));
                    }
                });
            }
            const headers = {
                'Content-Type': 'application/json',
            };
            if (apiKey) {
                headers['Authorization'] = `users API-Key ${apiKey}`;
            }
            const response = await fetch(url.toString(), {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`[payload] API error (${response.status}): ${errorText}`);
            }
            return await response.json();
        };
        // Register payload:find operation
        const findHandler = {
            async execute(operation) {
                const findConfig = operation.config;
                if (!findConfig.collection) {
                    throw new Error('[payload:find] Missing collection');
                }
                try {
                    const params = {};
                    if (findConfig.where) {
                        params.where = JSON.stringify(findConfig.where);
                    }
                    if (findConfig.depth !== undefined) {
                        params.depth = findConfig.depth;
                    }
                    if (findConfig.limit) {
                        params.limit = findConfig.limit;
                    }
                    if (findConfig.page) {
                        params.page = findConfig.page;
                    }
                    if (findConfig.sort) {
                        params.sort = findConfig.sort;
                    }
                    if (findConfig.select) {
                        params.select = findConfig.select.join(',');
                    }
                    const result = await makeRequest('GET', `/${findConfig.collection}`, undefined, params);
                    return {
                        docs: result.docs || [],
                        totalDocs: result.totalDocs || 0,
                        limit: result.limit,
                        page: result.page,
                        totalPages: result.totalPages,
                        hasNextPage: result.hasNextPage,
                        hasPrevPage: result.hasPrevPage,
                    };
                }
                catch (error) {
                    context.logger.error('[payload:find] Query error', error);
                    throw error;
                }
            },
        };
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
        });
        // Register payload:findById operation
        const findByIdHandler = {
            async execute(operation) {
                const findByIdConfig = operation.config;
                if (!findByIdConfig.collection) {
                    throw new Error('[payload:findById] Missing collection');
                }
                if (!findByIdConfig.id) {
                    throw new Error('[payload:findById] Missing id');
                }
                try {
                    const params = {};
                    if (findByIdConfig.depth !== undefined) {
                        params.depth = findByIdConfig.depth;
                    }
                    const result = await makeRequest('GET', `/${findByIdConfig.collection}/${findByIdConfig.id}`, undefined, params);
                    return result;
                }
                catch (error) {
                    context.logger.error('[payload:findById] Query error', error);
                    throw error;
                }
            },
        };
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
        });
        // Register payload:create operation
        const createHandler = {
            async execute(operation) {
                const createConfig = operation.config;
                if (!createConfig.collection) {
                    throw new Error('[payload:create] Missing collection');
                }
                if (!createConfig.data) {
                    throw new Error('[payload:create] Missing data');
                }
                try {
                    const params = {};
                    if (createConfig.depth !== undefined) {
                        params.depth = createConfig.depth;
                    }
                    if (createConfig.draft !== undefined) {
                        params.draft = createConfig.draft;
                    }
                    const result = await makeRequest('POST', `/${createConfig.collection}`, createConfig.data, params);
                    return {
                        doc: result.doc || result,
                        message: result.message || 'Document created successfully',
                    };
                }
                catch (error) {
                    context.logger.error('[payload:create] Creation error', error);
                    throw error;
                }
            },
        };
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
        });
        // Register payload:update operation
        const updateHandler = {
            async execute(operation) {
                const updateConfig = operation.config;
                if (!updateConfig.collection) {
                    throw new Error('[payload:update] Missing collection');
                }
                if (!updateConfig.id) {
                    throw new Error('[payload:update] Missing id');
                }
                if (!updateConfig.data) {
                    throw new Error('[payload:update] Missing data');
                }
                try {
                    const params = {};
                    if (updateConfig.depth !== undefined) {
                        params.depth = updateConfig.depth;
                    }
                    if (updateConfig.draft !== undefined) {
                        params.draft = updateConfig.draft;
                    }
                    const result = await makeRequest('PATCH', `/${updateConfig.collection}/${updateConfig.id}`, updateConfig.data, params);
                    return {
                        doc: result.doc || result,
                        message: result.message || 'Document updated successfully',
                    };
                }
                catch (error) {
                    context.logger.error('[payload:update] Update error', error);
                    throw error;
                }
            },
        };
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
        });
        // Register payload:delete operation
        const deleteHandler = {
            async execute(operation) {
                const deleteConfig = operation.config;
                if (!deleteConfig.collection) {
                    throw new Error('[payload:delete] Missing collection');
                }
                if (!deleteConfig.id) {
                    throw new Error('[payload:delete] Missing id');
                }
                try {
                    const result = await makeRequest('DELETE', `/${deleteConfig.collection}/${deleteConfig.id}`);
                    return {
                        id: deleteConfig.id,
                        message: result.message || 'Document deleted successfully',
                    };
                }
                catch (error) {
                    context.logger.error('[payload:delete] Deletion error', error);
                    throw error;
                }
            },
        };
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
        });
        context.logger.info('[payload] Operations registered', {
            operations: ['payload:find', 'payload:findById', 'payload:create', 'payload:update', 'payload:delete'],
        });
    },
};
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
export function createPayloadPlugin(config) {
    return {
        ...payloadPlugin,
        async initialize(context) {
            // Merge config
            context.config = { ...context.config, ...config };
            return payloadPlugin.initialize(context);
        },
    };
}
export default payloadPlugin;
//# sourceMappingURL=index.js.map