/**
 * Memory Manager - Hierarchical Memory System
 *
 * Orchestrates 5 memory layers:
 * 1. Working - Current execution context (in-memory)
 * 2. Session - Conversation history (KV with TTL)
 * 3. Long-Term - Persistent user data (D1)
 * 4. Semantic - Vector-based retrieval (Vectorize)
 * 5. Analytical - Structured data via Hyperdrive (SQL databases)
 *
 * Provides a unified interface for memory operations across all layers.
 */
import { AnalyticalMemory } from './analytical-memory.js';
import type { MemoryConfig, Message, Memory, SearchOptions, MemorySnapshot } from './types.js';
import type { ConductorEnv } from '../../types/env';
export declare class MemoryManager {
    private readonly env;
    private readonly config;
    private readonly userId?;
    private readonly sessionId?;
    private workingMemory;
    private sessionMemory;
    private longTermMemory;
    private semanticMemory;
    private analyticalMemory;
    constructor(env: ConductorEnv, config: MemoryConfig, userId?: string | undefined, sessionId?: string | undefined);
    /**
     * Set a value in working memory
     */
    setWorking(key: string, value: unknown): void;
    /**
     * Get a value from working memory
     */
    getWorking(key: string): unknown;
    /**
     * Get all working memory
     */
    getWorkingAll(): Record<string, unknown>;
    /**
     * Clear working memory
     */
    clearWorking(): void;
    /**
     * Add a message to session memory
     */
    addMessage(message: Message): Promise<void>;
    /**
     * Get conversation history
     */
    getConversationHistory(): Promise<Message[]>;
    /**
     * Get last N messages
     */
    getLastMessages(n: number): Promise<Message[]>;
    /**
     * Clear session memory
     */
    clearSession(): Promise<void>;
    /**
     * Compress session memory
     */
    compressSession(maxMessages: number): Promise<void>;
    /**
     * Set a value in long-term memory
     */
    setLongTerm(key: string, value: unknown): Promise<void>;
    /**
     * Get a value from long-term memory
     */
    getLongTerm(key: string): Promise<unknown>;
    /**
     * Get all long-term memory
     */
    getLongTermAll(): Promise<Record<string, unknown>>;
    /**
     * Delete from long-term memory
     */
    deleteLongTerm(key: string): Promise<void>;
    /**
     * Clear long-term memory
     */
    clearLongTerm(): Promise<void>;
    /**
     * Add a memory to semantic storage
     */
    addSemantic(content: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Search semantic memory
     */
    searchSemantic(query: string, options?: SearchOptions): Promise<Memory[]>;
    /**
     * Delete from semantic memory
     */
    deleteSemantic(id: string): Promise<void>;
    /**
     * Clear semantic memory
     */
    clearSemantic(): Promise<void>;
    /**
     * Create a complete memory snapshot
     */
    snapshot(): Promise<MemorySnapshot>;
    /**
     * Clear all memory layers
     */
    clearAll(): Promise<void>;
    /**
     * Get memory statistics
     */
    getStats(): Promise<{
        working: {
            size: number;
        };
        session?: {
            messageCount: number;
        };
        longTerm?: {
            keyCount: number;
        };
        semantic?: {
            note: string;
        };
        analytical?: {
            databases: string[];
            databaseCount: number;
        };
    }>;
    /**
     * Check if a memory layer is enabled
     */
    isLayerEnabled(layer: 'working' | 'session' | 'longTerm' | 'semantic' | 'analytical'): boolean;
    /**
     * Query analytical database
     */
    queryAnalytical<T = unknown>(sql: string, params?: unknown[], database?: string): Promise<T[]>;
    /**
     * Query analytical database with named parameters
     */
    queryAnalyticalNamed<T = unknown>(sql: string, params: Record<string, unknown>, database?: string): Promise<T[]>;
    /**
     * Execute write query on analytical database
     */
    executeAnalytical(sql: string, params?: unknown[], database?: string): Promise<number>;
    /**
     * Execute federated query across multiple databases
     */
    queryMultiple(queries: Array<{
        database: string;
        sql: string;
        params?: unknown[];
    }>): Promise<Map<string, unknown[]>>;
    /**
     * Get available analytical databases
     */
    getAnalyticalDatabases(): string[];
    /**
     * Check if analytical database exists
     */
    hasAnalyticalDatabase(alias: string): boolean;
    /**
     * List tables in analytical database
     */
    listAnalyticalTables(database?: string): Promise<string[]>;
    /**
     * Get analytical memory instance (for advanced usage)
     */
    getAnalyticalMemory(): AnalyticalMemory | null;
}
//# sourceMappingURL=memory-manager.d.ts.map