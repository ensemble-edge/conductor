/**
 * Semantic Memory - Vectorize
 *
 * Stores memories as embeddings for semantic search and retrieval.
 * Useful for finding contextually relevant information.
 */
import type { Memory, SearchOptions } from './types';
import type { ConductorEnv } from '../../types/env';
export declare class SemanticMemory {
    private readonly env;
    private readonly userId?;
    private readonly embeddingModel;
    constructor(env: ConductorEnv, userId?: string | undefined);
    /**
     * Add a memory to semantic storage
     */
    add(content: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Add multiple memories
     */
    addMany(memories: Array<{
        content: string;
        metadata?: Record<string, unknown>;
    }>): Promise<string[]>;
    /**
     * Search for semantically similar memories
     */
    search(query: string, options?: SearchOptions): Promise<Memory[]>;
    /**
     * Get a specific memory by ID
     */
    get(id: string): Promise<Memory | null>;
    /**
     * Delete a memory
     */
    delete(id: string): Promise<void>;
    /**
     * Delete multiple memories
     */
    deleteMany(ids: string[]): Promise<void>;
    /**
     * Clear all memories for this user
     */
    clear(): Promise<void>;
    /**
     * Generate embedding for a single text
     */
    private generateEmbedding;
    /**
     * Generate embeddings for multiple texts
     */
    private generateEmbeddings;
    /**
     * Calculate similarity between two texts
     */
    similarity(text1: string, text2: string): Promise<number>;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
}
//# sourceMappingURL=semantic-memory.d.ts.map