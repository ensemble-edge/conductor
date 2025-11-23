/**
 * PDF Storage Utilities
 *
 * Handles storing PDFs to R2 and generating URLs.
 */
import type { PdfStorageConfig } from '../types/index.js';
/**
 * Store PDF to R2
 */
export declare function storePdfToR2(pdf: ArrayBuffer, config: PdfStorageConfig, env: any): Promise<{
    r2Key: string;
    url?: string;
}>;
/**
 * Generate default R2 key
 */
export declare function generateDefaultR2Key(): string;
/**
 * Generate filename from R2 key or config
 */
export declare function generateFilename(r2Key?: string, configFilename?: string, fallback?: string): string;
/**
 * Create Content-Disposition header
 */
export declare function createContentDisposition(mode: 'inline' | 'attachment', filename: string): string;
/**
 * Validate storage configuration
 */
export declare function validateStorageConfig(config?: PdfStorageConfig): {
    valid: boolean;
    errors?: string[];
};
//# sourceMappingURL=storage.d.ts.map