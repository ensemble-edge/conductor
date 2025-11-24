import { B as BaseAgent } from "./worker-entry-kH6ZwluV.js";
class FetchMember extends BaseAgent {
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
      throw new Error('Fetch agent requires "url" in input');
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
export {
  FetchMember
};
//# sourceMappingURL=index-DoqPCwTC.js.map
