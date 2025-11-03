/**
 * Type-Safe Member Execution Helpers
 *
 * Provides type-safe wrappers for each built-in member.
 */

import type { ConductorClient, ExecuteResult } from './client.js';

/**
 * Fetch Member
 */
export interface FetchInput {
	url: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	headers?: Record<string, string>;
	body?: unknown;
}

export interface FetchOutput {
	statusCode: number;
	body: string;
	headers: Record<string, string>;
	duration: number;
	attempt: number;
}

export interface FetchConfig {
	timeout?: number;
	maxRetries?: number;
	retryDelay?: number;
}

/**
 * Scrape Member
 */
export interface ScrapeInput {
	url: string;
}

export interface ScrapeOutput {
	html: string;
	url: string;
	finalUrl?: string;
	tier: number;
	duration: number;
	botProtection?: {
		detected: boolean;
		reasons: string[];
	};
}

export interface ScrapeConfig {
	strategy?: 'fast' | 'balanced' | 'aggressive';
	timeout?: number;
	userAgent?: string;
}

/**
 * Validate Member
 */
export interface ValidateInput {
	content: string;
	evalType: 'rule' | 'judge' | 'nlp' | 'embedding';
	reference?: string;
	rules?: string[];
}

export interface ValidateOutput {
	passed: boolean;
	score: number;
	scores: Record<string, number>;
	details: Record<string, unknown>;
	evalType: string;
}

export interface ValidateConfig {
	threshold?: number;
	metrics?: string[];
}

/**
 * RAG Member
 */
export interface RAGInput {
	operation: 'index' | 'search';
	content?: string;
	query?: string;
	namespace?: string;
}

export interface RAGIndexOutput {
	indexed: number;
	chunks: number;
	embeddingModel: string;
	chunkStrategy: string;
}

export interface RAGSearchOutput {
	results: Array<{
		content: string;
		score: number;
		metadata?: Record<string, unknown>;
	}>;
	count: number;
	reranked: boolean;
}

export type RAGOutput = RAGIndexOutput | RAGSearchOutput;

export interface RAGConfig {
	chunkSize?: number;
	chunkOverlap?: number;
	chunkStrategy?: 'fixed' | 'semantic' | 'recursive';
	embeddingModel?: string;
	topK?: number;
	minScore?: number;
	rerank?: boolean;
}

/**
 * HITL Member
 */
export interface HITLInput {
	operation: 'request' | 'respond';
	approvalData?: Record<string, unknown>;
	approvalId?: string;
	approved?: boolean;
	feedback?: string;
}

export interface HITLRequestOutput {
	approvalId: string;
	status: 'pending' | 'approved' | 'rejected';
	notificationSent: boolean;
}

export interface HITLRespondOutput {
	approvalId: string;
	approved: boolean;
	timestamp: number;
}

export type HITLOutput = HITLRequestOutput | HITLRespondOutput;

export interface HITLConfig {
	notificationMethod?: 'slack' | 'email' | 'webhook';
	webhookUrl?: string;
	slackChannel?: string;
	emailTo?: string;
	timeout?: number;
}

/**
 * Queries Member
 */
export interface QueriesInput {
	queryName?: string;
	sql?: string;
	input?: Record<string, unknown> | unknown[];
	database?: string;
}

export interface QueriesOutput {
	rows: unknown[];
	count: number;
	metadata: {
		columns: string[];
		executionTime: number;
		cached: boolean;
		database: string;
		query?: string;
	};
}

export interface QueriesConfig {
	defaultDatabase?: string;
	cacheTTL?: number;
	maxRows?: number;
	timeout?: number;
	readOnly?: boolean;
	transform?: 'none' | 'camelCase' | 'snakeCase';
	includeMetadata?: boolean;
}

/**
 * Type-Safe Member Execution Helpers
 */
export class MemberHelpers {
	constructor(private client: ConductorClient) {}

	/**
	 * Execute fetch member
	 */
	async fetch(input: FetchInput, config?: FetchConfig): Promise<ExecuteResult<FetchOutput>> {
		return this.client.execute<FetchOutput>({
			member: 'fetch',
			input,
			config
		});
	}

	/**
	 * Execute scrape member
	 */
	async scrape(input: ScrapeInput, config?: ScrapeConfig): Promise<ExecuteResult<ScrapeOutput>> {
		return this.client.execute<ScrapeOutput>({
			member: 'scrape',
			input,
			config
		});
	}

	/**
	 * Execute validate member
	 */
	async validate(input: ValidateInput, config?: ValidateConfig): Promise<ExecuteResult<ValidateOutput>> {
		return this.client.execute<ValidateOutput>({
			member: 'validate',
			input,
			config
		});
	}

	/**
	 * Execute RAG member - index operation
	 */
	async ragIndex(
		content: string,
		namespace?: string,
		config?: RAGConfig
	): Promise<ExecuteResult<RAGIndexOutput>> {
		return this.client.execute<RAGIndexOutput>({
			member: 'rag',
			input: { operation: 'index', content, namespace },
			config
		});
	}

	/**
	 * Execute RAG member - search operation
	 */
	async ragSearch(
		query: string,
		namespace?: string,
		config?: RAGConfig
	): Promise<ExecuteResult<RAGSearchOutput>> {
		return this.client.execute<RAGSearchOutput>({
			member: 'rag',
			input: { operation: 'search', query, namespace },
			config
		});
	}

	/**
	 * Execute HITL member - request approval
	 */
	async hitlRequest(
		approvalData: Record<string, unknown>,
		config?: HITLConfig
	): Promise<ExecuteResult<HITLRequestOutput>> {
		return this.client.execute<HITLRequestOutput>({
			member: 'hitl',
			input: { operation: 'request', approvalData },
			config
		});
	}

	/**
	 * Execute HITL member - respond to approval
	 */
	async hitlRespond(
		approvalId: string,
		approved: boolean,
		feedback?: string,
		config?: HITLConfig
	): Promise<ExecuteResult<HITLRespondOutput>> {
		return this.client.execute<HITLRespondOutput>({
			member: 'hitl',
			input: { operation: 'respond', approvalId, approved, feedback },
			config
		});
	}

	/**
	 * Execute queries member - from catalog
	 */
	async queryCatalog(
		queryName: string,
		input: Record<string, unknown>,
		database?: string,
		config?: QueriesConfig
	): Promise<ExecuteResult<QueriesOutput>> {
		return this.client.execute<QueriesOutput>({
			member: 'queries',
			input: { queryName, input, database },
			config
		});
	}

	/**
	 * Execute queries member - inline SQL
	 */
	async querySql(
		sql: string,
		params?: Record<string, unknown> | unknown[],
		database?: string,
		config?: QueriesConfig
	): Promise<ExecuteResult<QueriesOutput>> {
		return this.client.execute<QueriesOutput>({
			member: 'queries',
			input: { sql, input: params, database },
			config
		});
	}

	/**
	 * Execute queries member - generic
	 */
	async queries(input: QueriesInput, config?: QueriesConfig): Promise<ExecuteResult<QueriesOutput>> {
		return this.client.execute<QueriesOutput>({
			member: 'queries',
			input,
			config
		});
	}
}

/**
 * Create member helpers instance
 */
export function createMemberHelpers(client: ConductorClient): MemberHelpers {
	return new MemberHelpers(client);
}
