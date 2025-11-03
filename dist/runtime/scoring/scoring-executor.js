/**
 * Scoring Executor
 *
 * Handles member execution with scoring, retry logic, and backoff strategies.
 */
import { Errors } from '../../errors/error-types.js';
import { createLogger } from '../../observability';
const logger = createLogger({ serviceName: 'scoring-executor' });
export class ScoringExecutor {
    /**
     * Execute a member with scoring and retry logic
     */
    async executeWithScoring(executeMember, evaluateOutput, config) {
        const startTime = Date.now();
        let attempts = 0;
        let lastScore;
        let lastOutput;
        let backoffMs = 1000;
        const maxAttempts = config.retryLimit || 3;
        while (attempts < maxAttempts) {
            attempts++;
            try {
                // Execute the member
                const output = await executeMember();
                lastOutput = output;
                // Evaluate the output
                const score = await evaluateOutput(output, attempts, lastScore);
                lastScore = score;
                // Check if score meets threshold
                if (score.passed) {
                    return {
                        output,
                        score,
                        attempts,
                        status: 'passed',
                        executionTime: Date.now() - startTime,
                    };
                }
                // Check improvement requirement
                if (config.requireImprovement && lastScore && attempts > 1) {
                    const improvement = score.score - lastScore.score;
                    const minImprovement = config.minImprovement || 0.05;
                    if (improvement < minImprovement) {
                        // Not improving enough, stop retrying
                        return {
                            output,
                            score,
                            attempts,
                            status: 'max_retries_exceeded',
                            executionTime: Date.now() - startTime,
                        };
                    }
                }
                // Handle failure based on strategy
                const onFailure = config.onFailure || 'retry';
                switch (onFailure) {
                    case 'retry':
                        if (attempts < maxAttempts) {
                            // Apply backoff
                            await this.applyBackoff(backoffMs);
                            backoffMs = this.calculateNextBackoff(backoffMs, 'exponential');
                        }
                        break;
                    case 'continue':
                        // Log warning but continue execution
                        logger.warn('Score below threshold, continuing anyway', {
                            score: score.score,
                            threshold: config.thresholds?.minimum,
                            attempts,
                        });
                        return {
                            output,
                            score,
                            attempts,
                            status: 'below_threshold',
                            executionTime: Date.now() - startTime,
                        };
                    case 'abort':
                        throw Errors.internal(`Score ${score.score} below minimum threshold ${config.thresholds?.minimum}`);
                }
            }
            catch (error) {
                // Execution failed
                if (attempts >= maxAttempts) {
                    throw error;
                }
                // Retry after backoff
                await this.applyBackoff(backoffMs);
                backoffMs = this.calculateNextBackoff(backoffMs, 'exponential');
            }
        }
        // Max retries exceeded
        return {
            output: lastOutput,
            score: lastScore,
            attempts,
            status: 'max_retries_exceeded',
            executionTime: Date.now() - startTime,
        };
    }
    /**
     * Apply backoff delay
     */
    async applyBackoff(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Calculate next backoff delay
     */
    calculateNextBackoff(current, strategy) {
        switch (strategy) {
            case 'exponential':
                return Math.min(current * 2, 60000); // Cap at 60s
            case 'linear':
                return Math.min(current + 1000, 30000); // Cap at 30s
            case 'fixed':
            default:
                return current;
        }
    }
    /**
     * Calculate composite score from breakdown
     */
    calculateCompositeScore(breakdown, weights) {
        const criteria = Object.keys(breakdown);
        if (!criteria.length) {
            return 0;
        }
        if (!weights) {
            // Simple average
            const sum = criteria.reduce((acc, key) => acc + breakdown[key], 0);
            return sum / criteria.length;
        }
        // Weighted average
        let weightedSum = 0;
        let totalWeight = 0;
        for (const criterion of criteria) {
            const weight = weights[criterion] || 1;
            weightedSum += breakdown[criterion] * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    /**
     * Check if score meets threshold
     */
    checkThreshold(score, threshold) {
        return score >= threshold;
    }
    /**
     * Get score range category
     */
    getScoreRange(score) {
        if (score >= 0.95)
            return 'excellent';
        if (score >= 0.8)
            return 'good';
        if (score >= 0.6)
            return 'acceptable';
        return 'poor';
    }
    /**
     * Get failed criteria from breakdown
     */
    getFailedCriteria(breakdown, threshold) {
        return Object.entries(breakdown)
            .filter(([_, score]) => score < threshold)
            .map(([criterion]) => criterion);
    }
}
