/**
 * Judge Evaluator - LLM-based evaluation
 *
 * Uses an LLM to evaluate content quality based on criteria
 */
import { BaseEvaluator } from './base-evaluator.js';
import type { EvaluationScore, ValidateConfig } from '../types.js';
export declare class JudgeEvaluator extends BaseEvaluator {
    evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
}
//# sourceMappingURL=judge-evaluator.d.ts.map