/**
 * RAG Agent - Retrieval-Augmented Generation
 *
 * Uses Cloudflare Vectorize and AI embeddings for semantic search
 *
 * Operations:
 * - index: Store content in vector database
 * - search: Find relevant content using semantic search
 */

import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import type {
  RAGConfig,
  RAGInput,
  RAGIndexInput,
  RAGSearchInput,
  RAGResult,
  RAGIndexResult,
  RAGSearchResult,
  RAGSearchResultItem,
} from './types.js'
import { Chunker } from './chunker.js'
import type { ConductorEnv } from '../../../types/env.js'
import { createLogger } from '../../../observability/index.js'

const logger = createLogger({ serviceName: 'rag-agent' })

/**
 * Embedding model response from Cloudflare AI
 */
interface EmbeddingResponse {
  shape?: number[]
  data?: number[][]
  pooling?: 'mean' | 'cls'
}

/**
 * Reranker response from Cloudflare AI
 */
interface RerankerResponse {
  response?: Array<{
    id?: number
    score?: number
  }>
}

export class RAGMember extends BaseAgent {
  private ragConfig: RAGConfig
  private chunker: Chunker

  constructor(
    config: AgentConfig,
    private readonly env: ConductorEnv
  ) {
    super(config)

    const cfg = config.config as RAGConfig | undefined

    this.ragConfig = {
      operation: cfg?.operation || 'search',
      chunkStrategy: cfg?.chunkStrategy || 'semantic',
      chunkSize: cfg?.chunkSize || 512,
      overlap: cfg?.overlap || 50,
      embeddingModel: cfg?.embeddingModel || '@cf/baai/bge-base-en-v1.5',
      topK: cfg?.topK || 5,
      rerank: cfg?.rerank || false,
      rerankModel: cfg?.rerankModel || '@cf/baai/bge-reranker-base',
      namespace: cfg?.namespace,
    }

    this.chunker = new Chunker()
  }

  protected async run(context: AgentExecutionContext): Promise<RAGResult> {
    const input = context.input as RAGInput
    const operation = this.ragConfig.operation!

    switch (operation) {
      case 'index':
        return await this.indexContent(input as RAGIndexInput)
      case 'search':
        return await this.searchContent(input as RAGSearchInput)
      default:
        throw new Error(`Unknown RAG operation: ${operation}`)
    }
  }

  /**
   * Index content into vector database
   */
  private async indexContent(input: RAGIndexInput): Promise<RAGIndexResult> {
    if (!input.content) {
      throw new Error('Index operation requires "content" in input')
    }

    if (!input.id) {
      throw new Error('Index operation requires "id" in input')
    }

    // Check required bindings
    if (!this.env.AI) {
      throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml')
    }

    if (!this.env.VECTORIZE) {
      throw new Error(
        'RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml'
      )
    }

    // 1. Chunk content
    const chunks = this.chunker.chunk(
      input.content,
      this.ragConfig.chunkStrategy!,
      this.ragConfig.chunkSize!,
      this.ragConfig.overlap!
    )

    logger.debug('Chunked content', { docId: input.id, chunkCount: chunks.length })

    // 2. Generate embeddings using Cloudflare AI
    const embeddings = await this.generateEmbeddings(chunks)

    // 3. Store in Vectorize
    await this.storeInVectorize(input.id, chunks, embeddings, input.metadata)

    logger.info('Indexed document', {
      docId: input.id,
      chunks: chunks.length,
      model: this.ragConfig.embeddingModel,
    })

    return {
      indexed: chunks.length,
      chunks: chunks.length,
      embeddingModel: this.ragConfig.embeddingModel!,
      chunkStrategy: this.ragConfig.chunkStrategy!,
    }
  }

  /**
   * Search content in vector database
   */
  private async searchContent(input: RAGSearchInput): Promise<RAGSearchResult> {
    if (!input.query) {
      throw new Error('Search operation requires "query" in input')
    }

    // Check required bindings
    if (!this.env.AI) {
      throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml')
    }

    if (!this.env.VECTORIZE) {
      throw new Error(
        'RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml'
      )
    }

    // 1. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(input.query)

    // 2. Search Vectorize
    let results = await this.searchVectorize(
      queryEmbedding,
      input.filter,
      input.topK ?? this.ragConfig.topK
    )

    // 3. Rerank if configured
    const shouldRerank = input.rerank ?? this.ragConfig.rerank
    if (shouldRerank && results.length > 0) {
      results = await this.rerank(input.query, results)
    }

    logger.debug('Search completed', {
      query: input.query.slice(0, 50),
      resultCount: results.length,
      reranked: shouldRerank,
    })

    return {
      results,
      count: results.length,
      reranked: shouldRerank!,
    }
  }

  /**
   * Generate embeddings using Cloudflare AI
   */
  private async generateEmbeddings(chunks: Array<{ text: string }>): Promise<number[][]> {
    const texts = chunks.map((c) => c.text)

    // Cloudflare AI supports batching up to 100 texts
    const batchSize = 100
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      const response = (await this.env.AI.run(this.ragConfig.embeddingModel!, {
        text: batch,
        pooling: 'cls', // Use CLS pooling for better accuracy on longer texts
      })) as EmbeddingResponse

      if (!response.data) {
        throw new Error('Failed to generate embeddings: no data returned from AI')
      }

      allEmbeddings.push(...response.data)
    }

    return allEmbeddings
  }

  /**
   * Generate a single embedding
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = (await this.env.AI.run(this.ragConfig.embeddingModel!, {
      text: [text],
      pooling: 'cls',
    })) as EmbeddingResponse

    if (!response.data || response.data.length === 0) {
      throw new Error('Failed to generate embedding: no data returned from AI')
    }

    return response.data[0]
  }

  /**
   * Store chunks in Vectorize
   */
  private async storeInVectorize(
    docId: string,
    chunks: Array<{ text: string; index: number }>,
    embeddings: number[][],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const vectors = chunks.map((chunk, i) => ({
      id: `${docId}-chunk-${chunk.index}`,
      values: embeddings[i],
      namespace: this.ragConfig.namespace,
      metadata: {
        content: chunk.text,
        docId,
        chunkIndex: chunk.index,
        ...metadata,
      },
    }))

    // Vectorize supports batching up to 1000 vectors
    const batchSize = 1000
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      await this.env.VECTORIZE!.upsert(batch)
    }
  }

  /**
   * Search Vectorize for similar vectors
   */
  private async searchVectorize(
    queryEmbedding: number[],
    filter?: Record<string, unknown>,
    topK?: number
  ): Promise<RAGSearchResultItem[]> {
    const results = await this.env.VECTORIZE!.query(queryEmbedding, {
      topK: topK ?? this.ragConfig.topK!,
      namespace: this.ragConfig.namespace,
      filter: filter as VectorizeVectorMetadataFilter | undefined,
      returnValues: false, // Don't need embeddings back
      returnMetadata: 'all', // Get full metadata including content
    })

    // Transform Vectorize results to our format
    return results.matches.map((match) => ({
      id: match.id,
      score: match.score,
      content: (match.metadata?.content as string) || '',
      metadata: match.metadata || {},
    }))
  }

  /**
   * Rerank search results using cross-encoder model
   */
  private async rerank(
    query: string,
    results: RAGSearchResultItem[]
  ): Promise<RAGSearchResultItem[]> {
    if (results.length === 0) {
      return results
    }

    // Prepare contexts for reranker
    const contexts = results.map((r) => ({
      text: r.content,
    }))

    // Call the reranker model
    const response = (await this.env.AI.run(this.ragConfig.rerankModel!, {
      query,
      contexts,
      top_k: results.length, // Rerank all results
    })) as RerankerResponse

    if (!response.response || response.response.length === 0) {
      logger.warn('Reranker returned no results, using original order')
      return results
    }

    // Reorder results based on reranker scores
    const rerankedResults: RAGSearchResultItem[] = []
    for (const item of response.response) {
      if (item.id !== undefined && item.score !== undefined) {
        const originalResult = results[item.id]
        if (originalResult) {
          rerankedResults.push({
            ...originalResult,
            score: item.score, // Use reranker score
          })
        }
      }
    }

    return rerankedResults
  }
}
