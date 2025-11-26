/**
 * AI Documentation Enhancer
 *
 * Uses Workers AI to enhance auto-generated documentation with:
 * - Better descriptions
 * - Usage examples
 * - Clear explanations
 * - Best practices
 *
 * Includes comprehensive Conductor context in prompts.
 */

import type { OpenAPISpec } from './openapi-generator.js'

/**
 * Conductor context for AI prompts
 * A condensed version of the ai-context.mdx optimized for token efficiency
 */
const CONDUCTOR_CONTEXT = `
# Ensemble Conductor — Context for Documentation

Conductor is an agentic workflow orchestration framework for Cloudflare Workers.
It enables building AI-powered workflows using declarative YAML or TypeScript.

## Core Architecture
- **Agents** — Reusable units of work with specific operations
- **Ensembles** — Orchestrations that combine agents into workflows
- **Operations** — Atomic execution primitives (14 types)
- **Triggers** — Invocation methods: http, webhook, mcp, email, queue, cron

## Operations (14 types)
| Operation | Purpose |
|-----------|---------|
| think | LLM reasoning with any provider (OpenAI, Anthropic, Cloudflare, Groq) |
| code | Execute JavaScript/TypeScript scripts |
| storage | KV/R2 key-value and object storage |
| data | D1 SQL, Hyperdrive Postgres, Vectorize vector DB |
| http | Make HTTP requests to external APIs |
| tools | Call MCP tools |
| email | Send emails via providers |
| sms | Send SMS messages |
| html | Render HTML templates with data |
| pdf | Generate PDFs from HTML |
| form | Generate and handle forms |
| queue | Send/consume queue messages |
| docs | Generate API documentation |
| scoring | Score and evaluate agent outputs |

## Expression Syntax
- \${input.field} — Access ensemble input
- \${agent-name.output} — Reference another agent's output
- \${env.VARIABLE} — Environment variables
- \${state.field} — State variables

## Common Patterns
1. **Linear Pipeline** — Sequential agent execution
2. **Parallel Execution** — Concurrent independent tasks
3. **Conditional Branching** — Execute based on conditions
4. **Cache-or-Generate** — Check cache before expensive operations
5. **Fallback Chain** — Try primary, then backup on failure
6. **RAG Pipeline** — Embed → Vector Search → Generate

## File Structure
project/
├── ensembles/     # Workflow definitions (YAML or TypeScript)
├── agents/        # Custom agent configurations
├── scripts/       # TypeScript/JavaScript for code operations
├── prompts/       # Prompt templates for think operations
└── wrangler.toml  # Cloudflare Workers configuration

## Key Concepts
- Agents are stateless and reusable across ensembles
- Ensembles define the flow and can have multiple triggers
- All operations run on Cloudflare's edge network (200+ regions, <50ms cold start)
- Built-in retry, caching, and error handling support
`.trim()

/**
 * System prompt for documentation enhancement
 */
const SYSTEM_PROMPT = `You are a technical documentation writer for Ensemble Conductor.

${CONDUCTOR_CONTEXT}

Your task is to enhance auto-generated API documentation to be:
1. **Clear** — Easy to understand for developers of all skill levels
2. **Actionable** — Include practical usage examples
3. **Accurate** — Match the actual behavior of the code
4. **Concise** — No unnecessary verbosity, but complete enough to be useful

Guidelines:
- Write in second person ("You can..." not "Users can...")
- Use active voice
- Include code examples where helpful
- Explain the "why" not just the "what"
- Mention related endpoints or features when relevant
- Highlight important caveats or limitations
- Don't invent features that don't exist

Output format: Return ONLY the enhanced text, no explanations or meta-commentary.`

/**
 * Enhance an agent description
 */
export function createAgentDescriptionPrompt(agent: {
  name: string
  operation: string
  description?: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}): string {
  return `Enhance the description for this Conductor agent:

Agent Name: ${agent.name}
Operation Type: ${agent.operation}
Current Description: ${agent.description || 'No description provided'}

Input Schema:
${agent.inputSchema ? JSON.stringify(agent.inputSchema, null, 2) : 'Not specified'}

Output Schema:
${agent.outputSchema ? JSON.stringify(agent.outputSchema, null, 2) : 'Not specified'}

Write an improved description (2-3 sentences) that explains:
1. What this agent does
2. When you would use it
3. What makes it useful

Keep it practical and developer-friendly.`
}

/**
 * Enhance an ensemble description
 */
export function createEnsembleDescriptionPrompt(ensemble: {
  name: string
  description?: string
  triggers?: Array<{ type: string; path?: string; cron?: string }>
  stepCount: number
  agentNames: string[]
}): string {
  return `Enhance the description for this Conductor ensemble:

Ensemble Name: ${ensemble.name}
Current Description: ${ensemble.description || 'No description provided'}
Number of Steps: ${ensemble.stepCount}
Agents Used: ${ensemble.agentNames.join(', ') || 'None specified'}
Triggers: ${
    ensemble.triggers?.length
      ? ensemble.triggers
          .map((t) => `${t.type}${t.path ? ` at ${t.path}` : ''}${t.cron ? ` (${t.cron})` : ''}`)
          .join(', ')
      : 'None configured'
  }

Write an improved description (2-3 sentences) that explains:
1. What workflow this ensemble implements
2. How it's triggered and what it produces
3. The business problem it solves

Keep it practical and developer-friendly.`
}

/**
 * Generate a usage example for an agent
 */
export function createAgentExamplePrompt(agent: {
  name: string
  operation: string
  inputSchema?: Record<string, unknown>
}): string {
  return `Generate a YAML usage example for this Conductor agent:

Agent Name: ${agent.name}
Operation Type: ${agent.operation}

Input Schema:
${agent.inputSchema ? JSON.stringify(agent.inputSchema, null, 2) : 'Accept any input'}

Create a realistic YAML snippet showing how to use this agent in an ensemble flow.
Include:
1. The agent step with realistic input values
2. A brief comment explaining what it does

Example format:
\`\`\`yaml
# Brief comment explaining the step
- agent: agent-name
  input:
    field: \${input.value}
\`\`\`

Generate ONLY the YAML code block, nothing else.`
}

/**
 * Generate a usage example for an ensemble
 */
export function createEnsembleExamplePrompt(ensemble: {
  name: string
  inputSchema?: Record<string, unknown>
}): string {
  return `Generate a curl command example for invoking this Conductor ensemble:

Ensemble Name: ${ensemble.name}

Input Schema:
${ensemble.inputSchema ? JSON.stringify(ensemble.inputSchema, null, 2) : 'Accept any input'}

Create a realistic curl command showing how to invoke this ensemble via HTTP.
Include:
1. The POST request to /execute/${ensemble.name}
2. Realistic input data based on the schema
3. Common headers

Example format:
\`\`\`bash
curl -X POST http://localhost:8787/execute/${ensemble.name} \\
  -H "Content-Type: application/json" \\
  -d '{"field": "value"}'
\`\`\`

Generate ONLY the bash code block, nothing else.`
}

/**
 * Enhance OpenAPI operation description
 */
export function createOpenAPIOperationPrompt(operation: {
  path: string
  method: string
  summary?: string
  description?: string
  requestBody?: unknown
  responses?: unknown
}): string {
  return `Enhance the OpenAPI operation description:

Endpoint: ${operation.method.toUpperCase()} ${operation.path}
Current Summary: ${operation.summary || 'Not provided'}
Current Description: ${operation.description || 'Not provided'}

Request Body Schema:
${operation.requestBody ? JSON.stringify(operation.requestBody, null, 2) : 'None'}

Responses:
${operation.responses ? JSON.stringify(operation.responses, null, 2) : 'Not specified'}

Write:
1. A clear summary (one line, <10 words)
2. A helpful description (2-3 sentences) explaining what this endpoint does, when to use it, and any important notes

Format:
SUMMARY: [your summary]
DESCRIPTION: [your description]`
}

/**
 * AI configuration for docs enhancement
 */
export interface DocsAIConfig {
  /** Enable AI enhancement */
  enabled?: boolean
  /** AI model to use */
  model?: string
  /** AI provider */
  provider?: 'cloudflare' | 'openai' | 'anthropic'
  /** Temperature (0-1) */
  temperature?: number
}

/**
 * Default AI configuration
 */
export const DEFAULT_AI_CONFIG: DocsAIConfig = {
  enabled: false,
  model: '@cf/meta/llama-3.1-8b-instruct',
  provider: 'cloudflare',
  temperature: 0.3,
}

/**
 * AI Enhancer class for documentation
 *
 * Supports multiple AI providers:
 * - Cloudflare Workers AI (default)
 * - OpenAI (via API key)
 * - Anthropic (via API key)
 */
export class DocsAIEnhancer {
  private aiBinding: any // Workers AI binding
  private config: DocsAIConfig

  constructor(aiBinding: any, config?: DocsAIConfig) {
    this.aiBinding = aiBinding
    this.config = { ...DEFAULT_AI_CONFIG, ...config }
  }

  /**
   * Get current AI configuration
   */
  getConfig(): DocsAIConfig {
    return { ...this.config }
  }

  /**
   * Update AI configuration
   */
  setConfig(config: Partial<DocsAIConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Enhance a single text using AI
   */
  async enhance(prompt: string): Promise<string> {
    if (!this.config.enabled) {
      return ''
    }

    if (!this.aiBinding) {
      console.warn('[DocsAIEnhancer] No AI binding available, returning original')
      return ''
    }

    try {
      const model = this.config.model || DEFAULT_AI_CONFIG.model!
      const temperature = this.config.temperature ?? DEFAULT_AI_CONFIG.temperature!

      const response = await this.aiBinding.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature,
      })

      return response.response || ''
    } catch (error) {
      console.error('[DocsAIEnhancer] AI enhancement failed:', error)
      return ''
    }
  }

  /**
   * Enhance an entire OpenAPI spec
   */
  async enhanceSpec(spec: OpenAPISpec): Promise<OpenAPISpec> {
    const enhanced = { ...spec }

    // Enhance each path operation
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch'] as const) {
        const operation = pathItem[method]
        if (!operation) continue

        const prompt = createOpenAPIOperationPrompt({
          path,
          method,
          summary: operation.summary,
          description: operation.description,
          requestBody: operation.requestBody,
          responses: operation.responses,
        })

        const result = await this.enhance(prompt)

        if (result) {
          // Parse the result
          const summaryMatch = result.match(/SUMMARY:\s*(.+)/i)
          const descMatch = result.match(/DESCRIPTION:\s*(.+)/is)

          if (summaryMatch) {
            operation.summary = summaryMatch[1].trim()
          }
          if (descMatch) {
            operation.description = descMatch[1].trim()
          }
        }
      }
    }

    return enhanced
  }

  /**
   * Enhance agent description
   */
  async enhanceAgentDescription(agent: {
    name: string
    operation: string
    description?: string
    inputSchema?: Record<string, unknown>
    outputSchema?: Record<string, unknown>
  }): Promise<string> {
    const prompt = createAgentDescriptionPrompt(agent)
    const result = await this.enhance(prompt)
    return result || agent.description || ''
  }

  /**
   * Enhance ensemble description
   */
  async enhanceEnsembleDescription(ensemble: {
    name: string
    description?: string
    triggers?: Array<{ type: string; path?: string; cron?: string }>
    stepCount: number
    agentNames: string[]
  }): Promise<string> {
    const prompt = createEnsembleDescriptionPrompt(ensemble)
    const result = await this.enhance(prompt)
    return result || ensemble.description || ''
  }

  /**
   * Generate agent usage example
   */
  async generateAgentExample(agent: {
    name: string
    operation: string
    inputSchema?: Record<string, unknown>
  }): Promise<string> {
    const prompt = createAgentExamplePrompt(agent)
    return await this.enhance(prompt)
  }

  /**
   * Generate ensemble usage example
   */
  async generateEnsembleExample(ensemble: {
    name: string
    inputSchema?: Record<string, unknown>
  }): Promise<string> {
    const prompt = createEnsembleExamplePrompt(ensemble)
    return await this.enhance(prompt)
  }
}

/**
 * Get system prompt (exported for testing/inspection)
 */
export function getSystemPrompt(): string {
  return SYSTEM_PROMPT
}

/**
 * Get Conductor context (exported for testing/inspection)
 */
export function getConductorContext(): string {
  return CONDUCTOR_CONTEXT
}
