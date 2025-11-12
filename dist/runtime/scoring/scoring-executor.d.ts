/**
 * Scoring Executor
 *
 * Handles agent execution with scoring, retry logic, and backoff strategies.
 */
import type { AgentScoringConfig, ScoringResult, ScoredExecutionResult, ScoreBreakdown } from './types.js';
export declare class ScoringExecutor {
    /**
     * Execute a agent with scoring and retry logic
     */
    executeWithScoring<T = any>(executeAgent: () => Promise<T>, evaluateOutput: (output: T, attempt: number, previousScore?: ScoringResult) => Promise<ScoringResult>, config: AgentScoringConfig): Promise<ScoredExecutionResult<T>>;
    /**
     * Apply backoff delay
     */
    private applyBackoff;
    /**
     * Calculate next backoff delay
     */
    private calculateNextBackoff;
    /**
     * Calculate composite score from breakdown
     */
    calculateCompositeScore(breakdown: ScoreBreakdown, weights?: Record<string, number>): number;
    /**
     * Check if score meets threshold
     */
    checkThreshold(score: number, threshold: number): boolean;
    /**
     * Get score range category
     */
    getScoreRange(score: number): 'excellent' | 'good' | 'acceptable' | 'poor';
    /**
     * Get failed criteria from breakdown
     */
    getFailedCriteria(breakdown: ScoreBreakdown, threshold: number): string[];
}
//# sourceMappingURL=scoring-executor.d.ts.map