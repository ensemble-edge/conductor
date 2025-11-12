/**
 * Scoring System Types
 *
 * Provides quality control and confidence scoring for ensemble execution.
 */
/**
 * Scoring thresholds
 */
export interface ScoringThresholds {
    /**
     * Minimum acceptable score (fail below this)
     */
    minimum: number;
    /**
     * Target score (ideal quality level)
     */
    target?: number;
    /**
     * Excellent score threshold
     */
    excellent?: number;
}
/**
 * Backoff strategy for retries
 */
export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';
/**
 * Action to take on scoring failure
 */
export type ScoringFailureAction = 'retry' | 'continue' | 'abort';
/**
 * Scoring criteria definition
 */
export interface ScoringCriterion {
    /**
     * Criterion name
     */
    name: string;
    /**
     * Description of what this criterion measures
     */
    description: string;
    /**
     * Weight in overall score (0-1)
     */
    weight?: number;
}
/**
 * Ensemble-level scoring configuration
 */
export interface EnsembleScoringConfig {
    /**
     * Enable scoring for this ensemble
     */
    enabled: boolean;
    /**
     * Default thresholds for all agents
     */
    defaultThresholds: ScoringThresholds;
    /**
     * Maximum retry attempts
     */
    maxRetries?: number;
    /**
     * Backoff strategy
     */
    backoffStrategy?: BackoffStrategy;
    /**
     * Initial backoff delay (ms)
     */
    initialBackoff?: number;
    /**
     * Track scoring metrics in state
     */
    trackInState?: boolean;
    /**
     * Global scoring criteria
     */
    criteria?: Record<string, string> | ScoringCriterion[];
    /**
     * Aggregation method for multi-criteria scores
     */
    aggregation?: 'weighted_average' | 'minimum' | 'geometric_mean';
}
/**
 * Agent-level scoring configuration
 */
export interface AgentScoringConfig {
    /**
     * Evaluator agent to use for scoring
     */
    evaluator: string;
    /**
     * Scoring thresholds (overrides ensemble defaults)
     */
    thresholds?: ScoringThresholds;
    /**
     * Criteria for this agent
     */
    criteria?: Record<string, string> | ScoringCriterion[];
    /**
     * Action on scoring failure
     */
    onFailure?: ScoringFailureAction;
    /**
     * Retry limit for this agent
     */
    retryLimit?: number;
    /**
     * Require improvement on each retry
     */
    requireImprovement?: boolean;
    /**
     * Minimum improvement required (0-1)
     */
    minImprovement?: number;
}
/**
 * Score breakdown by criterion
 */
export interface ScoreBreakdown {
    [criterion: string]: number;
}
/**
 * Scoring result from evaluator
 */
export interface ScoringResult {
    /**
     * Overall score (0-1)
     */
    score: number;
    /**
     * Score breakdown by criterion
     */
    breakdown?: ScoreBreakdown;
    /**
     * Feedback for improvement
     */
    feedback?: string;
    /**
     * Whether score meets threshold
     */
    passed: boolean;
    /**
     * Confidence in the score
     */
    confidence?: number;
    /**
     * Reasoning for the score
     */
    reasoning?: string;
}
/**
 * Execution result with scoring
 */
export interface ScoredExecutionResult<T = any> {
    /**
     * Agent output
     */
    output: T;
    /**
     * Scoring result
     */
    score: ScoringResult;
    /**
     * Number of attempts
     */
    attempts: number;
    /**
     * Execution status
     */
    status: 'passed' | 'below_threshold' | 'max_retries_exceeded' | 'failed';
    /**
     * Execution time (ms)
     */
    executionTime: number;
}
/**
 * Score history entry
 */
export interface ScoreHistoryEntry {
    /**
     * Agent that was scored
     */
    agent: string;
    /**
     * Score
     */
    score: number;
    /**
     * Score breakdown
     */
    breakdown?: ScoreBreakdown;
    /**
     * Timestamp
     */
    timestamp: number;
    /**
     * Attempt number
     */
    attempt: number;
    /**
     * Feedback
     */
    feedback?: string;
    /**
     * Passed threshold
     */
    passed: boolean;
}
/**
 * Quality metrics for ensemble
 */
export interface QualityMetrics {
    /**
     * Overall ensemble score
     */
    ensembleScore: number;
    /**
     * Average score across all evaluations
     */
    averageScore: number;
    /**
     * Minimum score encountered
     */
    minScore: number;
    /**
     * Maximum score achieved
     */
    maxScore: number;
    /**
     * Total number of evaluations
     */
    totalEvaluations: number;
    /**
     * Pass rate (0-1)
     */
    passRate: number;
    /**
     * Criteria breakdown
     */
    criteriaBreakdown?: {
        [criterion: string]: {
            scores: number[];
            average: number;
            passRate: number;
        };
    };
    /**
     * Total retries
     */
    totalRetries: number;
    /**
     * Average attempts per agent
     */
    averageAttempts: number;
}
/**
 * Scoring state (stored in ensemble state)
 */
export interface ScoringState {
    /**
     * Score history for all agents
     */
    scoreHistory: ScoreHistoryEntry[];
    /**
     * Final ensemble score
     */
    finalScore?: number;
    /**
     * Retry count per agent
     */
    retryCount: Record<string, number>;
    /**
     * Quality metrics
     */
    qualityMetrics?: QualityMetrics;
}
/**
 * Scoring telemetry event
 */
export interface ScoringTelemetryEvent {
    /**
     * Ensemble name
     */
    ensemble: string;
    /**
     * Agent name
     */
    agent: string;
    /**
     * Score
     */
    score: number;
    /**
     * Breakdown
     */
    breakdown?: ScoreBreakdown;
    /**
     * Passed threshold
     */
    passed: boolean;
    /**
     * Number of attempts
     */
    attempts: number;
    /**
     * Retry reason
     */
    retryReason?: string;
    /**
     * Execution time (ms)
     */
    executionTime: number;
    /**
     * Score range category
     */
    scoreRange: 'excellent' | 'good' | 'acceptable' | 'poor';
    /**
     * Failed criteria
     */
    criteriaFailures?: string[];
    /**
     * Improvement delta from previous attempt
     */
    improvementDelta?: number;
    /**
     * Previous score
     */
    previousScore?: number;
}
//# sourceMappingURL=types.d.ts.map