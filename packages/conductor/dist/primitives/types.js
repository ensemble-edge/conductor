/**
 * Primitives Types
 *
 * Shared type definitions for all Conductor primitives.
 * These types are the canonical definitions used by both YAML and TypeScript authoring.
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
