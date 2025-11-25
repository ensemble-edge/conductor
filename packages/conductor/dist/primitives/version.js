/**
 * Version Primitives
 *
 * Primitives for referencing versioned components managed by Edgit.
 * These enable version-pinned references to agents, ensembles, and other
 * components in production workflows.
 */
/**
 * Component reference class - represents a versioned component reference
 */
export class ComponentRef {
    constructor(type, path, version, options) {
        /** Internal marker for serialization */
        this.__isComponentRef = true;
        this.type = type;
        this.path = path;
        this.version = version;
        this.fallback = options?.fallback;
        this.required = options?.required ?? true;
        this.resolution = options?.resolution ?? 'exact';
    }
    /**
     * Get the full reference path (type/path@version)
     */
    getFullPath() {
        return `${this.type}/${this.path}@${this.version}`;
    }
    /**
     * Convert to Git tag format (edgit format)
     */
    toGitTag() {
        // Map component types to edgit tag namespaces
        const namespace = this.type === 'agent' ? 'agents' : `${this.type}s`;
        return `${namespace}/${this.path}/${this.version}`;
    }
    /**
     * Convert to VersionReference for runtime resolution
     */
    toVersionReference() {
        return {
            type: this.type,
            path: this.path,
            version: this.version,
        };
    }
    /**
     * Convert to plain config object for YAML/serialization
     */
    toConfig() {
        const config = {
            type: this.type,
            path: this.path,
            version: this.version,
        };
        if (this.fallback !== undefined) {
            config.fallback = this.fallback;
        }
        if (!this.required) {
            config.required = false;
        }
        if (this.resolution !== 'exact') {
            config.resolution = this.resolution;
        }
        return config;
    }
}
/**
 * Versioned agent reference class
 */
export class VersionedAgent extends ComponentRef {
    constructor(path, version, options) {
        super('agent', path, version, options);
        /** Internal marker for serialization */
        this.__isVersionedAgent = true;
        this.agentConfig = options?.config;
        this.input = options?.input;
    }
    /**
     * Convert to agent flow step format
     */
    toFlowStep() {
        const step = {
            agent: this.path,
            version: this.version,
        };
        if (this.agentConfig) {
            step.config = this.agentConfig;
        }
        if (this.input) {
            step.input = this.input;
        }
        return step;
    }
}
/**
 * Versioned ensemble reference class
 */
export class VersionedEnsemble extends ComponentRef {
    constructor(path, version, options) {
        super('ensemble', path, version, options);
        /** Internal marker for serialization */
        this.__isVersionedEnsemble = true;
        this.input = options?.input;
        this.inheritState = options?.inheritState ?? false;
    }
    /**
     * Convert to ensemble invocation format
     */
    toInvocation() {
        const invocation = {
            ensemble: this.path,
            version: this.version,
        };
        if (this.input) {
            invocation.input = this.input;
        }
        if (this.inheritState) {
            invocation.inheritState = true;
        }
        return invocation;
    }
}
/**
 * Deployment reference class - resolves versions based on deployment environment
 */
export class DeploymentRef {
    constructor(component, environment, options) {
        /** Internal marker for serialization */
        this.__isDeploymentRef = true;
        this.component = component;
        this.environment = environment;
        this.fallback = options?.fallback;
        this.required = options?.required ?? true;
    }
    /**
     * Get the deployment tag format
     */
    toDeploymentTag() {
        return `deploy/${this.environment}/${this.component.type}s/${this.component.path}`;
    }
    /**
     * Convert to plain config object
     */
    toConfig() {
        const config = {
            component: this.component.toConfig(),
            environment: this.environment,
        };
        if (this.fallback) {
            config.fallback = this.fallback;
        }
        if (!this.required) {
            config.required = false;
        }
        return config;
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
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
export function componentRef(type, path, version, options) {
    return new ComponentRef(type, path, version, options);
}
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
export function versionedAgent(path, version, options) {
    return new VersionedAgent(path, version, options);
}
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
export function versionedEnsemble(path, version, options) {
    return new VersionedEnsemble(path, version, options);
}
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
export function deploymentRef(component, environment, options) {
    return new DeploymentRef(component, environment, options);
}
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if a value is a ComponentRef instance
 */
export function isComponentRef(value) {
    return (value instanceof ComponentRef ||
        (typeof value === 'object' && value !== null && '__isComponentRef' in value));
}
/**
 * Check if a value is a VersionedAgent instance
 */
export function isVersionedAgent(value) {
    return (value instanceof VersionedAgent ||
        (typeof value === 'object' && value !== null && '__isVersionedAgent' in value));
}
/**
 * Check if a value is a VersionedEnsemble instance
 */
export function isVersionedEnsemble(value) {
    return (value instanceof VersionedEnsemble ||
        (typeof value === 'object' && value !== null && '__isVersionedEnsemble' in value));
}
/**
 * Check if a value is a DeploymentRef instance
 */
export function isDeploymentRef(value) {
    return (value instanceof DeploymentRef ||
        (typeof value === 'object' && value !== null && '__isDeploymentRef' in value));
}
// ============================================================================
// Utility Functions
// ============================================================================
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
export function parseVersion(version) {
    // Handle special tags
    if (version === 'latest' || version === 'stable') {
        return { tag: version };
    }
    // Extract constraint prefix
    const constraintMatch = version.match(/^([~^]|>=|<=)/);
    const constraint = constraintMatch?.[1];
    const versionPart = constraint ? version.slice(constraint.length) : version;
    // Parse semver
    const semverMatch = versionPart.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (semverMatch) {
        return {
            constraint,
            major: parseInt(semverMatch[1], 10),
            minor: parseInt(semverMatch[2], 10),
            patch: parseInt(semverMatch[3], 10),
        };
    }
    return { tag: version };
}
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
export function satisfiesVersion(version, constraint) {
    if (constraint === 'latest' || constraint === 'stable') {
        return true;
    }
    const versionParts = parseVersion(version);
    const constraintParts = parseVersion(constraint);
    if (versionParts.tag || constraintParts.tag) {
        return version === constraint;
    }
    if (versionParts.major === undefined ||
        versionParts.minor === undefined ||
        versionParts.patch === undefined ||
        constraintParts.major === undefined ||
        constraintParts.minor === undefined ||
        constraintParts.patch === undefined) {
        return false;
    }
    switch (constraintParts.constraint) {
        case '^':
            // Compatible: same major version
            return (versionParts.major === constraintParts.major &&
                (versionParts.minor > constraintParts.minor ||
                    (versionParts.minor === constraintParts.minor &&
                        versionParts.patch >= constraintParts.patch)));
        case '~':
            // Patch-compatible: same major.minor
            return (versionParts.major === constraintParts.major &&
                versionParts.minor === constraintParts.minor &&
                versionParts.patch >= constraintParts.patch);
        case '>=':
            return (versionParts.major > constraintParts.major ||
                (versionParts.major === constraintParts.major &&
                    versionParts.minor > constraintParts.minor) ||
                (versionParts.major === constraintParts.major &&
                    versionParts.minor === constraintParts.minor &&
                    versionParts.patch >= constraintParts.patch));
        case '<=':
            return (versionParts.major < constraintParts.major ||
                (versionParts.major === constraintParts.major &&
                    versionParts.minor < constraintParts.minor) ||
                (versionParts.major === constraintParts.major &&
                    versionParts.minor === constraintParts.minor &&
                    versionParts.patch <= constraintParts.patch));
        default:
            // Exact match
            return (versionParts.major === constraintParts.major &&
                versionParts.minor === constraintParts.minor &&
                versionParts.patch === constraintParts.patch);
    }
}
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
export function versionedAgents(specs) {
    const result = {};
    for (const [path, spec] of Object.entries(specs)) {
        if (typeof spec === 'string') {
            result[path] = versionedAgent(path, spec);
        }
        else {
            result[path] = versionedAgent(path, spec.version, spec.options);
        }
    }
    return result;
}
