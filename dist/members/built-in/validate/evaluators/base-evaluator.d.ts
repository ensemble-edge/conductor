/**
 * Base Evaluator - Abstract class for all evaluators
 */
import type { EvaluationScore, ValidateConfig } from '../types';
export declare abstract class BaseEvaluator {
    /**
     * Evaluate content and return scores
     */
    abstract evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
    /**
     * Normalize score to 0-1 range
     */
    protected normalizeScore(score: number, min?: number, max?: number): number;
    /**
     * Calculate weighted average of scores
     */
    protected calculateWeightedAverage(scores: Record<string, number>, weights: Record<string, number>): number;
}
//# sourceMappingURL=base-evaluator.d.ts.map