/**
 * MJML Template Engine
 *
 * Responsive email framework - converts MJML to HTML
 */
import mjml2html from 'mjml';
import { BaseTemplateEngine } from './base.js';
import { HandlebarsTemplateEngine } from './handlebars.js';
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
     * Render MJML template with context
     * 1. First, render Handlebars variables
     * 2. Then, compile MJML to responsive HTML
     */
    async render(template, context) {
        try {
            // Step 1: Render Handlebars variables in MJML template
            const mjmlWithData = await this.handlebars.render(template, context);
            // Step 2: Compile MJML to HTML
            const result = mjml2html(mjmlWithData, {
                validationLevel: 'soft', // Don't fail on warnings
                minify: false, // Keep readable for development
                beautify: true
            });
            // Check for errors
            if (result.errors && result.errors.length > 0) {
                const errorMessages = result.errors.map((e) => e.formattedMessage || e.message).join(', ');
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
            // First validate Handlebars syntax
            const handlebarsValidation = await this.handlebars.validate(template);
            if (!handlebarsValidation.valid) {
                return handlebarsValidation;
            }
            // Then validate MJML structure (with dummy data for Handlebars vars)
            const testContext = this.createDummyContext(template);
            const mjmlWithData = await this.handlebars.render(template, testContext);
            const result = mjml2html(mjmlWithData, {
                validationLevel: 'strict'
            });
            if (result.errors && result.errors.length > 0) {
                return {
                    valid: false,
                    errors: result.errors.map((e) => e.formattedMessage || e.message)
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)]
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
