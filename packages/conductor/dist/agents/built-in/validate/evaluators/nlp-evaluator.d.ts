/**
 * NLP Evaluator - Statistical NLP metrics
 *
 * Calculates BLEU, ROUGE, and other NLP metrics
 */
import { BaseEvaluator } from './base-evaluator.js';
import type { EvaluationScore, ValidateConfig } from '../types.js';
export declare class NLPEvaluator extends BaseEvaluator {
    evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
    /**
     * Calculate BLEU score (simplified unigram)
     */
    private calculateBLEU;
    /**
     * Calculate ROUGE-L score (longest common subsequence)
     */
    private calculateROUGE;
    /**
     * Calculate length ratio (how close the lengths are)
     */
    private calculateLengthRatio;
    /**
     * Calculate longest common subsequence length
     */
    private longestCommonSubsequence;
}
//# sourceMappingURL=nlp-evaluator.d.ts.map