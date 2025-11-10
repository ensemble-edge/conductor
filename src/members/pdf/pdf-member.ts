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
import type {
  PdfMemberConfig,
  PdfMemberInput,
  PdfMemberOutput
} from './types/index.js';
import { HtmlMember } from '../html/html-member.js';
import { generatePdf, validatePageConfig } from './utils/pdf-generator.js';
import {
  storePdfToR2,
  generateFilename,
  createContentDisposition,
  validateStorageConfig
} from './utils/storage.js';
import { createTemplateEngine, type BaseTemplateEngine } from '../../utils/templates/index.js';

export class PdfMember extends BaseMember {
  private pdfConfig: PdfMemberConfig;
  private templateEngine: BaseTemplateEngine;

  constructor(config: MemberConfig) {
    super(config);
    this.pdfConfig = config as MemberConfig & PdfMemberConfig;

    // Initialize template engine (default to 'simple')
    const engine = this.pdfConfig.templateEngine || 'simple';
    this.templateEngine = createTemplateEngine(engine);

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate member configuration
   */
  private validateConfig(): void {
    // Validate page config
    if (this.pdfConfig.page) {
      const pageValidation = validatePageConfig(this.pdfConfig.page);
      if (!pageValidation.valid) {
        throw new Error(`Invalid page config: ${pageValidation.errors?.join(', ')}`);
      }
    }

    // Validate storage config
    if (this.pdfConfig.storage) {
      const storageValidation = validateStorageConfig(this.pdfConfig.storage);
      if (!storageValidation.valid) {
        throw new Error(`Invalid storage config: ${storageValidation.errors?.join(', ')}`);
      }
    }
  }

  /**
   * Execute PDF generation
   */
  protected async run(context: MemberExecutionContext): Promise<PdfMemberOutput> {
    const startTime = Date.now();
    const input = context.input as PdfMemberInput;

    // Merge config with input
    const htmlSource = input.html || this.pdfConfig.html;
    const pageConfig = { ...this.pdfConfig.page, ...input.page };
    const headerFooter = { ...this.pdfConfig.headerFooter, ...input.headerFooter };
    const storageConfig = { ...this.pdfConfig.storage, ...input.storage };
    const metadata = { ...this.pdfConfig.metadata, ...input.metadata };
    const deliveryMode = input.deliveryMode || this.pdfConfig.deliveryMode || 'inline';
    const filename = input.filename || this.pdfConfig.filename;

    // Get HTML content
    let html: string;
    let htmlSize: number;

    if (htmlSource?.inline) {
      // Inline HTML
      html = htmlSource.inline;
      htmlSize = html.length;
    } else if (htmlSource?.fromMember) {
      // Get HTML from previous member output
      const memberOutput = context.previousOutputs?.[htmlSource.fromMember] as any;
      if (!memberOutput?.output?.html) {
        throw new Error(
          `Member "${htmlSource.fromMember}" did not produce HTML output. ` +
            `Make sure it's an HTML member and executed before this PDF member.`
        );
      }
      html = memberOutput.output.html;
      htmlSize = html.length;
    } else if (htmlSource?.template) {
      // Render HTML from template
      const htmlMemberConfig: MemberConfig = {
        name: `${this.name}-html-renderer`,
        type: 'HTML',
        template: htmlSource.template,
        config: {
          templateEngine: this.pdfConfig.templateEngine || 'simple'
        },
        renderOptions: {
          // Don't inline CSS for PDF - browser can handle it
          inlineCss: false,
          minify: false
        }
      };

      const htmlMember = new HtmlMember(htmlMemberConfig);
      const htmlContext: MemberExecutionContext = {
        input: { data: htmlSource.data || {} },
        env: context.env,
        ctx: context.ctx,
        previousOutputs: context.previousOutputs
      };

      const htmlResponse = await htmlMember.execute(htmlContext);

      if (!htmlResponse.success) {
        throw new Error(`HTML rendering failed: ${htmlResponse.error}`);
      }

      html = (htmlResponse.data as any).html;
      htmlSize = html.length;
    } else {
      throw new Error(
        'No HTML source specified. Provide html.inline, html.fromMember, or html.template'
      );
    }

    // Render header/footer templates if they contain variables
    const renderedHeaderFooter = await this.renderHeaderFooter(headerFooter);

    // Generate PDF
    const pdfResult = await generatePdf(
      {
        html,
        page: pageConfig,
        headerFooter: renderedHeaderFooter,
        metadata
      },
      context.env
    );

    // Store to R2 if configured
    let r2Key: string | undefined;
    let url: string | undefined;

    if (storageConfig?.saveToR2) {
      const storageResult = await storePdfToR2(pdfResult.pdf, storageConfig, context.env);
      r2Key = storageResult.r2Key;
      url = storageResult.url;
    }

    // Generate filename
    const finalFilename = generateFilename(r2Key, filename, 'document.pdf');

    // Create Content-Disposition header
    const contentDisposition = createContentDisposition(deliveryMode, finalFilename);

    return {
      pdf: pdfResult.pdf,
      size: pdfResult.pdf.byteLength,
      url,
      r2Key,
      contentDisposition,
      filename: finalFilename,
      metadata: {
        generateTime: Date.now() - startTime,
        pageCount: pdfResult.pageCount,
        htmlSize
      }
    };
  }

  /**
   * Render header/footer templates with template engine
   */
  private async renderHeaderFooter(
    headerFooter?: PdfHeaderFooter
  ): Promise<PdfHeaderFooter | undefined> {
    if (!headerFooter) {
      return undefined;
    }

    const data = headerFooter.data || {};
    const rendered: PdfHeaderFooter = { ...headerFooter };

    // Render header template if it exists
    if (headerFooter.header) {
      rendered.header = await this.templateEngine.render(headerFooter.header, data);
    }

    // Render footer template if it exists
    if (headerFooter.footer) {
      rendered.footer = await this.templateEngine.render(headerFooter.footer, data);
    }

    return rendered;
  }
}
