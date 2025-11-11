/**
 * PDF Member Types
 *
 * Provides PDF generation from HTML with:
 * - HTML to PDF conversion
 * - R2 storage at configurable paths
 * - Browser display vs download options
 * - Page configuration (size, margins, orientation)
 * - Headers and footers with page numbers
 */
/**
 * PDF page dimensions by size
 */
export const PDF_PAGE_SIZES = {
    A4: { width: 210, height: 297 }, // mm
    A3: { width: 297, height: 420 },
    A5: { width: 148, height: 210 },
    Letter: { width: 216, height: 279 }, // 8.5" x 11"
    Legal: { width: 216, height: 356 }, // 8.5" x 14"
    Tabloid: { width: 279, height: 432 }, // 11" x 17"
};
