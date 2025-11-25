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
 * Memory provider types
 */
export type MemoryProviderType = 'kv' | 'r2' | 'd1' | 'vectorize' | 'durable-object' | 'custom';
/**
 * Memory scope defines the visibility of memory
 */
export type MemoryScope = 'agent' | 'ensemble' | 'session' | 'global';
/**
 * Memory entry with metadata
 */
export interface MemoryEntry<T = unknown> {
    /** Unique key for this entry */
    key: string;
    /** The stored value */
    value: T;
    /** When the entry was created */
    createdAt: Date;
    /** When the entry was last updated */
    updatedAt: Date;
    /** Time-to-live in seconds */
    ttl?: number;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Vector memory entry for semantic search
 */
export interface VectorMemoryEntry extends MemoryEntry {
    /** Vector embedding */
    embedding?: number[];
    /** Content for embedding generation */
    content?: string;
    /** Similarity score (when returned from search) */
    score?: number;
}
/**
 * Memory provider configuration
 */
export interface MemoryProviderConfig {
    /** Provider type */
    type: MemoryProviderType;
    /** Binding name in wrangler.toml */
    binding?: string;
    /** Namespace or table name */
    namespace?: string;
    /** Custom configuration */
    config?: Record<string, unknown>;
}
/**
 * KV memory configuration
 */
export interface KVMemoryConfig extends MemoryProviderConfig {
    type: 'kv';
    /** KV namespace binding */
    binding: string;
    /** Key prefix for namespacing */
    prefix?: string;
    /** Default TTL in seconds */
    defaultTTL?: number;
}
/**
 * R2 memory configuration (for large objects)
 */
export interface R2MemoryConfig extends MemoryProviderConfig {
    type: 'r2';
    /** R2 bucket binding */
    binding: string;
    /** Key prefix */
    prefix?: string;
    /** Maximum object size in bytes */
    maxSize?: number;
}
/**
 * D1 memory configuration (structured data)
 */
export interface D1MemoryConfig extends MemoryProviderConfig {
    type: 'd1';
    /** D1 database binding */
    binding: string;
    /** Table name */
    table?: string;
    /** Auto-create table if not exists */
    autoCreate?: boolean;
}
/**
 * Vectorize memory configuration (semantic search)
 */
export interface VectorizeMemoryConfig extends MemoryProviderConfig {
    type: 'vectorize';
    /** Vectorize index binding */
    binding: string;
    /** Embedding model to use */
    model?: string;
    /** Dimensions of the embeddings */
    dimensions?: number;
    /** Distance metric */
    metric?: 'cosine' | 'euclidean' | 'dot-product';
}
/**
 * Durable Object memory configuration (strongly consistent)
 */
export interface DurableObjectMemoryConfig extends MemoryProviderConfig {
    type: 'durable-object';
    /** Durable Object namespace binding */
    binding: string;
    /** ID generation strategy */
    idStrategy?: 'hash' | 'random' | 'custom';
}
/**
 * Custom memory provider configuration
 */
export interface CustomMemoryConfig extends MemoryProviderConfig {
    type: 'custom';
    /** Custom handler path */
    handler?: string;
    /** Custom implementation */
    implementation?: MemoryImplementation;
}
/**
 * Memory implementation interface for custom providers
 */
export interface MemoryImplementation {
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, options?: {
        ttl?: number;
    }): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(options?: {
        prefix?: string;
        limit?: number;
    }): Promise<string[]>;
    clear(prefix?: string): Promise<void>;
}
/**
 * Union type for memory configurations
 */
export type MemoryConfig = KVMemoryConfig | R2MemoryConfig | D1MemoryConfig | VectorizeMemoryConfig | DurableObjectMemoryConfig | CustomMemoryConfig;
/**
 * Memory configuration for an agent
 */
export interface AgentMemoryConfig {
    /** Memory provider configuration */
    provider: MemoryConfig;
    /** Memory scope */
    scope?: MemoryScope;
    /** Maximum entries to store */
    maxEntries?: number;
    /** Eviction policy when max is reached */
    evictionPolicy?: 'lru' | 'fifo' | 'ttl';
    /** Default TTL in seconds */
    defaultTTL?: number;
    /** Enable automatic summarization */
    summarize?: boolean;
    /** Summarization threshold (number of entries) */
    summarizeThreshold?: number;
}
/**
 * Memory class - runtime representation of memory configuration
 */
export declare class Memory {
    readonly provider: MemoryConfig;
    readonly scope: MemoryScope;
    readonly maxEntries?: number;
    readonly evictionPolicy: 'lru' | 'fifo' | 'ttl';
    readonly defaultTTL?: number;
    readonly summarize: boolean;
    readonly summarizeThreshold: number;
    constructor(config: AgentMemoryConfig);
    /**
     * Check if using KV storage
     */
    isKV(): this is Memory & {
        provider: KVMemoryConfig;
    };
    /**
     * Check if using R2 storage
     */
    isR2(): this is Memory & {
        provider: R2MemoryConfig;
    };
    /**
     * Check if using D1 storage
     */
    isD1(): this is Memory & {
        provider: D1MemoryConfig;
    };
    /**
     * Check if using Vectorize
     */
    isVectorize(): this is Memory & {
        provider: VectorizeMemoryConfig;
    };
    /**
     * Check if using Durable Objects
     */
    isDurableObject(): this is Memory & {
        provider: DurableObjectMemoryConfig;
    };
    /**
     * Convert to plain config object
     */
    toConfig(): AgentMemoryConfig;
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
export declare function memory(config: AgentMemoryConfig): Memory;
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
export declare function kvMemory(config: Omit<KVMemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
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
export declare function r2Memory(config: Omit<R2MemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
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
export declare function d1Memory(config: Omit<D1MemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
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
export declare function vectorMemory(config: Omit<VectorizeMemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
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
export declare function durableMemory(config: Omit<DurableObjectMemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
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
export declare function customMemory(config: Omit<CustomMemoryConfig, 'type'>, options?: Omit<AgentMemoryConfig, 'provider'>): Memory;
/**
 * Check if a value is a Memory instance
 */
export declare function isMemory(value: unknown): value is Memory;
/**
 * Check if a value is a valid memory configuration
 */
export declare function isMemoryConfig(value: unknown): value is AgentMemoryConfig;
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
export declare function conversationMemory(options: {
    binding: string;
    maxMessages?: number;
    summarizeAfter?: number;
    ttl?: number;
}): Memory;
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
export declare function knowledgeBase(options: {
    vectorBinding: string;
    storageBinding?: string;
    model?: string;
    dimensions?: number;
}): Memory;
//# sourceMappingURL=memory.d.ts.map