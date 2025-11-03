/**
 * Ensemble Scorer
 *
 * Aggregates and tracks quality metrics across ensemble execution.
 */

import type {
	ScoreHistoryEntry,
	QualityMetrics,
	ScoringState,
	ScoreBreakdown,
	EnsembleScoringConfig
} from './types.js';

export class EnsembleScorer {
	constructor(private readonly config: EnsembleScoringConfig) {}

	/**
	 * Calculate overall ensemble score from history
	 */
	calculateEnsembleScore(history: ScoreHistoryEntry[], weights?: Record<string, number>): number {
		if (!history.length) {
			return 0;
		}

		if (!weights) {
			// Simple average of latest scores per member
			const latestScores = this.getLatestScoresPerMember(history);
			const sum = Array.from(latestScores.values()).reduce((acc, score) => acc + score, 0);
			return sum / latestScores.size;
		}

		// Weighted average
		const latestScores = this.getLatestScoresPerMember(history);
		let weightedSum = 0;
		let totalWeight = 0;

		for (const [member, score] of latestScores.entries()) {
			const weight = weights[member] || 1;
			weightedSum += score * weight;
			totalWeight += weight;
		}

		return totalWeight > 0 ? weightedSum / totalWeight : 0;
	}

	/**
	 * Get latest score for each member
	 */
	private getLatestScoresPerMember(history: ScoreHistoryEntry[]): Map<string, number> {
		const scores = new Map<string, number>();

		// Process in order, later entries overwrite earlier ones
		for (const entry of history) {
			if (entry.passed) {
				// Only use passing scores
				scores.set(entry.member, entry.score);
			}
		}

		return scores;
	}

	/**
	 * Calculate comprehensive quality metrics
	 */
	calculateQualityMetrics(history: ScoreHistoryEntry[]): QualityMetrics {
		if (!history.length) {
			return {
				ensembleScore: 0,
				averageScore: 0,
				minScore: 0,
				maxScore: 0,
				totalEvaluations: 0,
				passRate: 0,
				totalRetries: 0,
				averageAttempts: 0
			};
		}

		const scores = history.map(e => e.score);
		const attempts = history.map(e => e.attempt);

		const ensembleScore = this.calculateEnsembleScore(history);
		const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
		const minScore = Math.min(...scores);
		const maxScore = Math.max(...scores);
		const passRate = history.filter(e => e.passed).length / history.length;
		const totalRetries = attempts.filter(a => a > 1).length;
		const averageAttempts = attempts.reduce((a, b) => a + b, 0) / attempts.length;

		const criteriaBreakdown = this.aggregateCriteria(history);

		return {
			ensembleScore,
			averageScore,
			minScore,
			maxScore,
			totalEvaluations: history.length,
			passRate,
			criteriaBreakdown,
			totalRetries,
			averageAttempts
		};
	}

	/**
	 * Aggregate scores by criterion
	 */
	private aggregateCriteria(
		history: ScoreHistoryEntry[]
	): QualityMetrics['criteriaBreakdown'] {
		const criteria: Record<
			string,
			{
				scores: number[];
				average: number;
				passRate: number;
			}
		> = {};

		// Collect scores per criterion
		for (const entry of history) {
			if (entry.breakdown) {
				for (const [criterion, score] of Object.entries(entry.breakdown)) {
					if (!criteria[criterion]) {
						criteria[criterion] = { scores: [], average: 0, passRate: 0 };
					}
					criteria[criterion].scores.push(score);
				}
			}
		}

		// Calculate averages and pass rates
		const threshold = this.config.defaultThresholds.minimum;

		for (const criterion of Object.keys(criteria)) {
			const scores = criteria[criterion].scores;
			criteria[criterion].average = scores.reduce((a, b) => a + b, 0) / scores.length;
			criteria[criterion].passRate =
				scores.filter(s => s >= threshold).length / scores.length;
		}

		return criteria;
	}

	/**
	 * Update scoring state with new entry
	 */
	updateScoringState(state: ScoringState, entry: ScoreHistoryEntry): ScoringState {
		const newHistory = [...state.scoreHistory, entry];

		// Update retry count
		const retryCount = { ...state.retryCount };
		if (entry.attempt > 1) {
			retryCount[entry.member] = (retryCount[entry.member] || 0) + 1;
		}

		// Calculate metrics
		const qualityMetrics = this.calculateQualityMetrics(newHistory);
		const finalScore = qualityMetrics.ensembleScore;

		return {
			scoreHistory: newHistory,
			finalScore,
			retryCount,
			qualityMetrics
		};
	}

	/**
	 * Initialize empty scoring state
	 */
	initializeScoringState(): ScoringState {
		return {
			scoreHistory: [],
			finalScore: undefined,
			retryCount: {},
			qualityMetrics: undefined
		};
	}

	/**
	 * Check if ensemble quality is degrading
	 */
	isQualityDegrading(history: ScoreHistoryEntry[], windowSize: number = 5): boolean {
		if (history.length < windowSize * 2) {
			return false;
		}

		// Compare recent scores to older scores
		const recentScores = history.slice(-windowSize).map(e => e.score);
		const olderScores = history.slice(-windowSize * 2, -windowSize).map(e => e.score);

		const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
		const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

		// Degrading if recent average is significantly lower
		const degradationThreshold = 0.1; // 10% drop
		return recentAvg < olderAvg - degradationThreshold;
	}

	/**
	 * Get recommendations based on quality metrics
	 */
	getRecommendations(metrics: QualityMetrics): string[] {
		const recommendations: string[] = [];

		// Low overall score
		if (metrics.ensembleScore < 0.7) {
			recommendations.push(
				'Overall ensemble score is low. Review member configurations and criteria.'
			);
		}

		// High retry rate
		if (metrics.totalRetries > metrics.totalEvaluations * 0.5) {
			recommendations.push(
				'High retry rate detected. Consider adjusting thresholds or improving member quality.'
			);
		}

		// Low pass rate
		if (metrics.passRate < 0.8) {
			recommendations.push(
				`Pass rate is ${(metrics.passRate * 100).toFixed(0)}%. Review failing criteria.`
			);
		}

		// Specific criteria failures
		if (metrics.criteriaBreakdown) {
			for (const [criterion, data] of Object.entries(metrics.criteriaBreakdown)) {
				if (data.passRate < 0.7) {
					recommendations.push(
						`Criterion '${criterion}' has low pass rate (${(data.passRate * 100).toFixed(0)}%). Focus improvement efforts here.`
					);
				}
			}
		}

		return recommendations;
	}

	/**
	 * Get score trend (improving, declining, stable)
	 */
	getScoreTrend(
		history: ScoreHistoryEntry[],
		windowSize: number = 5
	): 'improving' | 'declining' | 'stable' {
		if (history.length < windowSize * 2) {
			return 'stable';
		}

		const recentScores = history.slice(-windowSize).map(e => e.score);
		const olderScores = history.slice(-windowSize * 2, -windowSize).map(e => e.score);

		const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
		const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

		const changeThreshold = 0.05; // 5% change

		if (recentAvg > olderAvg + changeThreshold) {
			return 'improving';
		} else if (recentAvg < olderAvg - changeThreshold) {
			return 'declining';
		}

		return 'stable';
	}
}
