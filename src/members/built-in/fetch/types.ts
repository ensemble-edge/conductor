/**
 * Fetch Member - Type Definitions
 */

export interface FetchConfig {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers?: Record<string, string>;
	retry?: number;
	timeout?: number;
	retryDelay?: number; // Initial delay in ms for exponential backoff
}

export interface FetchInput {
	url: string;
	body?: any;
	headers?: Record<string, string>;
}

export interface FetchResult {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: any;
	duration: number;
	attempt: number;
}
