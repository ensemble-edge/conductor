/**
 * Rule Evaluator - Custom rule-based validation
 *
 * Executes JavaScript expressions as validation rules
 */
import { BaseEvaluator } from './base-evaluator';
import type { EvaluationScore, ValidateConfig } from '../types';
export declare class RuleEvaluator extends BaseEvaluator {
    evaluate(content: string, config: ValidateConfig): Promise<EvaluationScore>;
    /**
     * Safely evaluate a rule expression
     */
    private evaluateRule;
}
//# sourceMappingURL=rule-evaluator.d.ts.map