/**
 * RAG Agent - Retrieval-Augmented Generation
 *
 * Uses Cloudflare Vectorize and AI embeddings for semantic search
 *
 * Operations:
 * - index: Store content in vector database
 * - search: Find relevant content using semantic search
 */
import { BaseAgent } from '../../base-agent.js';
import { Chunker } from './chunker.js';
import { createLogger } from '../../../observability/index.js';
const logger = createLogger({ serviceName: 'rag-agent' });
export class RAGMember extends BaseAgent {
    constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
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
        };
        this.chunker = new Chunker();
    }
    async run(context) {
        const input = context.input;
        const operation = this.ragConfig.operation;
        switch (operation) {
            case 'index':
                return await this.indexContent(input);
            case 'search':
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
        // Check required bindings
        if (!this.env.AI) {
            throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml');
        }
        if (!this.env.VECTORIZE) {
            throw new Error('RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml');
        }
        // 1. Chunk content
        const chunks = this.chunker.chunk(input.content, this.ragConfig.chunkStrategy, this.ragConfig.chunkSize, this.ragConfig.overlap);
        logger.debug('Chunked content', { docId: input.id, chunkCount: chunks.length });
        // 2. Generate embeddings using Cloudflare AI
        const embeddings = await this.generateEmbeddings(chunks);
        // 3. Store in Vectorize
        await this.storeInVectorize(input.id, chunks, embeddings, input.metadata);
        logger.info('Indexed document', {
            docId: input.id,
            chunks: chunks.length,
            model: this.ragConfig.embeddingModel,
        });
        return {
            indexed: chunks.length,
            chunks: chunks.length,
            embeddingModel: this.ragConfig.embeddingModel,
            chunkStrategy: this.ragConfig.chunkStrategy,
        };
    }
    /**
     * Search content in vector database
     */
    async searchContent(input) {
        if (!input.query) {
            throw new Error('Search operation requires "query" in input');
        }
        // Check required bindings
        if (!this.env.AI) {
            throw new Error('RAG agent requires AI binding. Add [ai] binding = "AI" to wrangler.toml');
        }
        if (!this.env.VECTORIZE) {
            throw new Error('RAG agent requires VECTORIZE binding. Add [[vectorize]] binding = "VECTORIZE" to wrangler.toml');
        }
        // 1. Generate query embedding
        const queryEmbedding = await this.generateEmbedding(input.query);
        // 2. Search Vectorize
        let results = await this.searchVectorize(queryEmbedding, input.filter, input.topK ?? this.ragConfig.topK);
        // 3. Rerank if configured
        const shouldRerank = input.rerank ?? this.ragConfig.rerank;
        if (shouldRerank && results.length > 0) {
            results = await this.rerank(input.query, results);
        }
        logger.debug('Search completed', {
            query: input.query.slice(0, 50),
            resultCount: results.length,
            reranked: shouldRerank,
        });
        return {
            results,
            count: results.length,
            reranked: shouldRerank,
        };
    }
    /**
     * Generate embeddings using Cloudflare AI
     */
    async generateEmbeddings(chunks) {
        const texts = chunks.map((c) => c.text);
        // Cloudflare AI supports batching up to 100 texts
        const batchSize = 100;
        const allEmbeddings = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const response = (await this.env.AI.run(this.ragConfig.embeddingModel, {
                text: batch,
                pooling: 'cls', // Use CLS pooling for better accuracy on longer texts
            }));
            if (!response.data) {
                throw new Error('Failed to generate embeddings: no data returned from AI');
            }
            allEmbeddings.push(...response.data);
        }
        return allEmbeddings;
    }
    /**
     * Generate a single embedding
     */
    async generateEmbedding(text) {
        const response = (await this.env.AI.run(this.ragConfig.embeddingModel, {
            text: [text],
            pooling: 'cls',
        }));
        if (!response.data || response.data.length === 0) {
            throw new Error('Failed to generate embedding: no data returned from AI');
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
                ...metadata,
            },
        }));
        // Vectorize supports batching up to 1000 vectors
        const batchSize = 1000;
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
            filter: filter,
            returnValues: false, // Don't need embeddings back
            returnMetadata: 'all', // Get full metadata including content
        });
        // Transform Vectorize results to our format
        return results.matches.map((match) => ({
            id: match.id,
            score: match.score,
            content: match.metadata?.content || '',
            metadata: match.metadata || {},
        }));
    }
    /**
     * Rerank search results using cross-encoder model
     */
    async rerank(query, results) {
        if (results.length === 0) {
            return results;
        }
        // Prepare contexts for reranker
        const contexts = results.map((r) => ({
            text: r.content,
        }));
        // Call the reranker model
        const response = (await this.env.AI.run(this.ragConfig.rerankModel, {
            query,
            contexts,
            top_k: results.length, // Rerank all results
        }));
        if (!response.response || response.response.length === 0) {
            logger.warn('Reranker returned no results, using original order');
            return results;
        }
        // Reorder results based on reranker scores
        const rerankedResults = [];
        for (const item of response.response) {
            if (item.id !== undefined && item.score !== undefined) {
                const originalResult = results[item.id];
                if (originalResult) {
                    rerankedResults.push({
                        ...originalResult,
                        score: item.score, // Use reranker score
                    });
                }
            }
        }
        return rerankedResults;
    }
}
