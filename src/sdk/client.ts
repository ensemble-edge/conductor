/**
 * SDK Client
 *
 * HTTP client for calling deployed Conductor instances
 */

import type { ClientOptions, ExecutionResult, MemberResult, HealthStatus } from './types';

/**
 * Client for calling deployed Conductor instances
 *
 * @example
 * ```typescript
 * const client = new ConductorClient({
 *   baseUrl: 'https://owner-oiq.example.com',
 *   apiKey: process.env.OWNER_OIQ_API_KEY
 * });
 *
 * const result = await client.executeEnsemble('company-intelligence', {
 *   domain: 'acme.com'
 * });
 * ```
 */
export class ConductorClient {
	private baseUrl: string;
	private apiKey?: string;
	private timeout: number;
	private headers: Record<string, string>;

	constructor(options: ClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
		this.apiKey = options.apiKey;
		this.timeout = options.timeout || 30000;
		this.headers = {
			'Content-Type': 'application/json',
			...options.headers
		};

		if (this.apiKey) {
			this.headers['Authorization'] = `Bearer ${this.apiKey}`;
		}
	}

	/**
	 * Execute an ensemble
	 */
	async executeEnsemble(name: string, input: any): Promise<ExecutionResult> {
		const response = await this.fetch(`/ensemble/${name}`, {
			method: 'POST',
			body: JSON.stringify(input)
		});

		return await response.json() as ExecutionResult;
	}

	/**
	 * Execute a single member
	 */
	async executeMember(name: string, input: any): Promise<MemberResult> {
		const response = await this.fetch(`/member/${name}`, {
			method: 'POST',
			body: JSON.stringify(input)
		});

		return await response.json() as MemberResult;
	}

	/**
	 * Stream ensemble execution (for long-running Think members)
	 */
	async *streamEnsemble(name: string, input: any): AsyncIterableIterator<any> {
		const response = await this.fetch(`/ensemble/${name}/stream`, {
			method: 'POST',
			body: JSON.stringify(input)
		});

		if (!response.body) {
			throw new Error('Response body is null');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n').filter(line => line.trim());

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') return;
						yield JSON.parse(data);
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}

	/**
	 * Execute multiple requests in batch
	 */
	async executeBatch(requests: Array<{ ensemble: string; input: any }>): Promise<ExecutionResult[]> {
		const response = await this.fetch('/batch', {
			method: 'POST',
			body: JSON.stringify({ requests })
		});

		return await response.json() as ExecutionResult[];
	}

	/**
	 * Health check
	 */
	async health(): Promise<HealthStatus> {
		const response = await this.fetch('/health', {
			method: 'GET'
		});

		return await response.json() as HealthStatus;
	}

	/**
	 * List available ensembles
	 */
	async listEnsembles(): Promise<string[]> {
		const response = await this.fetch('/ensembles', {
			method: 'GET'
		});

		const data = await response.json() as { ensembles: string[] };
		return data.ensembles;
	}

	/**
	 * List available members
	 */
	async listMembers(): Promise<string[]> {
		const response = await this.fetch('/members', {
			method: 'GET'
		});

		const data = await response.json() as { members: string[] };
		return data.members;
	}

	/**
	 * Internal fetch wrapper with timeout and error handling
	 */
	private async fetch(path: string, init: RequestInit): Promise<Response> {
		const url = `${this.baseUrl}${path}`;

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				...init,
				headers: this.headers,
				signal: controller.signal
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`HTTP ${response.status}: ${error}`);
			}

			return response;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new Error(`Request timeout after ${this.timeout}ms`);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}
}
