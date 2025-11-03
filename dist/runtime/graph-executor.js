/**
 * Graph-based Workflow Executor
 *
 * Executes sophisticated workflows with parallel execution,
 * branching, and complex dependencies.
 */
import { Result } from '../types/result';
export class GraphExecutor {
    /**
     * Execute a graph-based flow
     */
    async execute(flow, context) {
        // Build execution graph
        const graph = this.buildGraph(flow);
        // Execute in topological order
        return await this.executeGraph(graph, context);
    }
    /**
     * Build execution graph from flow elements
     */
    buildGraph(flow) {
        const graph = {
            nodes: new Map(),
            edges: new Map(),
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
    addNode(graph, id, element) {
        const node = {
            id,
            type: this.getElementType(element),
            element,
            dependencies: this.getDependencies(element),
            status: 'pending',
        };
        graph.nodes.set(id, node);
        // Add edges for dependencies
        for (const depId of node.dependencies) {
            if (!graph.edges.has(depId)) {
                graph.edges.set(depId, new Set());
            }
            graph.edges.get(depId).add(id);
        }
    }
    /**
     * Get element type
     */
    getElementType(element) {
        if ('type' in element) {
            return element.type;
        }
        return 'step';
    }
    /**
     * Get dependencies from element
     */
    getDependencies(element) {
        if ('depends_on' in element && element.depends_on) {
            return element.depends_on;
        }
        return [];
    }
    /**
     * Execute the graph
     */
    async executeGraph(graph, context) {
        const results = new Map();
        const completed = new Set();
        // Find nodes with no dependencies
        const ready = Array.from(graph.nodes.values()).filter((node) => node.dependencies.length === 0);
        while (ready.length > 0 || completed.size < graph.nodes.size) {
            // Execute all ready nodes in parallel
            if (ready.length > 0) {
                const executions = ready.map((node) => this.executeNode(node, context, results));
                const nodeResults = await Promise.allSettled(executions);
                // Process results
                for (let i = 0; i < ready.length; i++) {
                    const node = ready[i];
                    const result = nodeResults[i];
                    if (result.status === 'fulfilled') {
                        results.set(node.id, result.value);
                        completed.add(node.id);
                        node.status = 'completed';
                    }
                    else {
                        node.status = 'failed';
                        node.error = result.reason;
                    }
                }
                // Clear ready list
                ready.length = 0;
            }
            // Find newly ready nodes
            for (const [nodeId, node] of graph.nodes) {
                if (node.status === 'pending') {
                    const depsCompleted = node.dependencies.every((dep) => completed.has(dep));
                    if (depsCompleted) {
                        ready.push(node);
                    }
                }
            }
            // Check for deadlock (no progress)
            if (ready.length === 0 && completed.size < graph.nodes.size) {
                // Find failed nodes
                const failed = Array.from(graph.nodes.values()).find((n) => n.status === 'failed');
                if (failed) {
                    return Result.err({
                        code: 'EXECUTION_FAILED',
                        message: `Node ${failed.id} failed: ${failed.error?.message}`,
                        details: { nodeId: failed.id, error: failed.error },
                        isOperational: true,
                        toJSON: () => ({ code: 'EXECUTION_FAILED', message: `Node failed` }),
                        toUserMessage: () => 'Execution failed',
                        name: 'ExecutionError',
                    });
                }
                // Deadlock detected
                return Result.err({
                    code: 'EXECUTION_DEADLOCK',
                    message: 'Execution deadlock detected - circular dependencies?',
                    details: {
                        completed: Array.from(completed),
                        pending: Array.from(graph.nodes.values())
                            .filter((n) => n.status === 'pending')
                            .map((n) => n.id),
                    },
                    isOperational: true,
                    toJSON: () => ({ code: 'EXECUTION_DEADLOCK', message: 'Deadlock detected' }),
                    toUserMessage: () => 'Execution deadlock detected',
                    name: 'DeadlockError',
                });
            }
        }
        return Result.ok(Object.fromEntries(results));
    }
    /**
     * Execute a single node
     */
    async executeNode(node, context, results) {
        node.status = 'running';
        node.startTime = Date.now();
        try {
            let result;
            switch (node.type) {
                case 'step':
                    result = await this.executeStepWithFeatures(node.element, context, results);
                    break;
                case 'parallel':
                    result = await this.executeParallel(node.element, context, results);
                    break;
                case 'branch':
                    result = await this.executeBranch(node.element, context, results);
                    break;
                case 'foreach':
                    result = await this.executeForEach(node.element, context, results);
                    break;
                case 'try':
                    result = await this.executeTry(node.element, context, results);
                    break;
                case 'switch':
                    result = await this.executeSwitch(node.element, context, results);
                    break;
                case 'while':
                    result = await this.executeWhile(node.element, context, results);
                    break;
                case 'map-reduce':
                    result = await this.executeMapReduce(node.element, context, results);
                    break;
                default:
                    throw new Error(`Unknown node type: ${node.type}`);
            }
            node.endTime = Date.now();
            node.result = result;
            return result;
        }
        catch (error) {
            node.endTime = Date.now();
            node.error = error;
            throw error;
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(step, context, results) {
        // TODO: Implement actual member execution
        // This is a simplified placeholder
        return { success: true, member: step.member };
    }
    /**
     * Execute step with retry, timeout, and conditional execution
     */
    async executeStepWithFeatures(step, context, results) {
        // Check "when" condition - skip if false
        if (step.when) {
            const shouldExecute = this.evaluateCondition(step.when, context, results);
            if (!shouldExecute) {
                return { skipped: true, reason: 'when condition false' };
            }
        }
        // Execute with retry logic
        if (step.retry) {
            return await this.executeWithRetry(step, context, results);
        }
        // Execute with timeout
        if (step.timeout) {
            return await this.executeWithTimeout(step, context, results);
        }
        // Regular execution
        return await this.executeStep(step, context, results);
    }
    /**
     * Execute step with retry logic
     */
    async executeWithRetry(step, context, results) {
        const retry = step.retry;
        const maxAttempts = retry.attempts || 3;
        const initialDelay = retry.initialDelay || 1000;
        const maxDelay = retry.maxDelay || 30000;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Execute with optional timeout
                if (step.timeout) {
                    return await this.executeWithTimeout(step, context, results);
                }
                return await this.executeStep(step, context, results);
            }
            catch (error) {
                const errorCode = error.code;
                // Check if we should retry this error
                if (retry.retryOn && errorCode && !retry.retryOn.includes(errorCode)) {
                    throw error; // Don't retry this error type
                }
                // Last attempt - throw error
                if (attempt === maxAttempts - 1) {
                    throw error;
                }
                // Calculate backoff delay
                let delay;
                switch (retry.backoff) {
                    case 'exponential':
                        delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
                        break;
                    case 'linear':
                        delay = Math.min(initialDelay * (attempt + 1), maxDelay);
                        break;
                    case 'fixed':
                    default:
                        delay = initialDelay;
                }
                // Wait before retry
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retry attempts reached');
    }
    /**
     * Execute step with timeout
     */
    async executeWithTimeout(step, context, results) {
        const timeout = step.timeout;
        const onTimeout = step.onTimeout;
        return (await Promise.race([
            this.executeStep(step, context, results),
            new Promise((_, reject) => setTimeout(() => {
                if (onTimeout?.error === false && onTimeout.fallback !== undefined) {
                    // Return fallback instead of error
                    return onTimeout.fallback;
                }
                reject(new Error(`Step timeout after ${timeout}ms`));
            }, timeout)),
        ]));
    }
    /**
     * Execute parallel block
     */
    async executeParallel(block, context, results) {
        const executions = block.steps.map((step) => this.executeStep(step, context, results));
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
    async executeBranch(block, context, results) {
        // Evaluate condition
        const condition = this.evaluateCondition(block.condition, context, results);
        // Execute appropriate branch
        const branch = condition ? block.then : block.else || [];
        const branchResults = [];
        for (const element of branch) {
            const result = await this.executeElement(element, context, results);
            branchResults.push(result);
        }
        return branchResults;
    }
    /**
     * Execute foreach loop
     */
    async executeForEach(block, context, results) {
        // Resolve items array
        const items = this.resolveExpression(block.items, context, results);
        if (!Array.isArray(items)) {
            throw new Error(`ForEach items must be an array, got: ${typeof items}`);
        }
        // Execute step for each item
        const maxConcurrency = block.maxConcurrency || items.length;
        const loopResults = [];
        for (let i = 0; i < items.length; i += maxConcurrency) {
            const batch = items.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(batch.map((item) => {
                const itemContext = { ...context, item };
                return this.executeStep(block.step, itemContext, results);
            }));
            loopResults.push(...batchResults);
            // Check break condition (early exit)
            if (block.breakWhen) {
                const shouldBreak = this.evaluateCondition(block.breakWhen, context, results);
                if (shouldBreak) {
                    break;
                }
            }
        }
        return loopResults;
    }
    /**
     * Execute any flow element
     */
    async executeElement(element, context, results) {
        if ('type' in element) {
            switch (element.type) {
                case 'parallel':
                    return this.executeParallel(element, context, results);
                case 'branch':
                    return this.executeBranch(element, context, results);
                case 'foreach':
                    return this.executeForEach(element, context, results);
                case 'try':
                    return this.executeTry(element, context, results);
                case 'switch':
                    return this.executeSwitch(element, context, results);
                case 'while':
                    return this.executeWhile(element, context, results);
                case 'map-reduce':
                    return this.executeMapReduce(element, context, results);
            }
        }
        return this.executeStep(element, context, results);
    }
    /**
     * Execute try/catch/finally block
     */
    async executeTry(block, context, results) {
        let tryResult;
        let error = null;
        try {
            // Execute try block
            const tryResults = [];
            for (const element of block.steps) {
                const result = await this.executeElement(element, context, results);
                tryResults.push(result);
            }
            tryResult = tryResults;
        }
        catch (err) {
            error = err;
            // Execute catch block if present
            if (block.catch && block.catch.length > 0) {
                const catchResults = [];
                const errorContext = { ...context, error };
                for (const element of block.catch) {
                    const result = await this.executeElement(element, errorContext, results);
                    catchResults.push(result);
                }
                tryResult = catchResults;
            }
            else {
                // No catch block - rethrow
                throw error;
            }
        }
        finally {
            // Execute finally block if present
            if (block.finally && block.finally.length > 0) {
                for (const element of block.finally) {
                    await this.executeElement(element, context, results);
                }
            }
        }
        return tryResult;
    }
    /**
     * Execute switch/case block
     */
    async executeSwitch(block, context, results) {
        // Evaluate switch value
        const value = this.resolveExpression(block.value, context, results);
        const valueStr = String(value);
        // Find matching case
        let caseSteps = block.cases[valueStr];
        if (!caseSteps && block.default) {
            caseSteps = block.default;
        }
        if (!caseSteps) {
            return null; // No matching case and no default
        }
        // Execute case steps
        const caseResults = [];
        for (const element of caseSteps) {
            const result = await this.executeElement(element, context, results);
            caseResults.push(result);
        }
        return caseResults;
    }
    /**
     * Execute while loop
     */
    async executeWhile(block, context, results) {
        const maxIterations = block.maxIterations || 1000; // Safety limit
        const loopResults = [];
        let iterations = 0;
        while (iterations < maxIterations) {
            // Check condition
            const condition = this.evaluateCondition(block.condition, context, results);
            if (!condition) {
                break;
            }
            // Execute loop steps
            const iterationResults = [];
            for (const element of block.steps) {
                const result = await this.executeElement(element, context, results);
                iterationResults.push(result);
            }
            loopResults.push(iterationResults);
            iterations++;
        }
        if (iterations >= maxIterations) {
            throw new Error(`While loop exceeded maximum iterations (${maxIterations})`);
        }
        return loopResults;
    }
    /**
     * Execute map/reduce pattern
     */
    async executeMapReduce(block, context, results) {
        // Resolve items array
        const items = this.resolveExpression(block.items, context, results);
        if (!Array.isArray(items)) {
            throw new Error(`Map-Reduce items must be an array, got: ${typeof items}`);
        }
        // Map phase: Process items with concurrency control
        const maxConcurrency = block.maxConcurrency || items.length;
        const mapResults = [];
        for (let i = 0; i < items.length; i += maxConcurrency) {
            const batch = items.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(batch.map((item) => {
                const itemContext = { ...context, item };
                return this.executeStep(block.map, itemContext, results);
            }));
            mapResults.push(...batchResults);
        }
        // Reduce phase: Aggregate results
        const reduceContext = { ...context, results: mapResults };
        return await this.executeStep(block.reduce, reduceContext, results);
    }
    /**
     * Evaluate condition expression
     */
    evaluateCondition(condition, context, results) {
        // Simple expression evaluation
        // In production, use a proper expression parser
        try {
            const func = new Function('context', 'results', `return ${condition}`);
            return func(context, Object.fromEntries(results));
        }
        catch {
            return false;
        }
    }
    /**
     * Resolve expression to value
     */
    resolveExpression(expression, context, results) {
        try {
            const func = new Function('context', 'results', `return ${expression}`);
            return func(context, Object.fromEntries(results));
        }
        catch {
            return expression;
        }
    }
}
