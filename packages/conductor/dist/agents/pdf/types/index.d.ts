/**
 * PDF Agent Types
 *
 * Provides PDF generation from HTML with:
 * - HTML to PDF conversion
 * - R2 storage at configurable paths
 * - Browser display vs download options
 * - Page configuration (size, margins, orientation)
 * - Headers and footers with page numbers
 */
import type { TemplateSource } from '../../html/types/index.js';
import type { TemplateEngine } from '../../../utils/templates/index.js';
/**
 * PDF page size presets
 */
export type PdfPageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Tabloid';
/**
 * PDF page orientation
 */
export type PdfOrientation = 'portrait' | 'landscape';
/**
 * PDF delivery mode
 */
export type PdfDeliveryMode = 'inline' | 'attachment';
/**
 * PDF page configuration
 */
export interface PdfPageConfig {
    /** Page size (default: A4) */
    size?: PdfPageSize;
    /** Page orientation (default: portrait) */
    orientation?: PdfOrientation;
    /** Page margins in mm */
    margins?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /** Print background graphics */
    printBackground?: boolean;
    /** Scale factor (0.1 - 2.0) */
    scale?: number;
}
/**
 * PDF header/footer configuration
 */
export interface PdfHeaderFooter {
    /** HTML template for header (supports template variables) */
    header?: string;
    /** HTML template for footer (supports template variables) */
    footer?: string;
    /** Template data for header/footer rendering */
    data?: Record<string, unknown>;
    /** Display header on first page */
    displayHeaderFooter?: boolean;
    /** Height of header in mm */
    headerHeight?: number;
    /** Height of footer in mm */
    footerHeight?: number;
}
/**
 * PDF storage configuration
 */
export interface PdfStorageConfig {
    /** Store to R2 */
    saveToR2?: boolean;
    /** R2 key (default: assets/static/generated-{timestamp}.pdf) */
    r2Key?: string;
    /** R2 bucket binding name (default: ASSETS) */
    r2Binding?: string;
    /** Make R2 object public */
    publicUrl?: boolean;
}
/**
 * PDF metadata
 */
export interface PdfMetadata {
    /** Document title */
    title?: string;
    /** Document author */
    author?: string;
    /** Document subject */
    subject?: string;
    /** Document keywords */
    keywords?: string;
    /** Document creator */
    creator?: string;
    /** Creation date */
    creationDate?: Date;
}
/**
 * PDF agent configuration
 */
export interface PdfMemberConfig {
    /** HTML source for PDF generation */
    html?: {
        /** Inline HTML */
        inline?: string;
        /** Use HTML agent output */
        fromMember?: string;
        /** HTML template source (KV/R2) */
        template?: TemplateSource;
        /** Template data */
        data?: Record<string, unknown>;
    };
    /** Page configuration */
    page?: PdfPageConfig;
    /** Header and footer */
    headerFooter?: PdfHeaderFooter;
    /** Storage configuration */
    storage?: PdfStorageConfig;
    /** PDF metadata */
    metadata?: PdfMetadata;
    /** Delivery mode (inline=display, attachment=download) */
    deliveryMode?: PdfDeliveryMode;
    /** Filename for download (only used with attachment mode) */
    filename?: string;
    /** Template engine for HTML/header/footer rendering (default: 'simple') */
    templateEngine?: TemplateEngine;
}
/**
 * PDF agent input
 */
export interface PdfMemberInput {
    /** Override HTML source */
    html?: {
        inline?: string;
        fromMember?: string;
        template?: TemplateSource;
        data?: Record<string, unknown>;
    };
    /** Override page config */
    page?: PdfPageConfig;
    /** Override header/footer */
    headerFooter?: PdfHeaderFooter;
    /** Override storage config */
    storage?: PdfStorageConfig;
    /** Override metadata */
    metadata?: PdfMetadata;
    /** Override delivery mode */
    deliveryMode?: PdfDeliveryMode;
    /** Override filename */
    filename?: string;
}
/**
 * PDF agent output
 */
export interface PdfMemberOutput {
    /** PDF binary data (ArrayBuffer) */
    pdf: ArrayBuffer;
    /** PDF size in bytes */
    size: number;
    /** R2 URL if stored */
    url?: string;
    /** R2 key if stored */
    r2Key?: string;
    /** Content-Disposition header value */
    contentDisposition: string;
    /** Suggested filename */
    filename: string;
    /** PDF metadata */
    metadata?: {
        /** Generation time in milliseconds */
        generateTime: number;
        /** Page count */
        pageCount?: number;
        /** HTML source size */
        htmlSize: number;
    };
}
/**
 * PDF generation result
 */
export interface PdfGenerationResult {
    /** PDF binary */
    pdf: ArrayBuffer;
    /** Page count */
    pageCount?: number;
    /** Generation time */
    generateTime: number;
}
/**
 * PDF page dimensions by size
 */
export declare const PDF_PAGE_SIZES: Record<PdfPageSize, {
    width: number;
    height: number;
}>;
//# sourceMappingURL=index.d.ts.map