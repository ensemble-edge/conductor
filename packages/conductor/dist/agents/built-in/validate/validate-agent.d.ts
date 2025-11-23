/**
 * Validate Agent - Validation and Evaluation Framework
 *
 * Pluggable evaluators:
 * - Rule: Custom rule-based validation
 * - Judge: LLM-based quality assessment
 * - NLP: Statistical NLP metrics (BLEU, ROUGE)
 * - Embedding: Semantic similarity via embeddings
 */
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { ValidationResult } from './types.js';
export declare class ValidateMember extends BaseAgent {
    private readonly env;
    private validateConfig;
    constructor(config: AgentConfig, env: Env);
    protected run(context: AgentExecutionContext): Promise<ValidationResult>;
    /**
     * Get the appropriate evaluator based on type
     */
    private getEvaluator;
}
//# sourceMappingURL=validate-agent.d.ts.map