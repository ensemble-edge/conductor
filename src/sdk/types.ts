/**
 * SDK Type Definitions
 */

import type { MemberExecutionContext, MemberResponse } from '../members/base-member';
import type { MemberConfig } from '../runtime/parser';
import { MemberType } from '../types/constants';

export type { MemberExecutionContext, MemberResponse, MemberConfig };
export { MemberType };

/**
 * Member handler function signature
 */
export type MemberHandler<TInput = any, TOutput = any> = (
	context: MemberExecutionContext
) => Promise<TOutput> | TOutput;

/**
 * Options for creating a member
 */
export interface CreateMemberOptions {
	name: string;
	type: MemberType.Function | MemberType.Think | MemberType.Data | MemberType.API;
	description?: string;
	config?: Record<string, any>;
	schema?: {
		input?: Record<string, any>;
		output?: Record<string, any>;
	};
	handler: MemberHandler;
}

/**
 * Client options for connecting to deployed Conductor
 */
export interface ClientOptions {
	baseUrl: string;
	apiKey?: string;
	timeout?: number;
	headers?: Record<string, string>;
}

/**
 * Execution result from client
 */
export interface ExecutionResult {
	success: boolean;
	output?: any;
	error?: string;
	metrics: {
		ensemble: string;
		totalDuration: number;
		members: Array<{
			name: string;
			duration: number;
			cached: boolean;
			success: boolean;
		}>;
		cacheHits: number;
	};
}

/**
 * Member execution result
 */
export interface MemberResult {
	success: boolean;
	data?: any;
	error?: string;
	timestamp: string;
	cached: boolean;
	executionTime: number;
}

/**
 * Health check status
 */
export interface HealthStatus {
	status: 'ok' | 'degraded' | 'down';
	version: string;
	timestamp: string;
	checks?: Record<string, boolean>;
}
