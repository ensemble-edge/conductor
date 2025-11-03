/**
 * Text Chunking Strategies
 *
 * Breaks down large text into smaller chunks for embedding
 */
export class Chunker {
    /**
     * Chunk text based on strategy
     */
    chunk(text, strategy, chunkSize, overlap) {
        switch (strategy) {
            case 'fixed':
                return this.fixedSizeChunking(text, chunkSize, overlap);
            case 'semantic':
                return this.semanticChunking(text, chunkSize, overlap);
            case 'recursive':
                return this.recursiveChunking(text, chunkSize, overlap);
            default:
                return this.fixedSizeChunking(text, chunkSize, overlap);
        }
    }
    /**
     * Fixed-size chunking with overlap
     */
    fixedSizeChunking(text, chunkSize, overlap) {
        const chunks = [];
        const words = text.split(/\s+/);
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
            const chunkWords = words.slice(i, i + chunkSize);
            const chunkText = chunkWords.join(' ');
            chunks.push({
                text: chunkText,
                index: chunks.length,
            });
            // Stop if we've processed all words
            if (i + chunkSize >= words.length) {
                break;
            }
        }
        return chunks;
    }
    /**
     * Semantic chunking (breaks on paragraph boundaries)
     */
    semanticChunking(text, chunkSize, overlap) {
        const chunks = [];
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = [];
        let currentSize = 0;
        for (const paragraph of paragraphs) {
            const words = paragraph.split(/\s+/);
            const paragraphSize = words.length;
            // If adding this paragraph would exceed chunk size, save current chunk
            if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    text: currentChunk.join('\n\n'),
                    index: chunks.length,
                });
                // Start new chunk with overlap
                if (overlap > 0 && currentChunk.length > 0) {
                    const lastParagraph = currentChunk[currentChunk.length - 1];
                    currentChunk = [lastParagraph, paragraph];
                    currentSize = lastParagraph.split(/\s+/).length + paragraphSize;
                }
                else {
                    currentChunk = [paragraph];
                    currentSize = paragraphSize;
                }
            }
            else {
                currentChunk.push(paragraph);
                currentSize += paragraphSize;
            }
        }
        // Add final chunk
        if (currentChunk.length > 0) {
            chunks.push({
                text: currentChunk.join('\n\n'),
                index: chunks.length,
            });
        }
        return chunks;
    }
    /**
     * Recursive chunking (tries multiple separators)
     */
    recursiveChunking(text, chunkSize, overlap) {
        const separators = ['\n\n', '\n', '. ', ' '];
        return this.recursiveChunkingHelper(text, chunkSize, overlap, separators, 0);
    }
    recursiveChunkingHelper(text, chunkSize, overlap, separators, depth) {
        // Base case: if text is small enough, return it as a single chunk
        const words = text.split(/\s+/);
        if (words.length <= chunkSize) {
            return [{ text, index: 0 }];
        }
        // If we've run out of separators, fall back to fixed-size chunking
        if (depth >= separators.length) {
            return this.fixedSizeChunking(text, chunkSize, overlap);
        }
        const separator = separators[depth];
        const parts = text.split(separator);
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        for (const part of parts) {
            const partWords = part.split(/\s+/);
            const partSize = partWords.length;
            if (currentSize + partSize > chunkSize && currentChunk.length > 0) {
                // Recursively chunk if still too large
                const chunkText = currentChunk.join(separator);
                const subChunks = this.recursiveChunkingHelper(chunkText, chunkSize, overlap, separators, depth + 1);
                chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
                currentChunk = [part];
                currentSize = partSize;
            }
            else {
                currentChunk.push(part);
                currentSize += partSize;
            }
        }
        // Process final chunk
        if (currentChunk.length > 0) {
            const chunkText = currentChunk.join(separator);
            const subChunks = this.recursiveChunkingHelper(chunkText, chunkSize, overlap, separators, depth + 1);
            chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
        }
        return chunks;
    }
}
