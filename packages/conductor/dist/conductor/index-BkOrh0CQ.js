import { B as BaseAgent } from "./worker-entry-BnW0lOUP.js";
class BaseEvaluator {
  /**
   * Normalize score to 0-1 range
   */
  normalizeScore(score, min = 0, max = 1) {
    return Math.max(min, Math.min(max, score));
  }
  /**
   * Calculate weighted average of scores
   */
  calculateWeightedAverage(scores, weights) {
    let totalWeight = 0;
    let weightedSum = 0;
    for (const [key, score] of Object.entries(scores)) {
      const weight = weights[key] || 1;
      weightedSum += score * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
}
class RuleEvaluator extends BaseEvaluator {
  async evaluate(content, config) {
    const rules = config.rules || [];
    if (rules.length === 0) {
      throw new Error("Rule evaluator requires at least one rule in config");
    }
    const breakdown = {};
    const weights = {};
    const details = {};
    for (const rule of rules) {
      try {
        const context = {
          content,
          length: content.length,
          wordCount: content.split(/\s+/).length,
          lineCount: content.split("\n").length
        };
        const result = this.evaluateRule(rule.check, context);
        const score = result ? 1 : 0;
        breakdown[rule.name] = score;
        weights[rule.name] = rule.weight;
        details[rule.name] = {
          passed: result,
          rule: rule.check,
          description: rule.description
        };
      } catch (error) {
        breakdown[rule.name] = 0;
        weights[rule.name] = rule.weight;
        details[rule.name] = {
          passed: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
    const average = this.calculateWeightedAverage(breakdown, weights);
    return {
      average,
      breakdown,
      details
    };
  }
  /**
   * Safely evaluate a rule expression
   */
  evaluateRule(expression, context) {
    let evalExpression = expression;
    evalExpression = evalExpression.replace(/content\.length/g, String(context.content.length));
    evalExpression = evalExpression.replace(/content\.wordCount/g, String(context.wordCount));
    evalExpression = evalExpression.replace(/content\.lineCount/g, String(context.lineCount));
    evalExpression = evalExpression.replace(
      /content\.includes\(['"]([^'"]+)['"]\)/g,
      (match, keyword) => {
        return String(context.content.toLowerCase().includes(keyword.toLowerCase()));
      }
    );
    try {
      const fn = new Function("return (" + evalExpression + ")");
      return Boolean(fn());
    } catch (error) {
      return false;
    }
  }
}
class JudgeEvaluator extends BaseEvaluator {
  async evaluate(content, config) {
    const criteria = config.criteria || [];
    const model = config.model || "claude-3-5-haiku-20241022";
    if (criteria.length === 0) {
      throw new Error("Judge evaluator requires at least one criterion in config");
    }
    const breakdown = {};
    const weights = {};
    for (const criterion of criteria) {
      breakdown[criterion.name] = 0.75;
      weights[criterion.name] = criterion.weight;
    }
    const average = this.calculateWeightedAverage(breakdown, weights);
    return {
      average,
      breakdown,
      details: {
        model,
        criteria: criteria.map((c) => c.name),
        note: "LLM-based evaluation not yet implemented"
      }
    };
  }
}
class NLPEvaluator extends BaseEvaluator {
  async evaluate(content, config) {
    const reference = config.reference;
    if (!reference) {
      throw new Error('NLP evaluator requires "reference" text in config');
    }
    const metrics = config.metrics || ["bleu", "rouge"];
    const breakdown = {};
    for (const metric of metrics) {
      switch (metric.toLowerCase()) {
        case "bleu":
          breakdown.bleu = this.calculateBLEU(content, reference);
          break;
        case "rouge":
          breakdown.rouge = this.calculateROUGE(content, reference);
          break;
        case "length-ratio":
          breakdown.lengthRatio = this.calculateLengthRatio(content, reference);
          break;
        default:
          breakdown[metric] = 0;
      }
    }
    const average = Object.values(breakdown).reduce((sum, score) => sum + score, 0) / Object.keys(breakdown).length;
    return {
      average,
      breakdown,
      details: {
        reference: reference.substring(0, 100) + "...",
        contentLength: content.length,
        referenceLength: reference.length
      }
    };
  }
  /**
   * Calculate BLEU score (simplified unigram)
   */
  calculateBLEU(candidate, reference) {
    const candidateWords = candidate.toLowerCase().split(/\s+/);
    const referenceWords = reference.toLowerCase().split(/\s+/);
    const referenceSet = new Set(referenceWords);
    let matches = 0;
    for (const word of candidateWords) {
      if (referenceSet.has(word)) {
        matches++;
      }
    }
    const precision = candidateWords.length > 0 ? matches / candidateWords.length : 0;
    return this.normalizeScore(precision);
  }
  /**
   * Calculate ROUGE-L score (longest common subsequence)
   */
  calculateROUGE(candidate, reference) {
    const candidateWords = candidate.toLowerCase().split(/\s+/);
    const referenceWords = reference.toLowerCase().split(/\s+/);
    const lcs = this.longestCommonSubsequence(candidateWords, referenceWords);
    const recall = referenceWords.length > 0 ? lcs / referenceWords.length : 0;
    const precision = candidateWords.length > 0 ? lcs / candidateWords.length : 0;
    const f1 = recall + precision > 0 ? 2 * recall * precision / (recall + precision) : 0;
    return this.normalizeScore(f1);
  }
  /**
   * Calculate length ratio (how close the lengths are)
   */
  calculateLengthRatio(candidate, reference) {
    const ratio = Math.min(candidate.length, reference.length) / Math.max(candidate.length, reference.length);
    return this.normalizeScore(ratio);
  }
  /**
   * Calculate longest common subsequence length
   */
  longestCommonSubsequence(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[m][n];
  }
}
class EmbeddingEvaluator extends BaseEvaluator {
  async evaluate(content, config) {
    const reference = config.reference;
    if (!reference) {
      throw new Error('Embedding evaluator requires "reference" text in config');
    }
    const model = config.model || "@cf/baai/bge-base-en-v1.5";
    const similarity = this.calculateSimpleTextSimilarity(content, reference);
    return {
      average: similarity,
      breakdown: {
        semanticSimilarity: similarity
      },
      details: {
        model,
        note: "Using simple text similarity as placeholder for embedding-based similarity"
      }
    };
  }
  /**
   * Calculate simple text similarity (placeholder for actual embeddings)
   */
  calculateSimpleTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = /* @__PURE__ */ new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same length");
    }
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    return dotProduct / (norm1 * norm2);
  }
}
class ValidateMember extends BaseAgent {
  constructor(config, env) {
    super(config);
    this.env = env;
    const cfg = config.config;
    this.validateConfig = {
      evalType: cfg?.evalType || "rule",
      threshold: cfg?.threshold !== void 0 ? cfg.threshold : 0.7,
      rules: cfg?.rules,
      criteria: cfg?.criteria,
      metrics: cfg?.metrics,
      reference: cfg?.reference,
      model: cfg?.model
    };
  }
  async run(context) {
    const input = context.input;
    if (!input.content) {
      throw new Error('Validate agent requires "content" in input');
    }
    const evalType = this.validateConfig.evalType;
    const evaluator = this.getEvaluator(evalType);
    const evalConfig = {
      ...this.validateConfig,
      reference: input.reference || this.validateConfig.reference
    };
    const scores = await evaluator.evaluate(input.content, evalConfig);
    const threshold = this.validateConfig.threshold;
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
  getEvaluator(type) {
    switch (type) {
      case "rule":
        return new RuleEvaluator();
      case "judge":
        return new JudgeEvaluator();
      case "nlp":
        return new NLPEvaluator();
      case "embedding":
        return new EmbeddingEvaluator();
      default:
        throw new Error(`Unknown evaluator type: ${type}`);
    }
  }
}
export {
  BaseEvaluator,
  EmbeddingEvaluator,
  JudgeEvaluator,
  NLPEvaluator,
  RuleEvaluator,
  ValidateMember
};
//# sourceMappingURL=index-BkOrh0CQ.js.map
