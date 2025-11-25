/**
 * Memory Primitives
 *
 * Provides primitives for PERSISTENT storage that survives across executions.
 * Memory is different from State:
 *
 * - **State** (StateManager): Workflow-scoped shared memory within a SINGLE
 *   ensemble execution. Use for passing data between steps. Declared with
 *   `state:` schema and accessed via `use:`/`set:`.
 *
 * - **Memory** (this module): Persistent storage that survives ACROSS multiple
 *   executions. Use for conversation history, knowledge bases, caching, and
 *   any data that should persist beyond a single workflow run.
 *
 * Memory providers map to Cloudflare storage:
 * - KV: Fast key-value for sessions, user preferences
 * - R2: Large objects like documents, images
 * - D1: Structured relational data
 * - Vectorize: Semantic search and RAG
 * - Durable Objects: Strongly consistent real-time state
 */
/**
 * Memory class - runtime representation of memory configuration
 */
export class Memory {
    constructor(config) {
        this.provider = config.provider;
        this.scope = config.scope ?? 'agent';
        this.maxEntries = config.maxEntries;
        this.evictionPolicy = config.evictionPolicy ?? 'lru';
        this.defaultTTL = config.defaultTTL;
        this.summarize = config.summarize ?? false;
        this.summarizeThreshold = config.summarizeThreshold ?? 100;
    }
    /**
     * Check if using KV storage
     */
    isKV() {
        return this.provider.type === 'kv';
    }
    /**
     * Check if using R2 storage
     */
    isR2() {
        return this.provider.type === 'r2';
    }
    /**
     * Check if using D1 storage
     */
    isD1() {
        return this.provider.type === 'd1';
    }
    /**
     * Check if using Vectorize
     */
    isVectorize() {
        return this.provider.type === 'vectorize';
    }
    /**
     * Check if using Durable Objects
     */
    isDurableObject() {
        return this.provider.type === 'durable-object';
    }
    /**
     * Convert to plain config object
     */
    toConfig() {
        return {
            provider: this.provider,
            scope: this.scope,
            maxEntries: this.maxEntries,
            evictionPolicy: this.evictionPolicy,
            defaultTTL: this.defaultTTL,
            summarize: this.summarize,
            summarizeThreshold: this.summarizeThreshold,
        };
    }
}
/**
 * Create a memory configuration
 *
 * @example
 * ```typescript
 * const agentMemory = memory({
 *   provider: { type: 'kv', binding: 'MEMORY_KV' },
 *   scope: 'session',
 *   defaultTTL: 3600
 * });
 * ```
 */
export function memory(config) {
    return new Memory(config);
}
/**
 * Create KV-backed memory
 *
 * @example
 * ```typescript
 * const kvMemory = kvMemory({
 *   binding: 'AGENT_MEMORY',
 *   prefix: 'chat/',
 *   defaultTTL: 86400
 * });
 * ```
 */
export function kvMemory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'kv', ...config },
    });
}
/**
 * Create R2-backed memory for large objects
 *
 * @example
 * ```typescript
 * const objectMemory = r2Memory({
 *   binding: 'DOCUMENTS',
 *   prefix: 'uploads/',
 *   maxSize: 10 * 1024 * 1024 // 10MB
 * });
 * ```
 */
export function r2Memory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'r2', ...config },
    });
}
/**
 * Create D1-backed structured memory
 *
 * @example
 * ```typescript
 * const dbMemory = d1Memory({
 *   binding: 'DB',
 *   table: 'agent_memory',
 *   autoCreate: true
 * });
 * ```
 */
export function d1Memory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'd1', ...config },
    });
}
/**
 * Create Vectorize-backed semantic memory
 *
 * @example
 * ```typescript
 * const semanticMemory = vectorMemory({
 *   binding: 'KNOWLEDGE_BASE',
 *   model: '@cf/baai/bge-base-en-v1.5',
 *   dimensions: 768,
 *   metric: 'cosine'
 * });
 * ```
 */
export function vectorMemory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'vectorize', ...config },
    });
}
/**
 * Create Durable Object-backed strongly consistent memory
 *
 * @example
 * ```typescript
 * const consistentMemory = durableMemory({
 *   binding: 'AGENT_STATE',
 *   idStrategy: 'hash'
 * });
 * ```
 */
export function durableMemory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'durable-object', ...config },
    });
}
/**
 * Create a custom memory provider
 *
 * @example
 * ```typescript
 * const redisMemory = customMemory({
 *   handler: 'memory/redis',
 *   config: { url: '${env.REDIS_URL}' }
 * });
 * ```
 */
export function customMemory(config, options) {
    return new Memory({
        ...options,
        provider: { type: 'custom', ...config },
    });
}
/**
 * Check if a value is a Memory instance
 */
export function isMemory(value) {
    return value instanceof Memory;
}
/**
 * Check if a value is a valid memory configuration
 */
export function isMemoryConfig(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const config = value;
    return typeof config.provider === 'object' && config.provider !== null;
}
/**
 * Conversation memory helper for chat-like interactions
 *
 * @example
 * ```typescript
 * const chatMemory = conversationMemory({
 *   binding: 'CHAT_HISTORY',
 *   maxMessages: 100,
 *   summarizeAfter: 50
 * });
 * ```
 */
export function conversationMemory(options) {
    return kvMemory({
        binding: options.binding,
        prefix: 'conversation/',
        defaultTTL: options.ttl,
    }, {
        scope: 'session',
        maxEntries: options.maxMessages,
        evictionPolicy: 'fifo',
        summarize: options.summarizeAfter !== undefined,
        summarizeThreshold: options.summarizeAfter,
    });
}
/**
 * Knowledge base memory for RAG applications
 *
 * @example
 * ```typescript
 * const knowledge = knowledgeBase({
 *   vectorBinding: 'KNOWLEDGE_VECTORS',
 *   storageBinding: 'KNOWLEDGE_DOCS'
 * });
 * ```
 */
export function knowledgeBase(options) {
    return vectorMemory({
        binding: options.vectorBinding,
        model: options.model ?? '@cf/baai/bge-base-en-v1.5',
        dimensions: options.dimensions ?? 768,
        metric: 'cosine',
    });
}
