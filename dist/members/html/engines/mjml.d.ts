/**
 * MJML Template Engine
 *
 * Responsive email framework - converts MJML to HTML
 */
import type { TemplateContext } from '../types/index.js';
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
     */
    registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
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