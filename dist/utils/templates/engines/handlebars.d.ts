/**
 * Handlebars Template Engine
 *
 * Full-featured Handlebars template rendering with support for helpers, partials, and all Handlebars features.
 */
import * as Handlebars from 'handlebars';
import type { TemplateContext } from '../types.js';
import { BaseTemplateEngine } from './base.js';
/**
 * Handlebars template engine
 */
export declare class HandlebarsTemplateEngine extends BaseTemplateEngine {
    name: string;
    private handlebars;
    private compiledTemplates;
    constructor();
    /**
     * Render a template with Handlebars
     */
    render(template: string, context: TemplateContext): Promise<string>;
    /**
     * Validate template syntax
     */
    validate(template: string): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Compile a template for repeated use
     */
    compile(template: string): Promise<HandlebarsTemplateDelegate>;
    /**
     * Register a helper function
     */
    registerHelper(name: string, fn: Handlebars.HelperDelegate): void;
    /**
     * Register a partial template
     */
    registerPartial(name: string, template: string): void;
    /**
     * Register default helpers
     */
    private registerDefaultHelpers;
    /**
     * Clear the template cache
     */
    clearCache(): void;
}
//# sourceMappingURL=handlebars.d.ts.map