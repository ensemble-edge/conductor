/**
 * AutoRAG Ingestion Helper
 *
 * Helper functions for ingesting documents into Cloudflare Vectorize
 * with automatic chunking and embedding via AutoRAG.
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
 * Ingest documents into Vectorize with AutoRAG
 */
export async function ingestDocuments(
	documents: Document[],
	options: IngestOptions,
	env: Record<string, unknown>
): Promise<{ success: boolean; count: number; errors?: string[] }> {
	const vectorize = env[options.index] as VectorizeIndex | undefined;

	if (!vectorize) {
		throw new Error(`Vectorize index '${options.index}' not found in environment bindings`);
	}

	const batchSize = options.batchSize || 100;
	const errors: string[] = [];
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
			await vectorize.upsert(vectors as VectorizeVector[]);
			successCount += batch.length;

		} catch (error) {
			const errorMsg = `Batch ${i / batchSize + 1} failed: ${(error as Error).message}`;
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
export function chunkText(
	text: string,
	chunkSize: number = 512,
	overlap: number = 50
): string[] {
	const chunks: string[] = [];
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
export function chunkDocument(
	doc: Document,
	chunkSize: number = 512,
	overlap: number = 50
): Document[] {
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

// Types (from @cloudflare/workers-types)
interface VectorizeIndex {
	upsert(vectors: VectorizeVector[]): Promise<VectorizeAsyncMutation>;
}

interface VectorizeVector {
	id: string;
	values: number[];
	namespace?: string;
	metadata?: Record<string, unknown>;
}

interface VectorizeAsyncMutation {
	mutationId: string;
}
