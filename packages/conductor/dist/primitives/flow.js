/**
 * Flow Control Primitives
 *
 * Functions for creating control flow structures in ensembles.
 * These produce the same objects as YAML parsing.
 */
/**
 * Create a parallel execution block
 *
 * Executes multiple steps concurrently for better performance.
 *
 * @param steps - Steps to execute in parallel
 * @param options - Parallel execution options
 * @returns ParallelFlowStep
 *
 * @example
 * ```typescript
 * // Wait for all steps to complete (default)
 * parallel([
 *   step('fetch-users'),
 *   step('fetch-products'),
 *   step('fetch-orders')
 * ])
 *
 * // Wait for any one step to complete
 * parallel([
 *   step('primary-api'),
 *   step('fallback-api')
 * ], { waitFor: 'any' })
 *
 * // Wait for first step to complete (ignore others)
 * parallel([
 *   step('fast-search'),
 *   step('comprehensive-search')
 * ], { waitFor: 'first' })
 * ```
 */
export function parallel(steps, options = {}) {
    return {
        type: 'parallel',
        steps,
        waitFor: options.waitFor ?? 'all',
    };
}
/**
 * Create a conditional branch
 *
 * Executes different steps based on a condition.
 *
 * @param condition - Condition expression (supports ${} syntax)
 * @param options - Branch options with then/else steps
 * @returns BranchFlowStep
 *
 * @example
 * ```typescript
 * // Simple if/then
 * branch('${input.premium}', {
 *   then: [step('premium-flow')]
 * })
 *
 * // If/then/else
 * branch('${validate.output.valid}', {
 *   then: [
 *     step('process'),
 *     step('notify-success')
 *   ],
 *   else: [
 *     step('log-error'),
 *     step('notify-failure')
 *   ]
 * })
 *
 * // Complex condition
 * branch('${input.amount > 1000 && input.verified}', {
 *   then: [step('high-value-flow')],
 *   else: [step('standard-flow')]
 * })
 * ```
 */
export function branch(condition, options) {
    return {
        type: 'branch',
        condition,
        then: options.then,
        ...(options.else && { else: options.else }),
    };
}
/**
 * Create an if/then shorthand (alias for branch without else)
 *
 * @param condition - Condition expression
 * @param steps - Steps to execute if condition is true
 * @returns BranchFlowStep
 *
 * @example
 * ```typescript
 * ifThen('${input.sendEmail}', [
 *   step('send-confirmation-email')
 * ])
 * ```
 */
export function ifThen(condition, steps) {
    return branch(condition, { then: steps });
}
/**
 * Create an if/then/else shorthand
 *
 * @param condition - Condition expression
 * @param thenSteps - Steps to execute if condition is true
 * @param elseSteps - Steps to execute if condition is false
 * @returns BranchFlowStep
 *
 * @example
 * ```typescript
 * ifThenElse('${input.premium}',
 *   [step('premium-flow')],
 *   [step('standard-flow')]
 * )
 * ```
 */
export function ifThenElse(condition, thenSteps, elseSteps) {
    return branch(condition, { then: thenSteps, else: elseSteps });
}
/**
 * Create a foreach iteration
 *
 * Iterates over a collection and executes steps for each item.
 *
 * @param items - Collection to iterate (expression like ${input.items})
 * @param stepToExecute - Step to execute for each item
 * @param options - Foreach options
 * @returns ForeachFlowStep
 *
 * @example
 * ```typescript
 * // Process each item sequentially
 * foreach('${input.users}', step('process-user', {
 *   input: { user: '${item}' }
 * }))
 *
 * // Process with concurrency limit
 * foreach('${input.urls}', step('fetch-url', {
 *   input: { url: '${item}' }
 * }), { maxConcurrency: 5 })
 *
 * // Early exit on condition
 * foreach('${input.records}', step('validate'), {
 *   breakWhen: '${item.output.invalid}'
 * })
 * ```
 */
export function foreach(items, stepToExecute, options = {}) {
    return {
        type: 'foreach',
        items,
        step: stepToExecute,
        ...(options.maxConcurrency && { maxConcurrency: options.maxConcurrency }),
        ...(options.breakWhen !== undefined && { breakWhen: options.breakWhen }),
    };
}
/**
 * Create a try/catch/finally block
 *
 * Handles errors gracefully with optional recovery steps.
 *
 * @param steps - Steps to try
 * @param options - Catch and finally handlers
 * @returns TryFlowStep
 *
 * @example
 * ```typescript
 * // Try with catch
 * tryStep([
 *   step('risky-operation')
 * ], {
 *   catch: [step('handle-error')]
 * })
 *
 * // Try with catch and finally
 * tryStep([
 *   step('open-connection'),
 *   step('process-data')
 * ], {
 *   catch: [step('log-error')],
 *   finally: [step('close-connection')]
 * })
 *
 * // Nested try blocks
 * tryStep([
 *   step('outer-operation'),
 *   tryStep([step('inner-operation')], {
 *     catch: [step('inner-recovery')]
 *   })
 * ], {
 *   catch: [step('outer-recovery')]
 * })
 * ```
 */
export function tryStep(steps, options = {}) {
    return {
        type: 'try',
        steps,
        ...(options.catch && { catch: options.catch }),
        ...(options.finally && { finally: options.finally }),
    };
}
/**
 * Create a switch/case block
 *
 * Multi-way branching based on a value.
 *
 * @param value - Value to switch on (expression)
 * @param cases - Map of case values to steps
 * @param defaultCase - Steps to execute if no case matches
 * @returns SwitchFlowStep
 *
 * @example
 * ```typescript
 * // Simple switch
 * switchStep('${input.type}', {
 *   'create': [step('handle-create')],
 *   'update': [step('handle-update')],
 *   'delete': [step('handle-delete')]
 * })
 *
 * // Switch with default
 * switchStep('${classify.output.category}', {
 *   'urgent': [step('priority-queue')],
 *   'normal': [step('standard-queue')]
 * }, [step('low-priority-queue')])
 *
 * // Switch with multiple steps per case
 * switchStep('${input.plan}', {
 *   'enterprise': [
 *     step('unlock-features'),
 *     step('assign-account-manager'),
 *     step('setup-sla')
 *   ],
 *   'pro': [
 *     step('unlock-features')
 *   ]
 * }, [step('basic-setup')])
 * ```
 */
export function switchStep(value, cases, defaultCase) {
    return {
        type: 'switch',
        value,
        cases,
        ...(defaultCase && { default: defaultCase }),
    };
}
/**
 * Create a while loop
 *
 * Repeats steps while a condition is true.
 *
 * @param condition - Condition to check (expression)
 * @param steps - Steps to repeat
 * @param options - Loop options (maxIterations for safety)
 * @returns WhileFlowStep
 *
 * @example
 * ```typescript
 * // Simple while loop
 * whileStep('${state.hasMore}', [
 *   step('fetch-page'),
 *   step('process-page')
 * ])
 *
 * // While with safety limit
 * whileStep('${state.retryNeeded}', [
 *   step('attempt-operation')
 * ], { maxIterations: 5 })
 *
 * // Pagination loop
 * whileStep('${state.nextCursor}', [
 *   step('fetch-batch', {
 *     input: { cursor: '${state.nextCursor}' }
 *   }),
 *   step('process-batch')
 * ], { maxIterations: 100 })
 * ```
 */
export function whileStep(condition, steps, options = {}) {
    return {
        type: 'while',
        condition,
        steps,
        maxIterations: options.maxIterations ?? 100, // Default safety limit
    };
}
/**
 * Create a do-while loop (executes at least once)
 *
 * Syntactic sugar that creates a sequence with initial execution + while loop.
 *
 * @param steps - Steps to repeat
 * @param condition - Condition to check after each iteration
 * @param options - Loop options
 * @returns Array of steps (initial + while)
 *
 * @example
 * ```typescript
 * doWhile([
 *   step('fetch-data'),
 *   step('process')
 * ], '${state.hasMore}')
 * ```
 */
export function doWhile(steps, condition, options = {}) {
    return [
        ...steps, // Execute once
        whileStep(condition, steps, options), // Then loop if condition is true
    ];
}
/**
 * Create a do-until loop (executes until condition becomes true)
 *
 * Opposite of do-while - continues while condition is false.
 *
 * @param steps - Steps to repeat
 * @param condition - Condition that stops the loop when true
 * @param options - Loop options
 * @returns Array of steps
 *
 * @example
 * ```typescript
 * doUntil([
 *   step('poll-status')
 * ], '${state.completed}', { maxIterations: 30 })
 * ```
 */
export function doUntil(steps, condition, options = {}) {
    // Negate the condition for while
    const negatedCondition = typeof condition === 'string' ? `!(${condition})` : { $not: condition };
    return [...steps, whileStep(negatedCondition, steps, options)];
}
/**
 * Create a map-reduce operation
 *
 * Process items in parallel (map) then aggregate results (reduce).
 *
 * @param items - Collection to process (expression)
 * @param mapStep - Step to execute for each item
 * @param reduceStep - Step to aggregate results
 * @param options - Map-reduce options
 * @returns MapReduceFlowStep
 *
 * @example
 * ```typescript
 * // Parallel processing with aggregation
 * mapReduce(
 *   '${input.documents}',
 *   step('analyze-document', {
 *     input: { doc: '${item}' }
 *   }),
 *   step('combine-analyses', {
 *     input: { analyses: '${results}' }
 *   })
 * )
 *
 * // With concurrency limit
 * mapReduce(
 *   '${input.urls}',
 *   step('fetch-url'),
 *   step('merge-responses'),
 *   { maxConcurrency: 10 }
 * )
 * ```
 */
export function mapReduce(items, mapStep, reduceStep, options = {}) {
    return {
        type: 'map-reduce',
        items,
        map: mapStep,
        reduce: reduceStep,
        ...(options.maxConcurrency && { maxConcurrency: options.maxConcurrency }),
    };
}
/**
 * Create a map transformation (without reduce)
 *
 * Syntactic sugar for foreach that collects all results.
 *
 * @param items - Collection to transform
 * @param stepToExecute - Transformation step
 * @param options - Map options
 * @returns ForeachFlowStep configured for mapping
 *
 * @example
 * ```typescript
 * map('${input.ids}', step('fetch-by-id', {
 *   input: { id: '${item}' }
 * }))
 * ```
 */
export function map(items, stepToExecute, options = {}) {
    return foreach(items, stepToExecute, options);
}
/**
 * Create a repeat loop (fixed number of iterations)
 *
 * @param count - Number of iterations
 * @param steps - Steps to repeat
 * @returns ForeachFlowStep over a range
 *
 * @example
 * ```typescript
 * repeat(3, [
 *   step('retry-operation')
 * ])
 * ```
 */
export function repeat(count, steps) {
    // Create an array of indices to iterate over
    return {
        type: 'foreach',
        items: `\${Array.from({length: ${count}}, (_, i) => i)}`,
        step: steps.length === 1 ? steps[0] : { type: 'parallel', steps, waitFor: 'all' },
    };
}
/**
 * Create a race condition (first to complete wins)
 *
 * Alias for parallel with waitFor: 'first'.
 *
 * @param steps - Steps to race
 * @returns ParallelFlowStep configured for racing
 *
 * @example
 * ```typescript
 * race([
 *   step('fast-api'),
 *   step('slow-api')
 * ])
 * ```
 */
export function race(steps) {
    return parallel(steps, { waitFor: 'first' });
}
/**
 * Create a fallback chain (try each until one succeeds)
 *
 * Tries each step in order, stopping at first success.
 *
 * @param steps - Steps to try in order
 * @returns TryFlowStep chain
 *
 * @example
 * ```typescript
 * fallback([
 *   step('primary-service'),
 *   step('secondary-service'),
 *   step('tertiary-service')
 * ])
 * ```
 */
export function fallback(steps) {
    if (steps.length === 0) {
        throw new Error('fallback requires at least one step');
    }
    if (steps.length === 1) {
        return steps[0];
    }
    // Build nested try/catch chain
    // try step[0] catch try step[1] catch try step[2] ...
    let result = steps[steps.length - 1];
    for (let i = steps.length - 2; i >= 0; i--) {
        result = tryStep([steps[i]], { catch: [result] });
    }
    return result;
}
