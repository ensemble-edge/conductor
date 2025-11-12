/**
 * PDF Agent
 *
 * Generates PDFs from HTML with support for:
 * - Cloudflare Browser Rendering API
 * - R2 storage with configurable paths
 * - Browser display (inline) or download (attachment)
 * - Page configuration (size, margins, orientation)
 * - Headers and footers with page numbers
 * - PDF metadata
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { PdfMemberOutput } from './types/index.js';
export declare class PdfMember extends BaseAgent {
    private pdfConfig;
    private templateEngine;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute PDF generation
     */
    protected run(context: AgentExecutionContext): Promise<PdfMemberOutput>;
    /**
     * Render header/footer templates with template engine
     */
    private renderHeaderFooter;
}
//# sourceMappingURL=pdf-agent.d.ts.map