/**
 * AI Provider System
 *
 * Base interfaces and types for AI provider implementations.
 * Follows composition over inheritance for flexible provider management.
 */
/**
 * Base AI provider with common functionality
 */
export class BaseAIProvider {
    /**
     * Default validation checks for API key
     */
    validateConfig(config, env) {
        return this.getConfigError(config, env) === null;
    }
    /**
     * Helper to get API key from config or env
     */
    getApiKey(config, env, envVarName) {
        // Access env as Record for dynamic key lookup
        const envRecord = env;
        return config.apiKey || envRecord[envVarName] || null;
    }
    /**
     * Helper to make HTTP request
     */
    async makeRequest(endpoint, headers, body) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }
        return await response.json();
    }
}
