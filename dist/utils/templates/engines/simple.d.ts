/**
 * Simple Template Engine
 *
 * Lightweight template engine with {{variable}} syntax.
 * No external dependencies, perfect for basic interpolation.
 *
 * Supports:
 * - Variables: {{name}}
 * - Nested paths: {{user.name}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Loops: {{#each items}}...{{/each}}
 * - Partials: {{> componentName}} or {{> uri://path@version}}
 * - Helpers: {{uppercase name}}
 */
import { BaseTemplateEngine } from './base.js';
import type { TemplateContext } from '../types.js';
import type { ComponentLoader } from '../../../runtime/component-loader.js';
export declare class SimpleTemplateEngine extends BaseTemplateEngine {
    name: string;
    private componentLoader?;
    private partials;
    /**
     * Set the component loader for partial support
     */
    setComponentLoader(loader: ComponentLoader): void;
    /**
     * Register a partial template
     */
    registerPartial(name: string, content: string): void;
    /**
     * Render template with simple {{variable}} replacement
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
     * Resolve nested object path (e.g., "user.name" -> context.user.name)
     */
    private resolveValue;
    /**
     * Process {{#if condition}}...{{else}}...{{/if}} blocks recursively
     * This allows conditionals to contain partials and other templates
     */
    private processConditionalsRecursive;
    /**
     * Process {{#each array}}...{{/each}} blocks recursively
     * This allows loops to contain partials with access to loop item data
     */
    private processLoopsRecursive;
    /**
     * Process {{#if condition}}...{{else}}...{{/if}} blocks (non-recursive, legacy)
     * @deprecated Use processConditionalsRecursive instead
     */
    private processConditionals;
    /**
     * Process {{#each array}}...{{/each}} blocks
     */
    private processLoops;
    /**
     * Process {{> partialName}} or {{> uri://path@version}} includes
     */
    private processPartials;
    /**
     * Parse partial arguments
     * Example: title="My Site" count=5 -> { title: "My Site", count: 5 }
     */
    private parsePartialArgs;
    /**
     * Process helper functions {{helper arg1 arg2}}
     */
    private processHelpers;
}
//# sourceMappingURL=simple.d.ts.map