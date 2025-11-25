/**
 * OpenAPI Documentation Generator
 *
 * Automatically generates OpenAPI 3.0 documentation from Conductor projects.
 * Supports both basic (automatic) and advanced (AI-powered) modes.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  Parser,
  type EnsembleConfig,
  type AgentConfig,
  type AgentFlowStep,
  type FlowStepType,
} from '../runtime/parser.js'

/**
 * Type guard to check if a flow step is an agent step
 */
function isAgentStep(step: FlowStepType): step is AgentFlowStep {
  return 'agent' in step && typeof (step as AgentFlowStep).agent === 'string'
}
import YAML from 'yaml'

export interface OpenAPISpec {
  openapi: string
  info: OpenAPIInfo
  servers?: OpenAPIServer[]
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, Schema>
    securitySchemes?: Record<string, SecurityScheme>
  }
  tags?: Tag[]
}

export interface OpenAPIInfo {
  title: string
  version: string
  description?: string
  contact?: {
    name?: string
    email?: string
    url?: string
  }
  license?: {
    name: string
    url?: string
  }
}

export interface OpenAPIServer {
  url: string
  description?: string
}

export interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  delete?: Operation
  patch?: Operation
}

export interface Operation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  parameters?: Parameter[]
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, MediaType>
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
}

export interface MediaType {
  schema: Schema
  example?: unknown
  examples?: Record<string, Example>
}

export interface Schema {
  type?: string
  properties?: Record<string, Schema>
  required?: string[]
  items?: Schema
  description?: string
  example?: unknown
  additionalProperties?: boolean | Schema
  enum?: unknown[]
  format?: string
}

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema: Schema
}

export interface Example {
  summary?: string
  description?: string
  value: unknown
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
}

export interface Tag {
  name: string
  description?: string
}

export interface GeneratorOptions {
  projectPath: string
  outputPath?: string
  useAI?: boolean
  aiAgent?: string
}

/**
 * OpenAPI Documentation Generator
 */
export class OpenAPIGenerator {
  private projectPath: string
  private parser: Parser
  private ensembles: Map<string, EnsembleConfig> = new Map()
  private agents: Map<string, AgentConfig> = new Map()

  constructor(projectPath: string) {
    this.projectPath = projectPath
    this.parser = new Parser()
  }

  /**
   * Generate OpenAPI documentation
   */
  async generate(options: GeneratorOptions): Promise<OpenAPISpec> {
    // Load project catalog
    await this.loadCatalog()

    // Generate base spec
    const spec = await this.generateBaseSpec()

    // Enhance with AI if enabled
    if (options.useAI) {
      return await this.enhanceWithAI(spec, options.aiAgent)
    }

    return spec
  }

  /**
   * Load project catalog (ensembles and agents)
   */
  private async loadCatalog(): Promise<void> {
    // Load ensembles
    const ensemblesPath = path.join(this.projectPath, 'ensembles')
    try {
      const files = await fs.readdir(ensemblesPath)
      for (const file of files) {
        // Skip examples directory
        if (file === 'examples') continue

        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(ensemblesPath, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const ensemble = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' }) as EnsembleConfig
          this.ensembles.set(ensemble.name, ensemble)
        }
      }
    } catch (error) {
      // Ensembles directory might not exist
    }

    // Load agents
    const membersPath = path.join(this.projectPath, 'agents')
    try {
      const dirs = await fs.readdir(membersPath, { withFileTypes: true })
      for (const dir of dirs) {
        // Skip examples directory
        if (dir.name === 'examples') continue

        if (dir.isDirectory()) {
          const memberYamlPath = path.join(membersPath, dir.name, 'agent.yaml')
          try {
            const content = await fs.readFile(memberYamlPath, 'utf-8')
            const agent = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' }) as AgentConfig
            this.agents.set(agent.name, agent)
          } catch {
            // Agent might not have agent.yaml
          }
        }
      }
    } catch (error) {
      // Members directory might not exist
    }
  }

  /**
   * Generate base OpenAPI spec from catalog
   */
  private async generateBaseSpec(): Promise<OpenAPISpec> {
    const projectName = await this.getProjectName()
    const projectVersion = await this.getProjectVersion()

    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: projectName,
        version: projectVersion,
        description: `API documentation for ${projectName}`,
        license: {
          name: 'Apache-2.0',
        },
      },
      servers: [
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
        {
          url: 'http://localhost:8787',
          description: 'Local development server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT authentication',
          },
        },
      },
      tags: [],
    }

    // Generate paths from ensembles
    const tags = new Set<string>()
    for (const [name, ensemble] of this.ensembles) {
      const tag = this.inferTag(ensemble)
      tags.add(tag)

      spec.paths[`/execute/${name}`] = {
        post: {
          summary: ensemble.description || `Execute ${name} workflow`,
          description: this.generateDescription(ensemble),
          operationId: `execute_${name}`,
          tags: [tag],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: this.generateInputSchema(ensemble),
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful execution',
              content: {
                'application/json': {
                  schema: this.generateOutputSchema(ensemble),
                },
              },
            },
            '400': {
              description: 'Invalid input',
            },
            '500': {
              description: 'Execution error',
            },
          },
        },
      }
    }

    // Add tags
    spec.tags = Array.from(tags).map((tag) => ({
      name: tag,
      description: `${tag} operations`,
    }))

    return spec
  }

  /**
   * Enhance documentation with AI
   */
  private async enhanceWithAI(spec: OpenAPISpec, aiAgent?: string): Promise<OpenAPISpec> {
    // TODO: Call AI agent to enhance descriptions, examples, etc.
    // This will be implemented with the docs-writer agent
    console.log('AI enhancement not yet implemented')
    return spec
  }

  /**
   * Infer API tag from ensemble name/description
   */
  private inferTag(ensemble: EnsembleConfig): string {
    const name = ensemble.name

    // Common patterns
    if (name.includes('user') || name.includes('auth')) return 'User Management'
    if (name.includes('payment') || name.includes('billing')) return 'Payments'
    if (name.includes('order')) return 'Orders'
    if (name.includes('product')) return 'Products'
    if (name.includes('search')) return 'Search'
    if (name.includes('notification')) return 'Notifications'
    if (name.includes('report')) return 'Reports'
    if (name.includes('analytics')) return 'Analytics'

    // Default: capitalize first word
    return name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1)
  }

  /**
   * Generate description from ensemble
   */
  private generateDescription(ensemble: EnsembleConfig): string {
    if (ensemble.description) {
      return ensemble.description
    }

    // Generate from flow
    if (!ensemble.flow || ensemble.flow.length === 0) {
      return 'No flow steps defined'
    }

    const stepCount = ensemble.flow.length
    const memberNames = ensemble.flow
      .filter(isAgentStep)
      .map((step) => step.agent)
      .join(', ')

    return `Executes ${stepCount} step${stepCount > 1 ? 's' : ''}: ${memberNames}`
  }

  /**
   * Generate input schema from ensemble
   */
  private generateInputSchema(ensemble: EnsembleConfig): Schema {
    // Analyze flow steps to determine required inputs
    const inputRefs = new Set<string>()

    if (ensemble.flow) {
      for (const step of ensemble.flow) {
        // Only agent steps have input mappings
        if (isAgentStep(step) && step.input) {
          // Extract input variable references (${input.xxx})
          const inputStr = JSON.stringify(step.input)
          const matches = inputStr.matchAll(/\$\{input\.(\w+)\}/g)
          for (const match of matches) {
            inputRefs.add(match[1])
          }
        }
      }
    }

    const properties: Record<string, Schema> = {}
    for (const ref of inputRefs) {
      properties[ref] = {
        type: 'string',
        description: `Input parameter: ${ref}`,
      }
    }

    return {
      type: 'object',
      properties,
      required: Array.from(inputRefs),
    }
  }

  /**
   * Generate output schema from ensemble
   */
  private generateOutputSchema(ensemble: EnsembleConfig): Schema {
    if (ensemble.output) {
      // Analyze output mapping
      const properties: Record<string, Schema> = {}

      for (const [key, value] of Object.entries(ensemble.output)) {
        properties[key] = {
          type: typeof value === 'string' ? 'string' : 'object',
          description: `Output field: ${key}`,
        }
      }

      return {
        type: 'object',
        properties,
      }
    }

    // Default output schema
    return {
      type: 'object',
      properties: {
        result: {
          type: 'object',
          description: 'Execution result',
        },
      },
    }
  }

  /**
   * Get project name from package.json
   */
  private async getProjectName(): Promise<string> {
    try {
      const pkgPath = path.join(this.projectPath, 'package.json')
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)
      return pkg.name || 'Conductor Project'
    } catch {
      return 'Conductor Project'
    }
  }

  /**
   * Get project version from package.json
   */
  private async getProjectVersion(): Promise<string> {
    try {
      const pkgPath = path.join(this.projectPath, 'package.json')
      const content = await fs.readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(content)
      return pkg.version || '1.0.0'
    } catch {
      return '1.0.0'
    }
  }

  /**
   * Save OpenAPI spec to file
   */
  async save(spec: OpenAPISpec, outputPath: string): Promise<void> {
    const content = YAML.stringify(spec)
    await fs.writeFile(outputPath, content, 'utf-8')
  }
}
