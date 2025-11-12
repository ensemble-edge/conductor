/**
 * Validate Member - Validation and Evaluation Framework
 *
 * Pluggable evaluators:
 * - Rule: Custom rule-based validation
 * - Judge: LLM-based quality assessment
 * - NLP: Statistical NLP metrics (BLEU, ROUGE)
 * - Embedding: Semantic similarity via embeddings
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member.js';
import type { MemberConfig } from '../../../runtime/parser.js';
import type { ValidationResult } from './types.js';
export declare class ValidateMember extends BaseMember {
    private readonly env;
    private validateConfig;
    constructor(config: MemberConfig, env: Env);
    protected run(context: MemberExecutionContext): Promise<ValidationResult>;
    /**
     * Get the appropriate evaluator based on type
     */
    private getEvaluator;
}
//# sourceMappingURL=validate-member.d.ts.map