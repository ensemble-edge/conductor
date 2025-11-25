import { b as BaseAgent, c as createLogger } from "./worker-entry-DOTZ2GbP.js";
const BOT_PROTECTION_KEYWORDS = [
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
const MIN_CONTENT_LENGTH = 800;
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
const logger = createLogger({ serviceName: "scrape-agent" });
class ScrapeMember extends BaseAgent {
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
      throw new Error('Scrape agent requires "url" in input');
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
}
export {
  ScrapeMember,
  convertHTMLToMarkdown,
  detectBotProtection,
  extractTextFromHTML,
  extractTitleFromHTML,
  isContentSuccessful
};
//# sourceMappingURL=index-D33EDezd.js.map
