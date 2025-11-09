/**
 * Docs Member
 *
 * Auto-generate and serve API documentation with:
 * - OpenAPI spec generation
 * - Interactive docs UI (Stoplight, Redoc, Swagger, etc.)
 * - AI-enhanced descriptions
 * - Multiple output formats (YAML, JSON, HTML)
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { DocsMemberOutput } from './types/index.js';
export declare class DocsMember extends BaseMember {
    private docsConfig;
    constructor(config: MemberConfig);
    /**
     * Execute docs generation/serving
     */
    protected run(context: MemberExecutionContext): Promise<DocsMemberOutput>;
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
     * Auto-generate OpenAPI spec from ensembles/members
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
//# sourceMappingURL=docs-member.d.ts.map