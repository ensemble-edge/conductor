/**
 * Conductor Testing Utilities
 *
 * Built-in testing infrastructure for Conductor projects.
 * No separate package needed - testing is first-class in Conductor.
 *
 * @example
 * ```typescript
 * import { TestConductor, registerMatchers } from '@ensemble-edge/conductor/testing';
 *
 * // Register custom matchers
 * registerMatchers();
 *
 * // Create test conductor
 * const conductor = await TestConductor.create({
 *   projectPath: '.'
 * });
 *
 * // Execute and test
 * const result = await conductor.executeEnsemble('my-ensemble', { input: 'data' });
 * expect(result).toBeSuccessful();
 * ```
 */
export { TestConductor } from './test-conductor.js';
export { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize, MockDurableObject, mockAIProvider, mockDatabase, mockHTTP, mockVectorize, mockDurableObject, } from './mocks.js';
export { registerMatchers } from './matchers.js';
export type { TestConductorOptions, TestMocks, TestExecutionResult, TestMemberResult, ExecutedStep, StateSnapshot, AICall, DatabaseQuery, HTTPRequest, VectorSearchResult, ExecutionRecord, ProjectSnapshot, } from './types';
//# sourceMappingURL=index.d.ts.map