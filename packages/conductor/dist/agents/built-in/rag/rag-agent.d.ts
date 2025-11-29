/**
 * RAG Agent - Retrieval-Augmented Generation
 *
 * Uses Cloudflare Vectorize and AI embeddings for semantic search
 *
 * Operations:
 * - index: Store content in vector database
 * - search: Find relevant content using semantic search
 */
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { RAGResult } from './types.js';
import type { ConductorEnv } from '../../../types/env.js';
export declare class RAGMember extends BaseAgent {
    private readonly env;
    private ragConfig;
    private chunker;
    constructor(config: AgentConfig, env: ConductorEnv);
    protected run(context: AgentExecutionContext): Promise<RAGResult>;
    /**
     * Index content into vector database
     */
    private indexContent;
    /**
     * Search content in vector database
     */
    private searchContent;
    /**
     * Generate embeddings using Cloudflare AI
     */
    private generateEmbeddings;
    /**
     * Generate a single embedding
     */
    private generateEmbedding;
    /**
     * Store chunks in Vectorize
     */
    private storeInVectorize;
    /**
     * Search Vectorize for similar vectors
     */
    private searchVectorize;
    /**
     * Rerank search results using cross-encoder model
     */
    private rerank;
}
//# sourceMappingURL=rag-agent.d.ts.map