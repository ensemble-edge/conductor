/**
 * Built-In Members - Shared Types
 *
 * Common types and interfaces used across all built-in members.
 */

import type { BaseMember } from '../base-member';
import type { MemberConfig } from '../../runtime/parser';
import { MemberType } from '../../types/constants';
import type { ConductorEnv } from '../../types/env';

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
