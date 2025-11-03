/**
 * Graph-based Workflow Types
 *
 * Support for sophisticated workflows with:
 * - Parallel execution
 * - Conditional branching
 * - Complex dependencies
 * - Dynamic flow control
 */

import type { FlowStep } from './parser';

/**
 * Enhanced flow step with graph capabilities
 */
export interface GraphFlowStep extends FlowStep {
	/** Steps that must complete before this one */
	depends_on?: string[];

	/** Timeout in milliseconds */
	timeout?: number;

	/** Fallback value if timeout occurs */
	onTimeout?: {
		fallback?: unknown;
		error?: boolean;
	};

	/** Retry configuration */
	retry?: {
		attempts: number;
		backoff: 'linear' | 'exponential' | 'fixed';
		initialDelay?: number;
		maxDelay?: number;
		retryOn?: string[]; // Error codes to retry on
	};

	/** Conditional execution - skip if false */
	when?: string; // Expression that resolves to boolean
}

/**
 * Parallel execution block
 */
export interface ParallelBlock {
	type: 'parallel';
	steps: GraphFlowStep[];
	/** Wait for all or just first to complete */
	waitFor?: 'all' | 'any';
}

/**
 * Conditional branch
 */
export interface BranchBlock {
	type: 'branch';
	condition: string;
	then: (GraphFlowStep | ParallelBlock | BranchBlock | ForEachBlock)[];
	else?: (GraphFlowStep | ParallelBlock | BranchBlock | ForEachBlock)[];
}

/**
 * Loop over items
 */
export interface ForEachBlock {
	type: 'foreach';
	items: string; // Expression that resolves to array
	step: GraphFlowStep;
	/** Maximum parallel executions */
	maxConcurrency?: number;
	/** Break condition - exit loop early if true */
	breakWhen?: string; // Expression that resolves to boolean
}

/**
 * Try/Catch error handling
 */
export interface TryBlock {
	type: 'try';
	steps: FlowElement[];
	catch?: FlowElement[];
	finally?: FlowElement[];
}

/**
 * Switch/Case branching
 */
export interface SwitchBlock {
	type: 'switch';
	value: string; // Expression to evaluate
	cases: Record<string, FlowElement[]>;
	default?: FlowElement[];
}

/**
 * While loop with condition
 */
export interface WhileBlock {
	type: 'while';
	condition: string; // Expression that resolves to boolean
	steps: FlowElement[];
	maxIterations?: number; // Safety limit
}

/**
 * Map/Reduce pattern
 */
export interface MapReduceBlock {
	type: 'map-reduce';
	items: string; // Expression that resolves to array
	maxConcurrency?: number;
	map: GraphFlowStep;
	reduce: GraphFlowStep;
}

/**
 * Union type for all flow elements
 */
export type FlowElement =
	| GraphFlowStep
	| ParallelBlock
	| BranchBlock
	| ForEachBlock
	| TryBlock
	| SwitchBlock
	| WhileBlock
	| MapReduceBlock;

/**
 * Extended ensemble config with graph support
 */
export interface GraphEnsembleConfig {
	name: string;
	description?: string;
	flow: FlowElement[];
	output?: Record<string, unknown>;
	state?: {
		schema?: Record<string, unknown>;
		initial?: Record<string, unknown>;
	};
}

/**
 * Execution node in the graph
 */
export interface ExecutionNode {
	id: string;
	type: 'step' | 'parallel' | 'branch' | 'foreach' | 'try' | 'switch' | 'while' | 'map-reduce';
	element: FlowElement;
	dependencies: string[];
	status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
	startTime?: number;
	endTime?: number;
	result?: unknown;
	error?: Error;
	/** Number of retry attempts made */
	retryCount?: number;
	/** Whether this step was skipped due to when condition */
	skipped?: boolean;
}

/**
 * Execution graph
 */
export interface ExecutionGraph {
	nodes: Map<string, ExecutionNode>;
	/** Maps node ID to dependent node IDs */
	edges: Map<string, Set<string>>;
}
