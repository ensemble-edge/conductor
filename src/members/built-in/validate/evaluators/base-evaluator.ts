/**
 * Base Evaluator - Abstract class for all evaluators
 */

import type { EvaluationScore, ValidateConfig } from '../types'

export abstract class BaseEvaluator {
  /**
   * Evaluate content and return scores
   */
  abstract evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>

  /**
   * Normalize score to 0-1 range
   */
  protected normalizeScore(score: number, min: number = 0, max: number = 1): number {
    return Math.max(min, Math.min(max, score))
  }

  /**
   * Calculate weighted average of scores
   */
  protected calculateWeightedAverage(
    scores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let totalWeight = 0
    let weightedSum = 0

    for (const [key, score] of Object.entries(scores)) {
      const weight = weights[key] || 1
      weightedSum += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }
}
