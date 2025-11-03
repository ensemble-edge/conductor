/**
 * Semantic Memory - Vectorize
 *
 * Stores memories as embeddings for semantic search and retrieval.
 * Useful for finding contextually relevant information.
 */

import type { Memory, SearchOptions } from './types';
import { createLogger } from '../../observability';

const logger = createLogger({ serviceName: 'semantic-memory' });

export class SemanticMemory {
	private readonly embeddingModel = '@cf/baai/bge-base-en-v1.5';

	constructor(
		private readonly env: Env,
		private readonly userId?: string
	) {}

	/**
	 * Add a memory to semantic storage
	 */
	async add(content: string, metadata?: Record<string, any>): Promise<string> {
		if (!this.userId || !(this.env as any).VECTORIZE || !(this.env as any).AI) {
			return '';
		}

		// Generate embedding
		const embedding = await this.generateEmbedding(content);

		// Create unique ID
		const id = `${this.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

		// Store in Vectorize
		await (this.env as any).VECTORIZE.upsert([
			{
				id,
				values: embedding,
				metadata: {
					user_id: this.userId,
					content: content,
					timestamp: Date.now(),
					...metadata
				}
			}
		]);

		return id;
	}

	/**
	 * Add multiple memories
	 */
	async addMany(memories: Array<{ content: string; metadata?: Record<string, any> }>): Promise<string[]> {
		if (!this.userId || !(this.env as any).VECTORIZE || !(this.env as any).AI) {
			return [];
		}

		// Generate embeddings for all memories
		const embeddings = await this.generateEmbeddings(memories.map((m) => m.content));

		// Create vectors
		const vectors = memories.map((memory, i) => ({
			id: `${this.userId}-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
			values: embeddings[i],
			metadata: {
				user_id: this.userId,
				content: memory.content,
				timestamp: Date.now(),
				...memory.metadata
			}
		}));

		// Store in Vectorize
		await (this.env as any).VECTORIZE.upsert(vectors);

		return vectors.map((v) => v.id);
	}

	/**
	 * Search for semantically similar memories
	 */
	async search(query: string, options?: SearchOptions): Promise<Memory[]> {
		if (!this.userId || !(this.env as any).VECTORIZE || !(this.env as any).AI) {
			return [];
		}

		// Generate query embedding
		const queryEmbedding = await this.generateEmbedding(query);

		// Search Vectorize
		const results = await (this.env as any).VECTORIZE.query(queryEmbedding, {
			topK: options?.topK || 5,
			filter: { user_id: this.userId, ...options?.filter },
			returnValues: false,
			returnMetadata: true
		});

		// Convert to Memory objects
		return results.matches
			.filter((match: any) => !options?.minScore || match.score >= options.minScore)
			.map((match: any) => ({
				id: match.id,
				content: match.metadata.content,
				timestamp: match.metadata.timestamp,
				metadata: match.metadata,
				score: match.score
			}));
	}

	/**
	 * Get a specific memory by ID
	 */
	async get(id: string): Promise<Memory | null> {
		if (!this.userId || !(this.env as any).VECTORIZE) {
			return null;
		}

		// Vectorize doesn't have a direct get by ID, so we search with a dummy vector
		// and filter by ID in metadata
		// This is a limitation - in production, consider caching or using a separate store
		return null;
	}

	/**
	 * Delete a memory
	 */
	async delete(id: string): Promise<void> {
		if (!this.userId || !(this.env as any).VECTORIZE) {
			return;
		}

		await (this.env as any).VECTORIZE.deleteByIds([id]);
	}

	/**
	 * Delete multiple memories
	 */
	async deleteMany(ids: string[]): Promise<void> {
		if (!this.userId || !(this.env as any).VECTORIZE || ids.length === 0) {
			return;
		}

		await (this.env as any).VECTORIZE.deleteByIds(ids);
	}

	/**
	 * Clear all memories for this user
	 */
	async clear(): Promise<void> {
		if (!this.userId || !(this.env as any).VECTORIZE) {
			return;
		}

		// Delete by filter (requires Vectorize to support metadata filtering in delete)
		// This is a placeholder - Vectorize may not support this yet
		// In production, you may need to track IDs separately
		logger.warn('Semantic memory clear not fully implemented - requires ID tracking', {
			userId: this.userId
		});
	}

	/**
	 * Generate embedding for a single text
	 */
	private async generateEmbedding(text: string): Promise<number[]> {
		const result = await (this.env as any).AI.run(this.embeddingModel, {
			text: [text]
		});

		return (result as any).data[0];
	}

	/**
	 * Generate embeddings for multiple texts
	 */
	private async generateEmbeddings(texts: string[]): Promise<number[][]> {
		const result = await (this.env as any).AI.run(this.embeddingModel, {
			text: texts
		});

		return (result as any).data;
	}

	/**
	 * Calculate similarity between two texts
	 */
	async similarity(text1: string, text2: string): Promise<number> {
		if (!(this.env as any).AI) {
			return 0;
		}

		const embeddings = await this.generateEmbeddings([text1, text2]);
		return this.cosineSimilarity(embeddings[0], embeddings[1]);
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	private cosineSimilarity(vec1: number[], vec2: number[]): number {
		if (vec1.length !== vec2.length) {
			return 0;
		}

		let dotProduct = 0;
		let norm1 = 0;
		let norm2 = 0;

		for (let i = 0; i < vec1.length; i++) {
			dotProduct += vec1[i] * vec2[i];
			norm1 += vec1[i] * vec1[i];
			norm2 += vec2[i] * vec2[i];
		}

		norm1 = Math.sqrt(norm1);
		norm2 = Math.sqrt(norm2);

		if (norm1 === 0 || norm2 === 0) {
			return 0;
		}

		return dotProduct / (norm1 * norm2);
	}
}
