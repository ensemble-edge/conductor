/**
 * Member Loader Utility
 *
 * Dynamically loads user-created members from their project directory
 * This runs in the user's project context, not in the conductor package
 */

import { Parser, type MemberConfig } from '../runtime/parser';
import { BaseMember } from '../members/base-member';
import { FunctionMember, type FunctionImplementation } from '../members/function-member';
import { ThinkMember } from '../members/think-member';
import { DataMember } from '../members/data-member';
import { APIMember } from '../members/api-member';

export interface LoaderConfig {
	/**
	 * Base directory where members are located
	 * @default './members'
	 */
	membersDir?: string;

	/**
	 * Base directory where ensembles are located
	 * @default './ensembles'
	 */
	ensemblesDir?: string;

	/**
	 * Environment context (passed from Worker)
	 */
	env: Env;

	/**
	 * Execution context (passed from Worker)
	 */
	ctx: ExecutionContext;
}

export interface LoadedMember {
	config: MemberConfig;
	instance: BaseMember;
}

/**
 * MemberLoader handles dynamic loading of user-created members
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Members must be bundled at build time using wrangler's module imports.
 *
 * For now, users will need to manually import and register their members.
 * Future: We can build a CLI tool that generates the registration code.
 */
export class MemberLoader {
	private config: LoaderConfig;
	private loadedMembers: Map<string, LoadedMember>;

	constructor(config: LoaderConfig) {
		this.config = {
			membersDir: config.membersDir || './members',
			ensemblesDir: config.ensemblesDir || './ensembles',
			env: config.env,
			ctx: config.ctx
		};
		this.loadedMembers = new Map();
	}

	/**
	 * Register a member manually
	 *
	 * @example
	 * ```typescript
	 * import greetConfig from './members/greet/member.yaml';
	 * import greetFunction from './members/greet/index';
	 *
	 * loader.registerMember(greetConfig, greetFunction);
	 * ```
	 */
	registerMember(
		memberConfig: MemberConfig | string,
		implementation?: any
	): BaseMember {
		// Parse config if it's a string (YAML)
		const config = typeof memberConfig === 'string'
			? Parser.parseMember(memberConfig)
			: memberConfig;

		// Create member instance based on type
		const instance = this.createMemberInstance(config, implementation);

		// Store in registry
		this.loadedMembers.set(config.name, {
			config,
			instance
		});

		return instance;
	}

	/**
	 * Load a member from Edgit by version reference
	 *
	 * This enables loading versioned member configs at runtime for A/B testing,
	 * environment-specific configs, and config-only deployments.
	 *
	 * @example
	 * ```typescript
	 * // Load specific version
	 * await loader.loadMemberFromEdgit('analyze-company@v1.0.0');
	 *
	 * // Load production deployment
	 * await loader.loadMemberFromEdgit('analyze-company@production');
	 * ```
	 */
	async loadMemberFromEdgit(memberRef: string): Promise<BaseMember> {
		const { name, version } = Parser.parseMemberReference(memberRef);

		if (!version) {
			throw new Error(`Member reference must include version: ${memberRef}`);
		}

		// Check if already loaded
		const versionedKey = `${name}@${version}`;
		if (this.loadedMembers.has(versionedKey)) {
			return this.loadedMembers.get(versionedKey)!.instance;
		}

		// TODO: Load from Edgit when available
		// Expected implementation:
		// import { loadMemberConfig } from '../sdk/edgit';
		// const config = await loadMemberConfig(memberRef, this.config.env);
		// const instance = this.createMemberInstance(config);
		// this.loadedMembers.set(versionedKey, { config, instance });
		// return instance;

		throw new Error(
			`Cannot load versioned member from Edgit: ${memberRef}. ` +
			`Edgit integration not yet available. ` +
			`Use loader.registerMember() for now.`
		);
	}

	/**
	 * Create a member instance based on type
	 */
	private createMemberInstance(
		config: MemberConfig,
		implementation?: FunctionImplementation
	): BaseMember {
		switch (config.type) {
			case 'Function':
				if (!implementation) {
					throw new Error(`Function member "${config.name}" requires an implementation function`);
				}
				return new FunctionMember(config, implementation);

			case 'Think':
				return new ThinkMember(config);

			case 'Data':
				return new DataMember(config);

			case 'API':
				return new APIMember(config);

			case 'MCP':
				throw new Error('MCP member type not yet implemented');

			case 'Scoring':
				throw new Error('Scoring member type not yet implemented');

			default:
				throw new Error(`Unknown member type: ${config.type}`);
		}
	}

	/**
	 * Get a loaded member by name
	 */
	getMember(name: string): BaseMember | undefined {
		return this.loadedMembers.get(name)?.instance;
	}

	/**
	 * Get all loaded members
	 */
	getAllMembers(): BaseMember[] {
		return Array.from(this.loadedMembers.values()).map(m => m.instance);
	}

	/**
	 * Get all member names
	 */
	getMemberNames(): string[] {
		return Array.from(this.loadedMembers.keys());
	}

	/**
	 * Check if a member is loaded
	 */
	hasMember(name: string): boolean {
		return this.loadedMembers.has(name);
	}

	/**
	 * Clear all loaded members
	 */
	clear(): void {
		this.loadedMembers.clear();
	}
}

/**
 * Helper function to create a loader instance
 */
export function createLoader(config: LoaderConfig): MemberLoader {
	return new MemberLoader(config);
}
