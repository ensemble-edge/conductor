/**
 * Agent Loader Utility
 *
 * Dynamically loads user-created agents from their project directory
 * This runs in the user's project context, not in the conductor package
 *
 * Note: tools, validate, autorag agents have been moved to template-based agents.
 * They now use `operation: code` with handlers like any other agent.
 * See: catalog/cloud/cloudflare/templates/agents/system/
 */
import { Parser } from '../runtime/parser.js';
import { FunctionAgent } from '../agents/function-agent.js';
import { ThinkAgent } from '../agents/think-agent.js';
import { DataAgent } from '../agents/data-agent.js';
import { APIAgent } from '../agents/api-agent.js';
import { EmailAgent } from '../agents/email/email-agent.js';
import { SmsAgent } from '../agents/sms/sms-agent.js';
import { FormAgent } from '../agents/form/form-agent.js';
import { HtmlAgent } from '../agents/html/html-agent.js';
import { PdfAgent } from '../agents/pdf/pdf-agent.js';
import { QueueAgent } from '../agents/queue/queue-agent.js';
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'agent-loader' });
/**
 * AgentLoader handles dynamic loading of user-created agents
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Agents must be bundled at build time using wrangler's module imports.
 *
 * For now, users will need to manually import and register their agents.
 * Future: We can build a CLI tool that generates the registration code.
 */
export class AgentLoader {
    constructor(config) {
        this.config = {
            agentsDir: config.agentsDir || './agents',
            ensemblesDir: config.ensemblesDir || './ensembles',
            env: config.env,
            ctx: config.ctx,
        };
        this.loadedAgents = new Map();
    }
    /**
     * Auto-discover and register agents from virtual module
     *
     * This method is designed to work with the Vite plugin system that generates
     * a virtual module containing all agent definitions at build time.
     *
     * @param discoveredAgents - Array of agent definitions from virtual:conductor-agents
     *
     * @example
     * ```typescript
     * import { agents as discoveredAgents } from 'virtual:conductor-agents';
     *
     * const loader = new AgentLoader({ env, ctx });
     * await loader.autoDiscover(discoveredAgents);
     * ```
     */
    async autoDiscover(discoveredAgents) {
        for (const agentDef of discoveredAgents) {
            try {
                // Parse YAML config
                const config = Parser.parseAgent(agentDef.config);
                // Load handler if available
                let implementation;
                if (agentDef.handler) {
                    const handlerModule = await agentDef.handler();
                    implementation = handlerModule?.default || handlerModule;
                }
                // Register the agent
                this.registerAgent(config, implementation);
                logger.debug(`Auto-discovered agent: ${agentDef.name}`, { agentName: agentDef.name });
            }
            catch (error) {
                logger.error(`Failed to load agent "${agentDef.name}"`, error instanceof Error ? error : undefined, {
                    agentName: agentDef.name,
                });
                // Continue with other agents even if one fails
            }
        }
        logger.info(`Auto-discovery complete: ${this.loadedAgents.size} agents loaded`, {
            agentCount: this.loadedAgents.size,
        });
    }
    /**
     * Register a agent manually
     *
     * @example
     * ```typescript
     * import greetConfig from './agents/greet/agent.yaml.js';
     * import greetFunction from './agents/greet/index.js';
     *
     * loader.registerAgent(greetConfig, greetFunction);
     * ```
     */
    registerAgent(agentConfig, implementation) {
        // Parse config if it's a string (YAML)
        const config = typeof agentConfig === 'string' ? Parser.parseAgent(agentConfig) : agentConfig;
        // Create agent instance based on type
        const instance = this.createAgentInstance(config, implementation);
        // Store in registry
        this.loadedAgents.set(config.name, {
            config,
            instance,
        });
        return instance;
    }
    /**
     * Load an agent from Edgit by version reference
     *
     * This enables loading versioned agent configs at runtime for A/B testing,
     * environment-specific configs, and config-only deployments.
     *
     * @example
     * ```typescript
     * // Load specific version
     * await loader.loadAgentFromEdgit('analyze-company@v1.0.0');
     *
     * // Load production deployment
     * await loader.loadAgentFromEdgit('analyze-company@production');
     * ```
     */
    async loadAgentFromEdgit(agentRef) {
        const { name, version } = Parser.parseAgentReference(agentRef);
        if (!version) {
            throw new Error(`Agent reference must include version: ${agentRef}`);
        }
        // Check if already loaded
        const versionedKey = `${name}@${version}`;
        if (this.loadedAgents.has(versionedKey)) {
            return this.loadedAgents.get(versionedKey).instance;
        }
        // TODO: Load from Edgit when available
        // Expected implementation:
        // import { loadAgentConfig } from '../sdk/edgit.js';
        // const config = await loadAgentConfig(agentRef, this.config.env);
        // const instance = this.createAgentInstance(config);
        // this.loadedAgents.set(versionedKey, { config, instance });
        // return instance;
        throw new Error(`Cannot load versioned agent from Edgit: ${agentRef}. ` +
            `Edgit integration not yet available. ` +
            `Use loader.registerAgent() for now.`);
    }
    /**
     * Create an agent instance based on type
     */
    createAgentInstance(config, implementation) {
        switch (config.operation) {
            case 'code':
                if (!implementation) {
                    throw new Error(`Code agent "${config.name}" requires an implementation function`);
                }
                // Code operation agents receive the full context object
                // User functions are exported as: (context: { input: any }) => result
                // FunctionAgent already passes the full context, so just use the implementation directly
                return new FunctionAgent(config, implementation);
            case 'think':
                return new ThinkAgent(config);
            case 'storage':
                return new DataAgent(config);
            case 'data':
                return new DataAgent(config);
            case 'http':
                return new APIAgent(config);
            case 'email':
                return new EmailAgent(config);
            case 'sms':
                return new SmsAgent(config);
            case 'form':
                return new FormAgent(config);
            case 'html':
                return new HtmlAgent(config);
            case 'pdf':
                return new PdfAgent(config);
            case 'queue':
                return new QueueAgent(config);
            default:
                throw new Error(`Unknown agent operation type: "${config.operation}". ` +
                    `If using tools, validate, or autorag, these are now template-based agents. ` +
                    `Use 'operation: code' with a handler instead. ` +
                    `See: catalog/cloud/cloudflare/templates/agents/system/`);
        }
    }
    /**
     * Get a loaded agent by name
     */
    getAgent(name) {
        return this.loadedAgents.get(name)?.instance;
    }
    /**
     * Get agent config by name
     */
    getAgentConfig(name) {
        return this.loadedAgents.get(name)?.config;
    }
    /**
     * Get all loaded agents
     */
    getAllAgents() {
        return Array.from(this.loadedAgents.values()).map((a) => a.instance);
    }
    /**
     * Get all agent names
     */
    getAgentNames() {
        return Array.from(this.loadedAgents.keys());
    }
    /**
     * Check if an agent is loaded
     */
    hasAgent(name) {
        return this.loadedAgents.has(name);
    }
    /**
     * Clear all loaded agents
     */
    clear() {
        this.loadedAgents.clear();
    }
}
/**
 * Helper function to create a loader instance
 */
export function createLoader(config) {
    return new AgentLoader(config);
}
// Backward compatibility aliases
export const MemberLoader = AgentLoader;
