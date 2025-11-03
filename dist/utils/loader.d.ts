/**
 * Member Loader Utility
 *
 * Dynamically loads user-created members from their project directory
 * This runs in the user's project context, not in the conductor package
 */
import { type MemberConfig } from '../runtime/parser';
import { BaseMember } from '../members/base-member';
import { type FunctionImplementation } from '../members/function-member';
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
export declare class MemberLoader {
    private config;
    private loadedMembers;
    constructor(config: LoaderConfig);
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
    registerMember(memberConfig: MemberConfig | string, implementation?: FunctionImplementation): BaseMember;
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
    loadMemberFromEdgit(memberRef: string): Promise<BaseMember>;
    /**
     * Create a member instance based on type
     */
    private createMemberInstance;
    /**
     * Get a loaded member by name
     */
    getMember(name: string): BaseMember | undefined;
    /**
     * Get all loaded members
     */
    getAllMembers(): BaseMember[];
    /**
     * Get all member names
     */
    getMemberNames(): string[];
    /**
     * Check if a member is loaded
     */
    hasMember(name: string): boolean;
    /**
     * Clear all loaded members
     */
    clear(): void;
}
/**
 * Helper function to create a loader instance
 */
export declare function createLoader(config: LoaderConfig): MemberLoader;
//# sourceMappingURL=loader.d.ts.map