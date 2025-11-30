/**
 * Primitives Types
 *
 * Shared type definitions for all Conductor primitives.
 * These types are the canonical definitions used by both YAML and TypeScript authoring.
 *
 * Flow step types are imported from flow-types.ts which is the single source of truth.
 * This avoids circular dependencies between parser.ts, types.ts, and ensemble.ts.
 */
// Re-export type guards for flow steps
export { isParallelStep, isBranchStep, isForeachStep, isTryStep, isSwitchStep, isWhileStep, isMapReduceStep, isAgentStep, isControlFlowStep, isFlowControlStep, } from '../runtime/flow-types.js';
