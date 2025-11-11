/**
 * MJML Template Engine
 *
 * Responsive email framework - converts MJML to HTML
 *
 * Note: MJML has Node.js dependencies that may not work in all test environments.
 * In production Cloudflare Workers, this should work fine.
 */
import { BaseTemplateEngine } from './base.js';
import { HandlebarsTemplateEngine } from './handlebars.js';
// Lazy load MJML to handle environments where it's not available
let mjml2html = null;
let mjmlLoadAttempted = false;
/**
 * MJML template engine
 * Combines MJML's responsive email capabilities with Handlebars for dynamic content
 */
export class MJMLTemplateEngine extends BaseTemplateEngine {
    constructor() {
        super();
        this.name = 'mjml';
        // Use Handlebars for variable interpolation within MJML
        this.handlebars = new HandlebarsTemplateEngine();
    }
    /**
     * Lazy load MJML module
     */
    async loadMjml() {
        if (mjmlLoadAttempted) {
            if (!mjml2html) {
                throw new Error('MJML template engine is not available in this environment. ' +
                    'This is typically a test environment limitation due to Node.js dependencies. ' +
                    'MJML works fine in production Cloudflare Workers.');
            }
            return;
        }
        mjmlLoadAttempted = true;
        try {
            const mjmlModule = await import('mjml');
            mjml2html = mjmlModule.default;
        }
        catch (error) {
            // MJML not available - will throw error on render attempt
            mjml2html = null;
            throw new Error('MJML template engine is not available in this environment. ' +
                'This is typically a test environment limitation due to Node.js dependencies. ' +
                'MJML works fine in production Cloudflare Workers.');
        }
    }
    /**
     * Render MJML template with context
     * 1. First, render Handlebars variables
     * 2. Then, compile MJML to responsive HTML
     */
    async render(template, context) {
        // Lazy load MJML on first use
        await this.loadMjml();
        try {
            // Step 1: Render Handlebars variables in MJML template
            const mjmlWithData = await this.handlebars.render(template, context);
            // Step 2: Compile MJML to HTML
            const result = mjml2html(mjmlWithData, {
                validationLevel: 'soft', // Don't fail on warnings
                minify: false, // Keep readable for development
                beautify: true,
            });
            // Check for errors
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors
                    .map((e) => e.formattedMessage || e.message)
                    .join(', ');
                throw new Error(`MJML compilation errors: ${errorMessages}`);
            }
            return result.html;
        }
        catch (error) {
            throw new Error(`MJML render error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate MJML template syntax
     */
    async validate(template) {
        try {
            // Lazy load MJML
            await this.loadMjml();
            // First validate Handlebars syntax
            const handlebarsValidation = await this.handlebars.validate(template);
            if (!handlebarsValidation.valid) {
                return handlebarsValidation;
            }
            // Then validate MJML structure (with dummy data for Handlebars vars)
            const testContext = this.createDummyContext(template);
            const mjmlWithData = await this.handlebars.render(template, testContext);
            const result = mjml2html(mjmlWithData, {
                validationLevel: 'strict',
            });
            if (result.errors && result.errors.length > 0) {
                return {
                    valid: false,
                    errors: result.errors.map((e) => e.formattedMessage || e.message),
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    /**
     * Register a Handlebars helper
     */
    registerHelper(name, fn) {
        this.handlebars.registerHelper(name, fn);
    }
    /**
     * Register a Handlebars partial
     */
    registerPartial(name, template) {
        this.handlebars.registerPartial(name, template);
    }
    /**
     * Create dummy context for validation
     * Extracts variable names from template and provides dummy values
     */
    createDummyContext(template) {
        const context = {};
        // Find all {{variable}} patterns
        const varRegex = /\{\{([^}#/]+)\}\}/g;
        let match;
        while ((match = varRegex.exec(template)) !== null) {
            const varName = match[1].trim();
            // Skip Handlebars helpers and keywords
            if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('!')) {
                // Handle nested variables (e.g., user.name)
                const parts = varName.split('.');
                let current = context;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i === parts.length - 1) {
                        // Last part, assign dummy value
                        current[part] = 'test';
                    }
                    else {
                        // Create nested object
                        current[part] = current[part] || {};
                        current = current[part];
                    }
                }
            }
        }
        return context;
    }
    /**
     * Clear cache (delegate to Handlebars)
     */
    clearCache() {
        this.handlebars.clearCache();
    }
}
