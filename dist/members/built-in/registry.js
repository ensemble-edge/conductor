/**
 * Built-In Member Registry
 *
 * Manages registration, discovery, and lazy loading of built-in members.
 *
 * Features:
 * - Lazy loading (only load members when used)
 * - Auto-discovery (list all available members)
 * - Versioning (each member has a version)
 * - Metadata (description, schemas, examples)
 */
import { MemberType } from '../../types/constants';
export class BuiltInMemberRegistry {
    constructor() {
        this.members = new Map();
    }
    /**
     * Register a built-in member
     */
    register(metadata, factory) {
        this.members.set(metadata.name, {
            metadata,
            factory,
            loaded: false,
        });
    }
    /**
     * Check if a member is built-in
     */
    isBuiltIn(name) {
        return this.members.has(name);
    }
    /**
     * Get a built-in member instance (lazy loading)
     */
    create(name, config, env) {
        const entry = this.members.get(name);
        if (!entry) {
            throw new Error(`Built-in member "${name}" not found. ` +
                `Available: ${this.getAvailableNames().join(', ')}`);
        }
        // Create instance using factory (lazy loading)
        entry.loaded = true;
        return entry.factory(config, env);
    }
    /**
     * Get metadata for a built-in member
     */
    getMetadata(name) {
        return this.members.get(name)?.metadata;
    }
    /**
     * List all built-in members
     */
    list() {
        return Array.from(this.members.values()).map((entry) => entry.metadata);
    }
    /**
     * Get available member names
     */
    getAvailableNames() {
        return Array.from(this.members.keys());
    }
    /**
     * Get members by type
     */
    listByType(type) {
        return this.list().filter((m) => m.type === type);
    }
    /**
     * Get members by tag
     */
    listByTag(tag) {
        return this.list().filter((m) => m.tags?.includes(tag));
    }
}
// Singleton registry instance
let registry = null;
/**
 * Get the built-in member registry (singleton)
 */
export function getBuiltInRegistry() {
    if (!registry) {
        registry = new BuiltInMemberRegistry();
        registerAllBuiltInMembers(registry);
    }
    return registry;
}
/**
 * Register all built-in members
 * This is called once when the registry is first accessed
 */
function registerAllBuiltInMembers(registry) {
    // Import and register each built-in member
    // This happens lazily, so only loaded when first accessed
    // Scrape member
    registry.register({
        name: 'scrape',
        version: '1.0.0',
        description: '3-tier web scraping with bot protection and fallback strategies',
        type: MemberType.Function,
        tags: ['web', 'scraping', 'cloudflare', 'browser-rendering'],
        examples: [
            {
                name: 'basic-scrape',
                description: 'Simple web scraping with balanced strategy',
                input: { url: 'https://example.com' },
                config: { strategy: 'balanced', returnFormat: 'markdown' },
                output: { markdown: '...', tier: 1, duration: 350 },
            },
            {
                name: 'aggressive-scrape',
                description: 'Aggressive scraping with all fallback tiers',
                input: { url: 'https://example.com' },
                config: { strategy: 'aggressive', returnFormat: 'markdown' },
                output: { markdown: '...', tier: 3, duration: 4500 },
            },
        ],
        documentation: 'https://docs.conductor.dev/built-in-members/scrape',
    }, (config, env) => {
        const { ScrapeMember } = require('./scrape');
        return new ScrapeMember(config, env);
    });
    // Validate member
    registry.register({
        name: 'validate',
        version: '1.0.0',
        description: 'Validation and evaluation with pluggable evaluators (judge, NLP, embedding, rule)',
        type: MemberType.Scoring,
        tags: ['validation', 'evaluation', 'scoring', 'quality'],
        examples: [
            {
                name: 'rule-validation',
                description: 'Validate content using custom rules',
                input: { content: 'Sample content...' },
                config: {
                    evalType: 'rule',
                    rules: [{ name: 'minLength', check: 'content.length >= 800', weight: 0.5 }],
                    threshold: 0.7,
                },
                output: { passed: true, score: 0.85, details: {} },
            },
            {
                name: 'llm-judge',
                description: 'Evaluate quality using LLM judge',
                input: { content: 'Sample content...', reference: 'Expected output...' },
                config: {
                    evalType: 'judge',
                    criteria: [
                        { name: 'accuracy', weight: 0.4 },
                        { name: 'relevance', weight: 0.3 },
                    ],
                    threshold: 0.8,
                },
            },
        ],
        documentation: 'https://docs.conductor.dev/built-in-members/validate',
    }, (config, env) => {
        const { ValidateMember } = require('./validate');
        return new ValidateMember(config, env);
    });
    // RAG member
    registry.register({
        name: 'rag',
        version: '1.0.0',
        description: 'RAG system using Cloudflare Vectorize and AI embeddings',
        type: MemberType.Data,
        tags: ['rag', 'vectorize', 'embeddings', 'search', 'ai'],
        examples: [
            {
                name: 'index-content',
                description: 'Index content into vector database',
                input: {
                    content: 'Document content...',
                    id: 'doc-123',
                    source: 'https://example.com',
                },
                config: {
                    operation: 'index',
                    chunkStrategy: 'semantic',
                    chunkSize: 512,
                },
                output: { indexed: 10, chunks: 10 },
            },
            {
                name: 'search-content',
                description: 'Search for relevant content',
                input: { query: 'What is the company mission?' },
                config: {
                    operation: 'search',
                    topK: 5,
                    rerank: true,
                },
                output: { results: [], count: 5 },
            },
        ],
        documentation: 'https://docs.conductor.dev/built-in-members/rag',
    }, (config, env) => {
        const { RAGMember } = require('./rag');
        return new RAGMember(config, env);
    });
    // HITL member
    registry.register({
        name: 'hitl',
        version: '1.0.0',
        description: 'Human-in-the-loop workflows with approval gates and notifications',
        type: MemberType.Function,
        tags: ['workflow', 'approval', 'human-in-loop', 'durable-objects'],
        examples: [
            {
                name: 'approval-gate',
                description: 'Suspend workflow for manual approval',
                input: {
                    approvalData: {
                        transaction: { amount: 10000, to: 'account-123' },
                        risk_score: 0.85,
                    },
                },
                config: {
                    action: 'suspend',
                    timeout: 86400000,
                    notificationChannel: 'slack',
                },
                output: {
                    status: 'suspended',
                    executionId: 'exec-123',
                    approvalUrl: 'https://app.com/approve/exec-123',
                },
            },
        ],
        documentation: 'https://docs.conductor.dev/built-in-members/hitl',
    }, (config, env) => {
        const { HITLMember } = require('./hitl');
        return new HITLMember(config, env);
    });
    // Fetch member
    registry.register({
        name: 'fetch',
        version: '1.0.0',
        description: 'HTTP client with retry logic and exponential backoff',
        type: MemberType.Function,
        tags: ['http', 'api', 'fetch', 'retry'],
        examples: [
            {
                name: 'basic-fetch',
                description: 'Simple HTTP GET request',
                input: { url: 'https://api.example.com/data' },
                config: { method: 'GET', retry: 3, timeout: 5000 },
                output: { status: 200, body: {}, headers: {} },
            },
            {
                name: 'post-with-retry',
                description: 'POST request with retry logic',
                input: {
                    url: 'https://api.example.com/submit',
                    body: { data: 'value' },
                },
                config: {
                    method: 'POST',
                    retry: 5,
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' },
                },
            },
        ],
        documentation: 'https://docs.conductor.dev/built-in-members/fetch',
    }, (config, env) => {
        const { FetchMember } = require('./fetch');
        return new FetchMember(config, env);
    });
    // Queries member
    registry.register({
        name: 'queries',
        version: '1.0.0',
        description: 'Execute SQL queries across Hyperdrive-connected databases with query catalog support',
        type: MemberType.Data,
        tags: ['sql', 'database', 'queries', 'hyperdrive', 'analytics'],
        examples: [
            {
                name: 'catalog-query',
                description: 'Execute query from catalog',
                input: {
                    queryName: 'user-analytics',
                    input: {
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                    },
                },
                config: {
                    defaultDatabase: 'analytics',
                    readOnly: true,
                    transform: 'camelCase',
                },
                output: {
                    rows: [],
                    count: 25,
                    metadata: {
                        columns: ['date', 'user_count', 'active_users'],
                        executionTime: 150,
                        cached: false,
                        database: 'analytics',
                    },
                },
            },
            {
                name: 'inline-query',
                description: 'Execute inline SQL query',
                input: {
                    sql: 'SELECT * FROM users WHERE created_at > $1 LIMIT 100',
                    input: ['2024-01-01'],
                },
                config: {
                    defaultDatabase: 'production',
                    readOnly: true,
                    maxRows: 100,
                },
            },
        ],
        inputSchema: {
            type: 'object',
            properties: {
                queryName: { type: 'string', description: 'Query name from catalog' },
                sql: { type: 'string', description: 'Inline SQL query' },
                input: {
                    oneOf: [{ type: 'object' }, { type: 'array' }],
                    description: 'Query parameters',
                },
                database: { type: 'string', description: 'Database alias' },
            },
        },
        outputSchema: {
            type: 'object',
            properties: {
                rows: { type: 'array' },
                count: { type: 'number' },
                metadata: { type: 'object' },
            },
        },
        configSchema: {
            type: 'object',
            properties: {
                defaultDatabase: { type: 'string' },
                cacheTTL: { type: 'number' },
                maxRows: { type: 'number' },
                timeout: { type: 'number' },
                readOnly: { type: 'boolean' },
                transform: { type: 'string', enum: ['none', 'camelCase', 'snakeCase'] },
                includeMetadata: { type: 'boolean' },
            },
        },
        documentation: 'https://docs.conductor.dev/built-in-members/queries',
    }, (config, env) => {
        const { QueriesMember } = require('./queries');
        return new QueriesMember(config, env);
    });
}
