/**
 * PDF Member - Public API
 *
 * PDF generation from HTML with R2 storage.
 */
export { PdfMember } from './pdf-member.js';
export type { PdfMemberConfig, PdfMemberInput, PdfMemberOutput, PdfPageConfig, PdfPageSize, PdfOrientation, PdfDeliveryMode, PdfHeaderFooter, PdfStorageConfig, PdfMetadata, PdfGenerationResult } from './types/index.js';
export { generatePdf, validatePageConfig, createDefaultHeader, createDefaultFooter } from './utils/pdf-generator.js';
export { storePdfToR2, generateFilename, createContentDisposition } from './utils/storage.js';
export { PDF_PAGE_SIZES } from './types/index.js';
//# sourceMappingURL=index.d.ts.map