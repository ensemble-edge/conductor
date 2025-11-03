/**
 * Graph-based Workflow Executor
 *
 * Executes sophisticated workflows with parallel execution,
 * branching, and complex dependencies.
 */

import type {
	FlowElement,
	GraphFlowStep,
	ParallelBlock,
	BranchBlock,
	ForEachBlock,
	ExecutionNode,
	ExecutionGraph
} from './graph-types';
import type { MemberExecutionContext } from '../members/base-member';
import { Result } from '../types/result';
import type { ConductorError } from '../errors/error-types';

export class GraphExecutor {
	/**
	 * Execute a graph-based flow
	 */
	async execute(
		flow: FlowElement[],
		context: Record<string, unknown>
	): Promise<Result<Record<string, unknown>, ConductorError>> {
		// Build execution graph
		const graph = this.buildGraph(flow);

		// Execute in topological order
		return await this.executeGraph(graph, context);
	}

	/**
	 * Build execution graph from flow elements
	 */
	private buildGraph(flow: FlowElement[]): ExecutionGraph {
		const graph: ExecutionGraph = {
			nodes: new Map(),
			edges: new Map()
		};

		let nodeId = 0;

		for (const element of flow) {
			const id = `node_${nodeId++}`;
			this.addNode(graph, id, element);
		}

		return graph;
	}

	/**
	 * Add node to graph
	 */
	private addNode(graph: ExecutionGraph, id: string, element: FlowElement): void {
		const node: ExecutionNode = {
			id,
			type: this.getElementType(element),
			element,
			dependencies: this.getDependencies(element),
			status: 'pending'
		};

		graph.nodes.set(id, node);

		// Add edges for dependencies
		for (const depId of node.dependencies) {
			if (!graph.edges.has(depId)) {
				graph.edges.set(depId, new Set());
			}
			graph.edges.get(depId)!.add(id);
		}
	}

	/**
	 * Get element type
	 */
	private getElementType(element: FlowElement): ExecutionNode['type'] {
		if ('type' in element) {
			return element.type as ExecutionNode['type'];
		}
		return 'step';
	}

	/**
	 * Get dependencies from element
	 */
	private getDependencies(element: FlowElement): string[] {
		if ('depends_on' in element && element.depends_on) {
			return element.depends_on;
		}
		return [];
	}

	/**
	 * Execute the graph
	 */
	private async executeGraph(
		graph: ExecutionGraph,
		context: Record<string, unknown>
	): Promise<Result<Record<string, unknown>, ConductorError>> {
		const results = new Map<string, unknown>();
		const completed = new Set<string>();

		// Find nodes with no dependencies
		const ready = Array.from(graph.nodes.values()).filter(
			node => node.dependencies.length === 0
		);

		while (ready.length > 0 || completed.size < graph.nodes.size) {
			// Execute all ready nodes in parallel
			if (ready.length > 0) {
				const executions = ready.map(node => this.executeNode(node, context, results));
				const nodeResults = await Promise.allSettled(executions);

				// Process results
				for (let i = 0; i < ready.length; i++) {
					const node = ready[i];
					const result = nodeResults[i];

					if (result.status === 'fulfilled') {
						results.set(node.id, result.value);
						completed.add(node.id);
						node.status = 'completed';
					} else {
						node.status = 'failed';
						node.error = result.reason as Error;
					}
				}

				// Clear ready list
				ready.length = 0;
			}

			// Find newly ready nodes
			for (const [nodeId, node] of graph.nodes) {
				if (node.status === 'pending') {
					const depsCompleted = node.dependencies.every(dep => completed.has(dep));
					if (depsCompleted) {
						ready.push(node);
					}
				}
			}

			// Check for deadlock (no progress)
			if (ready.length === 0 && completed.size < graph.nodes.size) {
				// Find failed nodes
				const failed = Array.from(graph.nodes.values()).find(n => n.status === 'failed');
				if (failed) {
					return Result.err({
						code: 'EXECUTION_FAILED',
						message: `Node ${failed.id} failed: ${failed.error?.message}`,
						details: { nodeId: failed.id, error: failed.error },
						isOperational: true,
						toJSON: () => ({ code: 'EXECUTION_FAILED', message: `Node failed` }),
						toUserMessage: () => 'Execution failed',
						name: 'ExecutionError'
					} as unknown as ConductorError);
				}

				// Deadlock detected
				return Result.err({
					code: 'EXECUTION_DEADLOCK',
					message: 'Execution deadlock detected - circular dependencies?',
					details: {
						completed: Array.from(completed),
						pending: Array.from(graph.nodes.values())
							.filter(n => n.status === 'pending')
							.map(n => n.id)
					},
					isOperational: true,
					toJSON: () => ({ code: 'EXECUTION_DEADLOCK', message: 'Deadlock detected' }),
					toUserMessage: () => 'Execution deadlock detected',
					name: 'DeadlockError'
				} as unknown as ConductorError);
			}
		}

		return Result.ok(Object.fromEntries(results));
	}

	/**
	 * Execute a single node
	 */
	private async executeNode(
		node: ExecutionNode,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown> {
		node.status = 'running';
		node.startTime = Date.now();

		try {
			let result: unknown;

			switch (node.type) {
				case 'step':
					result = await this.executeStep(node.element as GraphFlowStep, context, results);
					break;

				case 'parallel':
					result = await this.executeParallel(node.element as ParallelBlock, context, results);
					break;

				case 'branch':
					result = await this.executeBranch(node.element as BranchBlock, context, results);
					break;

				case 'foreach':
					result = await this.executeForEach(node.element as ForEachBlock, context, results);
					break;

				default:
					throw new Error(`Unknown node type: ${node.type}`);
			}

			node.endTime = Date.now();
			node.result = result;
			return result;

		} catch (error) {
			node.endTime = Date.now();
			node.error = error as Error;
			throw error;
		}
	}

	/**
	 * Execute a single step
	 */
	private async executeStep(
		step: GraphFlowStep,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown> {
		// TODO: Implement actual member execution
		// This is a simplified placeholder
		return { success: true, member: step.member };
	}

	/**
	 * Execute parallel block
	 */
	private async executeParallel(
		block: ParallelBlock,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown[]> {
		const executions = block.steps.map(step =>
			this.executeStep(step, context, results)
		);

		if (block.waitFor === 'any') {
			// Return first completed
			return [await Promise.race(executions)];
		}

		// Wait for all (default)
		return await Promise.all(executions);
	}

	/**
	 * Execute conditional branch
	 */
	private async executeBranch(
		block: BranchBlock,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown> {
		// Evaluate condition
		const condition = this.evaluateCondition(block.condition, context, results);

		// Execute appropriate branch
		const branch = condition ? block.then : (block.else || []);

		const branchResults: unknown[] = [];
		for (const element of branch) {
			const result = await this.executeElement(element, context, results);
			branchResults.push(result);
		}

		return branchResults;
	}

	/**
	 * Execute foreach loop
	 */
	private async executeForEach(
		block: ForEachBlock,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown[]> {
		// Resolve items array
		const items = this.resolveExpression(block.items, context, results) as unknown[];

		if (!Array.isArray(items)) {
			throw new Error(`ForEach items must be an array, got: ${typeof items}`);
		}

		// Execute step for each item
		const maxConcurrency = block.maxConcurrency || items.length;
		const loopResults: unknown[] = [];

		for (let i = 0; i < items.length; i += maxConcurrency) {
			const batch = items.slice(i, i + maxConcurrency);
			const batchResults = await Promise.all(
				batch.map(item => {
					const itemContext = { ...context, item };
					return this.executeStep(block.step, itemContext, results);
				})
			);
			loopResults.push(...batchResults);
		}

		return loopResults;
	}

	/**
	 * Execute any flow element
	 */
	private async executeElement(
		element: FlowElement,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): Promise<unknown> {
		if ('type' in element) {
			switch (element.type) {
				case 'parallel':
					return this.executeParallel(element as ParallelBlock, context, results);
				case 'branch':
					return this.executeBranch(element as BranchBlock, context, results);
				case 'foreach':
					return this.executeForEach(element as ForEachBlock, context, results);
			}
		}
		return this.executeStep(element as GraphFlowStep, context, results);
	}

	/**
	 * Evaluate condition expression
	 */
	private evaluateCondition(
		condition: string,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): boolean {
		// Simple expression evaluation
		// In production, use a proper expression parser
		try {
			const func = new Function('context', 'results', `return ${condition}`);
			return func(context, Object.fromEntries(results));
		} catch {
			return false;
		}
	}

	/**
	 * Resolve expression to value
	 */
	private resolveExpression(
		expression: string,
		context: Record<string, unknown>,
		results: Map<string, unknown>
	): unknown {
		try {
			const func = new Function('context', 'results', `return ${expression}`);
			return func(context, Object.fromEntries(results));
		} catch {
			return expression;
		}
	}
}
