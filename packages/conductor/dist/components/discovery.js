/**
 * Discovery Registries for Agents and Ensembles
 *
 * Provides read-only access to discover and inspect registered agents and ensembles.
 * Used by TypeScript handlers that need to enumerate available resources (e.g., OpenAPI generation).
 *
 * @module components/discovery
 */
/**
 * Create an AgentRegistry from a Map of BaseAgent instances
 */
export function createAgentRegistry(agents) {
    return {
        list() {
            const result = [];
            for (const [name, agent] of agents) {
                result.push(extractAgentMetadata(name, agent));
            }
            return result;
        },
        get(name) {
            const agent = agents.get(name);
            if (!agent)
                return undefined;
            return extractAgentMetadata(name, agent);
        },
        has(name) {
            return agents.has(name);
        },
    };
}
/**
 * Extract metadata from a BaseAgent instance
 */
function extractAgentMetadata(name, agent) {
    const config = agent.getConfig?.() || {};
    return {
        name,
        operation: agent.getType?.() || config.operation || 'unknown',
        description: config.description,
        // AgentConfig stores input/output schema under config.schema
        inputSchema: config.schema?.input,
        outputSchema: config.schema?.output,
        builtIn: isBuiltInAgent(name),
    };
}
/**
 * Check if an agent is a built-in type
 */
function isBuiltInAgent(name) {
    const builtInNames = [
        'scrape',
        'validate',
        'rag',
        'hitl',
        'fetch',
        'html',
        'form',
        'storage',
        'queue',
        'pdf',
        'email',
        'sms',
    ];
    return builtInNames.includes(name);
}
/**
 * Create an EnsembleRegistry from a Map of EnsembleConfig instances
 */
export function createEnsembleRegistry(ensembles) {
    return {
        list() {
            const result = [];
            for (const [name, { config, source }] of ensembles) {
                result.push(extractEnsembleMetadata(name, config, source));
            }
            return result;
        },
        get(name) {
            const entry = ensembles.get(name);
            if (!entry)
                return undefined;
            return extractEnsembleMetadata(name, entry.config, entry.source);
        },
        has(name) {
            return ensembles.has(name);
        },
    };
}
/**
 * Extract metadata from an EnsembleConfig
 */
function extractEnsembleMetadata(name, config, source) {
    // Extract triggers
    const triggers = config.trigger?.map((t) => ({
        type: t.type,
        path: t.path || t.paths?.[0]?.path,
        methods: t.methods || t.paths?.[0]?.methods,
        cron: t.cron,
    })) || [];
    // Extract agent names from flow
    const agentNames = [];
    if (Array.isArray(config.flow)) {
        for (const step of config.flow) {
            if ('agent' in step && typeof step.agent === 'string') {
                agentNames.push(step.agent);
            }
        }
    }
    return {
        name,
        description: config.description,
        triggers,
        inputSchema: config.inputs,
        outputSchema: config.output,
        source,
        agentNames,
        stepCount: Array.isArray(config.flow) ? config.flow.length : 0,
    };
}
/**
 * Create a DocsRegistry from a Map of docs pages
 *
 * @param docs - Map from DocsDirectoryLoader.getRegistryData()
 */
export function createDocsRegistry(docs) {
    return {
        list() {
            const result = [];
            for (const [slug, page] of docs) {
                result.push({
                    slug,
                    title: page.title,
                    content: page.content,
                    order: page.order,
                });
            }
            // Sort by order if available
            return result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        },
        get(slug) {
            const page = docs.get(slug);
            if (!page)
                return undefined;
            return {
                slug,
                title: page.title,
                content: page.content,
                order: page.order,
            };
        },
        has(slug) {
            return docs.has(slug);
        },
    };
}
