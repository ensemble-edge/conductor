/**
 * Validate Member - Validation and Evaluation Framework
 *
 * Pluggable evaluators:
 * - Rule: Custom rule-based validation
 * - Judge: LLM-based quality assessment
 * - NLP: Statistical NLP metrics (BLEU, ROUGE)
 * - Embedding: Semantic similarity via embeddings
 */

import { BaseMember, type MemberExecutionContext } from '../../base-member';
import type { MemberConfig } from '../../../runtime/parser';
import type { ValidateConfig, ValidateInput, ValidationResult, EvalType } from './types';
import { BaseEvaluator } from './evaluators/base-evaluator';
import { RuleEvaluator } from './evaluators/rule-evaluator';
import { JudgeEvaluator } from './evaluators/judge-evaluator';
import { NLPEvaluator } from './evaluators/nlp-evaluator';
import { EmbeddingEvaluator } from './evaluators/embedding-evaluator';

export class ValidateMember extends BaseMember {
	private validateConfig: ValidateConfig;

	constructor(config: MemberConfig, private readonly env: Env) {
		super(config);

		const cfg = config.config as ValidateConfig | undefined;

		this.validateConfig = {
			evalType: cfg?.evalType || 'rule',
			threshold: cfg?.threshold !== undefined ? cfg.threshold : 0.7,
			rules: cfg?.rules,
			criteria: cfg?.criteria,
			metrics: cfg?.metrics,
			reference: cfg?.reference,
			model: cfg?.model
		};
	}

	protected async run(context: MemberExecutionContext): Promise<ValidationResult> {
		const input = context.input as ValidateInput;

		if (!input.content) {
			throw new Error('Validate member requires "content" in input');
		}

		const evalType = this.validateConfig.evalType!;
		const evaluator = this.getEvaluator(evalType);

		// Merge config with input reference if provided
		const evalConfig = {
			...this.validateConfig,
			reference: input.reference || this.validateConfig.reference
		};

		// Evaluate
		const scores = await evaluator.evaluate(input.content, evalConfig);

		// Check if passed threshold
		const threshold = this.validateConfig.threshold!;
		const passed = scores.average >= threshold;

		return {
			passed,
			score: scores.average,
			scores: scores.breakdown,
			details: scores.details || {},
			evalType
		};
	}

	/**
	 * Get the appropriate evaluator based on type
	 */
	private getEvaluator(type: EvalType): BaseEvaluator {
		switch (type) {
			case 'rule':
				return new RuleEvaluator();
			case 'judge':
				return new JudgeEvaluator();
			case 'nlp':
				return new NLPEvaluator();
			case 'embedding':
				return new EmbeddingEvaluator();
			default:
				throw new Error(`Unknown evaluator type: ${type}`);
		}
	}
}
