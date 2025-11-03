/**
 * AutoRAG Ingestion Helper
 *
 * Helper functions for ingesting documents into Cloudflare Vectorize
 * with automatic chunking and embedding via AutoRAG.
 */
/**
 * Ingest documents into Vectorize with AutoRAG
 */
export async function ingestDocuments(documents, options, env) {
    const vectorize = env[options.index];
    if (!vectorize) {
        throw new Error(`Vectorize index '${options.index}' not found in environment bindings`);
    }
    const batchSize = options.batchSize || 100;
    const errors = [];
    let successCount = 0;
    // Process documents in batches
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        try {
            // Prepare vectors for insertion
            const vectors = batch.map(doc => {
                // For AutoRAG, we pass text in metadata and let Cloudflare generate embeddings
                return {
                    id: doc.id,
                    // Empty values array - AutoRAG will generate embeddings
                    values: [],
                    namespace: doc.namespace,
                    metadata: {
                        text: doc.content,
                        ...doc.metadata
                    }
                };
            });
            // Insert with AutoRAG
            await vectorize.upsert(vectors);
            successCount += batch.length;
        }
        catch (error) {
            const errorMsg = `Batch ${i / batchSize + 1} failed: ${error.message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
        }
    }
    return {
        success: errors.length === 0,
        count: successCount,
        errors: errors.length > 0 ? errors : undefined
    };
}
/**
 * Chunk text into smaller pieces
 */
export function chunkText(text, chunkSize = 512, overlap = 50) {
    const chunks = [];
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim()) {
            chunks.push(chunk);
        }
    }
    return chunks;
}
/**
 * Chunk document into multiple smaller documents
 */
export function chunkDocument(doc, chunkSize = 512, overlap = 50) {
    const chunks = chunkText(doc.content, chunkSize, overlap);
    return chunks.map((chunk, index) => ({
        id: `${doc.id}_chunk_${index}`,
        content: chunk,
        metadata: {
            ...doc.metadata,
            originalId: doc.id,
            chunkIndex: index,
            totalChunks: chunks.length
        },
        namespace: doc.namespace
    }));
}
