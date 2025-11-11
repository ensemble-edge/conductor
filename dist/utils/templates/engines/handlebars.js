/**
 * Handlebars Template Engine
 *
 * Full-featured Handlebars template rendering with support for helpers, partials, and all Handlebars features.
 */
import * as Handlebars from 'handlebars';
import { BaseTemplateEngine } from './base.js';
/**
 * Handlebars template engine
 */
export class HandlebarsTemplateEngine extends BaseTemplateEngine {
    constructor() {
        super();
        this.name = 'handlebars';
        this.compiledTemplates = new Map();
        this.handlebars = Handlebars.create();
        // Register default helpers
        this.registerDefaultHelpers();
    }
    /**
     * Render a template with Handlebars
     */
    async render(template, context) {
        try {
            // Check if we have a compiled version
            let compiledTemplate = this.compiledTemplates.get(template);
            if (!compiledTemplate) {
                compiledTemplate = this.handlebars.compile(template);
                // Cache compiled template for reuse
                this.compiledTemplates.set(template, compiledTemplate);
            }
            return compiledTemplate(context);
        }
        catch (error) {
            throw new Error(`Handlebars render error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate template syntax
     */
    async validate(template) {
        try {
            this.handlebars.compile(template);
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
     * Compile a template for repeated use
     */
    async compile(template) {
        const compiled = this.handlebars.compile(template);
        this.compiledTemplates.set(template, compiled);
        return compiled;
    }
    /**
     * Register a helper function
     */
    registerHelper(name, fn) {
        this.handlebars.registerHelper(name, fn);
    }
    /**
     * Register a partial template
     */
    registerPartial(name, template) {
        this.handlebars.registerPartial(name, template);
    }
    /**
     * Register default helpers
     */
    registerDefaultHelpers() {
        // eq - equality check
        this.handlebars.registerHelper('eq', (a, b) => a === b);
        // ne - not equal check
        this.handlebars.registerHelper('ne', (a, b) => a !== b);
        // lt - less than
        this.handlebars.registerHelper('lt', (a, b) => a < b);
        // lte - less than or equal
        this.handlebars.registerHelper('lte', (a, b) => a <= b);
        // gt - greater than
        this.handlebars.registerHelper('gt', (a, b) => a > b);
        // gte - greater than or equal
        this.handlebars.registerHelper('gte', (a, b) => a >= b);
        // and - logical AND
        this.handlebars.registerHelper('and', (...args) => {
            // Remove the options object (last argument)
            const values = args.slice(0, -1);
            return values.every((v) => !!v);
        });
        // or - logical OR
        this.handlebars.registerHelper('or', (...args) => {
            // Remove the options object (last argument)
            const values = args.slice(0, -1);
            return values.some((v) => !!v);
        });
        // not - logical NOT
        this.handlebars.registerHelper('not', (value) => !value);
        // length - get array/string length
        this.handlebars.registerHelper('length', (value) => {
            if (Array.isArray(value) || typeof value === 'string') {
                return value.length;
            }
            return 0;
        });
        // join - join array elements
        this.handlebars.registerHelper('join', (array, separator = ',') => {
            if (Array.isArray(array)) {
                return array.join(separator);
            }
            return '';
        });
        // upper - uppercase string
        this.handlebars.registerHelper('upper', (str) => {
            if (typeof str === 'string') {
                return str.toUpperCase();
            }
            return str;
        });
        // lower - lowercase string
        this.handlebars.registerHelper('lower', (str) => {
            if (typeof str === 'string') {
                return str.toLowerCase();
            }
            return str;
        });
        // capitalize - capitalize first letter
        this.handlebars.registerHelper('capitalize', (str) => {
            if (typeof str === 'string' && str.length > 0) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
            return str;
        });
        // truncate - truncate string to length
        this.handlebars.registerHelper('truncate', (str, length = 100) => {
            if (typeof str === 'string' && str.length > length) {
                return str.substring(0, length) + '...';
            }
            return str;
        });
        // default - provide default value if empty
        this.handlebars.registerHelper('default', (value, defaultValue) => {
            return value ?? defaultValue;
        });
        // json - stringify object as JSON
        this.handlebars.registerHelper('json', (obj) => {
            try {
                return JSON.stringify(obj, null, 2);
            }
            catch {
                return String(obj);
            }
        });
        // date - format date
        this.handlebars.registerHelper('date', (date) => {
            try {
                const d = date instanceof Date ? date : new Date(date);
                return d.toLocaleDateString();
            }
            catch {
                return String(date);
            }
        });
        // formatNumber - format number with commas
        this.handlebars.registerHelper('formatNumber', (num) => {
            if (typeof num === 'number') {
                return num.toLocaleString();
            }
            return num;
        });
    }
    /**
     * Clear the template cache
     */
    clearCache() {
        this.compiledTemplates.clear();
    }
}
