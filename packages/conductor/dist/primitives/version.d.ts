/**
 * Version Primitives
 *
 * Primitives for referencing versioned components managed by Edgit.
 * These enable version-pinned references to agents, ensembles, and other
 * components in production workflows.
 */
import type { ComponentType, VersionReference } from './types.js';
/**
 * Version constraint types for flexible version matching
 */
export type VersionConstraint = string | `^${string}` | `~${string}` | `>=${string}` | `<=${string}` | 'latest' | 'stable';
/**
 * Deployment environment references
 */
export type DeploymentEnvironment = 'production' | 'staging' | 'development' | 'canary' | string;
/**
 * Options for component references
 */
export interface ComponentRefOptions {
    /** Fallback version if specified version is unavailable */
    fallback?: VersionConstraint;
    /** Whether this reference is required (fail if not found) */
    required?: boolean;
    /** Custom resolution strategy */
    resolution?: 'exact' | 'compatible' | 'latest-matching';
}
/**
 * Options for versioned agent references
 */
export interface VersionedAgentOptions extends ComponentRefOptions {
    /** Override agent configuration */
    config?: Record<string, unknown>;
    /** Input mapping for the agent */
    input?: Record<string, unknown>;
}
/**
 * Options for versioned ensemble references
 */
export interface VersionedEnsembleOptions extends ComponentRefOptions {
    /** Input mapping for the ensemble */
    input?: Record<string, unknown>;
    /** Whether to inherit parent state */
    inheritState?: boolean;
}
/**
 * Options for deployment references
 */
export interface DeploymentRefOptions {
    /** Fallback environment if specified is unavailable */
    fallback?: DeploymentEnvironment;
    /** Whether this reference is required */
    required?: boolean;
}
/**
 * Component reference class - represents a versioned component reference
 */
export declare class ComponentRef {
    readonly type: ComponentType;
    readonly path: string;
    readonly version: VersionConstraint;
    readonly fallback?: VersionConstraint;
    readonly required: boolean;
    readonly resolution: 'exact' | 'compatible' | 'latest-matching';
    /** Internal marker for serialization */
    readonly __isComponentRef = true;
    constructor(type: ComponentType, path: string, version: VersionConstraint, options?: ComponentRefOptions);
    /**
     * Get the full reference path (type/path@version)
     */
    getFullPath(): string;
    /**
     * Convert to Git tag format (edgit format)
     * Uses type-specific namespaces aligned with Edgit's GitTagManager
     */
    toGitTag(): string;
    /**
     * Convert to VersionReference for runtime resolution
     */
    toVersionReference(): VersionReference;
    /**
     * Convert to plain config object for YAML/serialization
     */
    toConfig(): {
        type: ComponentType;
        path: string;
        version: string;
        fallback?: string;
        required?: boolean;
        resolution?: string;
    };
}
/**
 * Versioned agent reference class
 */
export declare class VersionedAgent extends ComponentRef {
    readonly agentConfig?: Record<string, unknown>;
    readonly input?: Record<string, unknown>;
    /** Internal marker for serialization */
    readonly __isVersionedAgent = true;
    constructor(path: string, version: VersionConstraint, options?: VersionedAgentOptions);
    /**
     * Convert to agent flow step format
     */
    toFlowStep(): {
        agent: string;
        version: string;
        config?: Record<string, unknown>;
        input?: Record<string, unknown>;
    };
}
/**
 * Versioned ensemble reference class
 */
export declare class VersionedEnsemble extends ComponentRef {
    readonly input?: Record<string, unknown>;
    readonly inheritState: boolean;
    /** Internal marker for serialization */
    readonly __isVersionedEnsemble = true;
    constructor(path: string, version: VersionConstraint, options?: VersionedEnsembleOptions);
    /**
     * Convert to ensemble invocation format
     */
    toInvocation(): {
        ensemble: string;
        version: string;
        input?: Record<string, unknown>;
        inheritState?: boolean;
    };
}
/**
 * Deployment reference class - resolves versions based on deployment environment
 */
export declare class DeploymentRef {
    readonly component: ComponentRef;
    readonly environment: DeploymentEnvironment;
    readonly fallback?: DeploymentEnvironment;
    readonly required: boolean;
    /** Internal marker for serialization */
    readonly __isDeploymentRef = true;
    constructor(component: ComponentRef, environment: DeploymentEnvironment, options?: DeploymentRefOptions);
    /**
     * Get the deployment tag format
     */
    toDeploymentTag(): string;
    /**
     * Convert to plain config object
     */
    toConfig(): {
        component: ReturnType<ComponentRef['toConfig']>;
        environment: string;
        fallback?: string;
        required?: boolean;
    };
}
/**
 * Create a versioned component reference
 *
 * @param type - Component type (agent, ensemble, tool, etc.)
 * @param path - Component path (e.g., 'analyzers/sentiment')
 * @param version - Version constraint (e.g., '1.0.0', '^1.0.0', 'latest')
 * @param options - Reference options
 * @returns ComponentRef instance
 *
 * @example
 * ```typescript
 * // Exact version reference
 * const analyzer = componentRef('agent', 'analyzers/sentiment', '1.2.0');
 *
 * // Compatible version reference
 * const processor = componentRef('agent', 'processors/text', '^2.0.0', {
 *   fallback: '1.9.0',
 *   resolution: 'compatible'
 * });
 *
 * // Tool reference
 * const searchTool = componentRef('tool', 'search/web', 'latest');
 * ```
 */
export declare function componentRef(type: ComponentType, path: string, version: VersionConstraint, options?: ComponentRefOptions): ComponentRef;
/**
 * Create a versioned agent reference
 *
 * @param path - Agent path (e.g., 'analyzers/sentiment')
 * @param version - Version constraint
 * @param options - Agent reference options
 * @returns VersionedAgent instance
 *
 * @example
 * ```typescript
 * // Simple versioned agent
 * const analyzer = versionedAgent('analyzers/sentiment', '1.0.0');
 *
 * // Versioned agent with config override
 * const customAnalyzer = versionedAgent('analyzers/sentiment', '^1.0.0', {
 *   config: {
 *     model: 'claude-sonnet-4',
 *     temperature: 0.5
 *   },
 *   input: {
 *     text: '${input.content}'
 *   }
 * });
 *
 * // Use in ensemble steps
 * const pipeline = createEnsemble({
 *   name: 'analysis-pipeline',
 *   steps: [
 *     versionedAgent('preprocessor', '2.1.0').toFlowStep(),
 *     versionedAgent('analyzer', '^1.0.0').toFlowStep(),
 *     versionedAgent('formatter', '1.0.0').toFlowStep()
 *   ]
 * });
 * ```
 */
export declare function versionedAgent(path: string, version: VersionConstraint, options?: VersionedAgentOptions): VersionedAgent;
/**
 * Create a versioned ensemble reference for composition
 *
 * @param path - Ensemble path (e.g., 'pipelines/data-processing')
 * @param version - Version constraint
 * @param options - Ensemble reference options
 * @returns VersionedEnsemble instance
 *
 * @example
 * ```typescript
 * // Reference a versioned sub-ensemble
 * const dataPipeline = versionedEnsemble('pipelines/data-processing', '1.0.0');
 *
 * // Compose ensembles with version pinning
 * const mainPipeline = createEnsemble({
 *   name: 'main-pipeline',
 *   steps: [
 *     step('preprocess'),
 *     // Invoke versioned sub-ensemble
 *     {
 *       ...versionedEnsemble('pipelines/analysis', '^2.0.0', {
 *         input: { data: '${preprocess.output}' },
 *         inheritState: true
 *       }).toInvocation()
 *     },
 *     step('postprocess')
 *   ]
 * });
 * ```
 */
export declare function versionedEnsemble(path: string, version: VersionConstraint, options?: VersionedEnsembleOptions): VersionedEnsemble;
/**
 * Create a deployment-based reference
 *
 * Deployment references resolve to the version deployed in a specific environment.
 * This is useful for environment-specific version resolution (prod, staging, etc.)
 *
 * @param component - Component reference
 * @param environment - Deployment environment
 * @param options - Deployment reference options
 * @returns DeploymentRef instance
 *
 * @example
 * ```typescript
 * // Reference production deployment
 * const prodAnalyzer = deploymentRef(
 *   componentRef('agent', 'analyzers/sentiment', 'latest'),
 *   'production'
 * );
 *
 * // Reference staging with production fallback
 * const stagingPipeline = deploymentRef(
 *   componentRef('ensemble', 'pipelines/main', 'latest'),
 *   'staging',
 *   { fallback: 'production' }
 * );
 *
 * // Use environment variable for deployment
 * const dynamicRef = deploymentRef(
 *   versionedAgent('analyzers/sentiment', 'latest'),
 *   process.env.DEPLOYMENT_ENV || 'development'
 * );
 * ```
 */
export declare function deploymentRef(component: ComponentRef, environment: DeploymentEnvironment, options?: DeploymentRefOptions): DeploymentRef;
/**
 * Check if a value is a ComponentRef instance
 */
export declare function isComponentRef(value: unknown): value is ComponentRef;
/**
 * Check if a value is a VersionedAgent instance
 */
export declare function isVersionedAgent(value: unknown): value is VersionedAgent;
/**
 * Check if a value is a VersionedEnsemble instance
 */
export declare function isVersionedEnsemble(value: unknown): value is VersionedEnsemble;
/**
 * Check if a value is a DeploymentRef instance
 */
export declare function isDeploymentRef(value: unknown): value is DeploymentRef;
/**
 * Parse a version string into its components
 *
 * @example
 * ```typescript
 * parseVersion('1.2.3') // { major: 1, minor: 2, patch: 3 }
 * parseVersion('^1.2.0') // { constraint: '^', major: 1, minor: 2, patch: 0 }
 * parseVersion('latest') // { tag: 'latest' }
 * ```
 */
export declare function parseVersion(version: string): {
    constraint?: string;
    major?: number;
    minor?: number;
    patch?: number;
    tag?: string;
};
/**
 * Check if a version satisfies a constraint
 *
 * @example
 * ```typescript
 * satisfiesVersion('1.2.3', '^1.0.0') // true
 * satisfiesVersion('2.0.0', '^1.0.0') // false
 * satisfiesVersion('1.2.3', '~1.2.0') // true
 * satisfiesVersion('1.3.0', '~1.2.0') // false
 * ```
 */
export declare function satisfiesVersion(version: string, constraint: VersionConstraint): boolean;
/**
 * Create multiple versioned agent references at once
 *
 * @example
 * ```typescript
 * const agents = versionedAgents({
 *   preprocessor: '2.1.0',
 *   analyzer: '^1.0.0',
 *   formatter: '~1.2.0'
 * });
 *
 * // Use in steps
 * const pipeline = createEnsemble({
 *   name: 'pipeline',
 *   steps: [
 *     agents.preprocessor.toFlowStep(),
 *     agents.analyzer.toFlowStep(),
 *     agents.formatter.toFlowStep()
 *   ]
 * });
 * ```
 */
export declare function versionedAgents(specs: Record<string, VersionConstraint | {
    version: VersionConstraint;
    options?: VersionedAgentOptions;
}>): Record<string, VersionedAgent>;
//# sourceMappingURL=version.d.ts.map