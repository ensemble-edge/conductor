/**
 * PDF Generator
 *
 * Generates PDFs from HTML using Cloudflare Browser Rendering API.
 * Falls back to a simple implementation if Browser API is not available.
 */
import type { PdfPageConfig, PdfHeaderFooter, PdfMetadata, PdfGenerationResult } from '../types/index.js';
/**
 * PDF generation options
 */
export interface PdfGenerateOptions {
    html: string;
    page?: PdfPageConfig;
    headerFooter?: PdfHeaderFooter;
    metadata?: PdfMetadata;
}
/**
 * Generate PDF from HTML
 */
export declare function generatePdf(options: PdfGenerateOptions, env?: {
    BROWSER?: any;
}): Promise<PdfGenerationResult>;
/**
 * Validate page configuration
 */
export declare function validatePageConfig(page?: PdfPageConfig): {
    valid: boolean;
    errors?: string[];
};
/**
 * Create default header template with page numbers
 */
export declare function createDefaultHeader(title?: string): string;
/**
 * Create default footer template with page numbers
 */
export declare function createDefaultFooter(): string;
//# sourceMappingURL=pdf-generator.d.ts.map