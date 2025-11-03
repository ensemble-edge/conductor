/**
 * Mock Utilities for Testing
 */
/**
 * Mock AI provider responses
 */
export class MockAIProvider {
    constructor(responses) {
        this.responses = responses;
    }
    getResponse(memberName) {
        return this.responses[memberName] || { message: 'Mock AI response' };
    }
    setResponse(memberName, response) {
        this.responses[memberName] = response;
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
