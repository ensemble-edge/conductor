/**
 * Vectorize RAG Ingestion Helper
 *
 * Helper functions for manually ingesting documents into Cloudflare Vectorize
 * with custom chunking strategies.
 *
 * Note: This requires you to generate embeddings yourself. For fully automatic
 * ingestion with zero configuration, use Cloudflare's AutoRAG service instead.
 */
export interface Document {
    /** Unique document ID */
    id: string;
    /** Document content */
    content: string;
    /** Document metadata */
    metadata?: Record<string, unknown>;
    /** Optional namespace for multi-tenancy */
    namespace?: string;
}
export interface IngestOptions {
    /** Vectorize index name */
    index: string;
    /** Batch size for ingestion */
    batchSize?: number;
    /** Enable auto-chunking */
    autoChunk?: boolean;
    /** Chunk size (if auto-chunking) */
    chunkSize?: number;
    /** Chunk overlap (if auto-chunking) */
    chunkOverlap?: number;
}
/**
 * Ingest documents into Vectorize manually
 *
 * Note: You need to provide embeddings in the values array.
 * This is a low-level function for when you need full control.
 */
export declare function ingestDocuments(documents: Document[], options: IngestOptions, env: Record<string, unknown>): Promise<{
    success: boolean;
    count: number;
    errors?: string[];
}>;
/**
 * Chunk text into smaller pieces
 */
export declare function chunkText(text: string, chunkSize?: number, overlap?: number): string[];
/**
 * Chunk document into multiple smaller documents
 */
export declare function chunkDocument(doc: Document, chunkSize?: number, overlap?: number): Document[];
//# sourceMappingURL=vectorize-rag-ingest.d.ts.map