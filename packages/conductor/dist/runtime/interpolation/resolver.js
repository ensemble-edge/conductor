/**
 * Interpolation Resolver System
 *
 * Chain of responsibility pattern for resolving template values.
 * Each resolver handles a specific type of interpolation.
 */
/**
 * Resolves string interpolations supporting two syntaxes:
 * - YAML syntax: ${input.x}, ${state.y} - used in YAML configuration files
 * - Template syntax: {{input.x}}, {{state.y}} - used in Handlebars/Liquid templates
 *
 * Supports both full replacement and partial interpolation:
 * - Full: '${input.name}' or '{{input.name}}' → returns value as-is (any type)
 * - Partial: 'Hello ${input.name}!' or 'Hello {{input.name}}!' → returns interpolated string
 */
export class StringResolver {
    constructor() {
        this.fullPatternDollar = /^\$\{([^}]*)\}$/; // YAML: ${...}
        this.fullPatternHandlebar = /^\{\{([^}]*)\}\}$/; // Templates: {{...}}
        this.hasInterpolationPattern = /(\$\{[^}]*\}|\{\{[^}]*\}\})/; // Either syntax
    }
    canResolve(template) {
        if (typeof template !== 'string')
            return false;
        return (this.fullPatternDollar.test(template) ||
            this.fullPatternHandlebar.test(template) ||
            this.hasInterpolationPattern.test(template));
    }
    resolve(template, context, interpolate) {
        // Case 1: Full replacement - entire string is ${...} or {{...}}
        // Returns the value as-is (could be any type)
        const dollarMatch = template.match(this.fullPatternDollar);
        const handlebarMatch = template.match(this.fullPatternHandlebar);
        const fullMatch = dollarMatch || handlebarMatch;
        if (fullMatch) {
            const path = fullMatch[1].trim();
            // Handle empty path
            if (!path) {
                return undefined;
            }
            return this.traversePath(path, context);
        }
        // Case 2: Partial interpolation - string contains ${...} or {{...}}
        // Returns a string with all interpolations replaced
        const result = template.replace(/(\$\{([^}]*)\}|\{\{([^}]*)\}\})/g, (match, _full, dollarPath, handlebarPath) => {
            const path = dollarPath !== undefined ? dollarPath : handlebarPath;
            const trimmedPath = path.trim();
            // Empty path becomes empty string
            if (!trimmedPath) {
                return '';
            }
            const value = this.traversePath(trimmedPath, context);
            // If value is undefined, keep original ${...} or {{...}} in string
            // Otherwise convert value to string
            return value !== undefined ? String(value) : match;
        });
        return result;
    }
    /**
     * Traverse context using dot-separated path
     */
    traversePath(path, context) {
        const parts = path.split('.').map((p) => p.trim());
        let value = context;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
}
/**
 * Resolves arrays by recursively resolving each item
 */
export class ArrayResolver {
    canResolve(template) {
        return Array.isArray(template);
    }
    resolve(template, context, interpolate) {
        return template.map((item) => interpolate(item, context));
    }
}
/**
 * Resolves objects by recursively resolving each property
 */
export class ObjectResolver {
    canResolve(template) {
        return typeof template === 'object' && template !== null && !Array.isArray(template);
    }
    resolve(template, context, interpolate) {
        const resolved = {};
        for (const [key, value] of Object.entries(template)) {
            resolved[key] = interpolate(value, context);
        }
        return resolved;
    }
}
/**
 * Passthrough resolver for primitives (numbers, booleans, null)
 */
export class PassthroughResolver {
    canResolve(template) {
        return true; // Handles everything else
    }
    resolve(template, context, interpolate) {
        return template;
    }
}
