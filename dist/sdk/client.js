/**
 * Conductor SDK Client
 *
 * Type-safe client for the Conductor API.
 */
export class ConductorError extends Error {
    constructor(code, message, details, requestId) {
        super(message);
        this.code = code;
        this.details = details;
        this.requestId = requestId;
        this.name = 'ConductorError';
    }
}
/**
 * Conductor API Client
 */
export class ConductorClient {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.timeout = config.timeout || 30000;
        this.headers = {
            'Content-Type': 'application/json',
            ...config.headers,
        };
        if (this.apiKey) {
            this.headers['X-API-Key'] = this.apiKey;
        }
    }
    async execute(options) {
        const response = await this.request('POST', '/api/v1/execute', options);
        return response;
    }
    async listMembers() {
        const response = await this.request('GET', '/api/v1/members');
        return response.members;
    }
    async getMember(name) {
        const response = await this.request('GET', `/api/v1/members/${name}`);
        return response;
    }
    async health() {
        const response = await this.request('GET', '/health');
        return response;
    }
    async ready() {
        const response = await this.request('GET', '/health/ready');
        return response.ready;
    }
    async alive() {
        const response = await this.request('GET', '/health/live');
        return response.alive;
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                method,
                headers: this.headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const data = (await response.json());
            if (!response.ok) {
                throw new ConductorError(data.error || 'UnknownError', data.message || 'An error occurred', data.details, data.requestId);
            }
            return data;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new ConductorError('TimeoutError', `Request timeout after ${this.timeout}ms`);
            }
            if (error instanceof ConductorError) {
                throw error;
            }
            throw new ConductorError('NetworkError', error.message || 'Network error occurred');
        }
    }
}
export function createClient(config) {
    return new ConductorClient(config);
}
