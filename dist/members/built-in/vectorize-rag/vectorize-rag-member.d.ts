/**
 * Vectorize RAG Member - Manual Cloudflare Vectorize Integration
 *
 * Manual RAG implementation using Cloudflare Vectorize for cases where
 * you need more control over chunking, embedding, and indexing.
 *
 * Features:
 * - Direct Vectorize index access
 * - Custom chunking and embedding strategies
 * - Full control over metadata and namespaces
 * - Hybrid search and filtering
 *
 * Note: For fully automatic RAG with zero configuration, see AutoRAGMember
 * which uses Cloudflare's R2-backed AutoRAG service.
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member';
export interface VectorizeRAGConfig {
    /** Vectorize index to use */
    index: string;
    /** Number of results to return */
    topK?: number;
    /** Minimum similarity score (0-1) */
    minScore?: number;
    /** Enable hybrid search (vector + keyword) */
    hybridSearch?: boolean;
    /** Metadata filters */
    filter?: Record<string, unknown>;
}
export interface VectorizeRAGInput {
    /** Query text */
    query: string;
    /** Optional namespace for multi-tenancy */
    namespace?: string;
    /** Override topK for this query */
    topK?: number;
}
export interface VectorizeRAGResult {
    /** Search results */
    results: Array<{
        /** Document content */
        content: string;
        /** Similarity score (0-1) */
        score: number;
        /** Document metadata */
        metadata: Record<string, unknown>;
        /** Document ID */
        id: string;
    }>;
    /** Combined context for LLM */
    context: string;
    /** Number of results returned */
    count: number;
    /** Query that was executed */
    query: string;
}
/**
 * Manual Vectorize RAG Member with full control
 */
export declare class VectorizeRAGMember extends BaseMember {
    run(ctx: MemberExecutionContext): Promise<VectorizeRAGResult>;
}
//# sourceMappingURL=vectorize-rag-member.d.ts.map