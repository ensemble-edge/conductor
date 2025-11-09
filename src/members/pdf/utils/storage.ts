/**
 * PDF Storage Utilities
 *
 * Handles storing PDFs to R2 and generating URLs.
 */

import type { PdfStorageConfig } from '../types/index.js';

/**
 * Store PDF to R2
 */
export async function storePdfToR2(
  pdf: ArrayBuffer,
  config: PdfStorageConfig,
  env: any
): Promise<{ r2Key: string; url?: string }> {
  const r2BindingName = config.r2Binding || 'ASSETS';
  const bucket = env[r2BindingName] as R2Bucket;

  if (!bucket) {
    throw new Error(`R2 bucket binding "${r2BindingName}" not found in environment`);
  }

  // Generate R2 key
  const r2Key = config.r2Key || generateDefaultR2Key();

  // Store to R2
  await bucket.put(r2Key, pdf, {
    httpMetadata: {
      contentType: 'application/pdf'
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      generatedBy: 'conductor-pdf-member'
    }
  });

  // Generate public URL if requested
  let url: string | undefined;
  if (config.publicUrl) {
    // Cloudflare R2 public URL format
    // Assumes R2 bucket has public access configured
    url = `/assets/static/${r2Key.split('/').pop()}`;
  }

  return { r2Key, url };
}

/**
 * Generate default R2 key
 */
export function generateDefaultR2Key(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `static/generated-${timestamp}-${random}.pdf`;
}

/**
 * Generate filename from R2 key or config
 */
export function generateFilename(
  r2Key?: string,
  configFilename?: string,
  fallback: string = 'document.pdf'
): string {
  if (configFilename) {
    // Ensure .pdf extension
    return configFilename.endsWith('.pdf') ? configFilename : `${configFilename}.pdf`;
  }

  if (r2Key) {
    // Extract filename from R2 key
    const parts = r2Key.split('/');
    const filename = parts[parts.length - 1];
    return filename || fallback;
  }

  return fallback;
}

/**
 * Create Content-Disposition header
 */
export function createContentDisposition(
  mode: 'inline' | 'attachment',
  filename: string
): string {
  // Sanitize filename
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (mode === 'attachment') {
    return `attachment; filename="${safeFilename}"`;
  }

  return `inline; filename="${safeFilename}"`;
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(
  config?: PdfStorageConfig
): { valid: boolean; errors?: string[] } {
  if (!config || !config.saveToR2) {
    return { valid: true };
  }

  const errors: string[] = [];

  if (config.r2Key) {
    // Validate R2 key format
    if (config.r2Key.includes('..')) {
      errors.push('R2 key cannot contain ".."');
    }
    if (config.r2Key.startsWith('/')) {
      errors.push('R2 key should not start with "/"');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
