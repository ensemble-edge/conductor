/**
 * AutoRAG Member - Cloudflare's Fully Managed RAG Service
 *
 * Uses Cloudflare's AutoRAG service which provides completely automatic
 * RAG with R2 storage integration. Zero manual work required.
 *
 * Cloudflare AutoRAG Features:
 * - Automatic document ingestion from R2 buckets
 * - Automatic chunking with configurable size/overlap
 * - Automatic embedding generation via Workers AI
 * - Automatic indexing in Vectorize
 * - Continuous monitoring and updates
 * - Supports PDFs, images, text, HTML, CSV, and more
 *
 * This is the easiest way to do RAG on Cloudflare - just point to an R2 bucket!
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member.js';
export interface AutoRAGConfig {
    /** AutoRAG instance name (configured in wrangler.toml) */
    instance: string;
    /** Return format: 'answer' (AI-generated) or 'results' (raw search results) */
    mode?: 'answer' | 'results';
    /** Number of results to retrieve */
    topK?: number;
    /** Optional query rewriting for better retrieval */
    rewriteQuery?: boolean;
}
export interface AutoRAGInput {
    /** Query text */
    query: string;
    /** Override topK for this query */
    topK?: number;
}
export interface AutoRAGAnswerResult {
    /** AI-generated answer grounded in retrieved documents */
    answer: string;
    /** Sources used to generate the answer */
    sources: Array<{
        /** Document content excerpt */
        content: string;
        /** Similarity score (0-1) */
        score: number;
        /** Document metadata */
        metadata: Record<string, unknown>;
        /** Document ID */
        id: string;
    }>;
    /** Original query */
    query: string;
}
export interface AutoRAGSearchResult {
    /** Retrieved search results without generation */
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
    /** Number of results */
    count: number;
    /** Original query */
    query: string;
}
/**
 * AutoRAG Member - Dead simple RAG with zero configuration
 */
export declare class AutoRAGMember extends BaseMember {
    run(ctx: MemberExecutionContext): Promise<AutoRAGAnswerResult | AutoRAGSearchResult>;
}
//# sourceMappingURL=autorag-member.d.ts.map