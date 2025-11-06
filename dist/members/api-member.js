/**
 * API Member Engine
 *
 * Makes HTTP requests to external APIs
 * Handles method, headers, body, timeouts, and response parsing
 */
import { BaseMember } from './base-member.js';
/**
 * API Member makes HTTP requests to external services
 *
 * @example User's member definition:
 * ```yaml
 * # members/fetch-company/member.yaml
 * name: fetch-company
 * type: API
 * description: Fetch company data from external API
 * config:
 *   url: https://api.example.com/company
 *   method: GET
 *   headers:
 *     Authorization: Bearer ${env.API_KEY}
 *   timeout: 5000
 * schema:
 *   input:
 *     domain: string
 *   output:
 *     data: object
 * ```
 */
export class APIMember extends BaseMember {
    constructor(config) {
        super(config);
        // Extract API-specific config
        const cfg = config.config;
        this.apiConfig = {
            url: cfg?.url,
            method: cfg?.method || 'GET',
            headers: cfg?.headers || {},
            timeout: cfg?.timeout || 30000,
            retries: cfg?.retries || 0,
        };
    }
    /**
     * Execute the API request
     */
    async run(context) {
        const { input } = context;
        // Resolve URL (may contain interpolations)
        const url = this.apiConfig.url || input.url;
        if (!url) {
            throw new Error(`API member "${this.name}" requires a URL (in config or input)`);
        }
        // Build request options
        const requestInit = {
            method: this.apiConfig.method,
            headers: this.resolveHeaders(this.apiConfig.headers || {}, context),
        };
        // Add body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(this.apiConfig.method)) {
            if (input.body) {
                requestInit.body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body);
                // Set content-type if not already set
                const headers = requestInit.headers;
                if (!headers['content-type'] && !headers['Content-Type']) {
                    headers['content-type'] = 'application/json';
                }
            }
        }
        // Execute with timeout and retries
        return await this.executeWithRetries(url, requestInit);
    }
    /**
     * Resolve headers (may contain env var references)
     */
    resolveHeaders(headers, context) {
        const resolved = {};
        for (const [key, value] of Object.entries(headers)) {
            // Replace ${env.VAR_NAME} with actual env var
            resolved[key] = value.replace(/\$\{env\.(\w+)\}/g, (_, varName) => {
                return context.env[varName] || '';
            });
        }
        return resolved;
    }
    /**
     * Execute request with timeout and retry logic
     */
    async executeWithRetries(url, init, attempt = 0) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout);
            try {
                // Make the request
                const response = await fetch(url, {
                    ...init,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                // Parse response
                const contentType = response.headers.get('content-type');
                let data;
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                }
                else {
                    data = await response.text();
                }
                // Check if response was successful
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    data,
                };
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        catch (error) {
            // Retry logic
            if (attempt < (this.apiConfig.retries || 0)) {
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.executeWithRetries(url, init, attempt + 1);
            }
            // Final error
            throw new Error(`API request to ${url} failed after ${attempt + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get API configuration
     */
    getAPIConfig() {
        return { ...this.apiConfig };
    }
}
