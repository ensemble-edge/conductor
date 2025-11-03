/**
 * Custom Vitest Matchers for Conductor Testing
 */
import type { TestExecutionResult } from './types';
export interface CustomMatchers<R = unknown> {
    toBeSuccessful(): R;
    toHaveFailed(): R;
    toHaveExecutedMember(memberName: string): R;
    toHaveExecutedSteps(count: number): R;
    toHaveCompletedIn(ms: number): R;
    toHaveState(key: string, value?: unknown): R;
    toHaveCalledAI(memberName?: string): R;
    toHaveUsedTokens(count: number): R;
    toHaveCostLessThan(dollars: number): R;
    toHaveOutput(expected: unknown): R;
    toMatchOutputShape(shape: Record<string, unknown>): R;
}
/**
 * Check if execution was successful
 */
export declare function toBeSuccessful(received: TestExecutionResult): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if execution failed
 */
export declare function toHaveFailed(received: TestExecutionResult): {
    pass: boolean;
    message: () => "Expected execution to have failed but it succeeded" | "Expected execution to succeed but it failed";
};
/**
 * Check if a specific member was executed
 */
export declare function toHaveExecutedMember(received: TestExecutionResult, memberName: string): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if a specific number of steps were executed
 */
export declare function toHaveExecutedSteps(received: TestExecutionResult, count: number): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if execution completed within a time limit
 */
export declare function toHaveCompletedIn(received: TestExecutionResult, ms: number): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if state contains a key with optional value check
 */
export declare function toHaveState(received: TestExecutionResult, key: string, value?: unknown): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if AI was called (optionally for a specific member)
 */
export declare function toHaveCalledAI(received: TestExecutionResult, memberName?: string): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if a certain number of tokens were used
 */
export declare function toHaveUsedTokens(received: TestExecutionResult, count: number): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if execution cost is below a threshold
 */
export declare function toHaveCostLessThan(received: TestExecutionResult, dollars: number): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if output matches expected value
 */
export declare function toHaveOutput(received: TestExecutionResult, expected: unknown): {
    pass: boolean;
    message: () => string;
};
/**
 * Check if output matches a shape (partial match)
 */
export declare function toMatchOutputShape(received: TestExecutionResult, shape: Record<string, unknown>): {
    pass: boolean;
    message: () => string;
};
/**
 * Register all custom matchers with Vitest
 */
export declare function registerMatchers(): void;
//# sourceMappingURL=matchers.d.ts.map