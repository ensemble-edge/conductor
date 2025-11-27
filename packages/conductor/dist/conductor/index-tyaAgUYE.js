import { b as BaseAgent } from "./worker-entry-CyVZt1wP.js";
class Chunker {
  /**
   * Chunk text based on strategy
   */
  chunk(text, strategy, chunkSize, overlap) {
    switch (strategy) {
      case "fixed":
        return this.fixedSizeChunking(text, chunkSize, overlap);
      case "semantic":
        return this.semanticChunking(text, chunkSize, overlap);
      case "recursive":
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
      const chunkText = chunkWords.join(" ");
      chunks.push({
        text: chunkText,
        index: chunks.length
      });
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
      if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join("\n\n"),
          index: chunks.length
        });
        if (overlap > 0 && currentChunk.length > 0) {
          const lastParagraph = currentChunk[currentChunk.length - 1];
          currentChunk = [lastParagraph, paragraph];
          currentSize = lastParagraph.split(/\s+/).length + paragraphSize;
        } else {
          currentChunk = [paragraph];
          currentSize = paragraphSize;
        }
      } else {
        currentChunk.push(paragraph);
        currentSize += paragraphSize;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join("\n\n"),
        index: chunks.length
      });
    }
    return chunks;
  }
  /**
   * Recursive chunking (tries multiple separators)
   */
  recursiveChunking(text, chunkSize, overlap) {
    const separators = ["\n\n", "\n", ". ", " "];
    return this.recursiveChunkingHelper(text, chunkSize, overlap, separators, 0);
  }
  recursiveChunkingHelper(text, chunkSize, overlap, separators, depth) {
    const words = text.split(/\s+/);
    if (words.length <= chunkSize) {
      return [{ text, index: 0 }];
    }
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
        const chunkText = currentChunk.join(separator);
        const subChunks = this.recursiveChunkingHelper(
          chunkText,
          chunkSize,
          overlap,
          separators,
          depth + 1
        );
        chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
        currentChunk = [part];
        currentSize = partSize;
      } else {
        currentChunk.push(part);
        currentSize += partSize;
      }
    }
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(separator);
      const subChunks = this.recursiveChunkingHelper(
        chunkText,
        chunkSize,
        overlap,
        separators,
        depth + 1
      );
      chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
    }
    return chunks;
  }
}
class RAGMember extends BaseAgent {
  constructor(config, env) {
    super(config);
    this.env = env;
    const cfg = config.config;
    this.ragConfig = {
      operation: cfg?.operation || "search",
      chunkStrategy: cfg?.chunkStrategy || "semantic",
      chunkSize: cfg?.chunkSize || 512,
      overlap: cfg?.overlap || 50,
      embeddingModel: cfg?.embeddingModel || "@cf/baai/bge-base-en-v1.5",
      topK: cfg?.topK || 5,
      rerank: cfg?.rerank || false,
      rerankAlgorithm: cfg?.rerankAlgorithm || "cross-encoder"
    };
    this.chunker = new Chunker();
  }
  async run(context) {
    const input = context.input;
    const operation = this.ragConfig.operation;
    switch (operation) {
      case "index":
        return await this.indexContent(input);
      case "search":
        return await this.searchContent(input);
      default:
        throw new Error(`Unknown RAG operation: ${operation}`);
    }
  }
  /**
   * Index content into vector database
   */
  async indexContent(input) {
    if (!input.content) {
      throw new Error('Index operation requires "content" in input');
    }
    if (!input.id) {
      throw new Error('Index operation requires "id" in input');
    }
    const chunks = this.chunker.chunk(
      input.content,
      this.ragConfig.chunkStrategy,
      this.ragConfig.chunkSize,
      this.ragConfig.overlap
    );
    return {
      indexed: chunks.length,
      chunks: chunks.length,
      embeddingModel: this.ragConfig.embeddingModel,
      chunkStrategy: this.ragConfig.chunkStrategy
    };
  }
  /**
   * Search content in vector database
   */
  async searchContent(input) {
    if (!input.query) {
      throw new Error('Search operation requires "query" in input');
    }
    return {
      results: [],
      count: 0,
      reranked: this.ragConfig.rerank
    };
  }
  /**
   * Generate embeddings using Cloudflare AI
   */
  async generateEmbeddings(chunks) {
    return chunks.map(() => Array(384).fill(0));
  }
  /**
   * Generate a single embedding
   */
  async generateEmbedding(text) {
    return Array(384).fill(0);
  }
  /**
   * Store chunks in Vectorize
   */
  async storeInVectorize(docId, chunks, embeddings, metadata) {
  }
  /**
   * Search Vectorize for similar vectors
   */
  async searchVectorize(queryEmbedding, filter) {
    return [];
  }
  /**
   * Rerank search results
   */
  async rerank(query, results) {
    return results;
  }
}
export {
  Chunker,
  RAGMember
};
//# sourceMappingURL=index-tyaAgUYE.js.map
