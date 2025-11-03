/**
 * Judge Evaluator - LLM-based evaluation
 *
 * Uses an LLM to evaluate content quality based on criteria
 */
import { BaseEvaluator } from './base-evaluator';
import type { EvaluationScore, ValidateConfig } from '../types';
export declare class JudgeEvaluator extends BaseEvaluator {
    evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
}
//# sourceMappingURL=judge-evaluator.d.ts.map