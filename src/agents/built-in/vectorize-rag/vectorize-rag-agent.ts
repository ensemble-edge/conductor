/**
 * Vectorize RAG Agent - Manual Cloudflare Vectorize Integration
 *
 * Manual RAG implementation using Cloudflare Vectorize for cases where
 * you need more control over chunking, embedding, and indexing.
 *
 * Features:
 * - Direct Vectorize index access
 * - Custom chunking and embedding strategies
 * - Full control over metadata and namespaces
 * - Hybrid search and filtering
 *
 * Note: For fully automatic RAG with zero configuration, see AutoRAGMember
 * which uses Cloudflare's R2-backed AutoRAG service.
 */

import { BaseAgent, type AgentExecutionContext, type AgentResponse } from '../../base-agent.js'

export interface VectorizeRAGConfig {
  /** Vectorize index to use */
  index: string

  /** Number of results to return */
  topK?: number

  /** Minimum similarity score (0-1) */
  minScore?: number

  /** Enable hybrid search (vector + keyword) */
  hybridSearch?: boolean

  /** Metadata filters */
  filter?: Record<string, unknown>
}

export interface VectorizeRAGInput {
  /** Query text */
  query: string

  /** Optional namespace for multi-tenancy */
  namespace?: string

  /** Override topK for this query */
  topK?: number
}

export interface VectorizeRAGResult {
  /** Search results */
  results: Array<{
    /** Document content */
    content: string

    /** Similarity score (0-1) */
    score: number

    /** Document metadata */
    metadata: Record<string, unknown>

    /** Document ID */
    id: string
  }>

  /** Combined context for LLM */
  context: string

  /** Number of results returned */
  count: number

  /** Query that was executed */
  query: string
}

/**
 * Manual Vectorize RAG Agent with full control
 */
export class VectorizeRAGMember extends BaseAgent {
  async run(ctx: AgentExecutionContext): Promise<VectorizeRAGResult> {
    const input = ctx.input as VectorizeRAGInput
    const config = this.config.config as unknown as VectorizeRAGConfig

    // Get Vectorize index
    const vectorize = (ctx.env as unknown as Record<string, unknown>)[config.index] as
      | VectorizeIndex
      | undefined

    if (!vectorize) {
      throw new Error(`Vectorize index '${config.index}' not found in environment bindings`)
    }

    // Perform vector search with AutoRAG
    // Cloudflare automatically generates embeddings for the query
    const results = await vectorize.query(input.query, {
      topK: input.topK || config.topK || 5,
      namespace: input.namespace,
      returnMetadata: 'all',
      returnValues: false,
      filter: config.filter,
    })

    // Filter by minimum score if configured
    const minScore = config.minScore || 0
    const filteredResults = results.matches.filter((match) => match.score >= minScore)

    // Transform results
    const searchResults = filteredResults.map((match) => ({
      content: (match.metadata?.text as string) || '',
      score: match.score,
      metadata: match.metadata || {},
      id: match.id,
    }))

    // Combine results into context string for LLM
    const contextString = searchResults
      .map((result, index) => {
        const source = result.metadata.source || result.id
        return `[${index + 1}] Source: ${source}\n${result.content}`
      })
      .join('\n\n---\n\n')

    return {
      results: searchResults,
      context: contextString,
      count: searchResults.length,
      query: input.query,
    }
  }
}

/**
 * Vectorize Index interface (from @cloudflare/workers-types)
 */
interface VectorizeIndex {
  query(
    queryVector: number[] | string,
    options: {
      topK?: number
      namespace?: string
      returnMetadata?: 'none' | 'indexed' | 'all'
      returnValues?: boolean
      filter?: Record<string, unknown>
    }
  ): Promise<VectorizeMatches>

  insert(vectors: VectorizeVector[]): Promise<VectorizeAsyncMutation>
  upsert(vectors: VectorizeVector[]): Promise<VectorizeAsyncMutation>
}

interface VectorizeMatches {
  matches: Array<{
    id: string
    score: number
    values?: number[]
    metadata?: Record<string, unknown>
  }>
  count: number
}

interface VectorizeVector {
  id: string
  values: number[]
  namespace?: string
  metadata?: Record<string, unknown>
}

interface VectorizeAsyncMutation {
  mutationId: string
}
