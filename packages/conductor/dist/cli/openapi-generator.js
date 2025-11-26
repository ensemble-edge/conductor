/**
 * OpenAPI Documentation Generator
 *
 * Automatically generates OpenAPI 3.0 documentation from Conductor projects.
 * Supports both basic (automatic) and advanced (AI-powered) modes.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { Parser, } from '../runtime/parser.js';
/**
 * Type guard to check if a flow step is an agent step
 */
function isAgentStep(step) {
    return 'agent' in step && typeof step.agent === 'string';
}
import YAML from 'yaml';
/**
 * OpenAPI Documentation Generator
 */
export class OpenAPIGenerator {
    constructor(projectPath) {
        this.ensembles = new Map();
        this.agents = new Map();
        this.projectPath = projectPath;
        this.parser = new Parser();
    }
    /**
     * Generate OpenAPI documentation
     */
    async generate(options) {
        // Load project catalog
        await this.loadCatalog();
        // Generate base spec
        const spec = await this.generateBaseSpec();
        // Enhance with AI if enabled
        if (options.useAI) {
            return await this.enhanceWithAI(spec, options.aiAgent);
        }
        return spec;
    }
    /**
     * Load project catalog (ensembles and agents)
     */
    async loadCatalog() {
        // Load ensembles
        const ensemblesPath = path.join(this.projectPath, 'ensembles');
        try {
            const files = await fs.readdir(ensemblesPath);
            for (const file of files) {
                // Skip examples directory
                if (file === 'examples')
                    continue;
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const filePath = path.join(ensemblesPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const ensemble = YAML.parse(content, {
                        mapAsMap: false,
                        logLevel: 'silent',
                    });
                    this.ensembles.set(ensemble.name, ensemble);
                }
            }
        }
        catch (error) {
            // Ensembles directory might not exist
        }
        // Load agents
        const membersPath = path.join(this.projectPath, 'agents');
        try {
            const dirs = await fs.readdir(membersPath, { withFileTypes: true });
            for (const dir of dirs) {
                // Skip examples directory
                if (dir.name === 'examples')
                    continue;
                if (dir.isDirectory()) {
                    const memberYamlPath = path.join(membersPath, dir.name, 'agent.yaml');
                    try {
                        const content = await fs.readFile(memberYamlPath, 'utf-8');
                        const agent = YAML.parse(content, {
                            mapAsMap: false,
                            logLevel: 'silent',
                        });
                        this.agents.set(agent.name, agent);
                    }
                    catch {
                        // Agent might not have agent.yaml
                    }
                }
            }
        }
        catch (error) {
            // Members directory might not exist
        }
    }
    /**
     * Generate base OpenAPI spec from catalog
     */
    async generateBaseSpec() {
        const projectName = await this.getProjectName();
        const projectVersion = await this.getProjectVersion();
        const spec = {
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
        };
        // Generate paths from ensembles
        const tags = new Set();
        for (const [name, ensemble] of this.ensembles) {
            const tag = this.inferTag(ensemble);
            tags.add(tag);
            spec.paths[`/api/v1/execute/ensemble/${name}`] = {
                post: {
                    summary: ensemble.description || `Execute ${name} workflow`,
                    description: this.generateDescription(ensemble),
                    operationId: `execute_ensemble_${name}`,
                    tags: [tag],
                    security: [{ bearerAuth: [] }, { apiKey: [] }],
                    requestBody: {
                        required: false,
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
                        '401': {
                            description: 'Unauthorized - authentication required',
                        },
                        '403': {
                            description: 'Forbidden - missing required permission',
                        },
                        '404': {
                            description: 'Ensemble not found',
                        },
                        '500': {
                            description: 'Execution error',
                        },
                    },
                },
            };
        }
        // Add tags
        spec.tags = Array.from(tags).map((tag) => ({
            name: tag,
            description: `${tag} operations`,
        }));
        return spec;
    }
    /**
     * Enhance documentation with AI
     */
    async enhanceWithAI(spec, aiAgent) {
        // Import the AI enhancer dynamically to avoid bundling in non-AI contexts
        try {
            const { DocsAIEnhancer, createOpenAPIOperationPrompt } = await import('./docs-ai-enhancer.js');
            console.log('  Enhancing documentation with AI...');
            // Note: In CLI context, we don't have Workers AI binding directly.
            // The AI enhancement is designed for runtime use in Workers.
            // For CLI, we'll return the base spec with a note about runtime enhancement.
            console.log('  Note: Full AI enhancement requires Workers AI binding (runtime only)');
            console.log('  Generating enhanced descriptions from templates...');
            // Apply template-based enhancements (no AI needed)
            const enhanced = this.applyTemplateEnhancements(spec);
            return enhanced;
        }
        catch (error) {
            console.warn('  AI enhancement module not available:', error.message);
            return spec;
        }
    }
    /**
     * Apply template-based enhancements (deterministic, no AI)
     */
    applyTemplateEnhancements(spec) {
        const enhanced = { ...spec };
        // Enhance info description
        enhanced.info.description = `${spec.info.description}

This API is powered by Ensemble Conductor, an agentic workflow orchestration framework for Cloudflare Workers.

## Quick Start

1. **Execute an ensemble**: POST to \`/api/v1/execute/ensemble/{name}\` with input data
2. **Execute an agent**: POST to \`/api/v1/execute/agent/{name}\` (if enabled)
3. **List agents**: GET \`/api/v1/agents\` to see available agents
4. **List ensembles**: GET \`/api/v1/ensembles\` to see available workflows
5. **Browse docs**: Visit \`/docs\` for interactive documentation

## Authentication

All \`/api/v1/*\` routes require authentication by default. Provide one of:
- \`Authorization: Bearer <token>\` header (JWT)
- \`X-API-Key: <key>\` header (API key)

## Permissions

API keys can be scoped with permissions like:
- \`ensemble:invoice-pdf:execute\` - Execute specific ensemble
- \`ensemble:*:execute\` - Execute any ensemble
- \`agent:http:execute\` - Execute specific agent
- \`*\` - Full access (admin)

## Rate Limits

Check response headers for rate limit information:
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: When the window resets`;
        // Enhance path descriptions with more detail
        for (const [path, pathItem] of Object.entries(enhanced.paths)) {
            for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
                const operation = pathItem[method];
                if (!operation)
                    continue;
                // Add examples and better descriptions based on path patterns
                if (path.includes('/api/v1/execute/ensemble/')) {
                    const ensembleName = path.split('/api/v1/execute/ensemble/')[1];
                    operation.description = `Execute the **${ensembleName}** ensemble workflow.

This endpoint triggers the ensemble's flow, executing each agent in sequence (or parallel where configured).

**Authentication**: Requires Bearer token or API key.
**Permission**: \`ensemble:${ensembleName}:execute\` (if auto-permissions enabled)

**Input**: Provide the ensemble's expected input in the request body.
**Output**: Returns the final output after all steps complete.

The ensemble may include:
- AI/LLM operations (think)
- External API calls (http)
- Database operations (data)
- And more...`;
                }
                if (path.includes('/api/v1/execute/agent/')) {
                    const agentName = path.split('/api/v1/execute/agent/')[1];
                    operation.description = `Execute the **${agentName}** agent directly.

This endpoint bypasses the ensemble flow and executes an agent directly.

**Authentication**: Requires Bearer token or API key.
**Permission**: \`agent:${agentName}:execute\` (if auto-permissions enabled)
**Note**: Direct agent execution can be disabled via \`allowDirectAgentExecution: false\`.

**Input**: Provide the agent's expected input in the request body.
**Output**: Returns the agent's output.`;
                }
                if (path === '/api/v1/agents') {
                    operation.description = `List all available agents in this Conductor project.

Returns both **built-in agents** (provided by Conductor) and **custom agents** (defined in your \`agents/\` directory).

Use this to discover what agents are available for use in your ensembles.`;
                }
                if (path === '/api/v1/agents/{name}') {
                    operation.description = `Get detailed information about a specific agent.

Returns:
- Agent configuration schema
- Input/output schemas
- Usage examples
- Whether it's a built-in or custom agent`;
                }
                if (path === '/api/v1/ensembles') {
                    operation.description = `List all available ensembles in this Conductor project.

Returns ensembles defined in your \`ensembles/\` directory, including:
- Name and description
- Trigger configuration (HTTP, cron, webhook, etc.)
- Number of flow steps`;
                }
                if (path === '/api/v1/ensembles/{name}') {
                    operation.description = `Get detailed information about a specific ensemble.

Returns:
- Full flow definition (all steps)
- Trigger configurations
- Input/output schemas
- Inline agent definitions`;
                }
            }
        }
        return enhanced;
    }
    /**
     * Infer API tag from ensemble name/description
     */
    inferTag(ensemble) {
        const name = ensemble.name;
        // Common patterns
        if (name.includes('user') || name.includes('auth'))
            return 'User Management';
        if (name.includes('payment') || name.includes('billing'))
            return 'Payments';
        if (name.includes('order'))
            return 'Orders';
        if (name.includes('product'))
            return 'Products';
        if (name.includes('search'))
            return 'Search';
        if (name.includes('notification'))
            return 'Notifications';
        if (name.includes('report'))
            return 'Reports';
        if (name.includes('analytics'))
            return 'Analytics';
        // Default: capitalize first word
        return name.split('-')[0].charAt(0).toUpperCase() + name.split('-')[0].slice(1);
    }
    /**
     * Generate description from ensemble
     */
    generateDescription(ensemble) {
        if (ensemble.description) {
            return ensemble.description;
        }
        // Generate from flow
        if (!ensemble.flow || ensemble.flow.length === 0) {
            return 'No flow steps defined';
        }
        const stepCount = ensemble.flow.length;
        const memberNames = ensemble.flow
            .filter(isAgentStep)
            .map((step) => step.agent)
            .join(', ');
        return `Executes ${stepCount} step${stepCount > 1 ? 's' : ''}: ${memberNames}`;
    }
    /**
     * Generate input schema from ensemble
     */
    generateInputSchema(ensemble) {
        // Analyze flow steps to determine required inputs
        const inputRefs = new Set();
        if (ensemble.flow) {
            for (const step of ensemble.flow) {
                // Only agent steps have input mappings
                if (isAgentStep(step) && step.input) {
                    // Extract input variable references (${input.xxx})
                    const inputStr = JSON.stringify(step.input);
                    const matches = inputStr.matchAll(/\$\{input\.(\w+)\}/g);
                    for (const match of matches) {
                        inputRefs.add(match[1]);
                    }
                }
            }
        }
        const properties = {};
        for (const ref of inputRefs) {
            properties[ref] = {
                type: 'string',
                description: `Input parameter: ${ref}`,
            };
        }
        return {
            type: 'object',
            properties,
            required: Array.from(inputRefs),
        };
    }
    /**
     * Generate output schema from ensemble
     */
    generateOutputSchema(ensemble) {
        if (ensemble.output) {
            // Analyze output mapping
            const properties = {};
            for (const [key, value] of Object.entries(ensemble.output)) {
                properties[key] = {
                    type: typeof value === 'string' ? 'string' : 'object',
                    description: `Output field: ${key}`,
                };
            }
            return {
                type: 'object',
                properties,
            };
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
        };
    }
    /**
     * Get project name from package.json
     */
    async getProjectName() {
        try {
            const pkgPath = path.join(this.projectPath, 'package.json');
            const content = await fs.readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(content);
            return pkg.name || 'Conductor Project';
        }
        catch {
            return 'Conductor Project';
        }
    }
    /**
     * Get project version from package.json
     */
    async getProjectVersion() {
        try {
            const pkgPath = path.join(this.projectPath, 'package.json');
            const content = await fs.readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(content);
            return pkg.version || '1.0.0';
        }
        catch {
            return '1.0.0';
        }
    }
    /**
     * Save OpenAPI spec to file
     */
    async save(spec, outputPath) {
        const content = YAML.stringify(spec);
        await fs.writeFile(outputPath, content, 'utf-8');
    }
}
