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
export type MemoryProviderType = 'kv' | 'r2' | 'd1' | 'vectorize' | 'durable-object' | 'custom'

/**
 * Memory scope defines the visibility of memory
 */
export type MemoryScope = 'agent' | 'ensemble' | 'session' | 'global'

/**
 * Memory entry with metadata
 */
export interface MemoryEntry<T = unknown> {
	/** Unique key for this entry */
	key: string
	/** The stored value */
	value: T
	/** When the entry was created */
	createdAt: Date
	/** When the entry was last updated */
	updatedAt: Date
	/** Time-to-live in seconds */
	ttl?: number
	/** Custom metadata */
	metadata?: Record<string, unknown>
}

/**
 * Vector memory entry for semantic search
 */
export interface VectorMemoryEntry extends MemoryEntry {
	/** Vector embedding */
	embedding?: number[]
	/** Content for embedding generation */
	content?: string
	/** Similarity score (when returned from search) */
	score?: number
}

/**
 * Memory provider configuration
 */
export interface MemoryProviderConfig {
	/** Provider type */
	type: MemoryProviderType
	/** Binding name in wrangler.toml */
	binding?: string
	/** Namespace or table name */
	namespace?: string
	/** Custom configuration */
	config?: Record<string, unknown>
}

/**
 * KV memory configuration
 */
export interface KVMemoryConfig extends MemoryProviderConfig {
	type: 'kv'
	/** KV namespace binding */
	binding: string
	/** Key prefix for namespacing */
	prefix?: string
	/** Default TTL in seconds */
	defaultTTL?: number
}

/**
 * R2 memory configuration (for large objects)
 */
export interface R2MemoryConfig extends MemoryProviderConfig {
	type: 'r2'
	/** R2 bucket binding */
	binding: string
	/** Key prefix */
	prefix?: string
	/** Maximum object size in bytes */
	maxSize?: number
}

/**
 * D1 memory configuration (structured data)
 */
export interface D1MemoryConfig extends MemoryProviderConfig {
	type: 'd1'
	/** D1 database binding */
	binding: string
	/** Table name */
	table?: string
	/** Auto-create table if not exists */
	autoCreate?: boolean
}

/**
 * Vectorize memory configuration (semantic search)
 */
export interface VectorizeMemoryConfig extends MemoryProviderConfig {
	type: 'vectorize'
	/** Vectorize index binding */
	binding: string
	/** Embedding model to use */
	model?: string
	/** Dimensions of the embeddings */
	dimensions?: number
	/** Distance metric */
	metric?: 'cosine' | 'euclidean' | 'dot-product'
}

/**
 * Durable Object memory configuration (strongly consistent)
 */
export interface DurableObjectMemoryConfig extends MemoryProviderConfig {
	type: 'durable-object'
	/** Durable Object namespace binding */
	binding: string
	/** ID generation strategy */
	idStrategy?: 'hash' | 'random' | 'custom'
}

/**
 * Custom memory provider configuration
 */
export interface CustomMemoryConfig extends MemoryProviderConfig {
	type: 'custom'
	/** Custom handler path */
	handler?: string
	/** Custom implementation */
	implementation?: MemoryImplementation
}

/**
 * Memory implementation interface for custom providers
 */
export interface MemoryImplementation {
	get<T = unknown>(key: string): Promise<T | null>
	set<T = unknown>(key: string, value: T, options?: { ttl?: number }): Promise<void>
	delete(key: string): Promise<boolean>
	list(options?: { prefix?: string; limit?: number }): Promise<string[]>
	clear(prefix?: string): Promise<void>
}

/**
 * Union type for memory configurations
 */
export type MemoryConfig =
	| KVMemoryConfig
	| R2MemoryConfig
	| D1MemoryConfig
	| VectorizeMemoryConfig
	| DurableObjectMemoryConfig
	| CustomMemoryConfig

/**
 * Memory configuration for an agent
 */
export interface AgentMemoryConfig {
	/** Memory provider configuration */
	provider: MemoryConfig
	/** Memory scope */
	scope?: MemoryScope
	/** Maximum entries to store */
	maxEntries?: number
	/** Eviction policy when max is reached */
	evictionPolicy?: 'lru' | 'fifo' | 'ttl'
	/** Default TTL in seconds */
	defaultTTL?: number
	/** Enable automatic summarization */
	summarize?: boolean
	/** Summarization threshold (number of entries) */
	summarizeThreshold?: number
}

/**
 * Memory class - runtime representation of memory configuration
 */
export class Memory {
	public readonly provider: MemoryConfig
	public readonly scope: MemoryScope
	public readonly maxEntries?: number
	public readonly evictionPolicy: 'lru' | 'fifo' | 'ttl'
	public readonly defaultTTL?: number
	public readonly summarize: boolean
	public readonly summarizeThreshold: number

	constructor(config: AgentMemoryConfig) {
		this.provider = config.provider
		this.scope = config.scope ?? 'agent'
		this.maxEntries = config.maxEntries
		this.evictionPolicy = config.evictionPolicy ?? 'lru'
		this.defaultTTL = config.defaultTTL
		this.summarize = config.summarize ?? false
		this.summarizeThreshold = config.summarizeThreshold ?? 100
	}

	/**
	 * Check if using KV storage
	 */
	isKV(): this is Memory & { provider: KVMemoryConfig } {
		return this.provider.type === 'kv'
	}

	/**
	 * Check if using R2 storage
	 */
	isR2(): this is Memory & { provider: R2MemoryConfig } {
		return this.provider.type === 'r2'
	}

	/**
	 * Check if using D1 storage
	 */
	isD1(): this is Memory & { provider: D1MemoryConfig } {
		return this.provider.type === 'd1'
	}

	/**
	 * Check if using Vectorize
	 */
	isVectorize(): this is Memory & { provider: VectorizeMemoryConfig } {
		return this.provider.type === 'vectorize'
	}

	/**
	 * Check if using Durable Objects
	 */
	isDurableObject(): this is Memory & { provider: DurableObjectMemoryConfig } {
		return this.provider.type === 'durable-object'
	}

	/**
	 * Convert to plain config object
	 */
	toConfig(): AgentMemoryConfig {
		return {
			provider: this.provider,
			scope: this.scope,
			maxEntries: this.maxEntries,
			evictionPolicy: this.evictionPolicy,
			defaultTTL: this.defaultTTL,
			summarize: this.summarize,
			summarizeThreshold: this.summarizeThreshold,
		}
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
export function memory(config: AgentMemoryConfig): Memory {
	return new Memory(config)
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
export function kvMemory(
	config: Omit<KVMemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'kv', ...config },
	})
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
export function r2Memory(
	config: Omit<R2MemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'r2', ...config },
	})
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
export function d1Memory(
	config: Omit<D1MemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'd1', ...config },
	})
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
export function vectorMemory(
	config: Omit<VectorizeMemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'vectorize', ...config },
	})
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
export function durableMemory(
	config: Omit<DurableObjectMemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'durable-object', ...config },
	})
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
export function customMemory(
	config: Omit<CustomMemoryConfig, 'type'>,
	options?: Omit<AgentMemoryConfig, 'provider'>
): Memory {
	return new Memory({
		...options,
		provider: { type: 'custom', ...config },
	})
}

/**
 * Check if a value is a Memory instance
 */
export function isMemory(value: unknown): value is Memory {
	return value instanceof Memory
}

/**
 * Check if a value is a valid memory configuration
 */
export function isMemoryConfig(value: unknown): value is AgentMemoryConfig {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	const config = value as Record<string, unknown>
	return typeof config.provider === 'object' && config.provider !== null
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
export function conversationMemory(options: {
	binding: string
	maxMessages?: number
	summarizeAfter?: number
	ttl?: number
}): Memory {
	return kvMemory(
		{
			binding: options.binding,
			prefix: 'conversation/',
			defaultTTL: options.ttl,
		},
		{
			scope: 'session',
			maxEntries: options.maxMessages,
			evictionPolicy: 'fifo',
			summarize: options.summarizeAfter !== undefined,
			summarizeThreshold: options.summarizeAfter,
		}
	)
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
export function knowledgeBase(options: {
	vectorBinding: string
	storageBinding?: string
	model?: string
	dimensions?: number
}): Memory {
	return vectorMemory({
		binding: options.vectorBinding,
		model: options.model ?? '@cf/baai/bge-base-en-v1.5',
		dimensions: options.dimensions ?? 768,
		metric: 'cosine',
	})
}
