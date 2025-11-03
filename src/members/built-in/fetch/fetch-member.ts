/**
 * Fetch Member - HTTP Client with Retry Logic
 *
 * Features:
 * - Configurable retry attempts with exponential backoff
 * - Timeout handling
 * - Custom headers support
 * - Multiple HTTP methods
 */

import { BaseMember, type MemberExecutionContext } from '../../base-member';
import type { MemberConfig } from '../../../runtime/parser';
import type { FetchConfig, FetchInput, FetchResult } from './types';

export class FetchMember extends BaseMember {
	private fetchConfig: FetchConfig;

	constructor(config: MemberConfig, private readonly env: Env) {
		super(config);

		const cfg = config.config as FetchConfig | undefined;
		this.fetchConfig = {
			method: cfg?.method || 'GET',
			headers: cfg?.headers || {},
			retry: cfg?.retry !== undefined ? cfg.retry : 3,
			timeout: cfg?.timeout || 30000,
			retryDelay: cfg?.retryDelay || 1000
		};
	}

	protected async run(context: MemberExecutionContext): Promise<FetchResult> {
		const input = context.input as FetchInput;

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
				// If this is the last attempt, throw the error
				if (attempt === maxRetries) {
					throw new Error(
						`Fetch failed after ${attempt + 1} attempts: ${
							error instanceof Error ? error.message : 'Unknown error'
						}`
					);
				}

				// Otherwise, wait and retry with exponential backoff
				const delay = this.fetchConfig.retryDelay! * Math.pow(2, attempt);
				await this.sleep(delay);
			}
		}

		throw new Error('Fetch failed: Maximum retries exceeded');
	}

	private async executeRequest(input: FetchInput, attempt: number): Promise<Omit<FetchResult, 'duration' | 'attempt'>> {
		const url = input.url;
		const method = this.fetchConfig.method || 'GET';
		const headers = {
			...this.fetchConfig.headers,
			...input.headers
		};

		// Build request options
		const options: RequestInit = {
			method,
			headers,
			signal: AbortSignal.timeout(this.fetchConfig.timeout!)
		};

		// Add body for POST/PUT/PATCH
		if (input.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
			if (typeof input.body === 'object') {
				options.body = JSON.stringify(input.body);
				if (!headers['Content-Type']) {
					headers['Content-Type'] = 'application/json';
				}
			} else {
				options.body = input.body as string;
			}
		}

		// Execute request
		const response = await fetch(url, options);

		// Parse response body
		const contentType = response.headers.get('content-type') || '';
		let body: unknown;

		if (contentType.includes('application/json')) {
			body = await response.json();
		} else if (contentType.includes('text/')) {
			body = await response.text();
		} else {
			body = await response.text(); // Default to text
		}

		// Check for HTTP errors
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

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
