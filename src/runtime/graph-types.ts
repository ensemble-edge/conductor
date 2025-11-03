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

	/** Timeout in seconds */
	timeout?: number;

	/** Retry configuration */
	retry?: {
		attempts: number;
		backoff: 'linear' | 'exponential' | 'fixed';
		initialDelay?: number;
	};
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
}

/**
 * Union type for all flow elements
 */
export type FlowElement = GraphFlowStep | ParallelBlock | BranchBlock | ForEachBlock;

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
	type: 'step' | 'parallel' | 'branch' | 'foreach';
	element: FlowElement;
	dependencies: string[];
	status: 'pending' | 'running' | 'completed' | 'failed';
	startTime?: number;
	endTime?: number;
	result?: unknown;
	error?: Error;
}

/**
 * Execution graph
 */
export interface ExecutionGraph {
	nodes: Map<string, ExecutionNode>;
	/** Maps node ID to dependent node IDs */
	edges: Map<string, Set<string>>;
}
