/**
 * Flow Step Types
 *
 * This file defines the canonical flow step types used throughout Conductor.
 * These types MUST be defined explicitly (not derived via z.infer) because
 * Zod's z.lazy() creates circular references that TypeScript cannot resolve.
 *
 * This file is deliberately kept separate from parser.ts to avoid circular
 * dependencies, as it's imported by both primitives and runtime modules.
 */
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if a step is a parallel step
 */
export function isParallelStep(step) {
    return 'type' in step && step.type === 'parallel';
}
/**
 * Check if a step is a branch step
 */
export function isBranchStep(step) {
    return 'type' in step && step.type === 'branch';
}
/**
 * Check if a step is a foreach step
 */
export function isForeachStep(step) {
    return 'type' in step && step.type === 'foreach';
}
/**
 * Check if a step is a try step
 */
export function isTryStep(step) {
    return 'type' in step && step.type === 'try';
}
/**
 * Check if a step is a switch step
 */
export function isSwitchStep(step) {
    return 'type' in step && step.type === 'switch';
}
/**
 * Check if a step is a while step
 */
export function isWhileStep(step) {
    return 'type' in step && step.type === 'while';
}
/**
 * Check if a step is a map-reduce step
 */
export function isMapReduceStep(step) {
    return 'type' in step && step.type === 'map-reduce';
}
/**
 * Check if a step is an agent step (no 'type' field)
 */
export function isAgentStep(step) {
    return 'agent' in step && !('type' in step);
}
/**
 * Check if a step is a control flow step (has 'type' field)
 */
export function isControlFlowStep(step) {
    return 'type' in step;
}
/**
 * Check if a step is any flow control step
 */
export function isFlowControlStep(step) {
    return (isParallelStep(step) ||
        isBranchStep(step) ||
        isForeachStep(step) ||
        isTryStep(step) ||
        isSwitchStep(step) ||
        isWhileStep(step) ||
        isMapReduceStep(step));
}
