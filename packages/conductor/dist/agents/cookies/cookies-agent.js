/**
 * Cookies Agent
 *
 * Cookie management operation with:
 * - Read cookies from request (get, getAll)
 * - Set cookies on response (set)
 * - Delete cookies (delete)
 * - Consent integration with location context
 * - Graceful handling of non-HTTP triggers
 */
import { BaseAgent } from '../base-agent.js';
import { parseCookies, serializeCookie, createDeleteCookie, } from '../html/utils/cookies.js';
import { createLogger } from '../../observability/index.js';
const logger = createLogger({ serviceName: 'cookies-agent' });
/**
 * HTTP-based trigger types that support cookies
 */
const HTTP_TRIGGERS = ['http', 'webhook', 'mcp'];
export class CookiesAgent extends BaseAgent {
    constructor(config) {
        super(config);
        this.cookiesConfig = (config.config || {});
        this.validateConfig();
    }
    /**
     * Validate agent configuration
     */
    validateConfig() {
        const { action } = this.cookiesConfig;
        if (!action) {
            throw new Error('Cookies agent requires an action (get, set, delete, getAll)');
        }
        const validActions = ['get', 'set', 'delete', 'getAll'];
        if (!validActions.includes(action)) {
            throw new Error(`Invalid cookies action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }
        // Validate name is provided for actions that need it
        if (['get', 'set', 'delete'].includes(action) && !this.cookiesConfig.name) {
            throw new Error(`Cookies action "${action}" requires a name`);
        }
        // Validate value is provided for set action
        if (action === 'set' && this.cookiesConfig.value === undefined) {
            throw new Error('Cookies action "set" requires a value');
        }
    }
    /**
     * Execute cookie operation
     */
    async run(context) {
        const { action } = this.cookiesConfig;
        // Merge runtime config with static config
        const config = {
            ...this.cookiesConfig,
            ...context.config,
        };
        switch (action) {
            case 'get':
                return this.handleGet(config, context);
            case 'getAll':
                return this.handleGetAll(context);
            case 'set':
                return this.handleSet(config, context);
            case 'delete':
                return this.handleDelete(config, context);
            default:
                throw new Error(`Unknown cookies action: ${action}`);
        }
    }
    /**
     * Get a single cookie value
     */
    handleGet(config, context) {
        const { name } = config;
        // Try to get cookies from input (parsed by trigger) or from request header
        const cookies = this.getCookiesFromContext(context);
        const value = cookies[name] ?? null;
        return {
            value,
            found: value !== null,
        };
    }
    /**
     * Get all cookies
     */
    handleGetAll(context) {
        const cookies = this.getCookiesFromContext(context);
        return {
            cookies,
            count: Object.keys(cookies).length,
        };
    }
    /**
     * Set a cookie
     */
    handleSet(config, context) {
        const { name, value, purpose } = config;
        // Check for HTTP context
        const hasHttpContext = this.hasHttpContext(context);
        if (!hasHttpContext) {
            const triggerType = this.getTriggerType(context);
            logger.warn(`cookies operation skipped: no HTTP context (trigger type: ${triggerType})`);
            return {
                success: false,
                header: '',
                skipped: true,
                reason: 'no_http_context',
            };
        }
        // Consent check (integrates with location context)
        if (purpose && purpose !== 'essential') {
            const requiresConsent = context.location?.requiresConsent(purpose) ?? false;
            const hasConsent = context.input?.consents?.[purpose] === true;
            if (requiresConsent && !hasConsent) {
                logger.debug(`cookies operation skipped: consent required for purpose "${purpose}"`);
                return {
                    success: false,
                    header: '',
                    skipped: true,
                    reason: 'consent_required',
                    purpose,
                };
            }
        }
        // Build cookie options
        const options = {
            path: config.path ?? '/',
            secure: config.secure ?? true,
            httpOnly: config.httpOnly ?? true,
            sameSite: config.sameSite ?? 'lax',
        };
        if (config.maxAge !== undefined) {
            options.maxAge = config.maxAge;
        }
        if (config.expires !== undefined) {
            options.expires = typeof config.expires === 'string'
                ? new Date(config.expires)
                : new Date(config.expires);
        }
        if (config.domain) {
            options.domain = config.domain;
        }
        // Build the Set-Cookie header
        const header = serializeCookie(name, value, options);
        // Store in context for response building
        this.addSetCookieHeader(context, header);
        return {
            success: true,
            header,
        };
    }
    /**
     * Delete a cookie
     */
    handleDelete(config, context) {
        const { name, path } = config;
        // Check for HTTP context
        const hasHttpContext = this.hasHttpContext(context);
        if (!hasHttpContext) {
            const triggerType = this.getTriggerType(context);
            logger.warn(`cookies operation skipped: no HTTP context (trigger type: ${triggerType})`);
            return {
                success: false,
                header: '',
                skipped: true,
                reason: 'no_http_context',
            };
        }
        // Build delete cookie header
        const header = createDeleteCookie(name, { path: path ?? '/' });
        // Store in context for response building
        this.addSetCookieHeader(context, header);
        return {
            success: true,
            header,
        };
    }
    /**
     * Get parsed cookies from context
     * First checks input.cookies (set by trigger), then falls back to parsing request header
     */
    getCookiesFromContext(context) {
        // Check if cookies were already parsed by the trigger
        const input = context.input;
        if (input?.cookies && typeof input.cookies === 'object') {
            return input.cookies;
        }
        // Fall back to parsing from headers
        const cookieHeader = input?.headers?.cookie ?? '';
        if (cookieHeader) {
            return parseCookies(cookieHeader);
        }
        return {};
    }
    /**
     * Check if context has HTTP capabilities
     */
    hasHttpContext(context) {
        const input = context.input;
        // Check for explicit trigger type
        const triggerType = input?._triggerType || input?.triggerType;
        if (triggerType && HTTP_TRIGGERS.includes(triggerType)) {
            return true;
        }
        // Check for HTTP-like properties (body, method, headers)
        if (input?.method && input?.headers) {
            return true;
        }
        // Check for _setCookies array (indicates response capability)
        if (Array.isArray(input?._setCookies)) {
            return true;
        }
        return false;
    }
    /**
     * Get trigger type from context
     */
    getTriggerType(context) {
        const input = context.input;
        return input?._triggerType || input?.triggerType || 'unknown';
    }
    /**
     * Add Set-Cookie header to context for response building
     */
    addSetCookieHeader(context, header) {
        const input = context.input;
        // Initialize _setCookies array if not present
        if (!Array.isArray(input._setCookies)) {
            input._setCookies = [];
        }
        // Add the header
        input._setCookies.push(header);
    }
}
