/**
 * Template Registry
 *
 * Provides typed access to HTML/Handlebars templates from KV storage.
 * Templates support versioning and can be rendered with variables.
 *
 * @module components/templates
 */
import type { ComponentRegistry } from './registry.js';
/**
 * HTML/Handlebars template loaded from KV
 */
export interface Template {
    /** Raw template content (HTML/Handlebars) */
    content: string;
    /** Template engine to use */
    engine?: 'handlebars' | 'html' | 'liquid';
    /** Optional description */
    description?: string;
}
/**
 * Template registry for accessing HTML/Handlebars templates
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const { templates } = ctx
 *
 *   // Get a template
 *   const template = await templates.get('email-header@v1.0.0')
 *
 *   // Render with variables
 *   const html = await templates.render('page-layout', {
 *     title: 'Welcome',
 *     content: 'Hello World',
 *   })
 *
 *   return { html }
 * }
 * ```
 */
export declare class TemplateRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
    /**
     * Get a template by name (with optional @version)
     *
     * @param nameOrRef - Template name with optional version (e.g., "header" or "header@v1.0.0")
     * @returns Template object with content
     *
     * @example
     * templates.get('header')           // header@latest
     * templates.get('header@v1.0.0')    // exact version
     */
    get(nameOrRef: string): Promise<Template>;
    /**
     * Get raw template content as string
     *
     * @param nameOrRef - Template name with optional version
     * @returns Raw template content
     */
    getContent(nameOrRef: string): Promise<string>;
    /**
     * Render a template with variables
     *
     * Uses Handlebars for rendering by default.
     *
     * @param nameOrRef - Template name with optional version
     * @param variables - Variables to substitute in the template
     * @returns Rendered HTML string
     *
     * @example
     * const html = await templates.render('email-template', {
     *   userName: 'John',
     *   orderNumber: '12345',
     * })
     */
    render(nameOrRef: string, variables: Record<string, unknown>): Promise<string>;
    /**
     * Check if a template exists
     *
     * @param nameOrRef - Template name with optional version
     * @returns True if template exists
     */
    exists(nameOrRef: string): Promise<boolean>;
}
//# sourceMappingURL=templates.d.ts.map