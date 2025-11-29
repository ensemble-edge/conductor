/**
 * HTML Agent Types
 *
 * Provides HTML template rendering with:
 * - Template engines (Handlebars, Liquid, MJML for emails)
 * - Cookie management (set, read, delete, signed cookies)
 * - Template loading from KV, R2, or inline
 * - CSS inlining for email compatibility
 * - Data binding and variable interpolation
 */
/**
 * Cookie configuration options
 */
export interface CookieOptions {
    /** Max age in seconds */
    maxAge?: number;
    /** Expiration date */
    expires?: Date;
    /** Cookie domain */
    domain?: string;
    /** Cookie path (default: '/') */
    path?: string;
    /** Secure flag (HTTPS only) */
    secure?: boolean;
    /** HttpOnly flag (not accessible via JavaScript) */
    httpOnly?: boolean;
    /** SameSite attribute */
    sameSite?: 'strict' | 'lax' | 'none';
    /** Sign the cookie for tamper prevention */
    signed?: boolean;
}
/**
 * Cookie data structure
 */
export interface Cookie {
    name: string;
    value: string;
    options?: CookieOptions;
}
/**
 * Template engine types (Workers-compatible)
 * Note: Only 'simple' and 'liquid' - both work in Cloudflare Workers without eval()
 */
export type TemplateEngine = 'simple' | 'liquid';
/**
 * Template source configuration
 */
export interface TemplateSource {
    /** Template engine to use */
    engine?: TemplateEngine;
    /** Inline template string */
    inline?: string;
    /** KV key for template */
    kv?: string;
    /** R2 key for template */
    r2?: string;
    /** Template file path (relative to project root) */
    file?: string;
}
/**
 * HTML rendering options
 */
export interface HtmlRenderOptions {
    /** Inline CSS for email compatibility */
    inlineCss?: boolean;
    /** Minify output HTML */
    minify?: boolean;
    /** Pretty print HTML (development) */
    pretty?: boolean;
    /** Base URL for relative asset paths */
    baseUrl?: string;
}
/**
 * HTML agent configuration
 */
export interface HtmlMemberConfig {
    /** Template source */
    template: TemplateSource;
    /** Rendering options */
    renderOptions?: HtmlRenderOptions;
    /** Cookie secret for signed cookies */
    cookieSecret?: string;
    /** Default cookie options */
    defaultCookieOptions?: CookieOptions;
}
/**
 * HTML agent input
 */
export interface HtmlMemberInput {
    /** Template data (variables to interpolate) */
    data?: Record<string, unknown>;
    /** Request cookies (for reading) */
    cookies?: Record<string, string>;
    /** Cookies to set in response */
    setCookies?: Cookie[];
    /** Cookie names to delete */
    deleteCookies?: string[];
    /** Override template source */
    template?: TemplateSource;
    /** Layout to wrap content (e.g., "template://layouts/main" or registered partial name) */
    layout?: string;
    /** Override render options */
    renderOptions?: HtmlRenderOptions;
}
/**
 * HTML agent output
 */
export interface HtmlMemberOutput {
    /** Rendered HTML */
    html: string;
    /** Cookies to set (Set-Cookie headers) */
    cookies?: string[];
    /** Cookies that were read */
    readCookies?: Record<string, string>;
    /** Template engine used */
    engine: TemplateEngine;
    /** Rendering metadata */
    metadata?: {
        /** Rendering time in milliseconds */
        renderTime: number;
        /** Template size in bytes */
        templateSize: number;
        /** Output size in bytes */
        outputSize: number;
        /** CSS was inlined */
        cssInlined?: boolean;
        /** HTML was minified */
        minified?: boolean;
    };
}
/**
 * Cookie parsing result
 */
export interface ParsedCookie {
    name: string;
    value: string;
    /** Whether the cookie signature is valid (for signed cookies) */
    valid?: boolean;
}
/**
 * Template rendering context
 * Index signature allows flexible template data binding
 */
export interface TemplateContext {
    /** Template data */
    data: Record<string, unknown>;
    /** Helper functions available in templates */
    helpers?: Record<string, (...args: unknown[]) => unknown>;
    /** Partials (template includes) */
    partials?: Record<string, string>;
    /** Allow additional properties for template flexibility */
    [key: string]: unknown;
}
/**
 * Template loading result
 */
export interface TemplateLoadResult {
    /** Template content */
    content: string;
    /** Template engine detected/specified */
    engine: TemplateEngine;
    /** Source type */
    source: 'inline' | 'kv' | 'r2' | 'file';
}
/**
 * HTML validation result
 */
export interface HtmlValidationResult {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
}
/**
 * Email-specific HTML configuration
 */
export interface EmailHtmlConfig extends HtmlMemberConfig {
    /** Use MJML for email templates */
    mjml?: boolean;
    /** Inline all CSS (required for email) */
    inlineCss: true;
    /** Email-specific metadata */
    emailMetadata?: {
        /** Subject line template */
        subject?: string;
        /** Preheader text */
        preheader?: string;
        /** From name */
        fromName?: string;
    };
}
//# sourceMappingURL=index.d.ts.map