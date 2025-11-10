/**
 * Unified Router
 *
 * Central routing system with type-specific defaults and path-based rules
 */
import { CustomValidatorRegistry, createBearerValidator, createApiKeyValidator, createCookieValidator, createUnkeyValidator, createCustomValidatorRegistry } from '../auth/index.js';
/**
 * Unified Router
 */
export class UnifiedRouter {
    constructor(config = {}) {
        this.routes = [];
        this.validators = new Map();
        this.config = config;
        this.customValidatorRegistry = new CustomValidatorRegistry();
    }
    /**
     * Initialize validators from environment
     */
    async init(env) {
        // Register built-in validators
        const bearer = createBearerValidator(env);
        if (bearer)
            this.validators.set('bearer', bearer);
        const apiKey = createApiKeyValidator(env);
        if (apiKey)
            this.validators.set('apiKey', apiKey);
        const cookie = createCookieValidator(env);
        if (cookie)
            this.validators.set('cookie', cookie);
        const unkey = createUnkeyValidator(env);
        if (unkey)
            this.validators.set('unkey', unkey);
        // Register custom validators
        this.customValidatorRegistry = createCustomValidatorRegistry(env);
    }
    /**
     * Register a route
     */
    register(options) {
        // Resolve 'default' path from directory structure
        let pattern = options.pattern;
        let path = options.path || options.pattern;
        if (pattern === 'default' || pattern === 'auto') {
            // Use member path as the route
            // For /pages/login/page.yaml -> /login
            // For /members/api/users/member.yaml -> /api/users
            // For /ensembles/workflows/invoice/ensemble.yaml -> /ensembles/workflows/invoice
            if (options.memberPath) {
                pattern = this.resolveDefaultPath(options.memberPath, options.memberType);
                path = pattern;
            }
            else {
                // Fallback to member name if no path provided
                pattern = `/${options.memberType}s/${options.memberName}`;
                path = pattern;
            }
        }
        const route = {
            pattern,
            path,
            methods: options.methods,
            memberType: options.memberType,
            memberName: options.memberName,
            auth: options.auth,
            priority: options.priority,
            handler: options.handler
        };
        this.routes.push(route);
        // Sort by priority (lower = higher priority)
        this.routes.sort((a, b) => {
            const aPrio = a.priority ?? this.getDefaultPriority(a.memberType);
            const bPrio = b.priority ?? this.getDefaultPriority(b.memberType);
            if (aPrio !== bPrio)
                return aPrio - bPrio;
            // Static routes before dynamic (both : params and * wildcards)
            const aStatic = !a.pattern.includes(':') && !a.pattern.includes('*');
            const bStatic = !b.pattern.includes(':') && !b.pattern.includes('*');
            if (aStatic && !bStatic)
                return -1;
            if (!aStatic && bStatic)
                return 1;
            // Longer paths first
            return b.pattern.length - a.pattern.length;
        });
    }
    /**
     * Resolve default path from member directory structure
     */
    resolveDefaultPath(memberPath, memberType) {
        // Remove file extensions and standard names
        let path = memberPath
            .replace(/\.(yaml|yml|ts|js|tsx|jsx)$/, '')
            .replace(/\/(member|page|ensemble|form|api)$/, '');
        // Remove type-specific prefixes
        const prefixes = ['/pages/', '/members/', '/ensembles/', '/forms/', '/apis/', '/webhooks/', '/docs/'];
        for (const prefix of prefixes) {
            if (path.startsWith(prefix)) {
                path = path.substring(prefix.length - 1); // Keep leading slash
                break;
            }
        }
        // Ensure leading slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        // Handle index pages
        if (path.endsWith('/index')) {
            path = path.substring(0, path.length - 6) || '/';
        }
        return path;
    }
    /**
     * Get default priority for member type
     */
    getDefaultPriority(memberType) {
        const priorities = {
            static: 1,
            health: 2,
            auth: 3,
            api: 50,
            webhook: 60,
            docs: 70,
            page: 80,
            form: 90
        };
        return priorities[memberType] || 100;
    }
    /**
     * Match route pattern
     */
    matchPattern(pattern, path) {
        // Normalize paths
        pattern = pattern.replace(/\/+$/, '') || '/';
        path = path.replace(/\/+$/, '') || '/';
        // Wildcard match
        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            if (path.startsWith(prefix)) {
                return {};
            }
            return null;
        }
        // Exact match
        if (!pattern.includes(':')) {
            return pattern === path ? {} : null;
        }
        // Dynamic match
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            if (patternPart.startsWith(':')) {
                const paramName = patternPart.slice(1);
                params[paramName] = decodeURIComponent(pathPart);
            }
            else if (patternPart !== pathPart) {
                return null;
            }
        }
        return params;
    }
    /**
     * Find matching route
     */
    match(path, method) {
        for (const route of this.routes) {
            // Check method
            if (!route.methods.includes(method) && !route.methods.includes('*')) {
                continue;
            }
            // Check pattern
            const params = this.matchPattern(route.pattern, path);
            if (params === null) {
                continue;
            }
            // Resolve auth config
            const auth = this.resolveAuthConfig(route.pattern, route.memberType, route.auth);
            return {
                pattern: route.pattern,
                params,
                auth,
                memberType: route.memberType,
                priority: route.priority ?? this.getDefaultPriority(route.memberType)
            };
        }
        return null;
    }
    /**
     * Resolve auth config by merging defaults and rules
     */
    resolveAuthConfig(path, memberType, memberAuth) {
        // Priority: member > path rule > type default > global default
        let resolved = {};
        let source = 'global-default';
        // 1. Global default
        if (this.config.routing?.auth?.global) {
            resolved = { ...this.config.routing.auth.global };
        }
        // 2. Type default
        const typeDefaults = this.config.routing?.auth?.defaults;
        if (typeDefaults) {
            // Map member types to config keys (handle singular/plural variations)
            const typeKeyMap = {
                page: 'pages',
                api: 'api',
                webhook: 'webhooks',
                form: 'forms',
                docs: 'docs',
                static: 'pages', // Use pages default for static
                health: 'api', // Use api default for health
                auth: 'api' // Use api default for auth
            };
            const typeKey = typeKeyMap[memberType];
            if (typeKey && typeDefaults[typeKey]) {
                resolved = { ...resolved, ...typeDefaults[typeKey] };
                source = 'type-default';
            }
        }
        // 3. Path rules
        const rules = this.config.routing?.auth?.rules || [];
        for (const rule of rules) {
            if (this.matchPattern(rule.pattern, path)) {
                resolved = { ...resolved, ...rule.auth };
                if (rule.rateLimit) {
                    resolved.rateLimit = rule.rateLimit;
                }
                source = 'rule';
                break;
            }
        }
        // 4. Member-specific
        if (memberAuth) {
            resolved = { ...resolved, ...memberAuth };
            source = 'member';
        }
        // Ensure requirement is set
        if (!resolved.requirement) {
            resolved.requirement = 'required';
        }
        return {
            requirement: resolved.requirement,
            methods: resolved.methods,
            permissions: resolved.permissions,
            roles: resolved.roles,
            serviceAccountOnly: resolved.serviceAccountOnly,
            stealthMode: resolved.stealthMode,
            customValidator: resolved.customValidator,
            onFailure: resolved.onFailure,
            auditLog: resolved.auditLog,
            source,
            rateLimit: resolved.rateLimit
        };
    }
    /**
     * Authenticate request
     */
    async authenticate(request, env, auth) {
        // Public routes don't need auth
        if (auth.requirement === 'public') {
            return {
                valid: true,
                context: {
                    authenticated: false,
                    method: undefined
                }
            };
        }
        const methods = auth.methods || ['bearer', 'apiKey', 'cookie'];
        // Try custom validator first
        if (auth.customValidator) {
            const validator = this.customValidatorRegistry.get(auth.customValidator);
            if (validator) {
                const result = await validator.validate(request, env);
                if (result.valid)
                    return result;
            }
        }
        // Try each auth method
        for (const method of methods) {
            const validator = this.validators.get(method);
            if (!validator)
                continue;
            const result = await validator.validate(request, env);
            if (result.valid) {
                // Check service account requirement
                if (auth.serviceAccountOnly && result.context?.unkey?.isServiceAccount !== true) {
                    continue;
                }
                // Check permissions
                if (auth.permissions && auth.permissions.length > 0) {
                    const userPerms = result.context?.user?.permissions || [];
                    const hasPerms = auth.permissions.every(p => userPerms.includes(p));
                    if (!hasPerms) {
                        return {
                            valid: false,
                            error: 'insufficient_permissions',
                            message: 'Insufficient permissions'
                        };
                    }
                }
                // Check roles
                if (auth.roles && auth.roles.length > 0) {
                    const userRoles = result.context?.user?.roles || [];
                    const hasRoles = auth.roles.some(r => userRoles.includes(r));
                    if (!hasRoles) {
                        return {
                            valid: false,
                            error: 'insufficient_permissions',
                            message: 'Insufficient role'
                        };
                    }
                }
                return result;
            }
        }
        // Optional auth
        if (auth.requirement === 'optional') {
            return {
                valid: true,
                context: {
                    authenticated: false,
                    method: undefined
                }
            };
        }
        // Required but not provided
        return {
            valid: false,
            error: 'invalid_token',
            message: 'Authentication required'
        };
    }
    /**
     * Handle request
     */
    async handle(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        // Find matching route
        const match = this.match(path, method);
        if (!match) {
            return null; // No match, let caller handle 404
        }
        // Authenticate
        const authResult = await this.authenticate(request, env, match.auth);
        if (!authResult.valid) {
            return this.handleAuthFailure(authResult, match.auth);
        }
        // Find registered route handler
        const route = this.routes.find(r => r.pattern === match.pattern);
        if (!route?.handler) {
            return null; // No handler, let member handle it
        }
        // Call handler with auth context
        return await route.handler(request, env, ctx, authResult.context);
    }
    /**
     * Handle auth failure
     */
    handleAuthFailure(authResult, auth) {
        // Stealth mode
        if (auth.stealthMode) {
            return new Response('Not Found', { status: 404 });
        }
        // Custom failure action
        if (auth.onFailure) {
            if (auth.onFailure.action === 'redirect') {
                const location = auth.onFailure.redirectTo || '/login';
                return Response.redirect(location, 302);
            }
            if (auth.onFailure.action === 'page') {
                // Return error page (caller must render)
                return new Response(JSON.stringify({
                    error: 'auth_failed',
                    page: auth.onFailure.page,
                    context: auth.onFailure.context
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        // Default error response
        const status = authResult.error === 'insufficient_permissions' ? 403 : 401;
        return new Response(JSON.stringify({
            error: authResult.error,
            message: authResult.message
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
