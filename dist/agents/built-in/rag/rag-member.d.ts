/**
 * RAG Member - Retrieval-Augmented Generation
 *
 * Uses Cloudflare Vectorize and AI embeddings for semantic search
 *
 * Operations:
 * - index: Store content in vector database
 * - search: Find relevant content using semantic search
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member.js';
import type { MemberConfig } from '../../../runtime/parser.js';
import type { RAGResult } from './types.js';
export declare class RAGMember extends BaseMember {
    private readonly env;
    private ragConfig;
    private chunker;
    constructor(config: MemberConfig, env: Env);
    protected run(context: MemberExecutionContext): Promise<RAGResult>;
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
     * Rerank search results
     */
    private rerank;
}
//# sourceMappingURL=rag-member.d.ts.map