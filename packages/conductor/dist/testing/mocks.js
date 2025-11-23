/**
 * Mock Utilities for Testing
 */
/**
 * Mock AI provider for testing
 * Implements the AIProvider interface to integrate with ThinkAgent
 */
export class MockAIProvider {
    constructor(responses = {}, id = 'mock', sharedResponsesMap, onExecute) {
        this.defaultResponse = {
            content: 'Mock AI response',
            model: 'mock-model',
            provider: 'mock',
            tokensUsed: 0,
            metadata: {},
        };
        this.id = id;
        this.name = `Mock ${id}`;
        this.onExecute = onExecute;
        // Use shared responses map if provided, otherwise create new one
        if (sharedResponsesMap) {
            this.responses = sharedResponsesMap;
        }
        else {
            this.responses = new Map();
            for (const [key, value] of Object.entries(responses)) {
                this.responses.set(key, value);
            }
        }
    }
    async execute(request) {
        const timestamp = Date.now();
        let aiResponse;
        // Try to match response by context (this is called during agent execution)
        // We'll match by the first available mocked response
        for (const [, response] of this.responses.entries()) {
            if (response instanceof Error) {
                // Track the error call
                if (this.onExecute) {
                    this.onExecute({
                        request,
                        response: { error: response.message },
                        timestamp,
                    });
                }
                throw response;
            }
            // Convert the mocked response to AIProviderResponse format
            if (typeof response === 'object' && response !== null) {
                // If it's already in AIProviderResponse format, use it
                if ('content' in response && typeof response.content === 'string') {
                    aiResponse = response;
                }
                else {
                    // For test mocks, the response object IS the expected agent output
                    // Return it as JSON in content, and ThinkAgent will use it as-is
                    // Since ThinkAgent returns AIProviderResponse as the agent data,
                    // we return the response directly as the AIProviderResponse,
                    // making the mocked object available in the response
                    aiResponse = {
                        ...response,
                        content: JSON.stringify(response),
                        model: request.config.model,
                        provider: 'mock',
                        tokensUsed: 0,
                    };
                }
            }
            else {
                // Fallback: convert to string
                aiResponse = {
                    content: String(response),
                    model: request.config.model,
                    provider: 'mock',
                    tokensUsed: 0,
                    metadata: {},
                };
            }
            // Track the AI call
            if (this.onExecute) {
                this.onExecute({
                    request,
                    response: aiResponse,
                    timestamp,
                });
            }
            return aiResponse;
        }
        // No mocked responses, return default
        aiResponse = this.defaultResponse;
        // Track the default response
        if (this.onExecute) {
            this.onExecute({
                request,
                response: aiResponse,
                timestamp,
            });
        }
        return aiResponse;
    }
    validateConfig(config, env) {
        return this.getConfigError(config, env) === null;
    }
    getConfigError(config, env) {
        // Mock provider doesn't require API keys
        return null;
    }
    setResponse(agentName, response) {
        this.responses.set(agentName, response);
    }
    getResponse(agentName) {
        return this.responses.get(agentName);
    }
    clear() {
        this.responses.clear();
    }
    getResponsesMap() {
        return this.responses;
    }
}
/**
 * Mock database for testing
 */
export class MockDatabase {
    constructor(tables = {}) {
        this.tables = tables;
    }
    query(table) {
        return this.tables[table] || [];
    }
    insert(table, record) {
        if (!this.tables[table]) {
            this.tables[table] = [];
        }
        this.tables[table].push(record);
    }
    update(table, predicate, updates) {
        if (!this.tables[table])
            return;
        this.tables[table] = this.tables[table].map((record) => {
            if (predicate(record)) {
                return { ...record, ...updates };
            }
            return record;
        });
    }
    delete(table, predicate) {
        if (!this.tables[table])
            return;
        this.tables[table] = this.tables[table].filter((record) => !predicate(record));
    }
    clear(table) {
        if (table) {
            this.tables[table] = [];
        }
        else {
            this.tables = {};
        }
    }
}
/**
 * Mock HTTP client for testing
 */
export class MockHTTPClient {
    constructor(routes = {}) {
        this.routes = routes;
    }
    async fetch(url) {
        const response = this.routes[url];
        if (!response) {
            throw new Error(`No mock response for URL: ${url}`);
        }
        if (response instanceof Error) {
            throw response;
        }
        return response;
    }
    setRoute(url, response) {
        this.routes[url] = response;
    }
    clearRoutes() {
        this.routes = {};
    }
}
/**
 * Mock Vectorize for testing
 */
export class MockVectorize {
    constructor(collections = {}) {
        this.collections = collections;
    }
    query(query, options = {}) {
        const namespace = options.namespace || 'default';
        const topK = options.topK || 5;
        const results = this.collections[namespace] || [];
        return results.slice(0, topK);
    }
    insert(namespace, documents) {
        if (!this.collections[namespace]) {
            this.collections[namespace] = [];
        }
        for (const doc of documents) {
            this.collections[namespace].push({
                id: doc.id,
                score: 1.0,
                metadata: doc.metadata,
            });
        }
    }
    clear(namespace) {
        if (namespace) {
            this.collections[namespace] = [];
        }
        else {
            this.collections = {};
        }
    }
}
/**
 * Mock Durable Object for testing
 */
export class MockDurableObject {
    constructor(state) {
        this.state = state;
    }
    getState() {
        return this.state;
    }
    setState(state) {
        this.state = state;
    }
    reset(initialState) {
        this.state = initialState;
    }
}
/**
 * Helper to create mock AI provider
 */
export function mockAIProvider(responses) {
    return new MockAIProvider(responses);
}
/**
 * Helper to create mock database
 */
export function mockDatabase(tables) {
    return new MockDatabase(tables);
}
/**
 * Helper to create mock HTTP client
 */
export function mockHTTP(routes) {
    return new MockHTTPClient(routes);
}
/**
 * Helper to create mock Vectorize
 */
export function mockVectorize(collections) {
    return new MockVectorize(collections);
}
/**
 * Helper to create mock Durable Object
 */
export function mockDurableObject(initialState) {
    return new MockDurableObject(initialState);
}
