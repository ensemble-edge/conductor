/**
 * Agent Loader Utility
 *
 * Dynamically loads user-created agents from their project directory
 * This runs in the user's project context, not in the conductor package
 */

import { Parser, type AgentConfig } from '../runtime/parser.js'
import { BaseAgent } from '../agents/base-agent.js'
import { FunctionAgent, type FunctionImplementation } from '../agents/function-agent.js'
import { ThinkAgent } from '../agents/think-agent.js'
import { DataAgent } from '../agents/data-agent.js'
import { APIAgent } from '../agents/api-agent.js'
import { EmailAgent } from '../agents/email/email-agent.js'
import { SmsMember } from '../agents/sms/sms-agent.js'
import { FormAgent } from '../agents/form/form-agent.js'
import { HtmlMember } from '../agents/html/html-agent.js'
import { PdfMember } from '../agents/pdf/pdf-agent.js'
import { QueueMember } from '../agents/queue/queue-agent.js'
import { DocsMember } from '../agents/docs/docs-agent.js'
import { ToolsMember } from '../agents/built-in/tools/tools-agent.js'
import { ValidateMember } from '../agents/built-in/validate/validate-agent.js'
import { AutoRAGMember } from '../agents/built-in/autorag/autorag-agent.js'

export interface LoaderConfig {
  /**
   * Base directory where agents are located
   * @default './agents'
   */
  membersDir?: string

  /**
   * Base directory where ensembles are located
   * @default './ensembles'
   */
  ensemblesDir?: string

  /**
   * Environment context (passed from Worker)
   */
  env: Env

  /**
   * Execution context (passed from Worker)
   */
  ctx: ExecutionContext
}

export interface LoadedMember {
  config: AgentConfig
  instance: BaseAgent
}

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
  private config: LoaderConfig
  private loadedMembers: Map<string, LoadedMember>

  constructor(config: LoaderConfig) {
    this.config = {
      membersDir: config.membersDir || './agents',
      ensemblesDir: config.ensemblesDir || './ensembles',
      env: config.env,
      ctx: config.ctx,
    }
    this.loadedMembers = new Map()
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
  async autoDiscover(
    discoveredAgents: Array<{
      name: string
      config: string
      handler?: () => Promise<any>
    }>
  ): Promise<void> {
    for (const agentDef of discoveredAgents) {
      try {
        // Parse YAML config
        const config = Parser.parseAgent(agentDef.config)

        // Load handler if available
        let implementation: FunctionImplementation | undefined
        if (agentDef.handler) {
          const handlerModule = await agentDef.handler()
          implementation = handlerModule?.default || handlerModule
        }

        // Register the agent
        this.registerAgent(config, implementation)

        console.log(`[MemberLoader] Auto-discovered agent: ${agentDef.name}`)
      } catch (error) {
        console.error(`[MemberLoader] Failed to load agent "${agentDef.name}":`, error)
        // Continue with other agents even if one fails
      }
    }

    console.log(`[MemberLoader] Auto-discovery complete: ${this.loadedMembers.size} agents loaded`)
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
  registerAgent(
    agentConfig: AgentConfig | string,
    implementation?: FunctionImplementation
  ): BaseAgent {
    // Parse config if it's a string (YAML)
    const config = typeof agentConfig === 'string' ? Parser.parseAgent(agentConfig) : agentConfig

    // Create agent instance based on type
    const instance = this.createMemberInstance(config, implementation)

    // Store in registry
    this.loadedMembers.set(config.name, {
      config,
      instance,
    })

    return instance
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
  async loadMemberFromEdgit(memberRef: string): Promise<BaseAgent> {
    const { name, version } = Parser.parseAgentReference(memberRef)

    if (!version) {
      throw new Error(`Agent reference must include version: ${memberRef}`)
    }

    // Check if already loaded
    const versionedKey = `${name}@${version}`
    if (this.loadedMembers.has(versionedKey)) {
      return this.loadedMembers.get(versionedKey)!.instance
    }

    // TODO: Load from Edgit when available
    // Expected implementation:
    // import { loadMemberConfig } from '../sdk/edgit.js';
    // const config = await loadMemberConfig(memberRef, this.config.env);
    // const instance = this.createMemberInstance(config);
    // this.loadedMembers.set(versionedKey, { config, instance });
    // return instance;

    throw new Error(
      `Cannot load versioned agent from Edgit: ${memberRef}. ` +
        `Edgit integration not yet available. ` +
        `Use loader.registerAgent() for now.`
    )
  }

  /**
   * Create a agent instance based on type
   */
  private createMemberInstance(
    config: AgentConfig,
    implementation?: FunctionImplementation
  ): BaseAgent {
    switch (config.operation) {
      case 'code':
        if (!implementation) {
          throw new Error(`Code agent "${config.name}" requires an implementation function`)
        }
        // Code operation agents receive the full context object
        // User functions are exported as: (context: { input: any }) => result
        // FunctionAgent already passes the full context, so just use the implementation directly
        return new FunctionAgent(config, implementation)

      case 'think':
        return new ThinkAgent(config)

      case 'storage':
        return new DataAgent(config)

      case 'data':
        return new DataAgent(config)

      case 'http':
        return new APIAgent(config)

      case 'tools':
        return new ToolsMember(config, this.config.env)

      case 'scoring':
        return new ValidateMember(config, this.config.env)

      case 'email':
        return new EmailAgent(config)

      case 'sms':
        return new SmsMember(config)

      case 'form':
        return new FormAgent(config)

      case 'html':
        return new HtmlMember(config)

      case 'pdf':
        return new PdfMember(config)

      case 'queue':
        return new QueueMember(config)

      case 'docs':
        return new DocsMember(config)

      case 'autorag':
        return new AutoRAGMember(config)

      default:
        throw new Error(`Unknown agent type: ${config.operation}`)
    }
  }

  /**
   * Get a loaded agent by name
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.loadedMembers.get(name)?.instance
  }

  /**
   * Get agent config by name
   */
  getAgentConfig(name: string): AgentConfig | undefined {
    return this.loadedMembers.get(name)?.config
  }

  /**
   * Get all loaded agents
   */
  getAllMembers(): BaseAgent[] {
    return Array.from(this.loadedMembers.values()).map((m) => m.instance)
  }

  /**
   * Get all agent names
   */
  getMemberNames(): string[] {
    return Array.from(this.loadedMembers.keys())
  }

  /**
   * Check if a agent is loaded
   */
  hasMember(name: string): boolean {
    return this.loadedMembers.has(name)
  }

  /**
   * Clear all loaded agents
   */
  clear(): void {
    this.loadedMembers.clear()
  }
}

/**
 * Helper function to create a loader instance
 */
export function createLoader(config: LoaderConfig): AgentLoader {
  return new AgentLoader(config)
}

// Backward compatibility alias
export const MemberLoader = AgentLoader
