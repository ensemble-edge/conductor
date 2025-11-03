/**
 * Embedding Evaluator - Semantic similarity using embeddings
 *
 * Uses Cloudflare AI embeddings to calculate semantic similarity
 */
import { BaseEvaluator } from './base-evaluator';
import type { EvaluationScore, ValidateConfig } from '../types';
export declare class EmbeddingEvaluator extends BaseEvaluator {
    evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
    /**
     * Calculate simple text similarity (placeholder for actual embeddings)
     */
    private calculateSimpleTextSimilarity;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
}
//# sourceMappingURL=embedding-evaluator.d.ts.map