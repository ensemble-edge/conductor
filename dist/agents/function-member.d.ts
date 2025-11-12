/**
 * Function Member Engine
 *
 * Executes user-defined JavaScript/TypeScript functions
 * The simplest member type - just runs the provided function
 */
import { BaseMember, type MemberExecutionContext } from './base-member.js';
import type { MemberConfig } from '../runtime/parser.js';
export type FunctionImplementation = (context: MemberExecutionContext) => Promise<unknown> | unknown;
/**
 * Function Member executes user-provided JavaScript functions
 *
 * @example User's member definition:
 * ```yaml
 * # members/greet/member.yaml
 * name: greet
 * type: Function
 * description: Greet a user
 * schema:
 *   input:
 *     name: string
 *   output:
 *     message: string
 * ```
 *
 * ```typescript
 * // members/greet/index.ts
 * export default async function greet({ input }) {
 *   return {
 *     message: `Hello, ${input.name}! Welcome to Conductor.`
 *   };
 * }
 * ```
 */
export declare class FunctionMember extends BaseMember {
    private implementation;
    constructor(config: MemberConfig, implementation: FunctionImplementation);
    /**
     * Execute the user-provided function
     */
    protected run(context: MemberExecutionContext): Promise<unknown>;
    /**
     * Get the function implementation (for testing/inspection)
     */
    getImplementation(): FunctionImplementation;
    /**
     * Create a FunctionMember from a config with inline handler
     * Supports test-style handlers: (input, context?) => result
     */
    static fromConfig(config: MemberConfig): FunctionMember | null;
}
//# sourceMappingURL=function-member.d.ts.map