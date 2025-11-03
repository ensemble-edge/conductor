/**
 * Text Chunking Strategies
 *
 * Breaks down large text into smaller chunks for embedding
 */
import type { Chunk, ChunkStrategy } from './types';
export declare class Chunker {
    /**
     * Chunk text based on strategy
     */
    chunk(text: string, strategy: ChunkStrategy, chunkSize: number, overlap: number): Chunk[];
    /**
     * Fixed-size chunking with overlap
     */
    private fixedSizeChunking;
    /**
     * Semantic chunking (breaks on paragraph boundaries)
     */
    private semanticChunking;
    /**
     * Recursive chunking (tries multiple separators)
     */
    private recursiveChunking;
    private recursiveChunkingHelper;
}
//# sourceMappingURL=chunker.d.ts.map