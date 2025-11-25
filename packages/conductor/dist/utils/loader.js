/**
 * Agent Loader Utility
 *
 * Dynamically loads user-created agents from their project directory
 * This runs in the user's project context, not in the conductor package
 */
import { Parser } from '../runtime/parser.js';
import { FunctionAgent } from '../agents/function-agent.js';
import { ThinkAgent } from '../agents/think-agent.js';
import { DataAgent } from '../agents/data-agent.js';
import { APIAgent } from '../agents/api-agent.js';
import { EmailAgent } from '../agents/email/email-agent.js';
import { SmsMember } from '../agents/sms/sms-agent.js';
import { FormAgent } from '../agents/form/form-agent.js';
import { HtmlMember } from '../agents/html/html-agent.js';
import { PdfMember } from '../agents/pdf/pdf-agent.js';
import { QueueMember } from '../agents/queue/queue-agent.js';
import { DocsMember } from '../agents/docs/docs-agent.js';
import { ToolsMember } from '../agents/built-in/tools/tools-agent.js';
import { ValidateMember } from '../agents/built-in/validate/validate-agent.js';
import { AutoRAGMember } from '../agents/built-in/autorag/autorag-agent.js';
/**
 * MemberLoader handles dynamic loading of user-created agents
 *
 * Note: In Cloudflare Workers, we can't use Node.js fs module.
 * Members must be bundled at build time using wrangler's module imports.
 *
 * For now, users will need to manually import and register their agents.
 * Future: We can build a CLI tool that generates the registration code.
 */
export class AgentLoader {
    constructor(config) {
        this.config = {
            membersDir: config.membersDir || './agents',
            ensemblesDir: config.ensemblesDir || './ensembles',
            env: config.env,
            ctx: config.ctx,
        };
        this.loadedMembers = new Map();
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
     * const loader = new MemberLoader({ env, ctx });
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
                console.log(`[MemberLoader] Auto-discovered agent: ${agentDef.name}`);
            }
            catch (error) {
                console.error(`[MemberLoader] Failed to load agent "${agentDef.name}":`, error);
                // Continue with other agents even if one fails
            }
        }
        console.log(`[MemberLoader] Auto-discovery complete: ${this.loadedMembers.size} agents loaded`);
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
        const instance = this.createMemberInstance(config, implementation);
        // Store in registry
        this.loadedMembers.set(config.name, {
            config,
            instance,
        });
        return instance;
    }
    /**
     * Load a agent from Edgit by version reference
     *
     * This enables loading versioned agent configs at runtime for A/B testing,
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
    async loadMemberFromEdgit(memberRef) {
        const { name, version } = Parser.parseAgentReference(memberRef);
        if (!version) {
            throw new Error(`Agent reference must include version: ${memberRef}`);
        }
        // Check if already loaded
        const versionedKey = `${name}@${version}`;
        if (this.loadedMembers.has(versionedKey)) {
            return this.loadedMembers.get(versionedKey).instance;
        }
        // TODO: Load from Edgit when available
        // Expected implementation:
        // import { loadMemberConfig } from '../sdk/edgit.js';
        // const config = await loadMemberConfig(memberRef, this.config.env);
        // const instance = this.createMemberInstance(config);
        // this.loadedMembers.set(versionedKey, { config, instance });
        // return instance;
        throw new Error(`Cannot load versioned agent from Edgit: ${memberRef}. ` +
            `Edgit integration not yet available. ` +
            `Use loader.registerAgent() for now.`);
    }
    /**
     * Create a agent instance based on type
     */
    createMemberInstance(config, implementation) {
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
            case 'tools':
                return new ToolsMember(config, this.config.env);
            case 'scoring':
                return new ValidateMember(config, this.config.env);
            case 'email':
                return new EmailAgent(config);
            case 'sms':
                return new SmsMember(config);
            case 'form':
                return new FormAgent(config);
            case 'html':
                return new HtmlMember(config);
            case 'pdf':
                return new PdfMember(config);
            case 'queue':
                return new QueueMember(config);
            case 'docs':
                return new DocsMember(config);
            case 'autorag':
                return new AutoRAGMember(config);
            default:
                throw new Error(`Unknown agent type: ${config.operation}`);
        }
    }
    /**
     * Get a loaded agent by name
     */
    getAgent(name) {
        return this.loadedMembers.get(name)?.instance;
    }
    /**
     * Get agent config by name
     */
    getAgentConfig(name) {
        return this.loadedMembers.get(name)?.config;
    }
    /**
     * Get all loaded agents
     */
    getAllMembers() {
        return Array.from(this.loadedMembers.values()).map((m) => m.instance);
    }
    /**
     * Get all agent names
     */
    getMemberNames() {
        return Array.from(this.loadedMembers.keys());
    }
    /**
     * Check if a agent is loaded
     */
    hasMember(name) {
        return this.loadedMembers.has(name);
    }
    /**
     * Clear all loaded agents
     */
    clear() {
        this.loadedMembers.clear();
    }
}
/**
 * Helper function to create a loader instance
 */
export function createLoader(config) {
    return new AgentLoader(config);
}
// Backward compatibility alias
export const MemberLoader = AgentLoader;
