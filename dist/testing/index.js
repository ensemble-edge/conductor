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
// Core testing utilities
export { TestConductor } from './test-conductor';
// Mock utilities
export { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize, MockDurableObject, mockAIProvider, mockDatabase, mockHTTP, mockVectorize, mockDurableObject, } from './mocks';
// Custom matchers
export { registerMatchers } from './matchers';
