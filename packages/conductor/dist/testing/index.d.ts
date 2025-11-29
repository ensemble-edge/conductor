/**
 * Conductor Testing Utilities
 *
 * Built-in testing infrastructure for Conductor projects.
 * No separate package needed - testing is first-class in Conductor.
 *
 * @example
 * ```typescript
 * import {
 *   TestConductor,
 *   registerMatchers,
 *   createMockEnv,
 *   createAgentContext,
 *   MockResponse,
 * } from '@ensemble-edge/conductor/testing';
 *
 * // Register custom matchers
 * registerMatchers();
 *
 * // Create test conductor for ensemble testing
 * const conductor = await TestConductor.create({ projectPath: '.' });
 * const result = await conductor.executeEnsemble('my-ensemble', { input: 'data' });
 * expect(result).toBeSuccessful();
 *
 * // Or use utilities for unit testing agents
 * const context = createAgentContext({ input: { url: 'https://api.example.com' } });
 * const result = await agent.execute(context);
 * ```
 */
export { TestConductor } from './test-conductor.js';
export { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize, MockDurableObject, mockAIProvider, mockDatabase, mockHTTP, mockVectorize, mockDurableObject, } from './mocks.js';
export { createMockEnv, createMockContext, createAgentContext, createTestHonoApp, type TestAppOptions, MockResponse, MockRepository, MockEmailProvider, type MockEmailResult, createMockFetch, assertSuccess, assertError, waitFor, delay, } from './test-utils.js';
export { registerMatchers } from './matchers.js';
export type { TestConductorOptions, TestMocks, TestExecutionResult, TestMemberResult, ExecutedStep, StateSnapshot, AICall, DatabaseQuery, HTTPRequest, VectorSearchResult, ExecutionRecord, ProjectSnapshot, } from './types.js';
//# sourceMappingURL=index.d.ts.map