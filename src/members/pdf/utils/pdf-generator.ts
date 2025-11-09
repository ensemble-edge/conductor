/**
 * PDF Generator
 *
 * Generates PDFs from HTML using Cloudflare Browser Rendering API.
 * Falls back to a simple implementation if Browser API is not available.
 */

import type {
  PdfPageConfig,
  PdfHeaderFooter,
  PdfMetadata,
  PdfGenerationResult,
  PdfPageSize
} from '../types/index.js';

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
export async function generatePdf(
  options: PdfGenerateOptions,
  env?: { BROWSER?: any }
): Promise<PdfGenerationResult> {
  const startTime = Date.now();

  // Try Cloudflare Browser Rendering API first
  if (env?.BROWSER) {
    return await generatePdfWithBrowser(options, env.BROWSER);
  }

  // Fallback to basic implementation
  return await generatePdfBasic(options);
}

/**
 * Generate PDF using Cloudflare Browser Rendering API
 */
async function generatePdfWithBrowser(
  options: PdfGenerateOptions,
  browser: any
): Promise<PdfGenerationResult> {
  const startTime = Date.now();

  // Launch browser session
  const session = await browser.newSession();

  try {
    // Navigate to data URL with HTML
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(options.html)}`;
    await session.goto(dataUrl, { waitUntil: 'networkidle' });

    // Build PDF options
    const pdfOptions: any = {
      format: options.page?.size || 'A4',
      landscape: options.page?.orientation === 'landscape',
      printBackground: options.page?.printBackground !== false,
      margin: {
        top: `${options.page?.margins?.top || 10}mm`,
        right: `${options.page?.margins?.right || 10}mm`,
        bottom: `${options.page?.margins?.bottom || 10}mm`,
        left: `${options.page?.margins?.left || 10}mm`
      }
    };

    // Add header/footer if configured
    if (options.headerFooter?.displayHeaderFooter) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = options.headerFooter.header || '';
      pdfOptions.footerTemplate = options.headerFooter.footer || '';
    }

    // Add scale if configured
    if (options.page?.scale) {
      pdfOptions.scale = options.page.scale;
    }

    // Generate PDF
    const pdfBuffer = await session.pdf(pdfOptions);

    return {
      pdf: pdfBuffer,
      generateTime: Date.now() - startTime
    };
  } finally {
    // Close browser session
    await session.close();
  }
}

/**
 * Basic PDF generation (fallback)
 * Creates a minimal PDF structure
 */
async function generatePdfBasic(options: PdfGenerateOptions): Promise<PdfGenerationResult> {
  const startTime = Date.now();

  // This is a very basic PDF generation for development/testing
  // In production, Browser Rendering API should be used
  const pdfContent = createBasicPdf(options);
  const encoder = new TextEncoder();
  const pdfBuffer = encoder.encode(pdfContent);

  return {
    pdf: pdfBuffer.buffer,
    generateTime: Date.now() - startTime
  };
}

/**
 * Create a basic PDF structure (for fallback only)
 * This creates a minimal valid PDF with the HTML rendered as text
 */
function createBasicPdf(options: PdfGenerateOptions): string {
  const title = options.metadata?.title || 'Document';
  const author = options.metadata?.author || 'Conductor';
  const creationDate = options.metadata?.creationDate || new Date();

  // Strip HTML tags for text content
  const textContent = options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Basic PDF structure
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Metadata 3 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [4 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Metadata
/Subtype /XML
/Length 0
>>
stream
endstream
endobj

4 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 5 0 R
/Resources <<
/Font <<
/F1 6 0 R
>>
>>
>>
endobj

5 0 obj
<<
/Length ${textContent.length + 50}
>>
stream
BT
/F1 12 Tf
50 800 Td
(${title}) Tj
0 -20 Td
(${textContent.substring(0, 500)}) Tj
ET
endstream
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000131 00000 n
0000000229 00000 n
0000000379 00000 n
0000000${(500 + textContent.length).toString().padStart(3, '0')} 00000 n
trailer
<<
/Size 7
/Root 1 0 R
/Info <<
/Title (${title})
/Author (${author})
/CreationDate (D:${formatPdfDate(creationDate)})
>>
>>
startxref
${(550 + textContent.length).toString()}
%%EOF`;
}

/**
 * Format date for PDF
 */
function formatPdfDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Validate page configuration
 */
export function validatePageConfig(page?: PdfPageConfig): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (page?.scale && (page.scale < 0.1 || page.scale > 2.0)) {
    errors.push('Scale must be between 0.1 and 2.0');
  }

  if (page?.margins) {
    const { top, right, bottom, left } = page.margins;
    if (top && top < 0) errors.push('Top margin cannot be negative');
    if (right && right < 0) errors.push('Right margin cannot be negative');
    if (bottom && bottom < 0) errors.push('Bottom margin cannot be negative');
    if (left && left < 0) errors.push('Left margin cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Create default header template with page numbers
 */
export function createDefaultHeader(title?: string): string {
  return `
    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 10mm;">
      <span>${title || 'Document'}</span>
    </div>
  `;
}

/**
 * Create default footer template with page numbers
 */
export function createDefaultFooter(): string {
  return `
    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 10mm;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `;
}
