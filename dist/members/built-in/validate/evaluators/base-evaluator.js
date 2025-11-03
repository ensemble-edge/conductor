/**
 * Base Evaluator - Abstract class for all evaluators
 */
export class BaseEvaluator {
    /**
     * Normalize score to 0-1 range
     */
    normalizeScore(score, min = 0, max = 1) {
        return Math.max(min, Math.min(max, score));
    }
    /**
     * Calculate weighted average of scores
     */
    calculateWeightedAverage(scores, weights) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const [key, score] of Object.entries(scores)) {
            const weight = weights[key] || 1;
            weightedSum += score * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
}
