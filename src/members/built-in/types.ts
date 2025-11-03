/**
 * Built-In Members - Shared Types
 *
 * Common types and interfaces used across all built-in members.
 */

import type { BaseMember } from '../base-member';
import type { MemberConfig } from '../../runtime/parser';
import { MemberType } from '../../types/constants';

/**
 * Metadata for a built-in member
 */
export interface BuiltInMemberMetadata {
	name: string;
	version: string;
	description: string;
	type: MemberType;
	configSchema?: Record<string, any>;
	inputSchema?: Record<string, any>;
	outputSchema?: Record<string, any>;
	tags?: string[];
	examples?: Array<{
		name: string;
		description: string;
		input: Record<string, any>;
		config?: Record<string, any>;
		output?: Record<string, any>;
	}>;
	documentation?: string;
}

/**
 * Factory function to create a built-in member instance
 */
export type BuiltInMemberFactory = (config: MemberConfig, env: Env) => BaseMember;

/**
 * Built-in member registration entry
 */
export interface BuiltInMemberEntry {
	metadata: BuiltInMemberMetadata;
	factory: BuiltInMemberFactory;
	loaded: boolean;
}
