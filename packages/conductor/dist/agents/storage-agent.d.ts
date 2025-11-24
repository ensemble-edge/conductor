/**
 * Storage Agent - Key-Value and Object Storage
 *
 * Handles storage operations for KV, R2, and Cache API through a unified Repository interface.
 * Storage backend is injected, making it testable and platform-agnostic.
 *
 * Storage types:
 * - KV: Key-value store (Cloudflare Workers KV)
 * - R2: Object storage (Cloudflare R2)
 * - Cache: Cache API (browser-compatible caching)
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import type { Repository } from '../storage/index.js';
import { StorageType } from '../types/constants.js';
export interface StorageConfig {
    backend: StorageType;
    operation: 'get' | 'put' | 'delete' | 'list';
    binding?: string;
    ttl?: number;
}
export interface StorageInput {
    key?: string;
    value?: unknown;
    prefix?: string;
    limit?: number;
    cursor?: string;
    ttl?: number;
}
/**
 * Storage Agent performs key-value and object storage operations via Repository pattern
 *
 * Benefits of Repository pattern:
 * - Platform-agnostic (works with any storage backend)
 * - Testable (easy to inject mock repositories)
 * - Composable (repositories can be chained, cached, etc.)
 * - Type-safe (Result types for error handling)
 */
export declare class StorageAgent extends BaseAgent {
    private readonly repository?;
    private storageConfig;
    constructor(config: AgentConfig, repository?: Repository<unknown, string> | undefined);
    /**
     * Execute storage operation via repository
     */
    protected run(context: AgentExecutionContext): Promise<unknown>;
    /**
     * Execute GET operation
     */
    private executeGet;
    /**
     * Execute PUT operation
     */
    private executePut;
    /**
     * Execute DELETE operation
     */
    private executeDelete;
    /**
     * Execute LIST operation
     */
    private executeList;
    /**
     * Create repository from environment bindings
     * Falls back to original behavior if no repository injected
     */
    private createRepository;
    /**
     * Get binding name with sensible defaults
     */
    private getBindingName;
    /**
     * Get Storage configuration
     */
    getStorageConfig(): StorageConfig;
}
//# sourceMappingURL=storage-agent.d.ts.map