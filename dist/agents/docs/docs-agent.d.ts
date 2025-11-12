/**
 * Docs Agent
 *
 * Auto-generate and serve API documentation with:
 * - OpenAPI spec generation
 * - Interactive docs UI (Stoplight, Redoc, Swagger, etc.)
 * - AI-enhanced descriptions
 * - Multiple output formats (YAML, JSON, HTML)
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { DocsMemberOutput } from './types/index.js';
export declare class DocsMember extends BaseAgent {
    private docsConfig;
    constructor(config: AgentConfig);
    /**
     * Execute docs generation/serving
     */
    protected run(context: AgentExecutionContext): Promise<DocsMemberOutput>;
    /**
     * Serve interactive docs UI
     */
    private serveDocsUI;
    /**
     * Serve OpenAPI spec
     */
    private serveSpec;
    /**
     * Generate OpenAPI specification
     */
    private generateSpec;
    /**
     * Auto-generate OpenAPI spec from ensembles/agents
     */
    private autoGenerateSpec;
    /**
     * Generate Stoplight Elements UI
     */
    private generateStoplightUI;
    /**
     * Generate Redoc UI
     */
    private generateRedocUI;
    /**
     * Generate Swagger UI
     */
    private generateSwaggerUI;
    /**
     * Generate Scalar UI
     */
    private generateScalarUI;
    /**
     * Generate RapiDoc UI
     */
    private generateRapidocUI;
    /**
     * Check cache
     */
    private checkCache;
    /**
     * Cache output
     */
    private cacheOutput;
}
//# sourceMappingURL=docs-agent.d.ts.map