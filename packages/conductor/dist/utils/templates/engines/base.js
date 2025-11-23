/**
 * Base Template Engine
 *
 * Abstract base class for all template rendering engines.
 */
export class BaseTemplateEngine {
    /**
     * Compile a template for repeated use (optional optimization)
     */
    async compile(template) {
        // Default: no compilation
        return template;
    }
    /**
     * Register a helper function
     */
    registerHelper(name, fn) {
        // Default: no-op (engines can override)
    }
    /**
     * Register a partial template
     */
    registerPartial(name, template) {
        // Default: no-op (engines can override)
    }
}
