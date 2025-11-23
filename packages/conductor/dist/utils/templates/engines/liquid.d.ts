/**
 * Liquid Template Engine
 *
 * Shopify's Liquid templating with powerful filters and safe execution
 */
import type { TemplateContext } from '../types.js';
import { BaseTemplateEngine } from './base.js';
/**
 * Liquid template engine
 */
export declare class LiquidTemplateEngine extends BaseTemplateEngine {
    name: string;
    private liquid;
    private compiledTemplates;
    constructor();
    /**
     * Render a template with Liquid
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
    compile(template: string): Promise<any>;
    /**
     * Register a helper function (Liquid calls them filters)
     */
    registerHelper(name: string, fn: (...args: unknown[]) => unknown): void;
    /**
     * Register default filters
     */
    private registerDefaultFilters;
    /**
     * Clear the template cache
     */
    clearCache(): void;
}
//# sourceMappingURL=liquid.d.ts.map