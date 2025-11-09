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
import { BaseMember } from '../../runtime/base-member.js';
import type { MemberExecutionContext, MemberConfig } from '../../runtime/types.js';
import type { PdfMemberOutput } from './types/index.js';
export declare class PdfMember extends BaseMember {
    private config;
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