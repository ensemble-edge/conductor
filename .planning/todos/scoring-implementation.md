# **Ensemble Scoring Implementation**

## **Quality Control & Confidence Scoring for Edge Orchestration**

### Executive Summary

The Ensemble Scoring System provides comprehensive quality control and confidence measurement throughout workflow execution. By treating evaluation as a first-class citizen in our orchestration model, every member's output can be scored, validated, and conditionally retried based on configurable confidence thresholds. This document outlines the implementation of scoring across the Conductor runtime.

---

## **Core Concepts**

### The Performance Metaphor Extended

Just as a conductor ensures each musician performs to standard, our scoring system acts as the **Performance Director** \- continuously evaluating quality and requesting retakes when needed.

- **Scoring Members** \= Music critics (evaluate performance quality)  
- **Confidence Scores** \= Performance ratings (0.0 to 1.0)  
- **Thresholds** \= Acceptable performance standards  
- **Retry Logic** \= Request for another take  
- **Score State** \= Performance history tracking

---

## **Architecture**

### 1\. Scoring Schema Definition

Every ensemble can define quality thresholds and scoring criteria at both the ensemble and member levels:

```
name: content-generation-with-qa
description: Generate content with automatic quality assurance

# Ensemble-level scoring configuration
scoring:
  enabled: true
  defaultThresholds:
    minimum: 0.6      # Fail below this
    target: 0.8       # Ideal score
    excellent: 0.95   # Exceptional quality
  maxRetries: 3
  backoffStrategy: exponential  # linear | exponential | fixed
  
  # Track scoring metrics in state
  trackInState: true
  
  # Global scoring criteria
  criteria:
    accuracy: "Factually correct and precise"
    relevance: "Directly addresses the requirement"
    clarity: "Clear and well-structured"
    completeness: "All aspects covered"

# State includes scoring history
state:
  schema:
    scoreHistory: array      # Track all scores
    finalScore: number       # Overall ensemble score
    retryCount: object       # Per-member retry tracking
    qualityMetrics: object   # Aggregated quality data
  initial:
    scoreHistory: []
    finalScore: 0
    retryCount: {}
    qualityMetrics: {}

flow:
  - member: generate-content
    input:
      prompt: ${input.prompt}
    # Member-specific scoring
    scoring:
      evaluator: grade-content  # Which scoring member to use
      thresholds:
        minimum: 0.7           # Override ensemble defaults
        target: 0.85
      criteria:
        - originality: "Unique and creative"
        - tone: "Appropriate for audience"
      onFailure: retry         # retry | continue | abort
      retryLimit: 2
    
  - member: grade-content
    type: Scoring  # Special scoring member type
    config:
      model: gpt-4
      temperature: 0.1  # Low temperature for consistent scoring
    input:
      content: ${generate-content.output}
      criteria: ${scoring.criteria}
    output:
      score: number     # 0.0 to 1.0
      breakdown: object # Score per criterion
      feedback: string  # Improvement suggestions
      passed: boolean
```

### 2\. Scoring Member Implementation

Scoring members are specialized evaluators that implement consistent quality assessment:

```javascript
// members/grade-content/index.js
export default async function gradeContent({ 
  input, 
  config,
  state,
  setState 
}) {
  const { content, criteria, reference } = input;
  const { model, rubric } = config;
  
  // Build evaluation prompt with criteria
  const evalPrompt = buildEvaluationPrompt({
    content,
    criteria,
    rubric,
    reference
  });
  
  // Get structured score from LLM
  const evaluation = await callLLM({
    model,
    prompt: evalPrompt,
    schema: scoringSchema  // Enforce structured output
  });
  
  // Calculate composite score
  const scores = evaluation.breakdown;
  const avgScore = Object.values(scores).reduce(
    (sum, score) => sum + score, 0
  ) / Object.keys(scores).length;
  
  // Update scoring state
  setState({
    scoreHistory: [...state.scoreHistory, {
      member: input.sourceMember,
      score: avgScore,
      breakdown: scores,
      timestamp: Date.now()
    }]
  });
  
  return {
    score: avgScore,
    breakdown: scores,
    feedback: evaluation.feedback,
    passed: avgScore >= input.threshold,
    confidence: evaluation.confidence
  };
}

// Zod schema for structured scoring output
const scoringSchema = z.object({
  breakdown: z.record(z.number().min(0).max(1)),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});
```

### 3\. Retry Logic & Backoff Strategies

The Conductor runtime implements intelligent retry logic based on scores:

```javascript
// conductor/runtime/scoring-executor.js
export class ScoringExecutor {
  async executeWithScoring(member, input, scoringConfig) {
    let attempts = 0;
    let lastScore = 0;
    let backoffMs = 1000;
    
    while (attempts < scoringConfig.retryLimit) {
      // Execute the member
      const result = await this.executeMember(member, input);
      
      // Run scoring evaluation
      const score = await this.evaluateOutput(
        result,
        scoringConfig.evaluator,
        scoringConfig.criteria
      );
      
      // Check if score meets threshold
      if (score.passed) {
        return {
          output: result,
          score: score.score,
          attempts: attempts + 1,
          status: 'passed'
        };
      }
      
      // Handle failure based on strategy
      switch (scoringConfig.onFailure) {
        case 'retry':
          attempts++;
          lastScore = score.score;
          
          // Apply backoff strategy
          if (attempts < scoringConfig.retryLimit) {
            await this.applyBackoff(backoffMs, scoringConfig.backoffStrategy);
            backoffMs = this.calculateNextBackoff(backoffMs, scoringConfig.backoffStrategy);
            
            // Enhance input with feedback for next attempt
            input = {
              ...input,
              previousScore: score,
              feedback: score.feedback,
              attempt: attempts + 1
            };
          }
          break;
          
        case 'continue':
          // Log warning but continue execution
          console.warn(`Score below threshold: ${score.score}`);
          return {
            output: result,
            score: score.score,
            status: 'below_threshold'
          };
          
        case 'abort':
          throw new ScoringError(
            `Score ${score.score} below minimum ${scoringConfig.thresholds.minimum}`
          );
      }
    }
    
    // Max retries exceeded
    return {
      output: null,
      score: lastScore,
      attempts,
      status: 'max_retries_exceeded'
    };
  }
  
  calculateNextBackoff(current, strategy) {
    switch (strategy) {
      case 'exponential':
        return current * 2;
      case 'linear':
        return current + 1000;
      case 'fixed':
      default:
        return current;
    }
  }
}
```

### 4\. Aggregated Scoring & Ensemble Metrics

Track overall ensemble quality through aggregated scores:

```javascript
// conductor/runtime/ensemble-scorer.js
export class EnsembleScorer {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }
  
  async calculateEnsembleScore() {
    const state = this.stateManager.getState();
    const { scoreHistory, qualityMetrics } = state;
    
    if (!scoreHistory.length) return null;
    
    // Calculate weighted ensemble score
    const weights = this.getMemberWeights();
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const entry of scoreHistory) {
      const weight = weights[entry.member] || 1;
      weightedSum += entry.score * weight;
      totalWeight += weight;
    }
    
    const ensembleScore = weightedSum / totalWeight;
    
    // Update quality metrics
    const metrics = {
      ensembleScore,
      averageScore: this.calculateAverage(scoreHistory),
      minScore: Math.min(...scoreHistory.map(e => e.score)),
      maxScore: Math.max(...scoreHistory.map(e => e.score)),
      totalEvaluations: scoreHistory.length,
      passRate: this.calculatePassRate(scoreHistory),
      criteriaBreakdown: this.aggregateCriteria(scoreHistory)
    };
    
    this.stateManager.setState({
      finalScore: ensembleScore,
      qualityMetrics: metrics
    });
    
    return metrics;
  }
  
  aggregateCriteria(history) {
    const criteria = {};
    
    for (const entry of history) {
      if (entry.breakdown) {
        for (const [criterion, score] of Object.entries(entry.breakdown)) {
          if (!criteria[criterion]) {
            criteria[criterion] = { scores: [], average: 0 };
          }
          criteria[criterion].scores.push(score);
        }
      }
    }
    
    // Calculate averages per criterion
    for (const criterion of Object.keys(criteria)) {
      criteria[criterion].average = 
        criteria[criterion].scores.reduce((a, b) => a + b, 0) / 
        criteria[criterion].scores.length;
    }
    
    return criteria;
  }
}
```

### 5\. Conditional Branching Based on Scores

Use scores to control ensemble flow:

```
flow:
  - member: generate-summary
    scoring:
      evaluator: grade-summary
      thresholds:
        minimum: 0.7
    
  - member: conditional-enhancement
    condition:
      # Only enhance if score is below target
      - if: ${state.scoreHistory[-1].score} < 0.85
        member: enhance-summary
        input:
          original: ${generate-summary.output}
          feedback: ${state.scoreHistory[-1].feedback}
      
      # Skip enhancement if already excellent
      - else:
        continue: true
  
  - member: final-validation
    scoring:
      evaluator: comprehensive-check
      # Require higher score after enhancement
      thresholds:
        minimum: 0.85
```

### 6\. Scoring Observability & Analytics

Integration with Cloudflare Analytics Engine for scoring metrics:

```javascript
// conductor/telemetry/scoring-telemetry.js
export class ScoringTelemetry {
  async logScoringEvent(event) {
    const telemetryData = {
      timestamp: Date.now(),
      ensemble: event.ensemble,
      member: event.member,
      score: event.score,
      breakdown: event.breakdown,
      passed: event.passed,
      attempts: event.attempts,
      retryReason: event.feedback,
      latency: event.executionTime,
      
      // Scoring-specific dimensions
      scoreRange: this.getScoreRange(event.score),
      criteriaFailures: this.getFailedCriteria(event.breakdown),
      improvementDelta: event.previousScore 
        ? event.score - event.previousScore 
        : 0
    };
    
    // Send to Analytics Engine
    await this.analytics.track('scoring_evaluation', telemetryData);
    
    // Track patterns for optimization
    if (event.score < 0.5) {
      await this.analytics.track('low_quality_alert', {
        ...telemetryData,
        alertType: 'quality_threshold'
      });
    }
  }
  
  getScoreRange(score) {
    if (score >= 0.95) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.6) return 'acceptable';
    return 'poor';
  }
}
```

---

## **Implementation Patterns**

### Pattern 1: Multi-Stage Validation

```
name: document-processing
flow:
  # Stage 1: Initial generation
  - member: extract-data
    scoring:
      evaluator: validate-extraction
      thresholds: { minimum: 0.8 }
  
  # Stage 2: Enhancement if needed
  - member: enhance-data
    condition:
      - if: ${state.scoreHistory[-1].score} < 0.9
    scoring:
      evaluator: validate-enhancement
      thresholds: { minimum: 0.9 }
  
  # Stage 3: Final check
  - member: final-validation
    type: Scoring
    input:
      data: ${state.processedData}
      checkCompleteness: true
      checkAccuracy: true
```

### Pattern 2: Comparative Scoring

```
name: multi-model-selection
flow:
  parallel:
    - member: generate-with-gpt4
      scoring:
        evaluator: score-output
    
    - member: generate-with-claude
      scoring:
        evaluator: score-output
    
    - member: generate-with-gemini
      scoring:
        evaluator: score-output
  
  - member: select-best
    input:
      scores: ${state.scoreHistory}
    output:
      selected: ${highest_scoring_output}
      model: ${highest_scoring_model}
```

### Pattern 3: Progressive Quality Improvement

```
name: iterative-refinement
scoring:
  targetImprovement: 0.1  # Each iteration should improve by 10%
  maxIterations: 5

flow:
  - member: initial-draft
    scoring:
      evaluator: grade-quality
  
  - member: iterative-improvement
    loop:
      while: ${state.scoreHistory[-1].score} < 0.9
      maxIterations: 5
    input:
      current: ${previous.output}
      targetScore: 0.9
      feedback: ${state.scoreHistory[-1].feedback}
    scoring:
      evaluator: grade-quality
      requireImprovement: true  # Must beat previous score
```

---

## **Configuration Examples**

### Basic Quality Gate

```
scoring:
  enabled: true
  defaultThresholds:
    minimum: 0.7
  evaluator: default-grader
```

### Advanced Multi-Criteria Scoring

```
scoring:
  enabled: true
  criteria:
    technical_accuracy:
      weight: 0.4
      description: "Technically correct implementation"
    code_quality:
      weight: 0.3
      description: "Clean, maintainable code"
    performance:
      weight: 0.2
      description: "Efficient execution"
    documentation:
      weight: 0.1
      description: "Well-documented"
  
  thresholds:
    minimum: 0.65
    target: 0.80
    excellent: 0.95
  
  aggregation: weighted_average  # weighted_average | minimum | geometric_mean
```

### Human-in-the-Loop Scoring

```
scoring:
  evaluator: human-review
  thresholds:
    minimum: 0.8
  
  humanReview:
    enabled: true
    triggerBelow: 0.6  # Request human review if below
    suspendOnReview: true
    reviewTimeout: 3600  # 1 hour
```

---

## **API Integration**

### Scoring Endpoints

```javascript
// GET /conductor/ensemble/:name/scores
// Returns scoring metrics for ensemble executions
{
  "ensemble": "content-generation",
  "metrics": {
    "averageScore": 0.82,
    "passRate": 0.94,
    "totalEvaluations": 1523,
    "criteriaBreakdown": {
      "accuracy": 0.88,
      "relevance": 0.79,
      "clarity": 0.81
    }
  }
}

// POST /conductor/score/override
// Manual score override for human review
{
  "executionId": "exec-123",
  "memberId": "generate-content",
  "score": 0.95,
  "feedback": "Manually approved after review",
  "reviewer": "user-456"
}
```

### SDK Support

```javascript
import { Ensemble } from '@ensemble-edge/sdk';

const ensemble = new Ensemble('content-generation');

// Execute with scoring enabled
const result = await ensemble.execute(input, {
  scoring: {
    enabled: true,
    thresholds: { minimum: 0.8 },
    returnScores: true
  }
});

console.log(result.output);        // The actual output
console.log(result.scores);        // Scoring breakdown
console.log(result.ensembleScore); // Overall quality score
```

---

## **Performance Considerations**

### Scoring Overhead

- Evaluation adds 100-500ms per scoring operation  
- Use sampling for high-volume workflows (score every Nth execution)  
- Cache evaluation results for identical inputs  
- Consider async scoring for non-critical paths

### Cost Optimization

```
scoring:
  sampling:
    enabled: true
    rate: 0.1  # Score 10% of executions
    alwaysScoreOn: ["error", "first_run", "manual_trigger"]
  
  costControl:
    evaluatorModel: "gpt-3.5-turbo"  # Cheaper model for evaluation
    maxTokens: 500
```

---

## **Debugging & Monitoring**

### Score Tracking Dashboard

```javascript
// Real-time scoring metrics
const dashboard = {
  current: {
    ensembleScore: 0.84,
    trend: "improving",  // improving | declining | stable
    last24h: {
      evaluations: 523,
      passRate: 0.91,
      avgScore: 0.83
    }
  },
  
  alerts: [
    {
      type: "quality_degradation",
      member: "generate-summary",
      message: "Score dropped below 0.7 threshold",
      timestamp: Date.now()
    }
  ],
  
  recommendations: [
    "Consider adjusting temperature for generate-summary",
    "Review failed criteria: 'completeness' scoring low"
  ]
};
```

### Debugging Failed Scores

```
# Enable detailed scoring logs
scoring:
  debug: true
  logLevel: verbose
  capturePrompts: true  # Store evaluation prompts
  
  # Detailed failure analysis
  onFailure:
    captureState: true
    captureInput: true
    captureOutput: true
    notifyWebhook: "https://alerts.example.com/scoring"
```

---

## **Best Practices**

### DO:

✅ Set realistic thresholds based on baseline testing  
✅ Use consistent criteria across similar members  
✅ Implement gradual rollout for new scoring rules  
✅ Monitor scoring metrics for drift detection  
✅ Cache scores for identical inputs  
✅ Use sampling for high-volume workflows

### DON'T:

❌ Set thresholds too high initially (start at 0.6, increase gradually)  
❌ Score every intermediate step (focus on critical outputs)  
❌ Ignore scoring feedback in retry attempts  
❌ Use expensive models for simple validations  
❌ Block execution on non-critical score failures

---

## **Migration Guide**

### Adding Scoring to Existing Ensembles

1. **Baseline Measurement**

```shell
# Run without thresholds to measure current quality
npx ensemble score baseline --ensemble my-ensemble --runs 100
```

2. **Set Initial Thresholds**

```
scoring:
  enabled: true
  thresholds:
    minimum: <p10_score>  # Start with 10th percentile
    target: <p50_score>   # Median score
```

3. **Gradual Rollout**

```
scoring:
  rollout:
    percentage: 10  # Start with 10% of executions
    increment: 10   # Increase by 10% weekly
```

---

## **Summary**

The Ensemble Scoring System transforms quality assurance from an afterthought into an integral part of orchestration. By embedding evaluation directly into the execution flow, we ensure consistent quality while maintaining the flexibility to handle various failure modes gracefully.

Key capabilities:

- **Automatic quality gates** with configurable thresholds  
- **Intelligent retry logic** with backoff strategies  
- **State-integrated scoring** for historical tracking  
- **Multi-criteria evaluation** with weighted scoring  
- **Conditional flow control** based on quality metrics  
- **Comprehensive observability** through Analytics Engine

This scoring implementation ensures that every ensemble performs to standard, automatically requesting retakes when needed, and continuously improving through feedback-driven iteration.  