/**
 * Built-In Members - Shared Types
 *
 * Common types and interfaces used across all built-in members.
 */
import type { BaseMember } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import { MemberType } from '../../types/constants.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Metadata for a built-in member
 */
export interface BuiltInMemberMetadata {
    name: string;
    version: string;
    description: string;
    type: MemberType;
    configSchema?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    tags?: string[];
    examples?: Array<{
        name: string;
        description: string;
        input: Record<string, unknown>;
        config?: Record<string, unknown>;
        output?: Record<string, unknown>;
    }>;
    documentation?: string;
}
/**
 * Factory function to create a built-in member instance
 */
export type BuiltInMemberFactory = (config: MemberConfig, env: ConductorEnv) => BaseMember;
/**
 * Built-in member registration entry
 */
export interface BuiltInMemberEntry {
    metadata: BuiltInMemberMetadata;
    factory: BuiltInMemberFactory;
    loaded: boolean;
}
//# sourceMappingURL=types.d.ts.map