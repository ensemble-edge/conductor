import { B as BaseAgent, c as createLogger } from "./worker-entry-CSZwFgwd.js";
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
const logger = createLogger({ serviceName: "rag-agent" });
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
      rerankModel: cfg?.rerankModel || "@cf/baai/bge-reranker-base",
      namespace: cfg?.namespace
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
    if (!this.env.AI) {
      throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml');
    }
    if (!this.env.VECTORIZE) {
      throw new Error(
        'RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml'
      );
    }
    const chunks = this.chunker.chunk(
      input.content,
      this.ragConfig.chunkStrategy,
      this.ragConfig.chunkSize,
      this.ragConfig.overlap
    );
    logger.debug("Chunked content", { docId: input.id, chunkCount: chunks.length });
    const embeddings = await this.generateEmbeddings(chunks);
    await this.storeInVectorize(input.id, chunks, embeddings, input.metadata);
    logger.info("Indexed document", {
      docId: input.id,
      chunks: chunks.length,
      model: this.ragConfig.embeddingModel
    });
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
    if (!this.env.AI) {
      throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml');
    }
    if (!this.env.VECTORIZE) {
      throw new Error(
        'RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml'
      );
    }
    const queryEmbedding = await this.generateEmbedding(input.query);
    let results = await this.searchVectorize(
      queryEmbedding,
      input.filter,
      input.topK ?? this.ragConfig.topK
    );
    const shouldRerank = input.rerank ?? this.ragConfig.rerank;
    if (shouldRerank && results.length > 0) {
      results = await this.rerank(input.query, results);
    }
    logger.debug("Search completed", {
      query: input.query.slice(0, 50),
      resultCount: results.length,
      reranked: shouldRerank
    });
    return {
      results,
      count: results.length,
      reranked: shouldRerank
    };
  }
  /**
   * Generate embeddings using Cloudflare AI
   */
  async generateEmbeddings(chunks) {
    const texts = chunks.map((c) => c.text);
    const batchSize = 100;
    const allEmbeddings = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.env.AI.run(this.ragConfig.embeddingModel, {
        text: batch,
        pooling: "cls"
        // Use CLS pooling for better accuracy on longer texts
      });
      if (!response.data) {
        throw new Error("Failed to generate embeddings: no data returned from AI");
      }
      allEmbeddings.push(...response.data);
    }
    return allEmbeddings;
  }
  /**
   * Generate a single embedding
   */
  async generateEmbedding(text) {
    const response = await this.env.AI.run(this.ragConfig.embeddingModel, {
      text: [text],
      pooling: "cls"
    });
    if (!response.data || response.data.length === 0) {
      throw new Error("Failed to generate embedding: no data returned from AI");
    }
    return response.data[0];
  }
  /**
   * Store chunks in Vectorize
   */
  async storeInVectorize(docId, chunks, embeddings, metadata) {
    const vectors = chunks.map((chunk, i) => ({
      id: `${docId}-chunk-${chunk.index}`,
      values: embeddings[i],
      namespace: this.ragConfig.namespace,
      metadata: {
        content: chunk.text,
        docId,
        chunkIndex: chunk.index,
        ...metadata
      }
    }));
    const batchSize = 1e3;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.env.VECTORIZE.upsert(batch);
    }
  }
  /**
   * Search Vectorize for similar vectors
   */
  async searchVectorize(queryEmbedding, filter, topK) {
    const results = await this.env.VECTORIZE.query(queryEmbedding, {
      topK: topK ?? this.ragConfig.topK,
      namespace: this.ragConfig.namespace,
      filter,
      returnValues: false,
      // Don't need embeddings back
      returnMetadata: "all"
      // Get full metadata including content
    });
    return results.matches.map((match) => ({
      id: match.id,
      score: match.score,
      content: match.metadata?.content || "",
      metadata: match.metadata || {}
    }));
  }
  /**
   * Rerank search results using cross-encoder model
   */
  async rerank(query, results) {
    if (results.length === 0) {
      return results;
    }
    const contexts = results.map((r) => ({
      text: r.content
    }));
    const response = await this.env.AI.run(this.ragConfig.rerankModel, {
      query,
      contexts,
      top_k: results.length
      // Rerank all results
    });
    if (!response.response || response.response.length === 0) {
      logger.warn("Reranker returned no results, using original order");
      return results;
    }
    const rerankedResults = [];
    for (const item of response.response) {
      if (item.id !== void 0 && item.score !== void 0) {
        const originalResult = results[item.id];
        if (originalResult) {
          rerankedResults.push({
            ...originalResult,
            score: item.score
            // Use reranker score
          });
        }
      }
    }
    return rerankedResults;
  }
}
export {
  Chunker,
  RAGMember
};
//# sourceMappingURL=index-CfQrJyuC.js.map
