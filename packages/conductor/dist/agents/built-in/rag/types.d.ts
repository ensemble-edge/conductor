/**
 * RAG Agent - Type Definitions
 */
export type RAGOperation = 'index' | 'search';
export type ChunkStrategy = 'fixed' | 'semantic' | 'recursive';
export interface RAGConfig {
    /** Operation type: index (store content) or search (query content) */
    operation?: RAGOperation;
    /** Chunking strategy for splitting content */
    chunkStrategy?: ChunkStrategy;
    /** Target chunk size in characters */
    chunkSize?: number;
    /** Overlap between chunks in characters */
    overlap?: number;
    /** Cloudflare AI embedding model to use */
    embeddingModel?: string;
    /** Number of results to return */
    topK?: number;
    /** Whether to rerank results using cross-encoder */
    rerank?: boolean;
    /** Cloudflare AI reranker model to use */
    rerankModel?: string;
    /** Vectorize namespace for multi-tenant isolation */
    namespace?: string;
}
export interface RAGIndexInput {
    /** Content to index */
    content: string;
    /** Unique document ID */
    id: string;
    /** Optional source identifier */
    source?: string;
    /** Additional metadata to store with vectors */
    metadata?: Record<string, unknown>;
}
export interface RAGSearchInput {
    /** Search query */
    query: string;
    /** Metadata filter for search */
    filter?: Record<string, unknown>;
    /** Override default topK */
    topK?: number;
    /** Override default rerank setting */
    rerank?: boolean;
}
export type RAGInput = RAGIndexInput | RAGSearchInput;
export interface RAGIndexResult {
    /** Number of documents indexed */
    indexed: number;
    /** Number of chunks created */
    chunks: number;
    /** Model used for embeddings */
    embeddingModel: string;
    /** Strategy used for chunking */
    chunkStrategy: ChunkStrategy;
}
/**
 * Individual search result item
 */
export interface RAGSearchResultItem {
    /** Vector ID */
    id: string;
    /** Similarity score */
    score: number;
    /** Original content chunk */
    content: string;
    /** Stored metadata */
    metadata: Record<string, unknown>;
}
export interface RAGSearchResult {
    /** Search results ordered by relevance */
    results: RAGSearchResultItem[];
    /** Total number of results */
    count: number;
    /** Whether results were reranked */
    reranked: boolean;
}
export type RAGResult = RAGIndexResult | RAGSearchResult;
export interface Chunk {
    text: string;
    index: number;
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=types.d.ts.map