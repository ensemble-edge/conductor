#!/usr/bin/env node

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/members/base-member.ts
var BaseMember;
var init_base_member = __esm({
  "src/members/base-member.ts"() {
    "use strict";
    BaseMember = class {
      constructor(config) {
        this.config = config;
        this.name = config.name;
        this.type = config.type;
      }
      /**
       * Execute the member with given input and context
       * @param context - Execution context
       * @returns Member response
       */
      async execute(context) {
        const startTime = Date.now();
        try {
          const result = await this.run(context);
          const executionTime = Date.now() - startTime;
          return this.wrapSuccess(result, executionTime, false);
        } catch (error) {
          const executionTime = Date.now() - startTime;
          return this.wrapError(error, executionTime);
        }
      }
      /**
       * Wrap successful execution result
       * @param data - Result data
       * @param executionTime - Time taken in milliseconds
       * @param cached - Whether result was cached
       * @returns Wrapped response
       */
      wrapSuccess(data, executionTime, cached = false) {
        return {
          success: true,
          data,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          cached,
          executionTime,
          metadata: {
            member: this.name,
            type: this.type
          }
        };
      }
      /**
       * Wrap error response
       * @param error - Error object
       * @param executionTime - Time taken in milliseconds
       * @returns Wrapped error response
       */
      wrapError(error, executionTime) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          success: false,
          error: errorMessage,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          cached: false,
          executionTime,
          metadata: {
            member: this.name,
            type: this.type
          }
        };
      }
      /**
       * Generate cache key for this member's execution
       * @param input - Input data
       * @returns Cache key string
       */
      async generateCacheKey(input) {
        const inputString = JSON.stringify(this.sortObjectKeys(input));
        const hash = await this.hashString(inputString);
        return `member:${this.name}:${hash}`;
      }
      /**
       * Sort object keys recursively for stable stringification
       * @param obj - Object to sort
       * @returns Sorted object
       */
      sortObjectKeys(obj) {
        if (typeof obj !== "object" || obj === null) {
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map((item) => this.sortObjectKeys(item));
        }
        const sorted = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
          sorted[key] = this.sortObjectKeys(obj[key]);
        }
        return sorted;
      }
      /**
       * Cryptographically secure SHA-256 hash function
       * @param str - String to hash
       * @returns Hash value (hex string)
       */
      async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return hashHex.substring(0, 16);
      }
      /**
       * Get member configuration
       * @returns Member configuration
       */
      getConfig() {
        return this.config;
      }
      /**
       * Get member name
       * @returns Member name
       */
      getName() {
        return this.name;
      }
      /**
       * Get member type
       * @returns Member type
       */
      getType() {
        return this.type;
      }
    };
  }
});

// src/members/built-in/scrape/bot-detection.ts
function detectBotProtection(content) {
  const reasons = [];
  const lowercaseContent = content.toLowerCase();
  if (content.length < MIN_CONTENT_LENGTH) {
    reasons.push(`Content too short (${content.length} < ${MIN_CONTENT_LENGTH})`);
  }
  for (const keyword of BOT_PROTECTION_KEYWORDS) {
    if (lowercaseContent.includes(keyword)) {
      reasons.push(`Contains bot protection keyword: "${keyword}"`);
    }
  }
  return {
    detected: reasons.length > 0,
    reasons
  };
}
function isContentSuccessful(content) {
  const result = detectBotProtection(content);
  return !result.detected;
}
var BOT_PROTECTION_KEYWORDS, MIN_CONTENT_LENGTH;
var init_bot_detection = __esm({
  "src/members/built-in/scrape/bot-detection.ts"() {
    "use strict";
    BOT_PROTECTION_KEYWORDS = [
      "cloudflare",
      "just a moment",
      "checking your browser",
      "please wait",
      "access denied",
      "captcha",
      "recaptcha",
      "challenge",
      "verify you are human",
      "attention required",
      "enable javascript",
      "blocked"
    ];
    MIN_CONTENT_LENGTH = 800;
  }
});

// src/members/built-in/scrape/html-parser.ts
function extractTextFromHTML(html) {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, " ");
  text = text.trim();
  return text;
}
function extractTitleFromHTML(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return "";
}
function convertHTMLToMarkdown(html) {
  let markdown = html;
  const title = extractTitleFromHTML(html);
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  markdown = markdown.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, "\n# $1\n");
  markdown = markdown.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, "\n## $1\n");
  markdown = markdown.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, "\n### $1\n");
  markdown = markdown.replace(/<h4[^>]*>([^<]+)<\/h4>/gi, "\n#### $1\n");
  markdown = markdown.replace(/<h5[^>]*>([^<]+)<\/h5>/gi, "\n##### $1\n");
  markdown = markdown.replace(/<h6[^>]*>([^<]+)<\/h6>/gi, "\n###### $1\n");
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi, "[$2]($1)");
  markdown = markdown.replace(/<(strong|b)[^>]*>([^<]+)<\/(strong|b)>/gi, "**$2**");
  markdown = markdown.replace(/<(em|i)[^>]*>([^<]+)<\/(em|i)>/gi, "*$2*");
  markdown = markdown.replace(/<li[^>]*>([^<]+)<\/li>/gi, "- $1\n");
  markdown = markdown.replace(/<p[^>]*>([^<]+)<\/p>/gi, "\n$1\n");
  markdown = markdown.replace(/<[^>]+>/g, "");
  markdown = markdown.replace(/&nbsp;/g, " ");
  markdown = markdown.replace(/&amp;/g, "&");
  markdown = markdown.replace(/&lt;/g, "<");
  markdown = markdown.replace(/&gt;/g, ">");
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.replace(/[ \t]+/g, " ");
  markdown = markdown.trim();
  if (title) {
    markdown = `# ${title}

${markdown}`;
  }
  return markdown;
}
var init_html_parser = __esm({
  "src/members/built-in/scrape/html-parser.ts"() {
    "use strict";
  }
});

// src/observability/types.ts
var init_types = __esm({
  "src/observability/types.ts"() {
    "use strict";
  }
});

// src/observability/logger.ts
function createLogger(config = {}, analyticsEngine) {
  return new ConductorLogger(config, analyticsEngine);
}
var LOG_LEVEL_PRIORITY, ConductorLogger;
var init_logger = __esm({
  "src/observability/logger.ts"() {
    "use strict";
    init_types();
    LOG_LEVEL_PRIORITY = {
      ["debug" /* DEBUG */]: 0,
      ["info" /* INFO */]: 1,
      ["warn" /* WARN */]: 2,
      ["error" /* ERROR */]: 3
    };
    ConductorLogger = class _ConductorLogger {
      constructor(config = {}, analyticsEngine, baseContext = {}) {
        const isDebug = config.debug ?? (typeof process !== "undefined" && process.env?.DEBUG === "true" || typeof globalThis !== "undefined" && globalThis.DEBUG === true);
        this.config = {
          level: config.level ?? (isDebug ? "debug" /* DEBUG */ : "info" /* INFO */),
          serviceName: config.serviceName ?? "conductor",
          environment: config.environment ?? "production",
          debug: isDebug,
          enableAnalytics: config.enableAnalytics ?? true,
          baseContext: config.baseContext ?? {}
        };
        this.baseContext = Object.freeze({ ...this.config.baseContext, ...baseContext });
        this.analyticsEngine = analyticsEngine;
      }
      /**
       * Check if a log level should be output
       */
      shouldLog(level) {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
      }
      /**
       * Create structured log entry
       */
      createLogEntry(level, message, context, error) {
        const entry = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message,
          ...Object.keys({ ...this.baseContext, ...context }).length > 0 && {
            context: { ...this.baseContext, ...context }
          }
        };
        if (error) {
          entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            // Include ConductorError specific fields
            ...this.isConductorError(error) && {
              code: error.code,
              details: error.details
            }
          };
        }
        return entry;
      }
      /**
       * Type guard for ConductorError
       */
      isConductorError(error) {
        return "code" in error && "toJSON" in error;
      }
      /**
       * Output log entry via console
       *
       * Cloudflare Workers Logs automatically captures console output
       * and indexes JSON fields for querying in the dashboard.
       */
      log(entry) {
        if (!this.shouldLog(entry.level)) {
          return;
        }
        const logOutput = JSON.stringify(entry);
        switch (entry.level) {
          case "debug" /* DEBUG */:
            console.debug(logOutput);
            break;
          case "info" /* INFO */:
            console.info(logOutput);
            break;
          case "warn" /* WARN */:
            console.warn(logOutput);
            break;
          case "error" /* ERROR */:
            console.error(logOutput);
            break;
        }
      }
      /**
       * Log debug information
       *
       * Only output when DEBUG=true or log level is DEBUG.
       * Useful for development and troubleshooting.
       */
      debug(message, context) {
        const entry = this.createLogEntry("debug" /* DEBUG */, message, context);
        this.log(entry);
      }
      /**
       * Log informational message
       *
       * Use for normal operational events worth tracking.
       */
      info(message, context) {
        const entry = this.createLogEntry("info" /* INFO */, message, context);
        this.log(entry);
      }
      /**
       * Log warning
       *
       * Use for concerning but non-critical issues.
       */
      warn(message, context) {
        const entry = this.createLogEntry("warn" /* WARN */, message, context);
        this.log(entry);
      }
      /**
       * Log error
       *
       * Use for errors that need attention.
       * Includes full error details and stack trace.
       */
      error(message, error, context) {
        const entry = this.createLogEntry("error" /* ERROR */, message, context, error);
        this.log(entry);
      }
      /**
       * Create child logger with additional context
       *
       * Useful for adding request-specific or execution-specific context
       * that applies to all logs within a scope.
       *
       * @example
       * const requestLogger = logger.child({ requestId: '123', userId: 'alice' });
       * requestLogger.info('Processing request'); // Includes requestId and userId
       */
      child(context) {
        return new _ConductorLogger(this.config, this.analyticsEngine, {
          ...this.baseContext,
          ...context
        });
      }
      /**
       * Record metric to Analytics Engine
       *
       * Analytics Engine provides unlimited-cardinality analytics at scale.
       * Use for high-volume metrics that need SQL querying.
       *
       * @example
       * logger.metric('ensemble.execution', {
       *   blobs: ['user-workflow', 'completed'],
       *   doubles: [1234], // duration in ms
       *   indexes: ['ensemble.execution']
       * });
       */
      metric(name, data) {
        if (!this.config.enableAnalytics || !this.analyticsEngine) {
          return;
        }
        try {
          this.analyticsEngine.writeDataPoint({
            blobs: data.blobs ?? [],
            doubles: data.doubles ?? [],
            indexes: data.indexes ?? [name]
          });
        } catch (error) {
          this.warn("Failed to write metric", {
            metricName: name,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    };
  }
});

// src/observability/opentelemetry.ts
var init_opentelemetry = __esm({
  "src/observability/opentelemetry.ts"() {
    "use strict";
    init_types();
  }
});

// src/observability/index.ts
var init_observability = __esm({
  "src/observability/index.ts"() {
    "use strict";
    init_types();
    init_logger();
    init_opentelemetry();
  }
});

// src/members/built-in/scrape/scrape-member.ts
var logger, ScrapeMember;
var init_scrape_member = __esm({
  "src/members/built-in/scrape/scrape-member.ts"() {
    "use strict";
    init_base_member();
    init_bot_detection();
    init_html_parser();
    init_observability();
    logger = createLogger({ serviceName: "scrape-member" });
    ScrapeMember = class extends BaseMember {
      constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.scrapeConfig = {
          strategy: cfg?.strategy || "balanced",
          returnFormat: cfg?.returnFormat || "markdown",
          blockResources: cfg?.blockResources !== false,
          userAgent: cfg?.userAgent,
          timeout: cfg?.timeout || 3e4
        };
      }
      async run(context) {
        const input = context.input;
        if (!input.url) {
          throw new Error('Scrape member requires "url" in input');
        }
        const startTime = Date.now();
        const strategy = this.scrapeConfig.strategy;
        try {
          const result2 = await this.tier1Fast(input.url);
          if (isContentSuccessful(result2.html)) {
            return this.formatResult(result2, 1, Date.now() - startTime);
          }
        } catch (error) {
          logger.debug("Tier 1 fast scrape failed, trying Tier 2", {
            url: input.url,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
        if (strategy === "fast") {
          return this.fallbackResult(input.url, Date.now() - startTime);
        }
        try {
          const result2 = await this.tier2Slow(input.url);
          if (isContentSuccessful(result2.html)) {
            return this.formatResult(result2, 2, Date.now() - startTime);
          }
        } catch (error) {
          logger.debug("Tier 2 slow scrape failed, trying Tier 3", {
            url: input.url,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
        if (strategy === "balanced") {
          return this.fallbackResult(input.url, Date.now() - startTime);
        }
        const result = await this.tier3HTMLParsing(input.url);
        return this.formatResult(result, 3, Date.now() - startTime);
      }
      /**
       * Tier 1: Fast browser rendering with domcontentloaded
       */
      async tier1Fast(url) {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.scrapeConfig.userAgent || "Mozilla/5.0 (compatible; Conductor/1.0)"
          },
          signal: AbortSignal.timeout(this.scrapeConfig.timeout)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const title = extractTitleFromHTML(html);
        return { html, title };
      }
      /**
       * Tier 2: Slow browser rendering with networkidle2
       */
      async tier2Slow(url) {
        return await this.tier1Fast(url);
      }
      /**
       * Tier 3: HTML parsing fallback
       */
      async tier3HTMLParsing(url) {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.scrapeConfig.userAgent || "Mozilla/5.0 (compatible; Conductor/1.0)"
          },
          signal: AbortSignal.timeout(this.scrapeConfig.timeout)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const title = extractTitleFromHTML(html);
        return { html, title };
      }
      /**
       * Format the result based on configured return format
       */
      formatResult(data, tier, duration) {
        const botProtection = detectBotProtection(data.html);
        const format = this.scrapeConfig.returnFormat;
        const result = {
          url: "",
          tier,
          duration,
          botProtectionDetected: botProtection.detected,
          contentLength: data.html.length,
          title: data.title
        };
        if (format === "html" || format === "markdown") {
          result.html = data.html;
        }
        if (format === "markdown") {
          result.markdown = convertHTMLToMarkdown(data.html);
        }
        if (format === "text") {
          result.text = extractTextFromHTML(data.html);
        }
        return result;
      }
      /**
       * Return a fallback result when all tiers fail
       */
      fallbackResult(url, duration) {
        return {
          url,
          tier: 3,
          duration,
          botProtectionDetected: true,
          contentLength: 0,
          markdown: "",
          html: "",
          text: ""
        };
      }
    };
  }
});

// src/members/built-in/scrape/index.ts
var scrape_exports = {};
__export(scrape_exports, {
  ScrapeMember: () => ScrapeMember,
  convertHTMLToMarkdown: () => convertHTMLToMarkdown,
  detectBotProtection: () => detectBotProtection,
  extractTextFromHTML: () => extractTextFromHTML,
  extractTitleFromHTML: () => extractTitleFromHTML,
  isContentSuccessful: () => isContentSuccessful
});
var init_scrape = __esm({
  "src/members/built-in/scrape/index.ts"() {
    "use strict";
    init_scrape_member();
    init_bot_detection();
    init_html_parser();
  }
});

// src/members/built-in/validate/evaluators/base-evaluator.ts
var BaseEvaluator;
var init_base_evaluator = __esm({
  "src/members/built-in/validate/evaluators/base-evaluator.ts"() {
    "use strict";
    BaseEvaluator = class {
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
    };
  }
});

// src/members/built-in/validate/evaluators/rule-evaluator.ts
var RuleEvaluator;
var init_rule_evaluator = __esm({
  "src/members/built-in/validate/evaluators/rule-evaluator.ts"() {
    "use strict";
    init_base_evaluator();
    RuleEvaluator = class extends BaseEvaluator {
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
    };
  }
});

// src/members/built-in/validate/evaluators/judge-evaluator.ts
var JudgeEvaluator;
var init_judge_evaluator = __esm({
  "src/members/built-in/validate/evaluators/judge-evaluator.ts"() {
    "use strict";
    init_base_evaluator();
    JudgeEvaluator = class extends BaseEvaluator {
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
    };
  }
});

// src/members/built-in/validate/evaluators/nlp-evaluator.ts
var NLPEvaluator;
var init_nlp_evaluator = __esm({
  "src/members/built-in/validate/evaluators/nlp-evaluator.ts"() {
    "use strict";
    init_base_evaluator();
    NLPEvaluator = class extends BaseEvaluator {
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
    };
  }
});

// src/members/built-in/validate/evaluators/embedding-evaluator.ts
var EmbeddingEvaluator;
var init_embedding_evaluator = __esm({
  "src/members/built-in/validate/evaluators/embedding-evaluator.ts"() {
    "use strict";
    init_base_evaluator();
    EmbeddingEvaluator = class extends BaseEvaluator {
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
    };
  }
});

// src/members/built-in/validate/validate-member.ts
var ValidateMember;
var init_validate_member = __esm({
  "src/members/built-in/validate/validate-member.ts"() {
    "use strict";
    init_base_member();
    init_rule_evaluator();
    init_judge_evaluator();
    init_nlp_evaluator();
    init_embedding_evaluator();
    ValidateMember = class extends BaseMember {
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
          throw new Error('Validate member requires "content" in input');
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
    };
  }
});

// src/members/built-in/validate/index.ts
var validate_exports = {};
__export(validate_exports, {
  BaseEvaluator: () => BaseEvaluator,
  EmbeddingEvaluator: () => EmbeddingEvaluator,
  JudgeEvaluator: () => JudgeEvaluator,
  NLPEvaluator: () => NLPEvaluator,
  RuleEvaluator: () => RuleEvaluator,
  ValidateMember: () => ValidateMember
});
var init_validate = __esm({
  "src/members/built-in/validate/index.ts"() {
    "use strict";
    init_validate_member();
    init_base_evaluator();
    init_rule_evaluator();
    init_judge_evaluator();
    init_nlp_evaluator();
    init_embedding_evaluator();
  }
});

// src/members/built-in/rag/chunker.ts
var Chunker;
var init_chunker = __esm({
  "src/members/built-in/rag/chunker.ts"() {
    "use strict";
    Chunker = class {
      /**
       * Chunk text based on strategy
       */
      chunk(text, strategy, chunkSize, overlap) {
        switch (strategy) {
          case "fixed":
            return this.fixedSizeChunking(text, chunkSize, overlap);
          case "semantic":
            return this.semanticChunking(text, chunkSize, overlap);
          case "recursive":
            return this.recursiveChunking(text, chunkSize, overlap);
          default:
            return this.fixedSizeChunking(text, chunkSize, overlap);
        }
      }
      /**
       * Fixed-size chunking with overlap
       */
      fixedSizeChunking(text, chunkSize, overlap) {
        const chunks = [];
        const words = text.split(/\s+/);
        for (let i = 0; i < words.length; i += chunkSize - overlap) {
          const chunkWords = words.slice(i, i + chunkSize);
          const chunkText = chunkWords.join(" ");
          chunks.push({
            text: chunkText,
            index: chunks.length
          });
          if (i + chunkSize >= words.length) {
            break;
          }
        }
        return chunks;
      }
      /**
       * Semantic chunking (breaks on paragraph boundaries)
       */
      semanticChunking(text, chunkSize, overlap) {
        const chunks = [];
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = [];
        let currentSize = 0;
        for (const paragraph of paragraphs) {
          const words = paragraph.split(/\s+/);
          const paragraphSize = words.length;
          if (currentSize + paragraphSize > chunkSize && currentChunk.length > 0) {
            chunks.push({
              text: currentChunk.join("\n\n"),
              index: chunks.length
            });
            if (overlap > 0 && currentChunk.length > 0) {
              const lastParagraph = currentChunk[currentChunk.length - 1];
              currentChunk = [lastParagraph, paragraph];
              currentSize = lastParagraph.split(/\s+/).length + paragraphSize;
            } else {
              currentChunk = [paragraph];
              currentSize = paragraphSize;
            }
          } else {
            currentChunk.push(paragraph);
            currentSize += paragraphSize;
          }
        }
        if (currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.join("\n\n"),
            index: chunks.length
          });
        }
        return chunks;
      }
      /**
       * Recursive chunking (tries multiple separators)
       */
      recursiveChunking(text, chunkSize, overlap) {
        const separators = ["\n\n", "\n", ". ", " "];
        return this.recursiveChunkingHelper(text, chunkSize, overlap, separators, 0);
      }
      recursiveChunkingHelper(text, chunkSize, overlap, separators, depth) {
        const words = text.split(/\s+/);
        if (words.length <= chunkSize) {
          return [{ text, index: 0 }];
        }
        if (depth >= separators.length) {
          return this.fixedSizeChunking(text, chunkSize, overlap);
        }
        const separator = separators[depth];
        const parts = text.split(separator);
        const chunks = [];
        let currentChunk = [];
        let currentSize = 0;
        for (const part of parts) {
          const partWords = part.split(/\s+/);
          const partSize = partWords.length;
          if (currentSize + partSize > chunkSize && currentChunk.length > 0) {
            const chunkText = currentChunk.join(separator);
            const subChunks = this.recursiveChunkingHelper(
              chunkText,
              chunkSize,
              overlap,
              separators,
              depth + 1
            );
            chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
            currentChunk = [part];
            currentSize = partSize;
          } else {
            currentChunk.push(part);
            currentSize += partSize;
          }
        }
        if (currentChunk.length > 0) {
          const chunkText = currentChunk.join(separator);
          const subChunks = this.recursiveChunkingHelper(
            chunkText,
            chunkSize,
            overlap,
            separators,
            depth + 1
          );
          chunks.push(...subChunks.map((chunk, i) => ({ ...chunk, index: chunks.length + i })));
        }
        return chunks;
      }
    };
  }
});

// src/members/built-in/rag/rag-member.ts
var RAGMember;
var init_rag_member = __esm({
  "src/members/built-in/rag/rag-member.ts"() {
    "use strict";
    init_base_member();
    init_chunker();
    RAGMember = class extends BaseMember {
      constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.ragConfig = {
          operation: cfg?.operation || "search",
          chunkStrategy: cfg?.chunkStrategy || "semantic",
          chunkSize: cfg?.chunkSize || 512,
          overlap: cfg?.overlap || 50,
          embeddingModel: cfg?.embeddingModel || "@cf/baai/bge-base-en-v1.5",
          topK: cfg?.topK || 5,
          rerank: cfg?.rerank || false,
          rerankAlgorithm: cfg?.rerankAlgorithm || "cross-encoder"
        };
        this.chunker = new Chunker();
      }
      async run(context) {
        const input = context.input;
        const operation = this.ragConfig.operation;
        switch (operation) {
          case "index":
            return await this.indexContent(input);
          case "search":
            return await this.searchContent(input);
          default:
            throw new Error(`Unknown RAG operation: ${operation}`);
        }
      }
      /**
       * Index content into vector database
       */
      async indexContent(input) {
        if (!input.content) {
          throw new Error('Index operation requires "content" in input');
        }
        if (!input.id) {
          throw new Error('Index operation requires "id" in input');
        }
        const chunks = this.chunker.chunk(
          input.content,
          this.ragConfig.chunkStrategy,
          this.ragConfig.chunkSize,
          this.ragConfig.overlap
        );
        return {
          indexed: chunks.length,
          chunks: chunks.length,
          embeddingModel: this.ragConfig.embeddingModel,
          chunkStrategy: this.ragConfig.chunkStrategy
        };
      }
      /**
       * Search content in vector database
       */
      async searchContent(input) {
        if (!input.query) {
          throw new Error('Search operation requires "query" in input');
        }
        return {
          results: [],
          count: 0,
          reranked: this.ragConfig.rerank
        };
      }
      /**
       * Generate embeddings using Cloudflare AI
       */
      async generateEmbeddings(chunks) {
        return chunks.map(() => Array(384).fill(0));
      }
      /**
       * Generate a single embedding
       */
      async generateEmbedding(text) {
        return Array(384).fill(0);
      }
      /**
       * Store chunks in Vectorize
       */
      async storeInVectorize(docId, chunks, embeddings, metadata) {
      }
      /**
       * Search Vectorize for similar vectors
       */
      async searchVectorize(queryEmbedding, filter) {
        return [];
      }
      /**
       * Rerank search results
       */
      async rerank(query, results) {
        return results;
      }
    };
  }
});

// src/members/built-in/rag/index.ts
var rag_exports = {};
__export(rag_exports, {
  Chunker: () => Chunker,
  RAGMember: () => RAGMember
});
var init_rag = __esm({
  "src/members/built-in/rag/index.ts"() {
    "use strict";
    init_rag_member();
    init_chunker();
  }
});

// src/members/built-in/hitl/hitl-member.ts
var logger2, HITLMember;
var init_hitl_member = __esm({
  "src/members/built-in/hitl/hitl-member.ts"() {
    "use strict";
    init_base_member();
    init_observability();
    logger2 = createLogger({ serviceName: "hitl-member" });
    HITLMember = class extends BaseMember {
      constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.hitlConfig = {
          action: cfg?.action || "suspend",
          timeout: cfg?.timeout || 864e5,
          // 24 hours
          notificationChannel: cfg?.notificationChannel,
          notificationConfig: cfg?.notificationConfig
        };
      }
      async run(context) {
        const action = this.hitlConfig.action;
        switch (action) {
          case "suspend":
            return await this.suspendForApproval(context);
          case "resume":
            return await this.resumeExecution(context);
          case "approve":
            return await this.approveExecution(context);
          case "reject":
            return await this.rejectExecution(context);
          default:
            throw new Error(`Unknown HITL action: ${action}`);
        }
      }
      /**
       * Suspend execution and wait for approval
       */
      async suspendForApproval(context) {
        const input = context.input;
        if (!input.approvalData) {
          throw new Error('Suspend action requires "approvalData" in input');
        }
        const executionId = this.generateExecutionId();
        const expiresAt = Date.now() + this.hitlConfig.timeout;
        const approvalState = {
          executionId,
          state: context.state || {},
          suspendedAt: Date.now(),
          expiresAt,
          approvalData: input.approvalData,
          status: "suspended"
        };
        if (this.hitlConfig.notificationChannel) {
          await this.sendNotification(executionId, input.approvalData);
        }
        const approvalUrl = `https://your-app.com/approve/${executionId}`;
        return {
          status: "suspended",
          executionId,
          approvalUrl,
          expiresAt
        };
      }
      /**
       * Resume execution after approval/rejection
       */
      async resumeExecution(context) {
        const input = context.input;
        if (!input.executionId) {
          throw new Error('Resume action requires "executionId" in input');
        }
        const approvalState = {
          executionId: input.executionId,
          state: {},
          suspendedAt: Date.now() - 1e3,
          expiresAt: Date.now() + 864e5,
          approvalData: {},
          status: input.approved ? "approved" : "rejected",
          comments: input.comments
        };
        if (Date.now() > approvalState.expiresAt) {
          return {
            status: "expired",
            executionId: input.executionId,
            comments: "Approval request expired"
          };
        }
        return {
          status: approvalState.status,
          executionId: input.executionId,
          state: approvalState.state,
          comments: input.comments
        };
      }
      /**
       * Approve execution (shorthand for resume with approved=true)
       */
      async approveExecution(context) {
        const input = context.input;
        return await this.resumeExecution({
          ...context,
          input: { ...input, approved: true }
        });
      }
      /**
       * Reject execution (shorthand for resume with approved=false)
       */
      async rejectExecution(context) {
        const input = context.input;
        return await this.resumeExecution({
          ...context,
          input: { ...input, approved: false }
        });
      }
      /**
       * Send notification to configured channel
       */
      async sendNotification(executionId, approvalData) {
        const channel = this.hitlConfig.notificationChannel;
        const config = this.hitlConfig.notificationConfig || {};
        switch (channel) {
          case "slack":
            await this.sendSlackNotification(executionId, approvalData, config);
            break;
          case "email":
            await this.sendEmailNotification(executionId, approvalData, config);
            break;
          case "webhook":
            await this.sendWebhookNotification(executionId, approvalData, config);
            break;
        }
      }
      /**
       * Send Slack notification
       */
      async sendSlackNotification(executionId, approvalData, config) {
        const webhookUrl = config.webhookUrl;
        if (!webhookUrl || typeof webhookUrl !== "string") {
          throw new Error("Slack notification requires webhookUrl in notificationConfig");
        }
        const message = {
          text: `\u{1F514} Approval Required`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "\u{1F514} Approval Required"
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Execution ID:* ${executionId}
*Data:* ${JSON.stringify(approvalData, null, 2)}`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Approve"
                  },
                  style: "primary",
                  url: `https://your-app.com/approve/${executionId}?action=approve`
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Reject"
                  },
                  style: "danger",
                  url: `https://your-app.com/approve/${executionId}?action=reject`
                }
              ]
            }
          ]
        };
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message)
        });
      }
      /**
       * Send email notification
       */
      async sendEmailNotification(executionId, approvalData, config) {
        logger2.debug("Email notification not yet implemented", {
          executionId
        });
      }
      /**
       * Send webhook notification
       */
      async sendWebhookNotification(executionId, approvalData, config) {
        const webhookUrl = config.webhookUrl;
        if (!webhookUrl || typeof webhookUrl !== "string") {
          throw new Error("Webhook notification requires webhookUrl in notificationConfig");
        }
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            executionId,
            approvalData,
            approvalUrl: `https://your-app.com/approve/${executionId}`,
            expiresAt: Date.now() + this.hitlConfig.timeout
          })
        });
      }
      /**
       * Generate a cryptographically secure unique execution ID
       */
      generateExecutionId() {
        return `exec_${crypto.randomUUID()}`;
      }
      /**
       * Get Durable Object for approval state
       */
      getApprovalDO(executionId) {
        return null;
      }
    };
  }
});

// src/members/built-in/hitl/index.ts
var hitl_exports = {};
__export(hitl_exports, {
  HITLMember: () => HITLMember
});
var init_hitl = __esm({
  "src/members/built-in/hitl/index.ts"() {
    "use strict";
    init_hitl_member();
  }
});

// src/members/built-in/fetch/fetch-member.ts
var FetchMember;
var init_fetch_member = __esm({
  "src/members/built-in/fetch/fetch-member.ts"() {
    "use strict";
    init_base_member();
    FetchMember = class extends BaseMember {
      constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.fetchConfig = {
          method: cfg?.method || "GET",
          headers: cfg?.headers || {},
          retry: cfg?.retry !== void 0 ? cfg.retry : 3,
          timeout: cfg?.timeout || 3e4,
          retryDelay: cfg?.retryDelay || 1e3
        };
      }
      async run(context) {
        const input = context.input;
        if (!input.url) {
          throw new Error('Fetch member requires "url" in input');
        }
        const startTime = Date.now();
        const maxRetries = this.fetchConfig.retry || 0;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const result = await this.executeRequest(input, attempt);
            return {
              ...result,
              duration: Date.now() - startTime,
              attempt: attempt + 1
            };
          } catch (error) {
            if (attempt === maxRetries) {
              throw new Error(
                `Fetch failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`
              );
            }
            const delay = this.fetchConfig.retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
          }
        }
        throw new Error("Fetch failed: Maximum retries exceeded");
      }
      async executeRequest(input, attempt) {
        const url = input.url;
        const method = this.fetchConfig.method || "GET";
        const headers = {
          ...this.fetchConfig.headers,
          ...input.headers
        };
        const options = {
          method,
          headers,
          signal: AbortSignal.timeout(this.fetchConfig.timeout)
        };
        if (input.body && ["POST", "PUT", "PATCH"].includes(method)) {
          if (typeof input.body === "object") {
            options.body = JSON.stringify(input.body);
            if (!headers["Content-Type"]) {
              headers["Content-Type"] = "application/json";
            }
          } else {
            options.body = input.body;
          }
        }
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";
        let body;
        if (contentType.includes("application/json")) {
          body = await response.json();
        } else if (contentType.includes("text/")) {
          body = await response.text();
        } else {
          body = await response.text();
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body
        };
      }
      sleep(ms) {
        return new Promise((resolve2) => setTimeout(resolve2, ms));
      }
    };
  }
});

// src/members/built-in/fetch/index.ts
var fetch_exports = {};
__export(fetch_exports, {
  FetchMember: () => FetchMember
});
var init_fetch = __esm({
  "src/members/built-in/fetch/index.ts"() {
    "use strict";
    init_fetch_member();
  }
});

// src/members/built-in/queries/queries-member.ts
var QueriesMember;
var init_queries_member = __esm({
  "src/members/built-in/queries/queries-member.ts"() {
    "use strict";
    init_base_member();
    QueriesMember = class extends BaseMember {
      constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.queriesConfig = {
          defaultDatabase: cfg?.defaultDatabase,
          cacheTTL: cfg?.cacheTTL,
          maxRows: cfg?.maxRows,
          timeout: cfg?.timeout,
          readOnly: cfg?.readOnly !== void 0 ? cfg.readOnly : false,
          transform: cfg?.transform || "none",
          includeMetadata: cfg?.includeMetadata !== void 0 ? cfg.includeMetadata : true
        };
      }
      async run(context) {
        const input = context.input;
        if (!input.queryName && !input.sql) {
          throw new Error("Either queryName or sql must be provided");
        }
        if (input.queryName && input.sql) {
          throw new Error("Cannot specify both queryName and sql");
        }
        const query = input.queryName ? await this.loadQueryFromCatalog(input.queryName) : { sql: input.sql, params: {}, database: input.database };
        const database = input.database || query.database || this.queriesConfig.defaultDatabase;
        if (!database) {
          throw new Error("No database specified and no default database configured");
        }
        const hyperdrive = this.env[database];
        if (!hyperdrive) {
          throw new Error(`Hyperdrive binding not found: ${database}`);
        }
        if (this.queriesConfig.readOnly && this.isWriteQuery(query.sql)) {
          throw new Error("Write operations not allowed in read-only mode");
        }
        const { sql, params } = this.prepareQuery(query.sql, input.input || query.params || {});
        const startTime = Date.now();
        const result = await this.executeQuery(hyperdrive, sql, params);
        const executionTime = Date.now() - startTime;
        let rows = result.rows;
        if (this.queriesConfig.transform === "camelCase") {
          rows = this.toCamelCase(rows);
        } else if (this.queriesConfig.transform === "snakeCase") {
          rows = this.toSnakeCase(rows);
        }
        if (this.queriesConfig.maxRows && rows.length > this.queriesConfig.maxRows) {
          rows = rows.slice(0, this.queriesConfig.maxRows);
        }
        const output = {
          rows,
          count: rows.length,
          metadata: {
            columns: result.columns || [],
            executionTime,
            cached: false,
            // TODO: Implement caching
            database,
            ...this.queriesConfig.includeMetadata && { query: sql }
          }
        };
        return output;
      }
      /**
       * Load query from catalog
       */
      async loadQueryFromCatalog(queryName) {
        throw new Error(
          `Query catalog not yet implemented. Use inline SQL with 'sql' parameter instead of 'queryName'.`
        );
      }
      /**
       * Prepare query with parameters
       */
      prepareQuery(sql, input) {
        if (Array.isArray(input)) {
          return { sql, params: input };
        }
        const params = [];
        let paramIndex = 1;
        const convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
          if (!(paramName in input)) {
            throw new Error(`Missing parameter: ${paramName}`);
          }
          params.push(input[paramName]);
          return `$${paramIndex++}`;
        });
        return { sql: convertedSql, params };
      }
      /**
       * Execute query via Hyperdrive/D1
       */
      async executeQuery(hyperdrive, sql, params) {
        let stmt = hyperdrive.prepare(sql);
        if (params.length > 0) {
          stmt = stmt.bind(...params);
        }
        const executePromise = stmt.all();
        const result = this.queriesConfig.timeout ? await Promise.race([
          executePromise,
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Query timeout")), this.queriesConfig.timeout)
          )
        ]) : await executePromise;
        const columns = result.results.length > 0 ? Object.keys(result.results[0]) : result.meta?.columns ? result.meta.columns.map((c) => c.name) : [];
        return {
          rows: result.results,
          columns
        };
      }
      /**
       * Check if query is a write operation
       */
      isWriteQuery(sql) {
        const upperSQL = sql.trim().toUpperCase();
        return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL);
      }
      /**
       * Transform object keys to camelCase
       */
      toCamelCase(rows) {
        return rows.map((row) => {
          const transformed = {};
          for (const [key, value] of Object.entries(row)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            transformed[camelKey] = value;
          }
          return transformed;
        });
      }
      /**
       * Transform object keys to snake_case
       */
      toSnakeCase(rows) {
        return rows.map((row) => {
          const transformed = {};
          for (const [key, value] of Object.entries(row)) {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            transformed[snakeKey] = value;
          }
          return transformed;
        });
      }
    };
  }
});

// src/members/built-in/queries/index.ts
var queries_exports = {};
__export(queries_exports, {
  QueriesMember: () => QueriesMember
});
var init_queries = __esm({
  "src/members/built-in/queries/index.ts"() {
    "use strict";
    init_queries_member();
  }
});

// src/cli/index.ts
import { Command as Command10 } from "commander";
import chalk10 from "chalk";

// src/cli/commands/init.ts
import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
function createInitCommand() {
  const init = new Command("init");
  init.description(
    'Initialize a new Conductor project (use "." for current dir or "my-project" for new)'
  ).argument("[directory]", "Project directory (default: current directory)", ".").option("--template <name>", "Template to use (cloudflare)", "cloudflare").option("--force", "Overwrite existing files").option("--no-examples", "Skip example files (only include minimal starter files)").action(async (directory, options) => {
    try {
      console.log("");
      console.log(chalk.bold("\u{1F3AF} Initializing Conductor project..."));
      console.log("");
      const targetDir = path.resolve(process.cwd(), directory);
      let directoryExists = false;
      let isConductorProject = false;
      let hasFiles = false;
      try {
        const files = await fs.readdir(targetDir);
        directoryExists = true;
        hasFiles = files.length > 0;
        const conductorMarkers = [
          "conductor.config.ts",
          "conductor.config.js",
          "ensembles",
          "members"
        ];
        for (const marker of conductorMarkers) {
          try {
            await fs.access(path.join(targetDir, marker));
            isConductorProject = true;
            break;
          } catch {
          }
        }
      } catch (error) {
        await fs.mkdir(targetDir, { recursive: true });
      }
      if (isConductorProject && !options.force) {
        console.error(chalk.yellow("\u26A0 Detected existing Conductor project"));
        console.error("");
        console.error(chalk.dim("This directory appears to already have Conductor files."));
        console.error(chalk.dim("Initializing will overwrite:"));
        console.error(chalk.dim("  - conductor.config.ts"));
        console.error(chalk.dim("  - ensembles/"));
        console.error(chalk.dim("  - members/"));
        console.error(chalk.dim("  - prompts/"));
        console.error(chalk.dim("  - configs/"));
        console.error(chalk.dim("  - tests/"));
        console.error("");
        console.error(chalk.dim("Use --force to overwrite existing Conductor files"));
        console.error("");
        process.exit(1);
      }
      if (hasFiles && !isConductorProject && !options.force) {
        console.error(chalk.yellow("\u26A0 Directory is not empty"));
        console.error("");
        console.error(chalk.dim("This directory contains files but is not a Conductor project."));
        console.error(
          chalk.dim("Initializing will add Conductor structure alongside existing files.")
        );
        console.error("");
        console.error(chalk.dim("Use --force to proceed"));
        console.error("");
        process.exit(1);
      }
      let packageRoot = process.cwd();
      let currentDir = fileURLToPath(import.meta.url);
      while (currentDir !== path.dirname(currentDir)) {
        currentDir = path.dirname(currentDir);
        try {
          const pkgPath2 = path.join(currentDir, "package.json");
          await fs.access(pkgPath2);
          const pkgContent2 = await fs.readFile(pkgPath2, "utf-8");
          const pkg2 = JSON.parse(pkgContent2);
          if (pkg2.name === "@ensemble-edge/conductor") {
            packageRoot = currentDir;
            break;
          }
        } catch {
        }
      }
      const templatePath = path.join(
        packageRoot,
        "catalog",
        "cloud",
        options.template,
        "templates"
      );
      try {
        await fs.access(templatePath);
      } catch {
        console.error(chalk.red(`Error: Template '${options.template}' not found`));
        console.error("");
        console.error(chalk.dim(`Searched at: ${templatePath}`));
        console.error(chalk.dim("Available templates:"));
        console.error(chalk.dim("  - cloudflare (default)"));
        console.error("");
        process.exit(1);
      }
      console.log(chalk.cyan(`Template: ${options.template}`));
      console.log(chalk.cyan(`Target: ${targetDir}`));
      console.log(chalk.cyan(`Examples: ${options.examples !== false ? "included" : "excluded"}`));
      console.log("");
      const pkgPath = path.join(packageRoot, "package.json");
      const pkgContent = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgContent);
      const conductorVersion = pkg.version;
      await copyDirectory(templatePath, targetDir, options.force || false, options.examples !== false, conductorVersion);
      console.log(chalk.green("\u2713 Project initialized successfully"));
      console.log("");
      console.log(chalk.bold("Next steps:"));
      console.log("");
      if (directory !== ".") {
        console.log(chalk.dim(`  1. cd ${directory}`));
      }
      console.log(chalk.dim(`  ${directory !== "." ? "2" : "1"}. npm install`));
      console.log(chalk.dim(`  ${directory !== "." ? "3" : "2"}. Review the generated files:`));
      console.log(chalk.dim("     - ensembles/    : Your workflows"));
      console.log(chalk.dim("     - members/      : AI members, functions, and agents"));
      console.log(chalk.dim("     - prompts/      : Prompt templates"));
      console.log(chalk.dim("     - configs/      : Configuration files"));
      console.log(
        chalk.dim(
          `  ${directory !== "." ? "4" : "3"}. npx wrangler dev  : Start local development`
        )
      );
      console.log("");
      console.log(chalk.dim("Documentation: https://docs.ensemble-edge.com/conductor"));
      console.log("");
    } catch (error) {
      console.error("");
      console.error(chalk.red("\u2717 Failed to initialize project"));
      console.error("");
      console.error(chalk.dim(error.message));
      if (error.stack) {
        console.error(chalk.dim(error.stack));
      }
      console.error("");
      process.exit(1);
    }
  });
  return init;
}
async function copyDirectory(src, dest, force, includeExamples = true, conductorVersion) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (!includeExamples && entry.name === "examples" && entry.isDirectory()) {
      console.log(chalk.dim(`  \u2298 Skipping ${path.relative(dest, destPath)} (--no-examples)`));
      continue;
    }
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, force, includeExamples, conductorVersion);
    } else {
      if (!force) {
        try {
          await fs.access(destPath);
          console.log(chalk.yellow(`  \u2298 Skipping ${entry.name} (already exists)`));
          continue;
        } catch {
        }
      }
      if (conductorVersion && entry.name === "package.json") {
        let content = await fs.readFile(srcPath, "utf-8");
        content = content.replace(/__CONDUCTOR_VERSION__/g, conductorVersion);
        await fs.writeFile(destPath, content, "utf-8");
        console.log(chalk.dim(`  \u2713 Created ${path.relative(dest, destPath)} (version: ${conductorVersion})`));
      } else {
        await fs.copyFile(srcPath, destPath);
        console.log(chalk.dim(`  \u2713 Created ${path.relative(dest, destPath)}`));
      }
    }
  }
}

// src/cli/commands/exec.ts
import { Command as Command2 } from "commander";
import chalk2 from "chalk";

// src/members/built-in/registry.ts
var BuiltInMemberRegistry = class {
  constructor() {
    this.members = /* @__PURE__ */ new Map();
  }
  /**
   * Register a built-in member
   */
  register(metadata, factory) {
    this.members.set(metadata.name, {
      metadata,
      factory,
      loaded: false
    });
  }
  /**
   * Check if a member is built-in
   */
  isBuiltIn(name) {
    return this.members.has(name);
  }
  /**
   * Get a built-in member instance (lazy loading)
   */
  create(name, config, env) {
    const entry = this.members.get(name);
    if (!entry) {
      throw new Error(
        `Built-in member "${name}" not found. Available: ${this.getAvailableNames().join(", ")}`
      );
    }
    entry.loaded = true;
    return entry.factory(config, env);
  }
  /**
   * Get metadata for a built-in member
   */
  getMetadata(name) {
    return this.members.get(name)?.metadata;
  }
  /**
   * List all built-in members
   */
  list() {
    return Array.from(this.members.values()).map((entry) => entry.metadata);
  }
  /**
   * Get available member names
   */
  getAvailableNames() {
    return Array.from(this.members.keys());
  }
  /**
   * Get members by type
   */
  listByType(type) {
    return this.list().filter((m) => m.type === type);
  }
  /**
   * Get members by tag
   */
  listByTag(tag) {
    return this.list().filter((m) => m.tags?.includes(tag));
  }
};
var registry = null;
function getBuiltInRegistry() {
  if (!registry) {
    registry = new BuiltInMemberRegistry();
    registerAllBuiltInMembers(registry);
  }
  return registry;
}
function registerAllBuiltInMembers(registry2) {
  registry2.register(
    {
      name: "scrape",
      version: "1.0.0",
      description: "3-tier web scraping with bot protection and fallback strategies",
      type: "Function" /* Function */,
      tags: ["web", "scraping", "cloudflare", "browser-rendering"],
      examples: [
        {
          name: "basic-scrape",
          description: "Simple web scraping with balanced strategy",
          input: { url: "https://example.com" },
          config: { strategy: "balanced", returnFormat: "markdown" },
          output: { markdown: "...", tier: 1, duration: 350 }
        },
        {
          name: "aggressive-scrape",
          description: "Aggressive scraping with all fallback tiers",
          input: { url: "https://example.com" },
          config: { strategy: "aggressive", returnFormat: "markdown" },
          output: { markdown: "...", tier: 3, duration: 4500 }
        }
      ],
      documentation: "https://docs.conductor.dev/built-in-members/scrape"
    },
    (config, env) => {
      const { ScrapeMember: ScrapeMember2 } = (init_scrape(), __toCommonJS(scrape_exports));
      return new ScrapeMember2(config, env);
    }
  );
  registry2.register(
    {
      name: "validate",
      version: "1.0.0",
      description: "Validation and evaluation with pluggable evaluators (judge, NLP, embedding, rule)",
      type: "Scoring" /* Scoring */,
      tags: ["validation", "evaluation", "scoring", "quality"],
      examples: [
        {
          name: "rule-validation",
          description: "Validate content using custom rules",
          input: { content: "Sample content..." },
          config: {
            evalType: "rule",
            rules: [{ name: "minLength", check: "content.length >= 800", weight: 0.5 }],
            threshold: 0.7
          },
          output: { passed: true, score: 0.85, details: {} }
        },
        {
          name: "llm-judge",
          description: "Evaluate quality using LLM judge",
          input: { content: "Sample content...", reference: "Expected output..." },
          config: {
            evalType: "judge",
            criteria: [
              { name: "accuracy", weight: 0.4 },
              { name: "relevance", weight: 0.3 }
            ],
            threshold: 0.8
          }
        }
      ],
      documentation: "https://docs.conductor.dev/built-in-members/validate"
    },
    (config, env) => {
      const { ValidateMember: ValidateMember2 } = (init_validate(), __toCommonJS(validate_exports));
      return new ValidateMember2(config, env);
    }
  );
  registry2.register(
    {
      name: "rag",
      version: "1.0.0",
      description: "RAG system using Cloudflare Vectorize and AI embeddings",
      type: "Data" /* Data */,
      tags: ["rag", "vectorize", "embeddings", "search", "ai"],
      examples: [
        {
          name: "index-content",
          description: "Index content into vector database",
          input: {
            content: "Document content...",
            id: "doc-123",
            source: "https://example.com"
          },
          config: {
            operation: "index",
            chunkStrategy: "semantic",
            chunkSize: 512
          },
          output: { indexed: 10, chunks: 10 }
        },
        {
          name: "search-content",
          description: "Search for relevant content",
          input: { query: "What is the company mission?" },
          config: {
            operation: "search",
            topK: 5,
            rerank: true
          },
          output: { results: [], count: 5 }
        }
      ],
      documentation: "https://docs.conductor.dev/built-in-members/rag"
    },
    (config, env) => {
      const { RAGMember: RAGMember2 } = (init_rag(), __toCommonJS(rag_exports));
      return new RAGMember2(config, env);
    }
  );
  registry2.register(
    {
      name: "hitl",
      version: "1.0.0",
      description: "Human-in-the-loop workflows with approval gates and notifications",
      type: "Function" /* Function */,
      tags: ["workflow", "approval", "human-in-loop", "durable-objects"],
      examples: [
        {
          name: "approval-gate",
          description: "Suspend workflow for manual approval",
          input: {
            approvalData: {
              transaction: { amount: 1e4, to: "account-123" },
              risk_score: 0.85
            }
          },
          config: {
            action: "suspend",
            timeout: 864e5,
            notificationChannel: "slack"
          },
          output: {
            status: "suspended",
            executionId: "exec-123",
            approvalUrl: "https://app.com/approve/exec-123"
          }
        }
      ],
      documentation: "https://docs.conductor.dev/built-in-members/hitl"
    },
    (config, env) => {
      const { HITLMember: HITLMember2 } = (init_hitl(), __toCommonJS(hitl_exports));
      return new HITLMember2(config, env);
    }
  );
  registry2.register(
    {
      name: "fetch",
      version: "1.0.0",
      description: "HTTP client with retry logic and exponential backoff",
      type: "Function" /* Function */,
      tags: ["http", "api", "fetch", "retry"],
      examples: [
        {
          name: "basic-fetch",
          description: "Simple HTTP GET request",
          input: { url: "https://api.example.com/data" },
          config: { method: "GET", retry: 3, timeout: 5e3 },
          output: { status: 200, body: {}, headers: {} }
        },
        {
          name: "post-with-retry",
          description: "POST request with retry logic",
          input: {
            url: "https://api.example.com/submit",
            body: { data: "value" }
          },
          config: {
            method: "POST",
            retry: 5,
            timeout: 1e4,
            headers: { "Content-Type": "application/json" }
          }
        }
      ],
      documentation: "https://docs.conductor.dev/built-in-members/fetch"
    },
    (config, env) => {
      const { FetchMember: FetchMember2 } = (init_fetch(), __toCommonJS(fetch_exports));
      return new FetchMember2(config, env);
    }
  );
  registry2.register(
    {
      name: "queries",
      version: "1.0.0",
      description: "Execute SQL queries across Hyperdrive-connected databases with query catalog support",
      type: "Data" /* Data */,
      tags: ["sql", "database", "queries", "hyperdrive", "analytics"],
      examples: [
        {
          name: "catalog-query",
          description: "Execute query from catalog",
          input: {
            queryName: "user-analytics",
            input: {
              startDate: "2024-01-01",
              endDate: "2024-01-31"
            }
          },
          config: {
            defaultDatabase: "analytics",
            readOnly: true,
            transform: "camelCase"
          },
          output: {
            rows: [],
            count: 25,
            metadata: {
              columns: ["date", "user_count", "active_users"],
              executionTime: 150,
              cached: false,
              database: "analytics"
            }
          }
        },
        {
          name: "inline-query",
          description: "Execute inline SQL query",
          input: {
            sql: "SELECT * FROM users WHERE created_at > $1 LIMIT 100",
            input: ["2024-01-01"]
          },
          config: {
            defaultDatabase: "production",
            readOnly: true,
            maxRows: 100
          }
        }
      ],
      inputSchema: {
        type: "object",
        properties: {
          queryName: { type: "string", description: "Query name from catalog" },
          sql: { type: "string", description: "Inline SQL query" },
          input: {
            oneOf: [{ type: "object" }, { type: "array" }],
            description: "Query parameters"
          },
          database: { type: "string", description: "Database alias" }
        }
      },
      outputSchema: {
        type: "object",
        properties: {
          rows: { type: "array" },
          count: { type: "number" },
          metadata: { type: "object" }
        }
      },
      configSchema: {
        type: "object",
        properties: {
          defaultDatabase: { type: "string" },
          cacheTTL: { type: "number" },
          maxRows: { type: "number" },
          timeout: { type: "number" },
          readOnly: { type: "boolean" },
          transform: { type: "string", enum: ["none", "camelCase", "snakeCase"] },
          includeMetadata: { type: "boolean" }
        }
      },
      documentation: "https://docs.conductor.dev/built-in-members/queries"
    },
    (config, env) => {
      const { QueriesMember: QueriesMember2 } = (init_queries(), __toCommonJS(queries_exports));
      return new QueriesMember2(config, env);
    }
  );
}

// src/sdk/client.ts
var ConductorError = class extends Error {
  constructor(code, message, details, requestId) {
    super(message);
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.name = "ConductorError";
  }
};
var ConductorClient = class {
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 3e4;
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers
    };
    if (this.apiKey) {
      this.headers["X-API-Key"] = this.apiKey;
    }
  }
  async execute(options) {
    const response = await this.request("POST", "/api/v1/execute", options);
    return response;
  }
  async listMembers() {
    const response = await this.request(
      "GET",
      "/api/v1/members"
    );
    return response.members;
  }
  async getMember(name) {
    const response = await this.request("GET", `/api/v1/members/${name}`);
    return response;
  }
  async health() {
    const response = await this.request("GET", "/health");
    return response;
  }
  async ready() {
    const response = await this.request("GET", "/health/ready");
    return response.ready;
  }
  async alive() {
    const response = await this.request("GET", "/health/live");
    return response.alive;
  }
  async request(method, path5, body) {
    const url = `${this.baseUrl}${path5}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        throw new ConductorError(
          data.error || "UnknownError",
          data.message || "An error occurred",
          data.details,
          data.requestId
        );
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new ConductorError("TimeoutError", `Request timeout after ${this.timeout}ms`);
      }
      if (error instanceof ConductorError) {
        throw error;
      }
      throw new ConductorError("NetworkError", error.message || "Network error occurred");
    }
  }
};
function createClient(config) {
  return new ConductorClient(config);
}

// src/cli/commands/exec.ts
function createExecCommand() {
  const exec = new Command2("exec").description("Execute a member").argument("<member>", "Member name to execute").option("-i, --input <json>", "Input data as JSON string").option("-c, --config <json>", "Configuration as JSON string").option("-f, --file <path>", "Input data from JSON file").option("--remote", "Force remote execution via API").option("--api-url <url>", "API URL (default: from CONDUCTOR_API_URL env)").option("--api-key <key>", "API key (default: from CONDUCTOR_API_KEY env)").option("--output <format>", "Output format: json, pretty, or raw (default: pretty)", "pretty").action(async (memberName, options) => {
    try {
      let input = {};
      if (options.input) {
        input = JSON.parse(options.input);
      } else if (options.file) {
        const fs6 = await import("fs");
        const content = fs6.readFileSync(options.file, "utf-8");
        input = JSON.parse(content);
      }
      let config = {};
      if (options.config) {
        config = JSON.parse(options.config);
      }
      const forceRemote = options.remote;
      const canExecuteLocally = !forceRemote && canExecuteLocal();
      let result;
      let executionMode;
      if (canExecuteLocally) {
        console.log(chalk2.dim("\u2192 Executing locally..."));
        executionMode = "local";
        result = await executeLocal(memberName, input, config);
      } else {
        const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL;
        const apiKey = options.apiKey || process.env.CONDUCTOR_API_KEY;
        if (!apiUrl) {
          console.error(
            chalk2.red("Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url")
          );
          process.exit(1);
        }
        console.log(chalk2.dim(`\u2192 Executing remotely via ${apiUrl}...`));
        executionMode = "remote";
        result = await executeRemote(memberName, input, config, apiUrl, apiKey);
      }
      if (options.output === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else if (options.output === "raw") {
        console.log(result.data);
      } else {
        console.log("");
        if (result.success) {
          console.log(chalk2.green("\u2713 Execution successful"));
          console.log("");
          console.log(chalk2.bold("Result:"));
          console.log(JSON.stringify(result.data, null, 2));
          console.log("");
          console.log(chalk2.dim(`Duration: ${result.metadata?.duration || "N/A"}ms`));
          console.log(chalk2.dim(`Mode: ${executionMode}`));
        } else {
          console.log(chalk2.red("\u2717 Execution failed"));
          console.log("");
          console.log(chalk2.bold("Error:"));
          console.log(chalk2.red(result.error || "Unknown error"));
        }
      }
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error(chalk2.red("Error:"), error.message);
      if (options.output === "json") {
        console.log(JSON.stringify({ error: error.message }, null, 2));
      }
      process.exit(1);
    }
  });
  return exec;
}
function canExecuteLocal() {
  try {
    const registry2 = getBuiltInRegistry();
    return !!registry2;
  } catch {
    return false;
  }
}
async function executeLocal(memberName, input, config) {
  const startTime = Date.now();
  const registry2 = getBuiltInRegistry();
  if (!registry2.isBuiltIn(memberName)) {
    throw new Error(`Member not found: ${memberName}`);
  }
  const metadata = registry2.getMetadata(memberName);
  if (!metadata) {
    throw new Error(`Member metadata not found: ${memberName}`);
  }
  const memberConfig = {
    name: memberName,
    type: metadata.type,
    config
  };
  const mockEnv = {};
  const member = registry2.create(memberName, memberConfig, mockEnv);
  const context = {
    input,
    env: mockEnv,
    ctx: {
      waitUntil: () => {
      },
      passThroughOnException: () => {
      }
    }
  };
  const result = await member.execute(context);
  return {
    success: result.success,
    data: result.data,
    error: result.error,
    metadata: {
      executionId: `local-${Date.now()}`,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    }
  };
}
async function executeRemote(memberName, input, config, apiUrl, apiKey) {
  const client = createClient({
    baseUrl: apiUrl,
    apiKey
  });
  const result = await client.execute({
    member: memberName,
    input,
    config
  });
  return result;
}

// src/cli/commands/members.ts
import { Command as Command3 } from "commander";
import chalk3 from "chalk";
function createMembersCommand() {
  const members = new Command3("members").description("Manage and inspect members");
  members.command("list").description("List all available members").option("--remote", "List from API instead of local").option("--api-url <url>", "API URL (default: from CONDUCTOR_API_URL env)").option("--api-key <key>", "API key (default: from CONDUCTOR_API_KEY env)").option("--output <format>", "Output format: json, table, or simple (default: table)", "table").action(async (options) => {
    try {
      let membersList;
      if (options.remote) {
        const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL;
        const apiKey = options.apiKey || process.env.CONDUCTOR_API_KEY;
        if (!apiUrl) {
          console.error(
            chalk3.red("Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url")
          );
          process.exit(1);
        }
        const client = createClient({ baseUrl: apiUrl, apiKey });
        membersList = await client.listMembers();
      } else {
        const registry2 = getBuiltInRegistry();
        const builtInMembers = registry2.list();
        membersList = builtInMembers.map((m) => ({
          name: m.name,
          type: m.type,
          version: m.version,
          description: m.description,
          builtIn: true
        }));
      }
      if (options.output === "json") {
        console.log(JSON.stringify(membersList, null, 2));
      } else if (options.output === "simple") {
        membersList.forEach((m) => console.log(m.name));
      } else {
        console.log("");
        console.log(chalk3.bold("Available Members:"));
        console.log("");
        membersList.forEach((m) => {
          console.log(
            `${chalk3.cyan(m.name.padEnd(15))} ${chalk3.dim(m.type.padEnd(10))} ${m.description || ""}`
          );
        });
        console.log("");
        console.log(chalk3.dim(`Total: ${membersList.length} members`));
      }
    } catch (error) {
      console.error(chalk3.red("Error:"), error.message);
      process.exit(1);
    }
  });
  members.command("info").description("Get detailed information about a member").argument("<name>", "Member name").option("--remote", "Get info from API instead of local").option("--api-url <url>", "API URL (default: from CONDUCTOR_API_URL env)").option("--api-key <key>", "API key (default: from CONDUCTOR_API_KEY env)").option("--output <format>", "Output format: json or pretty (default: pretty)", "pretty").action(async (memberName, options) => {
    try {
      let memberInfo;
      if (options.remote) {
        const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL;
        const apiKey = options.apiKey || process.env.CONDUCTOR_API_KEY;
        if (!apiUrl) {
          console.error(
            chalk3.red("Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url")
          );
          process.exit(1);
        }
        const client = createClient({ baseUrl: apiUrl, apiKey });
        memberInfo = await client.getMember(memberName);
      } else {
        const registry2 = getBuiltInRegistry();
        if (!registry2.isBuiltIn(memberName)) {
          console.error(chalk3.red(`Error: Member not found: ${memberName}`));
          process.exit(1);
        }
        const metadata = registry2.getMetadata(memberName);
        memberInfo = {
          name: metadata.name,
          type: metadata.type,
          version: metadata.version,
          description: metadata.description,
          builtIn: true,
          config: {
            schema: metadata.configSchema,
            defaults: {}
          },
          input: {
            schema: metadata.inputSchema,
            examples: metadata.examples
          },
          output: {
            schema: metadata.outputSchema
          },
          tags: metadata.tags,
          documentation: metadata.documentation
        };
      }
      if (options.output === "json") {
        console.log(JSON.stringify(memberInfo, null, 2));
      } else {
        console.log("");
        console.log(chalk3.bold.cyan(memberInfo.name));
        console.log(chalk3.dim(`Version: ${memberInfo.version}`));
        console.log("");
        console.log(chalk3.bold("Description:"));
        console.log(memberInfo.description || "No description");
        console.log("");
        const tags = memberInfo.tags;
        if (tags && tags.length > 0) {
          console.log(chalk3.bold("Tags:"));
          console.log(tags.join(", "));
          console.log("");
        }
        const input = memberInfo.input;
        if (input?.schema) {
          console.log(chalk3.bold("Input Schema:"));
          console.log(JSON.stringify(input.schema, null, 2));
          console.log("");
        }
        const examples = input?.examples;
        if (examples && examples.length > 0) {
          console.log(chalk3.bold("Examples:"));
          examples.forEach((example, i) => {
            console.log(chalk3.dim(`Example ${i + 1}:`));
            console.log(JSON.stringify(example, null, 2));
          });
          console.log("");
        }
        const config = memberInfo.config;
        if (config?.schema) {
          console.log(chalk3.bold("Config Schema:"));
          console.log(JSON.stringify(config.schema, null, 2));
          console.log("");
        }
        if (memberInfo.documentation) {
          console.log(chalk3.bold("Documentation:"));
          console.log(memberInfo.documentation);
          console.log("");
        }
      }
    } catch (error) {
      console.error(chalk3.red("Error:"), error.message);
      process.exit(1);
    }
  });
  return members;
}

// src/cli/commands/docs.ts
import { Command as Command4 } from "commander";
import chalk4 from "chalk";

// src/cli/openapi-generator.ts
import * as fs2 from "fs/promises";
import * as path2 from "path";

// src/runtime/parser.ts
import * as YAML from "yaml";

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path5, errorMaps, issueData } = params;
  const fullPath = [...path5, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path5, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path5;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// src/runtime/interpolation/resolver.ts
var StringResolver = class {
  constructor() {
    this.fullPattern = /^\$\{([^}]*)\}$/;
    // Disallow } in capture to prevent matching multiple ${}
    this.hasInterpolationPattern = /\$\{[^}]*\}/;
  }
  canResolve(template) {
    if (typeof template !== "string") return false;
    return this.fullPattern.test(template) || this.hasInterpolationPattern.test(template);
  }
  resolve(template, context, interpolate) {
    const fullMatch = template.match(this.fullPattern);
    if (fullMatch) {
      const path5 = fullMatch[1].trim();
      if (!path5) {
        return void 0;
      }
      return this.traversePath(path5, context);
    }
    const result = template.replace(/\$\{([^}]*)\}/g, (match, path5) => {
      const trimmedPath = path5.trim();
      if (!trimmedPath) {
        return "";
      }
      const value = this.traversePath(trimmedPath, context);
      return value !== void 0 ? String(value) : match;
    });
    return result;
  }
  /**
   * Traverse context using dot-separated path
   */
  traversePath(path5, context) {
    const parts = path5.split(".").map((p) => p.trim());
    let value = context;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return void 0;
      }
    }
    return value;
  }
};
var ArrayResolver = class {
  canResolve(template) {
    return Array.isArray(template);
  }
  resolve(template, context, interpolate) {
    return template.map((item) => interpolate(item, context));
  }
};
var ObjectResolver = class {
  canResolve(template) {
    return typeof template === "object" && template !== null && !Array.isArray(template);
  }
  resolve(template, context, interpolate) {
    const resolved = {};
    for (const [key, value] of Object.entries(template)) {
      resolved[key] = interpolate(value, context);
    }
    return resolved;
  }
};
var PassthroughResolver = class {
  canResolve(template) {
    return true;
  }
  resolve(template) {
    return template;
  }
};

// src/runtime/interpolation/interpolator.ts
var Interpolator = class {
  constructor(resolvers) {
    this.resolvers = resolvers || [
      new StringResolver(),
      new ArrayResolver(),
      new ObjectResolver(),
      new PassthroughResolver()
      // Must be last (catches all)
    ];
  }
  /**
   * Resolve template with context
   * Delegates to first resolver that can handle the template
   */
  resolve(template, context) {
    for (const resolver of this.resolvers) {
      if (resolver.canResolve(template)) {
        return resolver.resolve(template, context, (t, c) => this.resolve(t, c));
      }
    }
    return template;
  }
};
var globalInterpolator = null;
function getInterpolator() {
  if (!globalInterpolator) {
    globalInterpolator = new Interpolator();
  }
  return globalInterpolator;
}

// src/runtime/parser.ts
var EnsembleSchema = external_exports.object({
  name: external_exports.string().min(1, "Ensemble name is required"),
  description: external_exports.string().optional(),
  state: external_exports.object({
    schema: external_exports.record(external_exports.unknown()).optional(),
    initial: external_exports.record(external_exports.unknown()).optional()
  }).optional(),
  scoring: external_exports.object({
    enabled: external_exports.boolean(),
    defaultThresholds: external_exports.object({
      minimum: external_exports.number().min(0).max(1),
      target: external_exports.number().min(0).max(1).optional(),
      excellent: external_exports.number().min(0).max(1).optional()
    }),
    maxRetries: external_exports.number().positive().optional(),
    backoffStrategy: external_exports.enum(["linear", "exponential", "fixed"]).optional(),
    initialBackoff: external_exports.number().positive().optional(),
    trackInState: external_exports.boolean().optional(),
    criteria: external_exports.union([external_exports.record(external_exports.string()), external_exports.array(external_exports.unknown())]).optional(),
    aggregation: external_exports.enum(["weighted_average", "minimum", "geometric_mean"]).optional()
  }).optional(),
  webhooks: external_exports.array(
    external_exports.object({
      path: external_exports.string().min(1),
      method: external_exports.enum(["POST", "GET"]).optional(),
      auth: external_exports.object({
        type: external_exports.enum(["bearer", "signature", "basic"]),
        secret: external_exports.string()
      }).optional(),
      mode: external_exports.enum(["trigger", "resume"]).optional(),
      async: external_exports.boolean().optional(),
      timeout: external_exports.number().positive().optional()
    })
  ).optional(),
  schedules: external_exports.array(
    external_exports.object({
      cron: external_exports.string().min(1, "Cron expression is required"),
      timezone: external_exports.string().optional(),
      enabled: external_exports.boolean().optional(),
      input: external_exports.record(external_exports.unknown()).optional(),
      metadata: external_exports.record(external_exports.unknown()).optional()
    })
  ).optional(),
  flow: external_exports.array(
    external_exports.object({
      member: external_exports.string().min(1, "Member name is required"),
      input: external_exports.record(external_exports.unknown()).optional(),
      state: external_exports.object({
        use: external_exports.array(external_exports.string()).optional(),
        set: external_exports.array(external_exports.string()).optional()
      }).optional(),
      cache: external_exports.object({
        ttl: external_exports.number().positive().optional(),
        bypass: external_exports.boolean().optional()
      }).optional(),
      scoring: external_exports.object({
        evaluator: external_exports.string().min(1),
        thresholds: external_exports.object({
          minimum: external_exports.number().min(0).max(1).optional(),
          target: external_exports.number().min(0).max(1).optional(),
          excellent: external_exports.number().min(0).max(1).optional()
        }).optional(),
        criteria: external_exports.union([external_exports.record(external_exports.string()), external_exports.array(external_exports.unknown())]).optional(),
        onFailure: external_exports.enum(["retry", "continue", "abort"]).optional(),
        retryLimit: external_exports.number().positive().optional(),
        requireImprovement: external_exports.boolean().optional(),
        minImprovement: external_exports.number().min(0).max(1).optional()
      }).optional(),
      condition: external_exports.unknown().optional()
    })
  ),
  output: external_exports.record(external_exports.unknown()).optional()
});
var MemberSchema = external_exports.object({
  name: external_exports.string().min(1, "Member name is required"),
  type: external_exports.enum([
    "Think" /* Think */,
    "Function" /* Function */,
    "Data" /* Data */,
    "API" /* API */,
    "MCP" /* MCP */,
    "Scoring" /* Scoring */,
    "Email" /* Email */,
    "SMS" /* SMS */,
    "Form" /* Form */,
    "Page" /* Page */,
    "HTML" /* HTML */,
    "PDF" /* PDF */
  ]),
  description: external_exports.string().optional(),
  config: external_exports.record(external_exports.unknown()).optional(),
  schema: external_exports.object({
    input: external_exports.record(external_exports.unknown()).optional(),
    output: external_exports.record(external_exports.unknown()).optional()
  }).optional()
});
var Parser = class {
  static {
    this.interpolator = getInterpolator();
  }
  /**
   * Parse and validate an ensemble YAML file
   */
  static parseEnsemble(yamlContent) {
    try {
      const parsed = YAML.parse(yamlContent);
      if (!parsed) {
        throw new Error("Empty or invalid YAML content");
      }
      const validated = EnsembleSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (error instanceof external_exports.ZodError) {
        throw new Error(
          `Ensemble validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
        );
      }
      throw new Error(
        `Failed to parse ensemble YAML: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Parse and validate a member YAML file
   */
  static parseMember(yamlContent) {
    try {
      const parsed = YAML.parse(yamlContent);
      if (!parsed) {
        throw new Error("Empty or invalid YAML content");
      }
      const validated = MemberSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (error instanceof external_exports.ZodError) {
        throw new Error(
          `Member validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
        );
      }
      throw new Error(
        `Failed to parse member YAML: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Resolve input interpolations using composition-based resolver chain
   *
   * Supports: ${input.x}, ${state.y}, ${member.output.z}
   *
   * Reduced from 42 lines of nested if/else to 1 line via chain of responsibility
   */
  static resolveInterpolation(template, context) {
    return this.interpolator.resolve(template, context);
  }
  /**
   * Parse a member reference that may include version
   * Supports formats:
   * - "member-name" (no version)
   * - "member-name@v1.0.0" (semver version)
   * - "member-name@production" (deployment tag)
   * - "member-name@latest" (latest tag)
   */
  static parseMemberReference(memberRef) {
    const parts = memberRef.split("@");
    if (parts.length === 1) {
      return { name: parts[0] };
    }
    if (parts.length === 2) {
      return {
        name: parts[0],
        version: parts[1]
      };
    }
    throw new Error(
      `Invalid member reference format: ${memberRef}. Expected "name" or "name@version"`
    );
  }
  /**
   * Validate that all required members exist
   */
  static validateMemberReferences(ensemble, availableMembers) {
    const missingMembers = [];
    for (const step of ensemble.flow) {
      const { name } = this.parseMemberReference(step.member);
      if (!availableMembers.has(name)) {
        missingMembers.push(step.member);
      }
    }
    if (missingMembers.length > 0) {
      throw new Error(
        `Ensemble "${ensemble.name}" references missing members: ${missingMembers.join(", ")}`
      );
    }
  }
};

// src/cli/openapi-generator.ts
import YAML2 from "yaml";
var OpenAPIGenerator = class {
  constructor(projectPath) {
    this.ensembles = /* @__PURE__ */ new Map();
    this.members = /* @__PURE__ */ new Map();
    this.projectPath = projectPath;
    this.parser = new Parser();
  }
  /**
   * Generate OpenAPI documentation
   */
  async generate(options) {
    await this.loadCatalog();
    const spec = await this.generateBaseSpec();
    if (options.useAI) {
      return await this.enhanceWithAI(spec, options.aiMember);
    }
    return spec;
  }
  /**
   * Load project catalog (ensembles and members)
   */
  async loadCatalog() {
    const ensemblesPath = path2.join(this.projectPath, "ensembles");
    try {
      const files = await fs2.readdir(ensemblesPath);
      for (const file of files) {
        if (file === "examples") continue;
        if (file.endsWith(".yaml") || file.endsWith(".yml")) {
          const filePath = path2.join(ensemblesPath, file);
          const content = await fs2.readFile(filePath, "utf-8");
          const ensemble = YAML2.parse(content);
          this.ensembles.set(ensemble.name, ensemble);
        }
      }
    } catch (error) {
    }
    const membersPath = path2.join(this.projectPath, "members");
    try {
      const dirs = await fs2.readdir(membersPath, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.name === "examples") continue;
        if (dir.isDirectory()) {
          const memberYamlPath = path2.join(membersPath, dir.name, "member.yaml");
          try {
            const content = await fs2.readFile(memberYamlPath, "utf-8");
            const member = YAML2.parse(content);
            this.members.set(member.name, member);
          } catch {
          }
        }
      }
    } catch (error) {
    }
  }
  /**
   * Generate base OpenAPI spec from catalog
   */
  async generateBaseSpec() {
    const projectName = await this.getProjectName();
    const projectVersion = await this.getProjectVersion();
    const spec = {
      openapi: "3.0.0",
      info: {
        title: projectName,
        version: projectVersion,
        description: `API documentation for ${projectName}`,
        license: {
          name: "Apache-2.0"
        }
      },
      servers: [
        {
          url: "https://api.example.com",
          description: "Production server"
        },
        {
          url: "http://localhost:8787",
          description: "Local development server"
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT authentication"
          }
        }
      },
      tags: []
    };
    const tags = /* @__PURE__ */ new Set();
    for (const [name, ensemble] of this.ensembles) {
      const tag = this.inferTag(ensemble);
      tags.add(tag);
      spec.paths[`/execute/${name}`] = {
        post: {
          summary: ensemble.description || `Execute ${name} workflow`,
          description: this.generateDescription(ensemble),
          operationId: `execute_${name}`,
          tags: [tag],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: this.generateInputSchema(ensemble)
              }
            }
          },
          responses: {
            "200": {
              description: "Successful execution",
              content: {
                "application/json": {
                  schema: this.generateOutputSchema(ensemble)
                }
              }
            },
            "400": {
              description: "Invalid input"
            },
            "500": {
              description: "Execution error"
            }
          }
        }
      };
    }
    spec.tags = Array.from(tags).map((tag) => ({
      name: tag,
      description: `${tag} operations`
    }));
    return spec;
  }
  /**
   * Enhance documentation with AI
   */
  async enhanceWithAI(spec, aiMember) {
    console.log("AI enhancement not yet implemented");
    return spec;
  }
  /**
   * Infer API tag from ensemble name/description
   */
  inferTag(ensemble) {
    const name = ensemble.name;
    if (name.includes("user") || name.includes("auth")) return "User Management";
    if (name.includes("payment") || name.includes("billing")) return "Payments";
    if (name.includes("order")) return "Orders";
    if (name.includes("product")) return "Products";
    if (name.includes("search")) return "Search";
    if (name.includes("notification")) return "Notifications";
    if (name.includes("report")) return "Reports";
    if (name.includes("analytics")) return "Analytics";
    return name.split("-")[0].charAt(0).toUpperCase() + name.split("-")[0].slice(1);
  }
  /**
   * Generate description from ensemble
   */
  generateDescription(ensemble) {
    if (ensemble.description) {
      return ensemble.description;
    }
    const stepCount = ensemble.flow.length;
    const memberNames = ensemble.flow.map((step) => step.member).join(", ");
    return `Executes ${stepCount} step${stepCount > 1 ? "s" : ""}: ${memberNames}`;
  }
  /**
   * Generate input schema from ensemble
   */
  generateInputSchema(ensemble) {
    const inputRefs = /* @__PURE__ */ new Set();
    for (const step of ensemble.flow) {
      if (step.input) {
        const inputStr = JSON.stringify(step.input);
        const matches = inputStr.matchAll(/\$\{input\.(\w+)\}/g);
        for (const match of matches) {
          inputRefs.add(match[1]);
        }
      }
    }
    const properties = {};
    for (const ref of inputRefs) {
      properties[ref] = {
        type: "string",
        description: `Input parameter: ${ref}`
      };
    }
    return {
      type: "object",
      properties,
      required: Array.from(inputRefs)
    };
  }
  /**
   * Generate output schema from ensemble
   */
  generateOutputSchema(ensemble) {
    if (ensemble.output) {
      const properties = {};
      for (const [key, value] of Object.entries(ensemble.output)) {
        properties[key] = {
          type: typeof value === "string" ? "string" : "object",
          description: `Output field: ${key}`
        };
      }
      return {
        type: "object",
        properties
      };
    }
    return {
      type: "object",
      properties: {
        result: {
          type: "object",
          description: "Execution result"
        }
      }
    };
  }
  /**
   * Get project name from package.json
   */
  async getProjectName() {
    try {
      const pkgPath = path2.join(this.projectPath, "package.json");
      const content = await fs2.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);
      return pkg.name || "Conductor Project";
    } catch {
      return "Conductor Project";
    }
  }
  /**
   * Get project version from package.json
   */
  async getProjectVersion() {
    try {
      const pkgPath = path2.join(this.projectPath, "package.json");
      const content = await fs2.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(content);
      return pkg.version || "1.0.0";
    } catch {
      return "1.0.0";
    }
  }
  /**
   * Save OpenAPI spec to file
   */
  async save(spec, outputPath) {
    const content = YAML2.stringify(spec);
    await fs2.writeFile(outputPath, content, "utf-8");
  }
};

// src/config/types.ts
var DEFAULT_CONFIG = {
  docs: {
    useAI: false,
    aiMember: "docs-writer",
    format: "yaml",
    includeExamples: true,
    includeSecurity: true,
    outputDir: "./docs"
  },
  testing: {
    coverage: {
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70
    },
    timeout: 3e4,
    environment: "node",
    globals: true
  },
  observability: {
    logging: true,
    logLevel: "info",
    metrics: true,
    trackTokenUsage: true
  },
  execution: {
    defaultTimeout: 3e4,
    trackHistory: true,
    maxHistoryEntries: 1e3,
    storeStateSnapshots: true
  },
  storage: {
    type: "filesystem",
    path: "./.conductor"
  }
};

// src/config/loader.ts
import * as fs3 from "fs/promises";
import * as path3 from "path";
import { pathToFileURL } from "url";

// src/types/result.ts
var Result = {
  /**
   * Create a successful Result
   */
  ok(value) {
    return { success: true, value };
  },
  /**
   * Create a failed Result
   */
  err(error) {
    return { success: false, error };
  },
  /**
   * Wrap a Promise to catch errors and return a Result
   * @example
   * ```typescript
   * const result = await Result.fromPromise(
   *   fetch('https://api.example.com/data')
   * );
   * ```
   */
  async fromPromise(promise) {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  },
  /**
   * Wrap a synchronous function to catch errors and return a Result
   * @example
   * ```typescript
   * const result = Result.fromThrowable(() => JSON.parse(input));
   * ```
   */
  fromThrowable(fn) {
    try {
      return Result.ok(fn());
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  },
  /**
   * Transform the value inside a successful Result
   * Leaves error Results unchanged
   * @example
   * ```typescript
   * const result = Result.ok(5);
   * const doubled = Result.map(result, x => x * 2);
   * // doubled = { success: true, value: 10 }
   * ```
   */
  map(result, fn) {
    if (result.success) {
      return Result.ok(fn(result.value));
    }
    return result;
  },
  /**
   * Async version of map
   */
  async mapAsync(result, fn) {
    if (result.success) {
      return Result.ok(await fn(result.value));
    }
    return result;
  },
  /**
   * Transform the error inside a failed Result
   * Leaves success Results unchanged
   * @example
   * ```typescript
   * const result = Result.err(new Error('failed'));
   * const wrapped = Result.mapErr(result, e => new CustomError(e));
   * ```
   */
  mapErr(result, fn) {
    if (result.success) {
      return result;
    }
    return Result.err(fn(result.error));
  },
  /**
   * Chain Results together (flatMap/bind)
   * If the first Result is an error, returns it without calling fn
   * If the first Result is success, calls fn with the value
   * @example
   * ```typescript
   * const result = Result.ok(5);
   * const chained = Result.flatMap(result, x => {
   *   if (x > 10) return Result.ok(x);
   *   return Result.err(new Error('too small'));
   * });
   * ```
   */
  flatMap(result, fn) {
    if (result.success) {
      return fn(result.value);
    }
    return result;
  },
  /**
   * Async version of flatMap
   */
  async flatMapAsync(result, fn) {
    if (result.success) {
      return await fn(result.value);
    }
    return result;
  },
  /**
   * Unwrap a Result, throwing if it's an error
   * Use sparingly - prefer explicit error handling
   * @throws The error if Result is failed
   * @example
   * ```typescript
   * const value = Result.unwrap(result); // Throws if error
   * ```
   */
  unwrap(result) {
    if (result.success) {
      return result.value;
    }
    throw result.error;
  },
  /**
   * Unwrap a Result, returning a default value if it's an error
   * @example
   * ```typescript
   * const value = Result.unwrapOr(result, 'default');
   * ```
   */
  unwrapOr(result, defaultValue) {
    return result.success ? result.value : defaultValue;
  },
  /**
   * Unwrap a Result, computing a default value from the error
   * @example
   * ```typescript
   * const value = Result.unwrapOrElse(result, error => {
   *   console.error('Failed:', error);
   *   return 'fallback';
   * });
   * ```
   */
  unwrapOrElse(result, fn) {
    return result.success ? result.value : fn(result.error);
  },
  /**
   * Check if Result is success
   */
  isOk(result) {
    return result.success === true;
  },
  /**
   * Check if Result is error
   */
  isErr(result) {
    return result.success === false;
  },
  /**
   * Combine multiple Results into one
   * Returns first error, or all values if all succeed
   * @example
   * ```typescript
   * const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
   * const combined = Result.all(results);
   * // combined = { success: true, value: [1, 2, 3] }
   * ```
   */
  all(results) {
    const values = [];
    for (const result of results) {
      if (!result.success) {
        return result;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },
  /**
   * Combine multiple Results, collecting all errors or all values
   * Unlike `all`, this doesn't short-circuit on first error
   * @example
   * ```typescript
   * const results = [
   *   Result.ok(1),
   *   Result.err(new Error('e1')),
   *   Result.err(new Error('e2'))
   * ];
   * const combined = Result.partition(results);
   * // combined = { success: false, error: [Error('e1'), Error('e2')] }
   * ```
   */
  partition(results) {
    const values = [];
    const errors = [];
    for (const result of results) {
      if (result.success) {
        values.push(result.value);
      } else {
        errors.push(result.error);
      }
    }
    if (errors.length > 0) {
      return Result.err(errors);
    }
    return Result.ok(values);
  },
  /**
   * Sequence async operations, short-circuiting on first error
   * @example
   * ```typescript
   * const result = await Result.sequence([
   *   () => validateInput(data),
   *   () => fetchUser(data.userId),
   *   () => updateUser(user)
   * ]);
   * ```
   */
  async sequence(operations) {
    const values = [];
    for (const operation of operations) {
      const result = await operation();
      if (!result.success) {
        return result;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },
  /**
   * Match on a Result, providing handlers for both cases
   * @example
   * ```typescript
   * const message = Result.match(result, {
   *   ok: user => `Welcome ${user.name}`,
   *   err: error => `Error: ${error.message}`
   * });
   * ```
   */
  match(result, handlers) {
    if (result.success) {
      return handlers.ok(result.value);
    }
    return handlers.err(result.error);
  },
  /**
   * Perform a side effect on success, returning the original Result
   * @example
   * ```typescript
   * const result = Result.ok(user)
   *   .pipe(Result.tap(u => console.log('Found user:', u.name)));
   * ```
   */
  tap(result, fn) {
    if (result.success) {
      fn(result.value);
    }
    return result;
  },
  /**
   * Perform a side effect on error, returning the original Result
   * @example
   * ```typescript
   * const result = operation()
   *   .pipe(Result.tapErr(e => console.error('Operation failed:', e)));
   * ```
   */
  tapErr(result, fn) {
    if (!result.success) {
      fn(result.error);
    }
    return result;
  }
};

// src/config/loader.ts
async function loadConfig(projectPath) {
  try {
    const configPath = path3.join(projectPath, "conductor.config.ts");
    try {
      await fs3.access(configPath);
    } catch {
      return Result.ok(DEFAULT_CONFIG);
    }
    const fileUrl = pathToFileURL(configPath).href;
    const configModule = await import(fileUrl);
    const userConfig = configModule.default;
    const config = mergeConfig(DEFAULT_CONFIG, userConfig);
    const validationResult = validateConfig(config);
    if (!validationResult.success) {
      return Result.err(validationResult.error);
    }
    return Result.ok(config);
  } catch (error) {
    return Result.err(error);
  }
}
function mergeConfig(defaults, user) {
  return {
    docs: { ...defaults.docs, ...user.docs },
    testing: {
      ...defaults.testing,
      ...user.testing,
      coverage: {
        ...defaults.testing?.coverage,
        ...user.testing?.coverage
      }
    },
    observability: {
      ...defaults.observability,
      ...user.observability,
      opentelemetry: {
        ...defaults.observability?.opentelemetry,
        ...user.observability?.opentelemetry
      }
    },
    execution: { ...defaults.execution, ...user.execution },
    storage: { ...defaults.storage, ...user.storage }
  };
}
function validateConfig(config) {
  const errors = [];
  if (config.docs) {
    if (config.docs.format && !["yaml", "json"].includes(config.docs.format)) {
      errors.push(`Invalid docs.format: ${config.docs.format}. Must be 'yaml' or 'json'`);
    }
  }
  if (config.testing?.coverage) {
    const c = config.testing.coverage;
    if (c.lines !== void 0 && (c.lines < 0 || c.lines > 100)) {
      errors.push(`Invalid testing.coverage.lines: ${c.lines}. Must be between 0 and 100`);
    }
    if (c.functions !== void 0 && (c.functions < 0 || c.functions > 100)) {
      errors.push(`Invalid testing.coverage.functions: ${c.functions}. Must be between 0 and 100`);
    }
    if (c.branches !== void 0 && (c.branches < 0 || c.branches > 100)) {
      errors.push(`Invalid testing.coverage.branches: ${c.branches}. Must be between 0 and 100`);
    }
    if (c.statements !== void 0 && (c.statements < 0 || c.statements > 100)) {
      errors.push(`Invalid testing.coverage.statements: ${c.statements}. Must be between 0 and 100`);
    }
  }
  if (config.observability?.logLevel) {
    const validLevels = ["debug", "info", "warn", "error"];
    if (!validLevels.includes(config.observability.logLevel)) {
      errors.push(
        `Invalid observability.logLevel: ${config.observability.logLevel}. Must be one of: ${validLevels.join(", ")}`
      );
    }
  }
  if (config.execution) {
    if (config.execution.defaultTimeout !== void 0 && config.execution.defaultTimeout < 0) {
      errors.push(
        `Invalid execution.defaultTimeout: ${config.execution.defaultTimeout}. Must be >= 0`
      );
    }
    if (config.execution.maxHistoryEntries !== void 0 && config.execution.maxHistoryEntries < 0) {
      errors.push(
        `Invalid execution.maxHistoryEntries: ${config.execution.maxHistoryEntries}. Must be >= 0`
      );
    }
  }
  if (config.storage?.type) {
    const validTypes = ["filesystem", "d1", "kv"];
    if (!validTypes.includes(config.storage.type)) {
      errors.push(
        `Invalid storage.type: ${config.storage.type}. Must be one of: ${validTypes.join(", ")}`
      );
    }
  }
  if (errors.length > 0) {
    return Result.err(new Error(`Configuration validation failed:
${errors.join("\n")}`));
  }
  return Result.ok(void 0);
}

// src/cli/commands/docs.ts
import * as fs4 from "fs/promises";
import YAML3 from "yaml";
function createDocsCommand() {
  const docs = new Command4("docs");
  docs.description("Generate OpenAPI documentation for your project").option("--ai", "Use AI to enhance documentation (requires docs-writer member)").option("-o, --output <path>", "Output file path", "./openapi.yaml").option("--json", "Output as JSON instead of YAML").action(async (options) => {
    const projectPath = process.cwd();
    try {
      console.log("");
      console.log(chalk4.bold("\u{1F4DA} Generating API Documentation..."));
      console.log("");
      const useAI = await shouldUseAI(projectPath, options.ai);
      if (useAI) {
        console.log(chalk4.cyan("\u{1F916} AI-powered documentation mode enabled"));
        console.log("");
      }
      const generator = new OpenAPIGenerator(projectPath);
      const spec = await generator.generate({
        projectPath,
        useAI,
        aiMember: "docs-writer"
      });
      const outputPath = options.output;
      const isJson = options.json || outputPath.endsWith(".json");
      const content = isJson ? JSON.stringify(spec, null, 2) : YAML3.stringify(spec);
      await fs4.writeFile(outputPath, content, "utf-8");
      console.log(chalk4.green("\u2713 Documentation generated successfully"));
      console.log("");
      console.log(`Output: ${chalk4.bold(outputPath)}`);
      console.log("");
      const pathCount = Object.keys(spec.paths).length;
      const tagCount = spec.tags?.length || 0;
      console.log(chalk4.dim(`  ${pathCount} API endpoint${pathCount !== 1 ? "s" : ""}`));
      console.log(chalk4.dim(`  ${tagCount} tag${tagCount !== 1 ? "s" : ""}`));
      console.log("");
      console.log(chalk4.dim("Next steps:"));
      console.log(chalk4.dim(`  \u2022 View your docs: ${outputPath}`));
      console.log(chalk4.dim("  \u2022 Host docs: conductor docs serve (coming soon)"));
      console.log(chalk4.dim("  \u2022 Publish to cloud: conductor docs publish (coming soon)"));
      console.log("");
    } catch (error) {
      console.error("");
      console.error(chalk4.red("\u2717 Failed to generate documentation"));
      console.error("");
      console.error(chalk4.dim(error.message));
      console.error("");
      process.exit(1);
    }
  });
  docs.command("validate").description("Validate OpenAPI specification").argument("[file]", "OpenAPI spec file", "./openapi.yaml").action(async (file) => {
    try {
      console.log("");
      console.log(chalk4.bold("\u{1F50D} Validating OpenAPI specification..."));
      console.log("");
      const content = await fs4.readFile(file, "utf-8");
      const spec = file.endsWith(".json") ? JSON.parse(content) : YAML3.parse(content);
      const errors = [];
      if (!spec.openapi) {
        errors.push("Missing openapi version");
      }
      if (!spec.info) {
        errors.push("Missing info section");
      }
      if (!spec.paths || Object.keys(spec.paths).length === 0) {
        errors.push("No paths defined");
      }
      if (errors.length > 0) {
        console.log(chalk4.red("\u2717 Validation failed"));
        console.log("");
        errors.forEach((err) => console.log(chalk4.red(`  \u2022 ${err}`)));
        console.log("");
        process.exit(1);
      }
      console.log(chalk4.green("\u2713 Specification is valid"));
      console.log("");
      console.log(chalk4.dim(`  OpenAPI ${spec.openapi}`));
      console.log(chalk4.dim(`  ${Object.keys(spec.paths).length} endpoints`));
      console.log("");
    } catch (error) {
      console.error("");
      console.error(chalk4.red("\u2717 Validation failed"));
      console.error("");
      console.error(chalk4.dim(error.message));
      console.error("");
      process.exit(1);
    }
  });
  return docs;
}
async function shouldUseAI(projectPath, cliOption) {
  if (cliOption !== void 0) {
    return cliOption;
  }
  const configResult = await loadConfig(projectPath);
  if (configResult.success) {
    return configResult.value.docs?.useAI ?? false;
  }
  return false;
}

// src/cli/commands/test.ts
import { Command as Command5 } from "commander";
import chalk5 from "chalk";
import { spawn } from "child_process";
function createTestCommand() {
  const test = new Command5("test").description("Run tests for your Conductor project").argument("[path]", "Test file or directory to run").option("--watch", "Run tests in watch mode").option("--coverage", "Generate coverage report").option("--ui", "Open Vitest UI").option("--reporter <type>", "Test reporter: default, verbose, dot, json").action(
    async (testPath, options) => {
      const projectPath = process.cwd();
      try {
        const configResult = await loadConfig(projectPath);
        const config = configResult.success ? configResult.value : void 0;
        const args = ["vitest"];
        if (testPath) {
          args.push(testPath);
        }
        if (options.watch) {
          args.push("--watch");
        }
        if (options.coverage) {
          args.push("--coverage");
        }
        if (options.ui) {
          args.push("--ui");
        }
        if (options.reporter) {
          args.push("--reporter", options.reporter);
        }
        if (config?.testing?.timeout) {
          args.push("--testTimeout", String(config.testing.timeout));
        }
        if (config?.testing?.globals) {
          args.push("--globals");
        }
        console.log("");
        console.log(chalk5.bold("\u{1F9EA} Running Tests..."));
        console.log(chalk5.dim(`Command: npx ${args.join(" ")}`));
        console.log("");
        const vitestProcess = spawn("npx", args, {
          stdio: "inherit",
          shell: true,
          cwd: projectPath
        });
        vitestProcess.on("exit", (code) => {
          process.exit(code || 0);
        });
        vitestProcess.on("error", (error) => {
          console.error("");
          console.error(chalk5.red("\u2717 Failed to run tests"));
          console.error("");
          console.error(chalk5.dim(error.message));
          console.error("");
          console.error(chalk5.dim("Make sure vitest is installed: npm install -D vitest"));
          console.error("");
          process.exit(1);
        });
      } catch (error) {
        console.error("");
        console.error(chalk5.red("\u2717 Test command failed"));
        console.error("");
        console.error(chalk5.dim(error.message));
        console.error("");
        process.exit(1);
      }
    }
  );
  return test;
}

// src/cli/commands/logs.ts
import { Command as Command6 } from "commander";
import chalk6 from "chalk";

// src/storage/execution-history.ts
import * as fs5 from "fs/promises";
import * as path4 from "path";
var ExecutionHistory = class {
  constructor(storagePath = "./.conductor/history") {
    this.storagePath = storagePath;
  }
  /**
   * Initialize storage directory
   */
  async initialize() {
    await fs5.mkdir(this.storagePath, { recursive: true });
  }
  /**
   * Store execution record
   */
  async store(record) {
    await this.initialize();
    const filePath = path4.join(this.storagePath, `${record.id}.json`);
    await fs5.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
  }
  /**
   * Get execution record by ID
   */
  async get(executionId) {
    try {
      const filePath = path4.join(this.storagePath, `${executionId}.json`);
      const content = await fs5.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  /**
   * List all execution records
   */
  async list(options) {
    try {
      await this.initialize();
      const files = await fs5.readdir(this.storagePath);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));
      const records = await Promise.all(
        jsonFiles.map(async (file) => {
          const content = await fs5.readFile(path4.join(this.storagePath, file), "utf-8");
          return JSON.parse(content);
        })
      );
      let filtered = records;
      if (options?.type) {
        filtered = filtered.filter((r) => r.type === options.type);
      }
      if (options?.status) {
        filtered = filtered.filter((r) => r.status === options.status);
      }
      filtered.sort((a, b) => b.startTime - a.startTime);
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      return filtered;
    } catch {
      return [];
    }
  }
  /**
   * Get logs for an execution
   */
  async getLogs(executionId) {
    const record = await this.get(executionId);
    return record?.logs || [];
  }
  /**
   * Get state snapshots for an execution
   */
  async getStateSnapshots(executionId) {
    const record = await this.get(executionId);
    return record?.stateSnapshots || [];
  }
  /**
   * Delete old execution records
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1e3) {
    try {
      const files = await fs5.readdir(this.storagePath);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));
      let deletedCount = 0;
      const now = Date.now();
      for (const file of jsonFiles) {
        const filePath = path4.join(this.storagePath, file);
        const content = await fs5.readFile(filePath, "utf-8");
        const record = JSON.parse(content);
        if (now - record.endTime > maxAge) {
          await fs5.unlink(filePath);
          deletedCount++;
        }
      }
      return deletedCount;
    } catch {
      return 0;
    }
  }
};

// src/cli/commands/logs.ts
function createLogsCommand() {
  const logs = new Command6("logs").description("View logs for a specific execution").argument("<execution-id>", "Execution ID to view logs for").option("--level <level>", "Filter by log level: debug, info, warn, error").option("--step <name>", "Filter by step name").option("--json", "Output as JSON").action(
    async (executionId, options) => {
      const projectPath = process.cwd();
      try {
        const configResult = await loadConfig(projectPath);
        const storagePath = configResult.success ? configResult.value.storage?.path : "./.conductor";
        const history = new ExecutionHistory(`${storagePath}/history`);
        const record = await history.get(executionId);
        if (!record) {
          console.error("");
          console.error(chalk6.red(`\u2717 Execution not found: ${executionId}`));
          console.error("");
          console.error(chalk6.dim("Use `conductor history` to list available executions"));
          console.error("");
          process.exit(1);
        }
        let logs2 = record.logs || [];
        if (options.level) {
          logs2 = logs2.filter((log) => log.level === options.level);
        }
        if (options.step) {
          logs2 = logs2.filter((log) => log.step === options.step);
        }
        if (options.json) {
          console.log(JSON.stringify({ executionId, logs: logs2 }, null, 2));
        } else {
          console.log("");
          console.log(chalk6.bold(`\u{1F4CB} Logs for execution: ${executionId}`));
          console.log("");
          console.log(chalk6.dim(`Ensemble: ${record.name}`));
          console.log(
            chalk6.dim(
              `Status: ${record.status === "success" ? chalk6.green(record.status) : chalk6.red(record.status)}`
            )
          );
          console.log(chalk6.dim(`Duration: ${record.duration}ms`));
          console.log("");
          if (logs2.length === 0) {
            console.log(chalk6.dim("No logs found"));
            if (options.level || options.step) {
              console.log(chalk6.dim("Try removing filters to see all logs"));
            }
            console.log("");
            return;
          }
          logs2.forEach((log) => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            const levelColor = {
              debug: chalk6.gray,
              info: chalk6.blue,
              warn: chalk6.yellow,
              error: chalk6.red
            }[log.level];
            const level = levelColor(`[${log.level.toUpperCase()}]`);
            const step = log.step ? chalk6.dim(`[${log.step}]`) : "";
            const time = chalk6.dim(timestamp);
            console.log(`${time} ${level} ${step} ${log.message}`);
            if (log.context && Object.keys(log.context).length > 0) {
              console.log(chalk6.dim(`  ${JSON.stringify(log.context)}`));
            }
          });
          console.log("");
        }
      } catch (error) {
        console.error("");
        console.error(chalk6.red("\u2717 Failed to retrieve logs"));
        console.error("");
        console.error(chalk6.dim(error.message));
        console.error("");
        process.exit(1);
      }
    }
  );
  return logs;
}

// src/cli/commands/state.ts
import { Command as Command7 } from "commander";
import chalk7 from "chalk";
function createStateCommand() {
  const state = new Command7("state").description("Inspect state snapshots for a specific execution").argument("<execution-id>", "Execution ID to view state for").option("--step <name>", "Filter by step name").option("--latest", "Show only the latest state snapshot").option("--json", "Output as JSON").action(
    async (executionId, options) => {
      const projectPath = process.cwd();
      try {
        const configResult = await loadConfig(projectPath);
        const storagePath = configResult.success ? configResult.value.storage?.path : "./.conductor";
        const history = new ExecutionHistory(`${storagePath}/history`);
        const record = await history.get(executionId);
        if (!record) {
          console.error("");
          console.error(chalk7.red(`\u2717 Execution not found: ${executionId}`));
          console.error("");
          console.error(chalk7.dim("Use `conductor history` to list available executions"));
          console.error("");
          process.exit(1);
        }
        let snapshots = record.stateSnapshots || [];
        if (options.step) {
          snapshots = snapshots.filter((snapshot) => snapshot.stepName === options.step);
        }
        if (options.latest && snapshots.length > 0) {
          snapshots = [snapshots[snapshots.length - 1]];
        }
        if (options.json) {
          console.log(JSON.stringify({ executionId, snapshots }, null, 2));
        } else {
          console.log("");
          console.log(chalk7.bold(`\u{1F50D} State for execution: ${executionId}`));
          console.log("");
          console.log(chalk7.dim(`Ensemble: ${record.name}`));
          console.log(
            chalk7.dim(
              `Status: ${record.status === "success" ? chalk7.green(record.status) : chalk7.red(record.status)}`
            )
          );
          console.log(chalk7.dim(`Duration: ${record.duration}ms`));
          console.log("");
          if (snapshots.length === 0) {
            console.log(chalk7.dim("No state snapshots found"));
            if (options.step || options.latest) {
              console.log(chalk7.dim("Try removing filters to see all snapshots"));
            }
            console.log("");
            return;
          }
          snapshots.forEach((snapshot, index) => {
            const timestamp = new Date(snapshot.timestamp).toLocaleTimeString();
            console.log(chalk7.bold(`Snapshot ${index + 1} - ${snapshot.stepName}`));
            console.log(chalk7.dim(`  Time: ${timestamp}`));
            console.log("");
            if (snapshot.state && Object.keys(snapshot.state).length > 0) {
              console.log(chalk7.cyan("  State:"));
              Object.entries(snapshot.state).forEach(([key, value]) => {
                const valueStr = typeof value === "object" ? JSON.stringify(value, null, 2).split("\n").map((line, i) => i === 0 ? line : `    ${line}`).join("\n") : String(value);
                console.log(`    ${chalk7.yellow(key)}: ${valueStr}`);
              });
            } else {
              console.log(chalk7.dim("  No state variables"));
            }
            console.log("");
          });
        }
      } catch (error) {
        console.error("");
        console.error(chalk7.red("\u2717 Failed to retrieve state"));
        console.error("");
        console.error(chalk7.dim(error.message));
        console.error("");
        process.exit(1);
      }
    }
  );
  return state;
}

// src/cli/commands/replay.ts
import { Command as Command8 } from "commander";
import chalk8 from "chalk";
function createReplayCommand() {
  const replay = new Command8("replay").description("Replay a past execution for debugging").argument("<execution-id>", "Execution ID to replay").option("--step-by-step", "Pause after each step (press Enter to continue)").option("--from-step <name>", "Start replay from a specific step").option("--show-state", "Show state after each step").option("--json", "Output as JSON").action(
    async (executionId, options) => {
      const projectPath = process.cwd();
      try {
        const configResult = await loadConfig(projectPath);
        const storagePath = configResult.success ? configResult.value.storage?.path : "./.conductor";
        const history = new ExecutionHistory(`${storagePath}/history`);
        const record = await history.get(executionId);
        if (!record) {
          console.error("");
          console.error(chalk8.red(`\u2717 Execution not found: ${executionId}`));
          console.error("");
          console.error(chalk8.dim("Use `conductor history` to list available executions"));
          console.error("");
          process.exit(1);
        }
        if (record.type !== "ensemble") {
          console.error("");
          console.error(chalk8.red("\u2717 Can only replay ensemble executions"));
          console.error("");
          console.error(chalk8.dim("Member executions cannot be replayed independently"));
          console.error("");
          process.exit(1);
        }
        if (!options.json) {
          console.log("");
          console.log(chalk8.bold(`\u{1F504} Replaying execution: ${executionId}`));
          console.log("");
          console.log(chalk8.dim(`Ensemble: ${record.name}`));
          console.log(
            chalk8.dim(
              `Original status: ${record.status === "success" ? chalk8.green(record.status) : chalk8.red(record.status)}`
            )
          );
          console.log(chalk8.dim(`Original duration: ${record.duration}ms`));
          console.log("");
          if (options.stepByStep) {
            console.log(
              chalk8.yellow("\u23F8  Step-by-step mode enabled (press Enter to continue each step)")
            );
            console.log("");
          }
        }
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                executionId,
                record: {
                  name: record.name,
                  type: record.type,
                  status: record.status,
                  duration: record.duration,
                  input: record.input,
                  output: record.output,
                  error: record.error,
                  steps: record.steps,
                  stateSnapshots: record.stateSnapshots
                }
              },
              null,
              2
            )
          );
        } else {
          console.log(chalk8.bold("\u{1F4CB} Input:"));
          console.log(JSON.stringify(record.input, null, 2));
          console.log("");
          if (record.steps && record.steps.length > 0) {
            console.log(chalk8.bold("\u{1F504} Execution Steps:"));
            console.log("");
            let startIndex = 0;
            if (options.fromStep) {
              const stepIndex = record.steps.findIndex((s) => s.name === options.fromStep);
              if (stepIndex === -1) {
                console.log(
                  chalk8.yellow(`\u26A0 Step "${options.fromStep}" not found, showing all steps`)
                );
                console.log("");
              } else {
                startIndex = stepIndex;
                console.log(chalk8.cyan(`\u23ED  Starting from step: ${options.fromStep}`));
                console.log("");
              }
            }
            for (let i = startIndex; i < record.steps.length; i++) {
              const step = record.steps[i];
              const statusIcon = step.status === "success" ? chalk8.green("\u2713") : step.status === "failure" ? chalk8.red("\u2717") : chalk8.yellow("\u2298");
              console.log(`${statusIcon} Step ${i + 1}: ${chalk8.bold(step.name)}`);
              console.log(chalk8.dim(`  Duration: ${step.duration}ms`));
              if (step.output !== void 0 && options.showState) {
                console.log(chalk8.dim("  Output:"));
                console.log(chalk8.dim(`    ${JSON.stringify(step.output)}`));
              }
              if (step.error) {
                console.log(chalk8.red(`  Error: ${step.error}`));
              }
              console.log("");
              if (options.showState && record.stateSnapshots) {
                const snapshot = record.stateSnapshots.find((s) => s.stepIndex === i);
                if (snapshot && Object.keys(snapshot.state).length > 0) {
                  console.log(chalk8.cyan("  State:"));
                  Object.entries(snapshot.state).forEach(([key, value]) => {
                    console.log(chalk8.dim(`    ${key}: ${JSON.stringify(value)}`));
                  });
                  console.log("");
                }
              }
              if (options.stepByStep && i < record.steps.length - 1) {
                await new Promise((resolve2) => {
                  console.log(chalk8.yellow("Press Enter to continue..."));
                  process.stdin.once("data", () => resolve2());
                });
              }
            }
          }
          console.log(chalk8.bold("\u{1F4CA} Final Result:"));
          console.log("");
          console.log(
            `  Status: ${record.status === "success" ? chalk8.green(record.status) : chalk8.red(record.status)}`
          );
          console.log(chalk8.dim(`  Duration: ${record.duration}ms`));
          console.log("");
          if (record.output !== void 0) {
            console.log(chalk8.bold("Output:"));
            console.log(JSON.stringify(record.output, null, 2));
          }
          if (record.error) {
            console.log(chalk8.bold("Error:"));
            console.log(chalk8.red(record.error.message));
          }
          console.log("");
        }
      } catch (error) {
        console.error("");
        console.error(chalk8.red("\u2717 Failed to replay execution"));
        console.error("");
        console.error(chalk8.dim(error.message));
        console.error("");
        process.exit(1);
      }
    }
  );
  return replay;
}

// src/cli/commands/history.ts
import { Command as Command9 } from "commander";
import chalk9 from "chalk";
function createHistoryCommand() {
  const history = new Command9("history").description("List past execution history").option("--limit <number>", "Limit number of results", "20").option("--type <type>", "Filter by type: ensemble or member").option("--status <status>", "Filter by status: success or failure").option("--json", "Output as JSON").action(
    async (options) => {
      const projectPath = process.cwd();
      try {
        const configResult = await loadConfig(projectPath);
        const storagePath = configResult.success ? configResult.value.storage?.path : "./.conductor";
        const historyManager = new ExecutionHistory(`${storagePath}/history`);
        const records = await historyManager.list({
          limit: parseInt(options.limit, 10),
          type: options.type,
          status: options.status
        });
        if (options.json) {
          console.log(JSON.stringify({ records }, null, 2));
        } else {
          console.log("");
          console.log(chalk9.bold("\u{1F4DC} Execution History"));
          console.log("");
          if (records.length === 0) {
            console.log(chalk9.dim("No executions found"));
            if (options.type || options.status) {
              console.log(chalk9.dim("Try removing filters to see all executions"));
            }
            console.log("");
            return;
          }
          const idWidth = 36;
          const nameWidth = 25;
          const typeWidth = 10;
          const statusWidth = 10;
          const durationWidth = 10;
          const timeWidth = 20;
          console.log(
            chalk9.dim(
              "ID".padEnd(idWidth) + "Name".padEnd(nameWidth) + "Type".padEnd(typeWidth) + "Status".padEnd(statusWidth) + "Duration".padEnd(durationWidth) + "Time"
            )
          );
          console.log(
            chalk9.dim(
              "\u2500".repeat(
                idWidth + nameWidth + typeWidth + statusWidth + durationWidth + timeWidth
              )
            )
          );
          records.forEach((record) => {
            const id = record.id.padEnd(idWidth);
            const name = (record.name.length > nameWidth - 3 ? record.name.substring(0, nameWidth - 3) + "..." : record.name).padEnd(nameWidth);
            const type = record.type.padEnd(typeWidth);
            const status = (record.status === "success" ? chalk9.green(record.status) : chalk9.red(record.status)).padEnd(statusWidth + 9);
            const duration = `${record.duration}ms`.padEnd(durationWidth);
            const time = new Date(record.startTime).toLocaleString();
            console.log(
              `${chalk9.dim(id)}${name}${chalk9.dim(type)}${status}${chalk9.dim(duration)}${chalk9.dim(time)}`
            );
          });
          console.log("");
          console.log(
            chalk9.dim(`Showing ${records.length} execution${records.length !== 1 ? "s" : ""}`)
          );
          console.log("");
          console.log(chalk9.dim("Commands:"));
          console.log(chalk9.dim("  conductor logs <id>    - View execution logs"));
          console.log(chalk9.dim("  conductor state <id>   - Inspect execution state"));
          console.log(chalk9.dim("  conductor replay <id>  - Replay execution"));
          console.log("");
        }
      } catch (error) {
        console.error("");
        console.error(chalk9.red("\u2717 Failed to retrieve history"));
        console.error("");
        console.error(chalk9.dim(error.message));
        console.error("");
        process.exit(1);
      }
    }
  );
  return history;
}

// src/cli/index.ts
var version = "1.1.6";
var program = new Command10();
program.name("conductor").description("Conductor - Agentic workflow orchestration for Cloudflare Workers").version(version).addHelpText(
  "before",
  `
${chalk10.bold.cyan("Getting Started:")}

  ${chalk10.bold("Create new project:")}
    ${chalk10.cyan("conductor init my-new-project")}
    ${chalk10.dim("cd my-new-project")}
    ${chalk10.dim("npm install")}

  ${chalk10.bold("Initialize existing project:")}
    ${chalk10.cyan("conductor init .")}
    ${chalk10.dim("npm install")}

${chalk10.dim("Documentation:")} ${chalk10.cyan("https://docs.ensemble-edge.com/conductor")}
`
);
program.addCommand(createInitCommand());
program.addCommand(createExecCommand());
program.addCommand(createMembersCommand());
program.addCommand(createDocsCommand());
program.addCommand(createTestCommand());
program.addCommand(createHistoryCommand());
program.addCommand(createLogsCommand());
program.addCommand(createStateCommand());
program.addCommand(createReplayCommand());
program.command("health").description("Check API health").option("--api-url <url>", "API URL (default: from CONDUCTOR_API_URL env)").action(async (options) => {
  try {
    const apiUrl = options.apiUrl || process.env.CONDUCTOR_API_URL;
    if (!apiUrl) {
      console.error(
        chalk10.red("Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url")
      );
      process.exit(1);
    }
    const response = await fetch(`${apiUrl}/health`);
    const data = await response.json();
    console.log("");
    console.log(chalk10.bold("API Health:"));
    console.log("");
    console.log(
      `Status: ${data.status === "healthy" ? chalk10.green(data.status) : chalk10.yellow(data.status)}`
    );
    console.log(`Version: ${data.version}`);
    console.log("");
    console.log(chalk10.bold("Checks:"));
    Object.entries(data.checks).forEach(([key, value]) => {
      const status = value ? chalk10.green("\u2713") : chalk10.red("\u2717");
      console.log(`  ${status} ${key}`);
    });
    console.log("");
  } catch (error) {
    console.error(chalk10.red("Error:"), error.message);
    process.exit(1);
  }
});
program.command("config").description("Show current configuration").action(() => {
  console.log("");
  console.log(chalk10.bold("Configuration:"));
  console.log("");
  console.log(`API URL: ${process.env.CONDUCTOR_API_URL || chalk10.dim("not set")}`);
  console.log(
    `API Key: ${process.env.CONDUCTOR_API_KEY ? chalk10.green("set") : chalk10.dim("not set")}`
  );
  console.log("");
  console.log(chalk10.dim("Set via environment variables:"));
  console.log(chalk10.dim("  export CONDUCTOR_API_URL=https://api.conductor.dev"));
  console.log(chalk10.dim("  export CONDUCTOR_API_KEY=your-api-key"));
  console.log("");
});
program.parse(process.argv);
