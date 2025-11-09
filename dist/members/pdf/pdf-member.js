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
import { HtmlMember } from '../html/html-member.js';
import { generatePdf, validatePageConfig } from './utils/pdf-generator.js';
import { storePdfToR2, generateFilename, createContentDisposition, validateStorageConfig } from './utils/storage.js';
export class PdfMember extends BaseMember {
    constructor(config) {
        super(config);
        this.config = config;
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate member configuration
     */
    validateConfig() {
        // Validate page config
        if (this.config.page) {
            const pageValidation = validatePageConfig(this.config.page);
            if (!pageValidation.valid) {
                throw new Error(`Invalid page config: ${pageValidation.errors?.join(', ')}`);
            }
        }
        // Validate storage config
        if (this.config.storage) {
            const storageValidation = validateStorageConfig(this.config.storage);
            if (!storageValidation.valid) {
                throw new Error(`Invalid storage config: ${storageValidation.errors?.join(', ')}`);
            }
        }
    }
    /**
     * Execute PDF generation
     */
    async run(context) {
        const startTime = Date.now();
        const input = context.input;
        // Merge config with input
        const htmlSource = input.html || this.config.html;
        const pageConfig = { ...this.config.page, ...input.page };
        const headerFooter = { ...this.config.headerFooter, ...input.headerFooter };
        const storageConfig = { ...this.config.storage, ...input.storage };
        const metadata = { ...this.config.metadata, ...input.metadata };
        const deliveryMode = input.deliveryMode || this.config.deliveryMode || 'inline';
        const filename = input.filename || this.config.filename;
        // Get HTML content
        let html;
        let htmlSize;
        if (htmlSource?.inline) {
            // Inline HTML
            html = htmlSource.inline;
            htmlSize = html.length;
        }
        else if (htmlSource?.fromMember) {
            // Get HTML from previous member output
            const memberOutput = context.previousOutputs?.[htmlSource.fromMember];
            if (!memberOutput?.output?.html) {
                throw new Error(`Member "${htmlSource.fromMember}" did not produce HTML output. ` +
                    `Make sure it's an HTML member and executed before this PDF member.`);
            }
            html = memberOutput.output.html;
            htmlSize = html.length;
        }
        else if (htmlSource?.template) {
            // Render HTML from template
            const htmlMemberConfig = {
                name: `${this.name}-html-renderer`,
                type: 'HTML',
                template: htmlSource.template,
                renderOptions: {
                    // Don't inline CSS for PDF - browser can handle it
                    inlineCss: false,
                    minify: false
                }
            };
            const htmlMember = new HtmlMember(htmlMemberConfig);
            const htmlContext = {
                input: { data: htmlSource.data || {} },
                env: context.env,
                ctx: context.ctx,
                previousOutputs: context.previousOutputs
            };
            const htmlResponse = await htmlMember.execute(htmlContext);
            if (!htmlResponse.success) {
                throw new Error(`HTML rendering failed: ${htmlResponse.error}`);
            }
            html = htmlResponse.data.html;
            htmlSize = html.length;
        }
        else {
            throw new Error('No HTML source specified. Provide html.inline, html.fromMember, or html.template');
        }
        // Generate PDF
        const pdfResult = await generatePdf({
            html,
            page: pageConfig,
            headerFooter,
            metadata
        }, context.env);
        // Store to R2 if configured
        let r2Key;
        let url;
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
}
