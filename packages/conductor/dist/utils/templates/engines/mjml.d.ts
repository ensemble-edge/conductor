/**
 * MJML Template Engine
 *
 * Responsive email framework - converts MJML to HTML
 *
 * Note: MJML has Node.js dependencies that may not work in all test environments.
 * In production Cloudflare Workers, this should work fine.
 */
import type { TemplateContext } from '../types.js';
import { BaseTemplateEngine } from './base.js';
/**
 * MJML template engine
 * Combines MJML's responsive email capabilities with Handlebars for dynamic content
 */
export declare class MJMLTemplateEngine extends BaseTemplateEngine {
    name: string;
    private handlebars;
    constructor();
    /**
     * Lazy load MJML module
     */
    private loadMjml;
    /**
     * Render MJML template with context
     * 1. First, render Handlebars variables
     * 2. Then, compile MJML to responsive HTML
     */
    render(template: string, context: TemplateContext): Promise<string>;
    /**
     * Validate MJML template syntax
     */
    validate(template: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Register a Handlebars helper
     * Uses Handlebars.HelperDelegate signature for type safety
     */
    registerHelper(name: string, fn: import('handlebars').HelperDelegate): void;
    /**
     * Register a Handlebars partial
     */
    registerPartial(name: string, template: string): void;
    /**
     * Create dummy context for validation
     * Extracts variable names from template and provides dummy values
     */
    private createDummyContext;
    /**
     * Clear cache (delegate to Handlebars)
     */
    clearCache(): void;
}
//# sourceMappingURL=mjml.d.ts.map