/**
 * Vectorize RAG Member - Manual Cloudflare Vectorize Integration
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
import { BaseMember } from '../../base-member';
/**
 * Manual Vectorize RAG Member with full control
 */
export class VectorizeRAGMember extends BaseMember {
    async run(ctx) {
        const input = ctx.input;
        const config = this.config.config;
        // Get Vectorize index
        const vectorize = ctx.env[config.index];
        if (!vectorize) {
            throw new Error(`Vectorize index '${config.index}' not found in environment bindings`);
        }
        // Perform vector search with AutoRAG
        // Cloudflare automatically generates embeddings for the query
        const results = await vectorize.query(input.query, {
            topK: input.topK || config.topK || 5,
            namespace: input.namespace,
            returnMetadata: 'all',
            returnValues: false,
            filter: config.filter,
        });
        // Filter by minimum score if configured
        const minScore = config.minScore || 0;
        const filteredResults = results.matches.filter((match) => match.score >= minScore);
        // Transform results
        const searchResults = filteredResults.map((match) => ({
            content: match.metadata?.text || '',
            score: match.score,
            metadata: match.metadata || {},
            id: match.id,
        }));
        // Combine results into context string for LLM
        const contextString = searchResults
            .map((result, index) => {
            const source = result.metadata.source || result.id;
            return `[${index + 1}] Source: ${source}\n${result.content}`;
        })
            .join('\n\n---\n\n');
        return {
            results: searchResults,
            context: contextString,
            count: searchResults.length,
            query: input.query,
        };
    }
}
