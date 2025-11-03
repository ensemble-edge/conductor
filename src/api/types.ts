/**
 * API Types
 *
 * Type definitions for the Conductor HTTP API.
 */

import type { Context } from 'hono';

/**
 * API Request/Response Types
 */

export interface ExecuteRequest {
	member: string;
	input: Record<string, any>;
	config?: Record<string, any>;
	userId?: string;
	sessionId?: string;
	metadata?: Record<string, any>;
}

export interface ExecuteResponse {
	success: boolean;
	data?: any;
	error?: string;
	metadata: {
		executionId: string;
		duration: number;
		timestamp: number;
	};
}

export interface AsyncExecuteRequest extends ExecuteRequest {
	callbackUrl?: string;
	priority?: 'low' | 'normal' | 'high';
}

export interface AsyncExecuteResponse {
	executionId: string;
	status: 'queued' | 'running' | 'completed' | 'failed';
	queuePosition?: number;
	estimatedTime?: number;
}

export interface StreamEvent {
	type: 'start' | 'data' | 'error' | 'end';
	data?: any;
	error?: string;
	timestamp: number;
}

export interface MemberListResponse {
	members: Array<{
		name: string;
		type: string;
		version?: string;
		description?: string;
		builtIn: boolean;
	}>;
	count: number;
}

export interface MemberDetailResponse {
	name: string;
	type: string;
	version?: string;
	description?: string;
	builtIn: boolean;
	config?: {
		schema?: Record<string, any>;
		defaults?: Record<string, any>;
	};
	input?: {
		schema?: Record<string, any>;
		examples?: any[];
	};
	output?: {
		schema?: Record<string, any>;
		examples?: any[];
	};
}

export interface HealthResponse {
	status: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: number;
	version: string;
	checks: {
		database?: boolean;
		cache?: boolean;
		queue?: boolean;
	};
}

export interface ErrorResponse {
	error: string;
	message: string;
	code?: string;
	details?: any;
	timestamp: number;
	requestId?: string;
}

/**
 * Authentication Types
 */

export interface AuthConfig {
	apiKeys?: string[];
	allowAnonymous?: boolean;
	rateLimits?: {
		authenticated: {
			requests: number;
			window: number;
		};
		anonymous: {
			requests: number;
			window: number;
		};
	};
}

export interface AuthContext {
	authenticated: boolean;
	apiKey?: string;
	userId?: string;
	tier?: 'free' | 'pro' | 'enterprise';
}

/**
 * Rate Limiting Types
 */

export interface RateLimitConfig {
	requests: number;
	window: number; // seconds
	keyPrefix?: string;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfter?: number;
}

/**
 * Extended Hono Context
 * Note: This is a simplified version. In production, properly extend Hono's Context type.
 */

export type ConductorContext = Context<{
	Bindings: Env;
	Variables: {
		auth?: AuthContext;
		requestId?: string;
		startTime?: number;
	};
}>;
