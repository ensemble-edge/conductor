/**
 * PDF Member
 *
 * Generates PDFs from HTML with support for:
 * - Cloudflare Browser Rendering API
 * - R2 storage with configurable paths
 * - Browser display (inline) or download (attachment)
 * - Page configuration (size, margins, orientation)
 * - Headers and footers with page numbers
 * - PDF metadata
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { PdfMemberOutput } from './types/index.js';
export declare class PdfMember extends BaseMember {
    private pdfConfig;
    constructor(config: MemberConfig);
    /**
     * Validate member configuration
     */
    private validateConfig;
    /**
     * Execute PDF generation
     */
    protected run(context: MemberExecutionContext): Promise<PdfMemberOutput>;
}
//# sourceMappingURL=pdf-member.d.ts.map