/**
 * Built-In Member Registry
 *
 * Manages registration, discovery, and lazy loading of built-in members.
 *
 * Features:
 * - Lazy loading (only load members when used)
 * - Auto-discovery (list all available members)
 * - Versioning (each member has a version)
 * - Metadata (description, schemas, examples)
 */
import type { BaseMember } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { BuiltInMemberMetadata, BuiltInMemberFactory } from './types.js';
import type { ConductorEnv } from '../../types/env.js';
export declare class BuiltInMemberRegistry {
    private members;
    /**
     * Register a built-in member
     */
    register(metadata: BuiltInMemberMetadata, factory: BuiltInMemberFactory): void;
    /**
     * Check if a member is built-in
     */
    isBuiltIn(name: string): boolean;
    /**
     * Get a built-in member instance (lazy loading)
     */
    create(name: string, config: MemberConfig, env: ConductorEnv): BaseMember;
    /**
     * Get metadata for a built-in member
     */
    getMetadata(name: string): BuiltInMemberMetadata | undefined;
    /**
     * List all built-in members
     */
    list(): BuiltInMemberMetadata[];
    /**
     * Get available member names
     */
    getAvailableNames(): string[];
    /**
     * Get members by type
     */
    listByType(type: string): BuiltInMemberMetadata[];
    /**
     * Get members by tag
     */
    listByTag(tag: string): BuiltInMemberMetadata[];
}
/**
 * Get the built-in member registry (singleton)
 */
export declare function getBuiltInRegistry(): BuiltInMemberRegistry;
//# sourceMappingURL=registry.d.ts.map