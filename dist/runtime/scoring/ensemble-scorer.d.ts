/**
 * Ensemble Scorer
 *
 * Aggregates and tracks quality metrics across ensemble execution.
 */
import type { ScoreHistoryEntry, QualityMetrics, ScoringState, EnsembleScoringConfig } from './types.js';
export declare class EnsembleScorer {
    private readonly config;
    constructor(config: EnsembleScoringConfig);
    /**
     * Calculate overall ensemble score from history
     */
    calculateEnsembleScore(history: ScoreHistoryEntry[], weights?: Record<string, number>): number;
    /**
     * Get latest score for each member
     */
    private getLatestScoresPerMember;
    /**
     * Calculate comprehensive quality metrics
     */
    calculateQualityMetrics(history: ScoreHistoryEntry[]): QualityMetrics;
    /**
     * Aggregate scores by criterion
     */
    private aggregateCriteria;
    /**
     * Update scoring state with new entry
     */
    updateScoringState(state: ScoringState, entry: ScoreHistoryEntry): ScoringState;
    /**
     * Initialize empty scoring state
     */
    initializeScoringState(): ScoringState;
    /**
     * Check if ensemble quality is degrading
     */
    isQualityDegrading(history: ScoreHistoryEntry[], windowSize?: number): boolean;
    /**
     * Get recommendations based on quality metrics
     */
    getRecommendations(metrics: QualityMetrics): string[];
    /**
     * Get score trend (improving, declining, stable)
     */
    getScoreTrend(history: ScoreHistoryEntry[], windowSize?: number): 'improving' | 'declining' | 'stable';
}
//# sourceMappingURL=ensemble-scorer.d.ts.map