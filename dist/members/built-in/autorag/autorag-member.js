/**
 * AutoRAG Member - Cloudflare's Fully Managed RAG Service
 *
 * Uses Cloudflare's AutoRAG service which provides completely automatic
 * RAG with R2 storage integration. Zero manual work required.
 *
 * Cloudflare AutoRAG Features:
 * - Automatic document ingestion from R2 buckets
 * - Automatic chunking with configurable size/overlap
 * - Automatic embedding generation via Workers AI
 * - Automatic indexing in Vectorize
 * - Continuous monitoring and updates
 * - Supports PDFs, images, text, HTML, CSV, and more
 *
 * This is the easiest way to do RAG on Cloudflare - just point to an R2 bucket!
 */
import { BaseMember } from '../../base-member';
/**
 * AutoRAG Member - Dead simple RAG with zero configuration
 */
export class AutoRAGMember extends BaseMember {
    async run(ctx) {
        const input = ctx.input;
        const config = this.config.config;
        // Get AI binding
        const ai = ctx.env.AI;
        if (!ai) {
            throw new Error('AI binding not found in environment. Make sure you have Workers AI configured.');
        }
        // Get AutoRAG instance
        const autorag = ai.autorag(config.instance);
        if (!autorag) {
            throw new Error(`AutoRAG instance '${config.instance}' not found. Check your wrangler.toml configuration.`);
        }
        const mode = config.mode || 'answer';
        const topK = input.topK || config.topK;
        if (mode === 'answer') {
            // Use aiSearch for AI-generated answers
            const result = await autorag.aiSearch({
                query: input.query,
                topK,
            });
            // Transform to our result format
            return {
                answer: result.answer,
                sources: result.sources?.map((source) => ({
                    content: source.content,
                    score: source.score,
                    metadata: source.metadata || {},
                    id: source.id,
                })) || [],
                query: input.query,
            };
        }
        else {
            // Use search for raw results without generation
            const result = await autorag.search({
                query: input.query,
                topK,
            });
            // Transform results
            const searchResults = result.results.map((match) => ({
                content: match.content,
                score: match.score,
                metadata: match.metadata || {},
                id: match.id,
            }));
            // Combine into context string for LLM
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
}
