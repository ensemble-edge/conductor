/**
 * OpenAPI Documentation Generator
 *
 * Automatically generates OpenAPI 3.0 documentation from Conductor projects.
 * Supports both basic (automatic) and advanced (AI-powered) modes.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { Parser } from '../runtime/parser.js';
import YAML from 'yaml';
/**
 * OpenAPI Documentation Generator
 */
export class OpenAPIGenerator {
    constructor(projectPath) {
        this.ensembles = new Map();
        this.members = new Map();
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
            return await this.enhanceWithAI(spec, options.aiMember);
        }
        return spec;
    }
    /**
     * Load project catalog (ensembles and members)
     */
    async loadCatalog() {
        // Load ensembles
        const ensemblesPath = path.join(this.projectPath, 'ensembles');
        try {
            const files = await fs.readdir(ensemblesPath);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const filePath = path.join(ensemblesPath, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const ensemble = YAML.parse(content);
                    this.ensembles.set(ensemble.name, ensemble);
                }
            }
        }
        catch (error) {
            // Ensembles directory might not exist
        }
        // Load members
        const membersPath = path.join(this.projectPath, 'members');
        try {
            const dirs = await fs.readdir(membersPath, { withFileTypes: true });
            for (const dir of dirs) {
                if (dir.isDirectory()) {
                    const memberYamlPath = path.join(membersPath, dir.name, 'member.yaml');
                    try {
                        const content = await fs.readFile(memberYamlPath, 'utf-8');
                        const member = YAML.parse(content);
                        this.members.set(member.name, member);
                    }
                    catch {
                        // Member might not have member.yaml
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
    async enhanceWithAI(spec, aiMember) {
        // TODO: Call AI member to enhance descriptions, examples, etc.
        // This will be implemented with the docs-writer member
        console.log('AI enhancement not yet implemented');
        return spec;
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
        const stepCount = ensemble.flow.length;
        const memberNames = ensemble.flow.map((step) => step.member).join(', ');
        return `Executes ${stepCount} step${stepCount > 1 ? 's' : ''}: ${memberNames}`;
    }
    /**
     * Generate input schema from ensemble
     */
    generateInputSchema(ensemble) {
        // Analyze flow steps to determine required inputs
        const inputRefs = new Set();
        for (const step of ensemble.flow) {
            if (step.input) {
                // Extract input variable references (${input.xxx})
                const inputStr = JSON.stringify(step.input);
                const matches = inputStr.matchAll(/\$\{input\.(\w+)\}/g);
                for (const match of matches) {
                    inputRefs.add(match[1]);
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
