/**
 * RAG Member - Type Definitions
 */

export type RAGOperation = 'index' | 'search';
export type ChunkStrategy = 'fixed' | 'semantic' | 'recursive';

export interface RAGConfig {
	operation?: RAGOperation;
	chunkStrategy?: ChunkStrategy;
	chunkSize?: number;
	overlap?: number;
	embeddingModel?: string;
	topK?: number;
	rerank?: boolean;
	rerankAlgorithm?: 'cross-encoder' | 'mmr';
}

export interface RAGIndexInput {
	content: string;
	id: string;
	source?: string;
	metadata?: Record<string, any>;
}

export interface RAGSearchInput {
	query: string;
	filter?: Record<string, any>;
}

export type RAGInput = RAGIndexInput | RAGSearchInput;

export interface RAGIndexResult {
	indexed: number;
	chunks: number;
	embeddingModel: string;
	chunkStrategy: ChunkStrategy;
}

export interface RAGSearchResult {
	results: Array<{
		content: string;
		score: number;
		source?: string;
		metadata?: Record<string, any>;
	}>;
	count: number;
	reranked: boolean;
}

export type RAGResult = RAGIndexResult | RAGSearchResult;

export interface Chunk {
	text: string;
	index: number;
	metadata?: Record<string, any>;
}
