/**
 * OpenAPI Documentation Generator
 *
 * Automatically generates OpenAPI 3.0 documentation from Conductor projects.
 * Supports both basic (automatic) and advanced (AI-powered) modes.
 */
export interface OpenAPISpec {
    openapi: string;
    info: OpenAPIInfo;
    servers?: OpenAPIServer[];
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, Schema>;
        securitySchemes?: Record<string, SecurityScheme>;
    };
    tags?: Tag[];
}
export interface OpenAPIInfo {
    title: string;
    version: string;
    description?: string;
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
}
export interface OpenAPIServer {
    url: string;
    description?: string;
}
export interface PathItem {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
    patch?: Operation;
}
export interface Operation {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    parameters?: Parameter[];
}
export interface RequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, MediaType>;
}
export interface Response {
    description: string;
    content?: Record<string, MediaType>;
}
export interface MediaType {
    schema: Schema;
    example?: unknown;
    examples?: Record<string, Example>;
}
export interface Schema {
    type?: string;
    properties?: Record<string, Schema>;
    required?: string[];
    items?: Schema;
    description?: string;
    example?: unknown;
    additionalProperties?: boolean | Schema;
    enum?: unknown[];
    format?: string;
}
export interface Parameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    schema: Schema;
}
export interface Example {
    summary?: string;
    description?: string;
    value: unknown;
}
export interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
}
export interface Tag {
    name: string;
    description?: string;
}
export interface GeneratorOptions {
    projectPath: string;
    outputPath?: string;
    useAI?: boolean;
    aiAgent?: string;
}
/**
 * OpenAPI Documentation Generator
 */
export declare class OpenAPIGenerator {
    private projectPath;
    private parser;
    private ensembles;
    private agents;
    constructor(projectPath: string);
    /**
     * Generate OpenAPI documentation
     */
    generate(options: GeneratorOptions): Promise<OpenAPISpec>;
    /**
     * Load project catalog (ensembles and agents)
     */
    private loadCatalog;
    /**
     * Generate base OpenAPI spec from catalog
     */
    private generateBaseSpec;
    /**
     * Enhance documentation with AI
     */
    private enhanceWithAI;
    /**
     * Infer API tag from ensemble name/description
     */
    private inferTag;
    /**
     * Generate description from ensemble
     */
    private generateDescription;
    /**
     * Generate input schema from ensemble
     */
    private generateInputSchema;
    /**
     * Generate output schema from ensemble
     */
    private generateOutputSchema;
    /**
     * Get project name from package.json
     */
    private getProjectName;
    /**
     * Get project version from package.json
     */
    private getProjectVersion;
    /**
     * Save OpenAPI spec to file
     */
    save(spec: OpenAPISpec, outputPath: string): Promise<void>;
}
//# sourceMappingURL=openapi-generator.d.ts.map