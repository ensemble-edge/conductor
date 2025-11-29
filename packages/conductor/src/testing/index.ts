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

// Core testing utilities
export { TestConductor } from './test-conductor.js'

// Mock utilities (high-level mocks for TestConductor)
export {
  MockAIProvider,
  MockDatabase,
  MockHTTPClient,
  MockVectorize,
  MockDurableObject,
  mockAIProvider,
  mockDatabase,
  mockHTTP,
  mockVectorize,
  mockDurableObject,
} from './mocks.js'

// Test utilities (common helpers for unit tests)
export {
  // Environment & context factories
  createMockEnv,
  createMockContext,
  createAgentContext,
  // Hono test app factory
  createTestHonoApp,
  type TestAppOptions,
  // Mock classes for unit testing
  MockResponse,
  MockRepository,
  MockEmailProvider,
  type MockEmailResult,
  // Fetch mocking
  createMockFetch,
  // Result assertion helpers
  assertSuccess,
  assertError,
  // Timing helpers
  waitFor,
  delay,
} from './test-utils.js'

// Custom matchers
export { registerMatchers } from './matchers.js'

// Types
export type {
  TestConductorOptions,
  TestMocks,
  TestExecutionResult,
  TestMemberResult,
  ExecutedStep,
  StateSnapshot,
  AICall,
  DatabaseQuery,
  HTTPRequest,
  VectorSearchResult,
  ExecutionRecord,
  ProjectSnapshot,
} from './types.js'
