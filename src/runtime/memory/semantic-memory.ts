/**
 * Semantic Memory - Vectorize
 *
 * Stores memories as embeddings for semantic search and retrieval.
 * Useful for finding contextually relevant information.
 */

import type { Memory, SearchOptions } from './types';
import { createLogger } from '../../observability';
import type { ConductorEnv } from '../../types/env';

const logger = createLogger({ serviceName: 'semantic-memory' });

/**
 * Vectorize match result
 */
interface VectorizeMatch {
	id: string;
	score: number;
	metadata: {
		user_id?: string;
		content: string;
		timestamp: number;
		[key: string]: unknown;
	};
}

/**
 * AI embedding result
 */
interface AIEmbeddingResult {
	data: number[][] | number[];
}

export class SemanticMemory {
	private readonly embeddingModel = '@cf/baai/bge-base-en-v1.5';

	constructor(
		private readonly env: ConductorEnv,
		private readonly userId?: string
	) {}

	/**
	 * Add a memory to semantic storage
	 */
	async add(content: string, metadata?: Record<string, unknown>): Promise<string> {
		if (!this.userId || !this.env.VECTORIZE || !this.env.AI) {
			return '';
		}

		// Generate embedding
		const embedding = await this.generateEmbedding(content);

		// Create unique ID
		const userId = this.userId; // Type narrowed after check
		const id = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

		// Store in Vectorize
		await this.env.VECTORIZE.upsert([
			{
				id,
				values: embedding,
				metadata: {
					user_id: userId,
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
	async addMany(memories: Array<{ content: string; metadata?: Record<string, unknown> }>): Promise<string[]> {
		if (!this.userId || !this.env.VECTORIZE || !this.env.AI) {
			return [];
		}

		// Generate embeddings for all memories
		const embeddings = await this.generateEmbeddings(memories.map((m) => m.content));

		// Type narrowed after check
		const userId = this.userId;

		// Create vectors
		const vectors = memories.map((memory, i) => ({
			id: `${userId}-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
			values: embeddings[i],
			metadata: {
				user_id: userId,
				content: memory.content,
				timestamp: Date.now(),
				...memory.metadata
			}
		}));

		// Store in Vectorize
		await this.env.VECTORIZE.upsert(vectors);

		return vectors.map((v) => v.id);
	}

	/**
	 * Search for semantically similar memories
	 */
	async search(query: string, options?: SearchOptions): Promise<Memory[]> {
		if (!this.userId || !this.env.VECTORIZE || !this.env.AI) {
			return [];
		}

		// Generate query embedding
		const queryEmbedding = await this.generateEmbedding(query);

		// Search Vectorize
		const results = await this.env.VECTORIZE.query(queryEmbedding, {
			topK: options?.topK || 5,
			filter: { user_id: this.userId, ...options?.filter },
			returnValues: false,
			returnMetadata: true
		});

		// Convert to Memory objects
		return (results.matches as VectorizeMatch[])
			.filter((match) => !options?.minScore || match.score >= options.minScore)
			.map((match) => ({
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
		if (!this.userId || !this.env.VECTORIZE) {
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
		if (!this.userId || !this.env.VECTORIZE) {
			return;
		}

		await this.env.VECTORIZE.deleteByIds([id]);
	}

	/**
	 * Delete multiple memories
	 */
	async deleteMany(ids: string[]): Promise<void> {
		if (!this.userId || !this.env.VECTORIZE || ids.length === 0) {
			return;
		}

		await this.env.VECTORIZE.deleteByIds(ids);
	}

	/**
	 * Clear all memories for this user
	 */
	async clear(): Promise<void> {
		if (!this.userId || !this.env.VECTORIZE) {
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
		const result = await this.env.AI.run(this.embeddingModel, {
			text: [text]
		}) as AIEmbeddingResult;

		return Array.isArray(result.data[0]) ? result.data[0] : result.data as number[];
	}

	/**
	 * Generate embeddings for multiple texts
	 */
	private async generateEmbeddings(texts: string[]): Promise<number[][]> {
		const result = await this.env.AI.run(this.embeddingModel, {
			text: texts
		}) as AIEmbeddingResult;

		return result.data as number[][];
	}

	/**
	 * Calculate similarity between two texts
	 */
	async similarity(text1: string, text2: string): Promise<number> {
		if (!this.env.AI) {
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
