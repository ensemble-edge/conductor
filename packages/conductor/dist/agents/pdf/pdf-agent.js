/**
 * PDF Agent
 *
 * Generates PDFs from HTML with support for:
 * - Cloudflare Browser Rendering API
 * - R2 storage with configurable paths
 * - Browser display (inline) or download (attachment)
 * - Page configuration (size, margins, orientation)
 * - Headers and footers with page numbers
 * - PDF metadata
 */
import { BaseAgent } from '../base-agent.js';
import { Operation } from '../../types/constants.js';
import { HtmlMember } from '../html/html-agent.js';
import { generatePdf, validatePageConfig } from './utils/pdf-generator.js';
import { storePdfToR2, generateFilename, createContentDisposition, validateStorageConfig, } from './utils/storage.js';
import { createTemplateEngine } from '../../utils/templates/index.js';
export class PdfMember extends BaseAgent {
    constructor(config) {
        super(config);
        // Extract nested config (config.config contains the agent-specific settings)
        this.pdfConfig = (config.config || {});
        // Initialize template engine (default to 'simple')
        const engine = this.pdfConfig.templateEngine || 'simple';
        this.templateEngine = createTemplateEngine(engine);
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate agent configuration
     */
    validateConfig() {
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
    async run(context) {
        const startTime = Date.now();
        const input = context.input;
        // Merge config with input
        const htmlSource = input.html || this.pdfConfig.html;
        const pageConfig = { ...this.pdfConfig.page, ...input.page };
        const headerFooter = { ...this.pdfConfig.headerFooter, ...input.headerFooter };
        const storageConfig = { ...this.pdfConfig.storage, ...input.storage };
        const metadata = { ...this.pdfConfig.metadata, ...input.metadata };
        const deliveryMode = input.deliveryMode || this.pdfConfig.deliveryMode || 'inline';
        const filename = input.filename || this.pdfConfig.filename;
        // Get HTML content
        let html;
        let htmlSize;
        if (htmlSource?.inline) {
            // Inline HTML
            html = htmlSource.inline;
            htmlSize = html.length;
        }
        else if (htmlSource?.fromMember) {
            // Get HTML from previous agent output
            const memberOutput = context.previousOutputs?.[htmlSource.fromMember];
            if (!memberOutput?.output?.html) {
                throw new Error(`Agent "${htmlSource.fromMember}" did not produce HTML output. ` +
                    `Make sure it's an HTML agent and executed before this PDF agent.`);
            }
            html = memberOutput.output.html;
            htmlSize = html.length;
        }
        else if (htmlSource?.template) {
            // Render HTML from template
            const htmlMemberConfig = {
                name: `${this.name}-html-renderer`,
                operation: Operation.html,
                config: {
                    template: htmlSource.template,
                    templateEngine: this.pdfConfig.templateEngine || 'simple',
                    renderOptions: {
                        // Don't inline CSS for PDF - browser can handle it
                        inlineCss: false,
                        minify: false,
                    },
                },
            };
            const htmlMember = new HtmlMember(htmlMemberConfig);
            const htmlContext = {
                input: { data: htmlSource.data || {} },
                env: context.env,
                ctx: context.ctx,
                previousOutputs: context.previousOutputs,
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
        // Render header/footer templates if they contain variables
        const renderedHeaderFooter = await this.renderHeaderFooter(headerFooter);
        // Generate PDF
        const pdfResult = await generatePdf({
            html,
            page: pageConfig,
            headerFooter: renderedHeaderFooter,
            metadata,
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
                htmlSize,
            },
        };
    }
    /**
     * Render header/footer templates with template engine
     */
    async renderHeaderFooter(headerFooter) {
        if (!headerFooter) {
            return undefined;
        }
        const data = headerFooter.data || {};
        const rendered = { ...headerFooter };
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
