/**
 * Zod Schemas for Configuration Validation
 *
 * Runtime validation schemas for Conductor configuration.
 * These schemas mirror the TypeScript interfaces in types.ts
 * and provide runtime validation with helpful error messages.
 *
 * @example
 * ```typescript
 * import { ConductorConfigSchema, validateConfig } from './schemas.js';
 *
 * const result = validateConfig(userConfig);
 * if (!result.success) {
 *   console.error('Invalid config:', result.error.format());
 * }
 * ```
 */
import { z } from 'zod';
/**
 * Rate limit configuration schema
 */
export declare const RateLimitConfigSchema: z.ZodObject<{
    requests: z.ZodNumber;
    window: z.ZodNumber;
    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
}, "strip", z.ZodTypeAny, {
    requests: number;
    window: number;
    keyBy: "apiKey" | "ip" | "user";
}, {
    requests: number;
    window: number;
    keyBy: "apiKey" | "ip" | "user";
}>;
/**
 * Authentication failure handling schema
 */
export declare const AuthFailureSchema: z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
    redirectTo: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodString>;
    preserveReturn: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page?: string | undefined;
    action?: "redirect" | "error" | "page" | undefined;
    redirectTo?: string | undefined;
    preserveReturn?: boolean | undefined;
}, {
    page?: string | undefined;
    action?: "redirect" | "error" | "page" | undefined;
    redirectTo?: string | undefined;
    preserveReturn?: boolean | undefined;
}>;
/**
 * Authentication rule schema
 */
export declare const AuthRuleSchema: z.ZodObject<{
    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
    customValidator: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    onFailure: z.ZodOptional<z.ZodObject<{
        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
        redirectTo: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodString>;
        preserveReturn: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        page?: string | undefined;
        action?: "redirect" | "error" | "page" | undefined;
        redirectTo?: string | undefined;
        preserveReturn?: boolean | undefined;
    }, {
        page?: string | undefined;
        action?: "redirect" | "error" | "page" | undefined;
        redirectTo?: string | undefined;
        preserveReturn?: boolean | undefined;
    }>>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        requests: z.ZodNumber;
        window: z.ZodNumber;
        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
    }, "strip", z.ZodTypeAny, {
        requests: number;
        window: number;
        keyBy: "apiKey" | "ip" | "user";
    }, {
        requests: number;
        window: number;
        keyBy: "apiKey" | "ip" | "user";
    }>>;
}, "strip", z.ZodTypeAny, {
    requirement?: "public" | "optional" | "required" | undefined;
    onFailure?: {
        page?: string | undefined;
        action?: "redirect" | "error" | "page" | undefined;
        redirectTo?: string | undefined;
        preserveReturn?: boolean | undefined;
    } | undefined;
    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
    customValidator?: string | undefined;
    roles?: string[] | undefined;
    permissions?: string[] | undefined;
    rateLimit?: {
        requests: number;
        window: number;
        keyBy: "apiKey" | "ip" | "user";
    } | undefined;
}, {
    requirement?: "public" | "optional" | "required" | undefined;
    onFailure?: {
        page?: string | undefined;
        action?: "redirect" | "error" | "page" | undefined;
        redirectTo?: string | undefined;
        preserveReturn?: boolean | undefined;
    } | undefined;
    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
    customValidator?: string | undefined;
    roles?: string[] | undefined;
    permissions?: string[] | undefined;
    rateLimit?: {
        requests: number;
        window: number;
        keyBy: "apiKey" | "ip" | "user";
    } | undefined;
}>;
/**
 * Path-based authentication rule schema
 */
export declare const PathAuthRuleSchema: z.ZodObject<{
    pattern: z.ZodString;
    auth: z.ZodOptional<z.ZodObject<{
        requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
        customValidator: z.ZodOptional<z.ZodString>;
        roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        onFailure: z.ZodOptional<z.ZodObject<{
            action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
            redirectTo: z.ZodOptional<z.ZodString>;
            page: z.ZodOptional<z.ZodString>;
            preserveReturn: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        }, {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        }>>;
        rateLimit: z.ZodOptional<z.ZodObject<{
            requests: z.ZodNumber;
            window: z.ZodNumber;
            keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
        }, "strip", z.ZodTypeAny, {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        }, {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        }>>;
    }, "strip", z.ZodTypeAny, {
        requirement?: "public" | "optional" | "required" | undefined;
        onFailure?: {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        } | undefined;
        methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
        customValidator?: string | undefined;
        roles?: string[] | undefined;
        permissions?: string[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        } | undefined;
    }, {
        requirement?: "public" | "optional" | "required" | undefined;
        onFailure?: {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        } | undefined;
        methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
        customValidator?: string | undefined;
        roles?: string[] | undefined;
        permissions?: string[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        } | undefined;
    }>>;
    priority: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    auth?: {
        requirement?: "public" | "optional" | "required" | undefined;
        onFailure?: {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        } | undefined;
        methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
        customValidator?: string | undefined;
        roles?: string[] | undefined;
        permissions?: string[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        } | undefined;
    } | undefined;
    priority?: number | undefined;
}, {
    pattern: string;
    auth?: {
        requirement?: "public" | "optional" | "required" | undefined;
        onFailure?: {
            page?: string | undefined;
            action?: "redirect" | "error" | "page" | undefined;
            redirectTo?: string | undefined;
            preserveReturn?: boolean | undefined;
        } | undefined;
        methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
        customValidator?: string | undefined;
        roles?: string[] | undefined;
        permissions?: string[] | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            keyBy: "apiKey" | "ip" | "user";
        } | undefined;
    } | undefined;
    priority?: number | undefined;
}>;
/**
 * Authentication configuration schema
 */
export declare const AuthConfigSchema: z.ZodObject<{
    defaults: z.ZodOptional<z.ZodObject<{
        pages: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
        api: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
        webhooks: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
        forms: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
        docs: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        docs?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        api?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        webhooks?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        forms?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        pages?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
    }, {
        docs?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        api?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        webhooks?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        forms?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        pages?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
    }>>;
    rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        auth: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
            customValidator: z.ZodOptional<z.ZodString>;
            roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            onFailure: z.ZodOptional<z.ZodObject<{
                action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                redirectTo: z.ZodOptional<z.ZodString>;
                page: z.ZodOptional<z.ZodString>;
                preserveReturn: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }, {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            }>>;
            rateLimit: z.ZodOptional<z.ZodObject<{
                requests: z.ZodNumber;
                window: z.ZodNumber;
                keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
            }, "strip", z.ZodTypeAny, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }, {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            }>>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        }>>;
        priority: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        priority?: number | undefined;
    }, {
        pattern: string;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        priority?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    defaults?: {
        docs?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        api?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        webhooks?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        forms?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        pages?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
    } | undefined;
    rules?: {
        pattern: string;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        priority?: number | undefined;
    }[] | undefined;
}, {
    defaults?: {
        docs?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        api?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        webhooks?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        forms?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        pages?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
    } | undefined;
    rules?: {
        pattern: string;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            onFailure?: {
                page?: string | undefined;
                action?: "redirect" | "error" | "page" | undefined;
                redirectTo?: string | undefined;
                preserveReturn?: boolean | undefined;
            } | undefined;
            methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
            customValidator?: string | undefined;
            roles?: string[] | undefined;
            permissions?: string[] | undefined;
            rateLimit?: {
                requests: number;
                window: number;
                keyBy: "apiKey" | "ip" | "user";
            } | undefined;
        } | undefined;
        priority?: number | undefined;
    }[] | undefined;
}>;
/**
 * Security configuration schema
 */
export declare const SecurityConfigOptionsSchema: z.ZodObject<{
    requireAuth: z.ZodOptional<z.ZodBoolean>;
    allowDirectAgentExecution: z.ZodOptional<z.ZodBoolean>;
    autoPermissions: z.ZodOptional<z.ZodBoolean>;
    productionEnvironments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    requireAuth?: boolean | undefined;
    allowDirectAgentExecution?: boolean | undefined;
    autoPermissions?: boolean | undefined;
    productionEnvironments?: string[] | undefined;
}, {
    requireAuth?: boolean | undefined;
    allowDirectAgentExecution?: boolean | undefined;
    autoPermissions?: boolean | undefined;
    productionEnvironments?: string[] | undefined;
}>;
/**
 * Routing configuration schema
 */
export declare const RoutingConfigSchema: z.ZodObject<{
    autoDiscover: z.ZodOptional<z.ZodBoolean>;
    basePath: z.ZodOptional<z.ZodString>;
    auth: z.ZodOptional<z.ZodObject<{
        defaults: z.ZodOptional<z.ZodObject<{
            pages: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
            api: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
            webhooks: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
            forms: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
            docs: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        }, {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        }>>;
        rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            pattern: z.ZodString;
            auth: z.ZodOptional<z.ZodObject<{
                requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                customValidator: z.ZodOptional<z.ZodString>;
                roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                onFailure: z.ZodOptional<z.ZodObject<{
                    action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                    redirectTo: z.ZodOptional<z.ZodString>;
                    page: z.ZodOptional<z.ZodString>;
                    preserveReturn: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }, {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                }>>;
                rateLimit: z.ZodOptional<z.ZodObject<{
                    requests: z.ZodNumber;
                    window: z.ZodNumber;
                    keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                }, "strip", z.ZodTypeAny, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }, {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                }>>;
            }, "strip", z.ZodTypeAny, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }, {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            }>>;
            priority: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }, {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        defaults?: {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        } | undefined;
        rules?: {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }[] | undefined;
    }, {
        defaults?: {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        } | undefined;
        rules?: {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    auth?: {
        defaults?: {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        } | undefined;
        rules?: {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }[] | undefined;
    } | undefined;
    basePath?: string | undefined;
    autoDiscover?: boolean | undefined;
}, {
    auth?: {
        defaults?: {
            docs?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            api?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            webhooks?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            forms?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            pages?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
        } | undefined;
        rules?: {
            pattern: string;
            auth?: {
                requirement?: "public" | "optional" | "required" | undefined;
                onFailure?: {
                    page?: string | undefined;
                    action?: "redirect" | "error" | "page" | undefined;
                    redirectTo?: string | undefined;
                    preserveReturn?: boolean | undefined;
                } | undefined;
                methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                customValidator?: string | undefined;
                roles?: string[] | undefined;
                permissions?: string[] | undefined;
                rateLimit?: {
                    requests: number;
                    window: number;
                    keyBy: "apiKey" | "ip" | "user";
                } | undefined;
            } | undefined;
            priority?: number | undefined;
        }[] | undefined;
    } | undefined;
    basePath?: string | undefined;
    autoDiscover?: boolean | undefined;
}>;
/**
 * Documentation UI framework type
 */
export declare const DocsUIFrameworkSchema: z.ZodEnum<["stoplight", "redoc", "swagger", "scalar", "rapidoc"]>;
/**
 * Documentation theme schema
 */
export declare const DocsThemeSchema: z.ZodObject<{
    primaryColor: z.ZodOptional<z.ZodString>;
    customCss: z.ZodOptional<z.ZodString>;
    darkMode: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    primaryColor?: string | undefined;
    darkMode?: boolean | undefined;
    customCss?: string | undefined;
}, {
    primaryColor?: string | undefined;
    darkMode?: boolean | undefined;
    customCss?: string | undefined;
}>;
/**
 * Documentation AI settings schema
 */
export declare const DocsAISchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    model: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodEnum<["cloudflare", "openai", "anthropic"]>>;
    temperature: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | "cloudflare" | undefined;
    temperature?: number | undefined;
}, {
    enabled?: boolean | undefined;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | "cloudflare" | undefined;
    temperature?: number | undefined;
}>;
/**
 * Documentation cache schema
 */
export declare const DocsCacheSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    ttl: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    ttl?: number | undefined;
}, {
    enabled?: boolean | undefined;
    ttl?: number | undefined;
}>;
/**
 * Server URL schema
 */
export declare const ServerUrlSchema: z.ZodObject<{
    url: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    description?: string | undefined;
}, {
    url: string;
    description?: string | undefined;
}>;
/**
 * Documentation configuration schema
 */
export declare const DocsConfigSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    favicon: z.ZodOptional<z.ZodString>;
    ui: z.ZodOptional<z.ZodEnum<["stoplight", "redoc", "swagger", "scalar", "rapidoc"]>>;
    theme: z.ZodOptional<z.ZodObject<{
        primaryColor: z.ZodOptional<z.ZodString>;
        customCss: z.ZodOptional<z.ZodString>;
        darkMode: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        primaryColor?: string | undefined;
        darkMode?: boolean | undefined;
        customCss?: string | undefined;
    }, {
        primaryColor?: string | undefined;
        darkMode?: boolean | undefined;
        customCss?: string | undefined;
    }>>;
    auth: z.ZodOptional<z.ZodObject<{
        requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
        redirectTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requirement?: "public" | "optional" | "required" | undefined;
        redirectTo?: string | undefined;
    }, {
        requirement?: "public" | "optional" | "required" | undefined;
        redirectTo?: string | undefined;
    }>>;
    ai: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        model: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodEnum<["cloudflare", "openai", "anthropic"]>>;
        temperature: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "cloudflare" | undefined;
        temperature?: number | undefined;
    }, {
        enabled?: boolean | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "cloudflare" | undefined;
        temperature?: number | undefined;
    }>>;
    include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
    includeSecurity: z.ZodOptional<z.ZodBoolean>;
    cache: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        ttl: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
    }, {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
    }>>;
    outputDir: z.ZodOptional<z.ZodString>;
    format: z.ZodOptional<z.ZodEnum<["yaml", "json"]>>;
    servers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        description?: string | undefined;
    }, {
        url: string;
        description?: string | undefined;
    }>, "many">>;
    useAI: z.ZodOptional<z.ZodBoolean>;
    aiAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    cache?: {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
    } | undefined;
    format?: "json" | "yaml" | undefined;
    includeExamples?: boolean | undefined;
    title?: string | undefined;
    ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
    includeSecurity?: boolean | undefined;
    outputDir?: string | undefined;
    description?: string | undefined;
    auth?: {
        requirement?: "public" | "optional" | "required" | undefined;
        redirectTo?: string | undefined;
    } | undefined;
    ai?: {
        enabled?: boolean | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "cloudflare" | undefined;
        temperature?: number | undefined;
    } | undefined;
    logo?: string | undefined;
    favicon?: string | undefined;
    theme?: {
        primaryColor?: string | undefined;
        darkMode?: boolean | undefined;
        customCss?: string | undefined;
    } | undefined;
    include?: string[] | undefined;
    exclude?: string[] | undefined;
    servers?: {
        url: string;
        description?: string | undefined;
    }[] | undefined;
    useAI?: boolean | undefined;
    aiAgent?: string | undefined;
}, {
    cache?: {
        enabled?: boolean | undefined;
        ttl?: number | undefined;
    } | undefined;
    format?: "json" | "yaml" | undefined;
    includeExamples?: boolean | undefined;
    title?: string | undefined;
    ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
    includeSecurity?: boolean | undefined;
    outputDir?: string | undefined;
    description?: string | undefined;
    auth?: {
        requirement?: "public" | "optional" | "required" | undefined;
        redirectTo?: string | undefined;
    } | undefined;
    ai?: {
        enabled?: boolean | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "cloudflare" | undefined;
        temperature?: number | undefined;
    } | undefined;
    logo?: string | undefined;
    favicon?: string | undefined;
    theme?: {
        primaryColor?: string | undefined;
        darkMode?: boolean | undefined;
        customCss?: string | undefined;
    } | undefined;
    include?: string[] | undefined;
    exclude?: string[] | undefined;
    servers?: {
        url: string;
        description?: string | undefined;
    }[] | undefined;
    useAI?: boolean | undefined;
    aiAgent?: string | undefined;
}>;
/**
 * Coverage thresholds schema
 */
export declare const CoverageThresholdsSchema: z.ZodObject<{
    lines: z.ZodOptional<z.ZodNumber>;
    functions: z.ZodOptional<z.ZodNumber>;
    branches: z.ZodOptional<z.ZodNumber>;
    statements: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    lines?: number | undefined;
    functions?: number | undefined;
    branches?: number | undefined;
    statements?: number | undefined;
}, {
    lines?: number | undefined;
    functions?: number | undefined;
    branches?: number | undefined;
    statements?: number | undefined;
}>;
/**
 * Testing configuration schema
 */
export declare const TestingConfigSchema: z.ZodObject<{
    coverage: z.ZodOptional<z.ZodObject<{
        lines: z.ZodOptional<z.ZodNumber>;
        functions: z.ZodOptional<z.ZodNumber>;
        branches: z.ZodOptional<z.ZodNumber>;
        statements: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        lines?: number | undefined;
        functions?: number | undefined;
        branches?: number | undefined;
        statements?: number | undefined;
    }, {
        lines?: number | undefined;
        functions?: number | undefined;
        branches?: number | undefined;
        statements?: number | undefined;
    }>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    environment: z.ZodOptional<z.ZodEnum<["node", "jsdom", "edge-runtime"]>>;
    setupFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    globals: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    environment?: "node" | "jsdom" | "edge-runtime" | undefined;
    timeout?: number | undefined;
    globals?: boolean | undefined;
    coverage?: {
        lines?: number | undefined;
        functions?: number | undefined;
        branches?: number | undefined;
        statements?: number | undefined;
    } | undefined;
    setupFiles?: string[] | undefined;
}, {
    environment?: "node" | "jsdom" | "edge-runtime" | undefined;
    timeout?: number | undefined;
    globals?: boolean | undefined;
    coverage?: {
        lines?: number | undefined;
        functions?: number | undefined;
        branches?: number | undefined;
        statements?: number | undefined;
    } | undefined;
    setupFiles?: string[] | undefined;
}>;
/**
 * Log event types
 */
export declare const LogEventTypeSchema: z.ZodEnum<["request", "response", "agent:start", "agent:complete", "agent:error", "ensemble:start", "ensemble:complete", "ensemble:error", "cache:hit", "cache:miss"]>;
/**
 * Metric types
 */
export declare const MetricTypeSchema: z.ZodEnum<["ensemble:execution", "agent:execution", "http:request", "cache:performance", "error"]>;
/**
 * Logging configuration schema
 */
export declare const LoggingConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    format: z.ZodOptional<z.ZodEnum<["json", "pretty"]>>;
    context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    redact: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    events: z.ZodOptional<z.ZodArray<z.ZodEnum<["request", "response", "agent:start", "agent:complete", "agent:error", "ensemble:start", "ensemble:complete", "ensemble:error", "cache:hit", "cache:miss"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    format?: "json" | "pretty" | undefined;
    level?: "debug" | "info" | "warn" | "error" | undefined;
    enabled?: boolean | undefined;
    context?: string[] | undefined;
    redact?: string[] | undefined;
    events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
}, {
    format?: "json" | "pretty" | undefined;
    level?: "debug" | "info" | "warn" | "error" | undefined;
    enabled?: boolean | undefined;
    context?: string[] | undefined;
    redact?: string[] | undefined;
    events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
}>;
/**
 * Metrics configuration schema
 */
export declare const MetricsConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    binding: z.ZodOptional<z.ZodString>;
    track: z.ZodOptional<z.ZodArray<z.ZodEnum<["ensemble:execution", "agent:execution", "http:request", "cache:performance", "error"]>, "many">>;
    dimensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    binding?: string | undefined;
    track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
    dimensions?: string[] | undefined;
}, {
    enabled?: boolean | undefined;
    binding?: string | undefined;
    track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
    dimensions?: string[] | undefined;
}>;
/**
 * OpenTelemetry configuration schema
 */
export declare const OpenTelemetryConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    endpoint: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    samplingRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    headers?: Record<string, string> | undefined;
    samplingRate?: number | undefined;
    enabled?: boolean | undefined;
    endpoint?: string | undefined;
}, {
    headers?: Record<string, string> | undefined;
    samplingRate?: number | undefined;
    enabled?: boolean | undefined;
    endpoint?: string | undefined;
}>;
/**
 * Observability configuration schema
 * Supports boolean shorthand or full config object
 */
export declare const ObservabilityConfigSchema: z.ZodObject<{
    logging: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        format: z.ZodOptional<z.ZodEnum<["json", "pretty"]>>;
        context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        redact: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        events: z.ZodOptional<z.ZodArray<z.ZodEnum<["request", "response", "agent:start", "agent:complete", "agent:error", "ensemble:start", "ensemble:complete", "ensemble:error", "cache:hit", "cache:miss"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        format?: "json" | "pretty" | undefined;
        level?: "debug" | "info" | "warn" | "error" | undefined;
        enabled?: boolean | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
    }, {
        format?: "json" | "pretty" | undefined;
        level?: "debug" | "info" | "warn" | "error" | undefined;
        enabled?: boolean | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
    }>]>>;
    metrics: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        binding: z.ZodOptional<z.ZodString>;
        track: z.ZodOptional<z.ZodArray<z.ZodEnum<["ensemble:execution", "agent:execution", "http:request", "cache:performance", "error"]>, "many">>;
        dimensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        binding?: string | undefined;
        track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
        dimensions?: string[] | undefined;
    }, {
        enabled?: boolean | undefined;
        binding?: string | undefined;
        track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
        dimensions?: string[] | undefined;
    }>]>>;
    opentelemetry: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        endpoint: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        samplingRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        headers?: Record<string, string> | undefined;
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
        endpoint?: string | undefined;
    }, {
        headers?: Record<string, string> | undefined;
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
        endpoint?: string | undefined;
    }>>;
    trackTokenUsage: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    trackTokenUsage?: boolean | undefined;
    logging?: boolean | {
        format?: "json" | "pretty" | undefined;
        level?: "debug" | "info" | "warn" | "error" | undefined;
        enabled?: boolean | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
    } | undefined;
    metrics?: boolean | {
        enabled?: boolean | undefined;
        binding?: string | undefined;
        track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
        dimensions?: string[] | undefined;
    } | undefined;
    opentelemetry?: {
        headers?: Record<string, string> | undefined;
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
        endpoint?: string | undefined;
    } | undefined;
}, {
    trackTokenUsage?: boolean | undefined;
    logging?: boolean | {
        format?: "json" | "pretty" | undefined;
        level?: "debug" | "info" | "warn" | "error" | undefined;
        enabled?: boolean | undefined;
        context?: string[] | undefined;
        redact?: string[] | undefined;
        events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
    } | undefined;
    metrics?: boolean | {
        enabled?: boolean | undefined;
        binding?: string | undefined;
        track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
        dimensions?: string[] | undefined;
    } | undefined;
    opentelemetry?: {
        headers?: Record<string, string> | undefined;
        samplingRate?: number | undefined;
        enabled?: boolean | undefined;
        endpoint?: string | undefined;
    } | undefined;
}>;
/**
 * Execution configuration schema
 */
export declare const ExecutionConfigSchema: z.ZodObject<{
    defaultTimeout: z.ZodOptional<z.ZodNumber>;
    trackHistory: z.ZodOptional<z.ZodBoolean>;
    maxHistoryEntries: z.ZodOptional<z.ZodNumber>;
    storeStateSnapshots: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    defaultTimeout?: number | undefined;
    trackHistory?: boolean | undefined;
    maxHistoryEntries?: number | undefined;
    storeStateSnapshots?: boolean | undefined;
}, {
    defaultTimeout?: number | undefined;
    trackHistory?: boolean | undefined;
    maxHistoryEntries?: number | undefined;
    storeStateSnapshots?: boolean | undefined;
}>;
/**
 * API execution controls for agents
 */
export declare const ApiAgentsExecutionConfigSchema: z.ZodObject<{
    requireExplicit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    requireExplicit?: boolean | undefined;
}, {
    requireExplicit?: boolean | undefined;
}>;
/**
 * API execution controls for ensembles
 */
export declare const ApiEnsemblesExecutionConfigSchema: z.ZodObject<{
    requireExplicit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    requireExplicit?: boolean | undefined;
}, {
    requireExplicit?: boolean | undefined;
}>;
/**
 * API execution configuration schema
 */
export declare const ApiExecutionConfigSchema: z.ZodObject<{
    agents: z.ZodOptional<z.ZodObject<{
        requireExplicit: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requireExplicit?: boolean | undefined;
    }, {
        requireExplicit?: boolean | undefined;
    }>>;
    ensembles: z.ZodOptional<z.ZodObject<{
        requireExplicit: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requireExplicit?: boolean | undefined;
    }, {
        requireExplicit?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    agents?: {
        requireExplicit?: boolean | undefined;
    } | undefined;
    ensembles?: {
        requireExplicit?: boolean | undefined;
    } | undefined;
}, {
    agents?: {
        requireExplicit?: boolean | undefined;
    } | undefined;
    ensembles?: {
        requireExplicit?: boolean | undefined;
    } | undefined;
}>;
/**
 * API configuration schema
 */
export declare const ApiConfigSchema: z.ZodObject<{
    execution: z.ZodOptional<z.ZodObject<{
        agents: z.ZodOptional<z.ZodObject<{
            requireExplicit: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            requireExplicit?: boolean | undefined;
        }, {
            requireExplicit?: boolean | undefined;
        }>>;
        ensembles: z.ZodOptional<z.ZodObject<{
            requireExplicit: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            requireExplicit?: boolean | undefined;
        }, {
            requireExplicit?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        agents?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
        ensembles?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
    }, {
        agents?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
        ensembles?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    execution?: {
        agents?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
        ensembles?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
    } | undefined;
}, {
    execution?: {
        agents?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
        ensembles?: {
            requireExplicit?: boolean | undefined;
        } | undefined;
    } | undefined;
}>;
/**
 * Storage configuration schema
 */
export declare const StorageConfigSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["filesystem", "d1", "kv"]>>;
    path: z.ZodOptional<z.ZodString>;
    d1Binding: z.ZodOptional<z.ZodString>;
    kvBinding: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "kv" | "d1" | "filesystem" | undefined;
    path?: string | undefined;
    d1Binding?: string | undefined;
    kvBinding?: string | undefined;
}, {
    type?: "kv" | "d1" | "filesystem" | undefined;
    path?: string | undefined;
    d1Binding?: string | undefined;
    kvBinding?: string | undefined;
}>;
/**
 * Complete Conductor configuration schema
 */
export declare const ConductorConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    security: z.ZodOptional<z.ZodObject<{
        requireAuth: z.ZodOptional<z.ZodBoolean>;
        allowDirectAgentExecution: z.ZodOptional<z.ZodBoolean>;
        autoPermissions: z.ZodOptional<z.ZodBoolean>;
        productionEnvironments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        requireAuth?: boolean | undefined;
        allowDirectAgentExecution?: boolean | undefined;
        autoPermissions?: boolean | undefined;
        productionEnvironments?: string[] | undefined;
    }, {
        requireAuth?: boolean | undefined;
        allowDirectAgentExecution?: boolean | undefined;
        autoPermissions?: boolean | undefined;
        productionEnvironments?: string[] | undefined;
    }>>;
    routing: z.ZodOptional<z.ZodObject<{
        autoDiscover: z.ZodOptional<z.ZodBoolean>;
        basePath: z.ZodOptional<z.ZodString>;
        auth: z.ZodOptional<z.ZodObject<{
            defaults: z.ZodOptional<z.ZodObject<{
                pages: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
                api: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
                webhooks: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
                forms: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
                docs: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            }, {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            }>>;
            rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                pattern: z.ZodString;
                auth: z.ZodOptional<z.ZodObject<{
                    requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
                    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["bearer", "apiKey", "cookie", "custom"]>, "many">>;
                    customValidator: z.ZodOptional<z.ZodString>;
                    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    onFailure: z.ZodOptional<z.ZodObject<{
                        action: z.ZodOptional<z.ZodEnum<["error", "redirect", "page"]>>;
                        redirectTo: z.ZodOptional<z.ZodString>;
                        page: z.ZodOptional<z.ZodString>;
                        preserveReturn: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }, {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    }>>;
                    rateLimit: z.ZodOptional<z.ZodObject<{
                        requests: z.ZodNumber;
                        window: z.ZodNumber;
                        keyBy: z.ZodEnum<["ip", "user", "apiKey"]>;
                    }, "strip", z.ZodTypeAny, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }, {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }, {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                }>>;
                priority: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }, {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        }, {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        auth?: {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        } | undefined;
        basePath?: string | undefined;
        autoDiscover?: boolean | undefined;
    }, {
        auth?: {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        } | undefined;
        basePath?: string | undefined;
        autoDiscover?: boolean | undefined;
    }>>;
    docs: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        logo: z.ZodOptional<z.ZodString>;
        favicon: z.ZodOptional<z.ZodString>;
        ui: z.ZodOptional<z.ZodEnum<["stoplight", "redoc", "swagger", "scalar", "rapidoc"]>>;
        theme: z.ZodOptional<z.ZodObject<{
            primaryColor: z.ZodOptional<z.ZodString>;
            customCss: z.ZodOptional<z.ZodString>;
            darkMode: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        }, {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        }>>;
        auth: z.ZodOptional<z.ZodObject<{
            requirement: z.ZodOptional<z.ZodEnum<["public", "optional", "required"]>>;
            redirectTo: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        }, {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        }>>;
        ai: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            model: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodEnum<["cloudflare", "openai", "anthropic"]>>;
            temperature: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        }>>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeExamples: z.ZodOptional<z.ZodBoolean>;
        includeSecurity: z.ZodOptional<z.ZodBoolean>;
        cache: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            ttl: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        }>>;
        outputDir: z.ZodOptional<z.ZodString>;
        format: z.ZodOptional<z.ZodEnum<["yaml", "json"]>>;
        servers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            description?: string | undefined;
        }, {
            url: string;
            description?: string | undefined;
        }>, "many">>;
        useAI: z.ZodOptional<z.ZodBoolean>;
        aiAgent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        cache?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        } | undefined;
        format?: "json" | "yaml" | undefined;
        includeExamples?: boolean | undefined;
        title?: string | undefined;
        ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
        includeSecurity?: boolean | undefined;
        outputDir?: string | undefined;
        description?: string | undefined;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        } | undefined;
        ai?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        } | undefined;
        logo?: string | undefined;
        favicon?: string | undefined;
        theme?: {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        } | undefined;
        include?: string[] | undefined;
        exclude?: string[] | undefined;
        servers?: {
            url: string;
            description?: string | undefined;
        }[] | undefined;
        useAI?: boolean | undefined;
        aiAgent?: string | undefined;
    }, {
        cache?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        } | undefined;
        format?: "json" | "yaml" | undefined;
        includeExamples?: boolean | undefined;
        title?: string | undefined;
        ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
        includeSecurity?: boolean | undefined;
        outputDir?: string | undefined;
        description?: string | undefined;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        } | undefined;
        ai?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        } | undefined;
        logo?: string | undefined;
        favicon?: string | undefined;
        theme?: {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        } | undefined;
        include?: string[] | undefined;
        exclude?: string[] | undefined;
        servers?: {
            url: string;
            description?: string | undefined;
        }[] | undefined;
        useAI?: boolean | undefined;
        aiAgent?: string | undefined;
    }>>;
    testing: z.ZodOptional<z.ZodObject<{
        coverage: z.ZodOptional<z.ZodObject<{
            lines: z.ZodOptional<z.ZodNumber>;
            functions: z.ZodOptional<z.ZodNumber>;
            branches: z.ZodOptional<z.ZodNumber>;
            statements: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        }, {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        }>>;
        timeout: z.ZodOptional<z.ZodNumber>;
        environment: z.ZodOptional<z.ZodEnum<["node", "jsdom", "edge-runtime"]>>;
        setupFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        globals: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        environment?: "node" | "jsdom" | "edge-runtime" | undefined;
        timeout?: number | undefined;
        globals?: boolean | undefined;
        coverage?: {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        } | undefined;
        setupFiles?: string[] | undefined;
    }, {
        environment?: "node" | "jsdom" | "edge-runtime" | undefined;
        timeout?: number | undefined;
        globals?: boolean | undefined;
        coverage?: {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        } | undefined;
        setupFiles?: string[] | undefined;
    }>>;
    observability: z.ZodOptional<z.ZodObject<{
        logging: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            level: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
            format: z.ZodOptional<z.ZodEnum<["json", "pretty"]>>;
            context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            redact: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            events: z.ZodOptional<z.ZodArray<z.ZodEnum<["request", "response", "agent:start", "agent:complete", "agent:error", "ensemble:start", "ensemble:complete", "ensemble:error", "cache:hit", "cache:miss"]>, "many">>;
        }, "strip", z.ZodTypeAny, {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        }, {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        }>]>>;
        metrics: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            binding: z.ZodOptional<z.ZodString>;
            track: z.ZodOptional<z.ZodArray<z.ZodEnum<["ensemble:execution", "agent:execution", "http:request", "cache:performance", "error"]>, "many">>;
            dimensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        }>]>>;
        opentelemetry: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            endpoint: z.ZodOptional<z.ZodString>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            samplingRate: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        }, {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        }>>;
        trackTokenUsage: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        trackTokenUsage?: boolean | undefined;
        logging?: boolean | {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        } | undefined;
        metrics?: boolean | {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        } | undefined;
        opentelemetry?: {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        } | undefined;
    }, {
        trackTokenUsage?: boolean | undefined;
        logging?: boolean | {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        } | undefined;
        metrics?: boolean | {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        } | undefined;
        opentelemetry?: {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        } | undefined;
    }>>;
    execution: z.ZodOptional<z.ZodObject<{
        defaultTimeout: z.ZodOptional<z.ZodNumber>;
        trackHistory: z.ZodOptional<z.ZodBoolean>;
        maxHistoryEntries: z.ZodOptional<z.ZodNumber>;
        storeStateSnapshots: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        defaultTimeout?: number | undefined;
        trackHistory?: boolean | undefined;
        maxHistoryEntries?: number | undefined;
        storeStateSnapshots?: boolean | undefined;
    }, {
        defaultTimeout?: number | undefined;
        trackHistory?: boolean | undefined;
        maxHistoryEntries?: number | undefined;
        storeStateSnapshots?: boolean | undefined;
    }>>;
    storage: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["filesystem", "d1", "kv"]>>;
        path: z.ZodOptional<z.ZodString>;
        d1Binding: z.ZodOptional<z.ZodString>;
        kvBinding: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: "kv" | "d1" | "filesystem" | undefined;
        path?: string | undefined;
        d1Binding?: string | undefined;
        kvBinding?: string | undefined;
    }, {
        type?: "kv" | "d1" | "filesystem" | undefined;
        path?: string | undefined;
        d1Binding?: string | undefined;
        kvBinding?: string | undefined;
    }>>;
    api: z.ZodOptional<z.ZodObject<{
        execution: z.ZodOptional<z.ZodObject<{
            agents: z.ZodOptional<z.ZodObject<{
                requireExplicit: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                requireExplicit?: boolean | undefined;
            }, {
                requireExplicit?: boolean | undefined;
            }>>;
            ensembles: z.ZodOptional<z.ZodObject<{
                requireExplicit: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                requireExplicit?: boolean | undefined;
            }, {
                requireExplicit?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        }, {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        execution?: {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        } | undefined;
    }, {
        execution?: {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        } | undefined;
    }>>;
    discovery: z.ZodOptional<z.ZodObject<{
        agents: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            directory: z.ZodString;
            patterns: z.ZodArray<z.ZodString, "many">;
            configFile: z.ZodOptional<z.ZodString>;
            excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            includeExamples: z.ZodOptional<z.ZodBoolean>;
        } & {
            handlerExtensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        }, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        }>>;
        ensembles: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            directory: z.ZodString;
            patterns: z.ZodArray<z.ZodString, "many">;
            configFile: z.ZodOptional<z.ZodString>;
            excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            includeExamples: z.ZodOptional<z.ZodBoolean>;
        } & {
            supportTypeScript: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        }, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        }>>;
        docs: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            directory: z.ZodString;
            patterns: z.ZodArray<z.ZodString, "many">;
            configFile: z.ZodOptional<z.ZodString>;
            excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            includeExamples: z.ZodOptional<z.ZodBoolean>;
        } & {
            excludeReadme: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        }, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        }>>;
        scripts: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            directory: z.ZodString;
            patterns: z.ZodArray<z.ZodString, "many">;
            configFile: z.ZodOptional<z.ZodString>;
            excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            includeExamples: z.ZodOptional<z.ZodBoolean>;
        } & {
            entryPoint: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        }, {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        agents?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        } | undefined;
        ensembles?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        } | undefined;
        docs?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        } | undefined;
        scripts?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        } | undefined;
    }, {
        agents?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        } | undefined;
        ensembles?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        } | undefined;
        docs?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        } | undefined;
        scripts?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    storage?: {
        type?: "kv" | "d1" | "filesystem" | undefined;
        path?: string | undefined;
        d1Binding?: string | undefined;
        kvBinding?: string | undefined;
    } | undefined;
    name?: string | undefined;
    docs?: {
        cache?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        } | undefined;
        format?: "json" | "yaml" | undefined;
        includeExamples?: boolean | undefined;
        title?: string | undefined;
        ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
        includeSecurity?: boolean | undefined;
        outputDir?: string | undefined;
        description?: string | undefined;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        } | undefined;
        ai?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        } | undefined;
        logo?: string | undefined;
        favicon?: string | undefined;
        theme?: {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        } | undefined;
        include?: string[] | undefined;
        exclude?: string[] | undefined;
        servers?: {
            url: string;
            description?: string | undefined;
        }[] | undefined;
        useAI?: boolean | undefined;
        aiAgent?: string | undefined;
    } | undefined;
    security?: {
        requireAuth?: boolean | undefined;
        allowDirectAgentExecution?: boolean | undefined;
        autoPermissions?: boolean | undefined;
        productionEnvironments?: string[] | undefined;
    } | undefined;
    version?: string | undefined;
    api?: {
        execution?: {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
    execution?: {
        defaultTimeout?: number | undefined;
        trackHistory?: boolean | undefined;
        maxHistoryEntries?: number | undefined;
        storeStateSnapshots?: boolean | undefined;
    } | undefined;
    discovery?: {
        agents?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        } | undefined;
        ensembles?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        } | undefined;
        docs?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        } | undefined;
        scripts?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        } | undefined;
    } | undefined;
    routing?: {
        auth?: {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        } | undefined;
        basePath?: string | undefined;
        autoDiscover?: boolean | undefined;
    } | undefined;
    testing?: {
        environment?: "node" | "jsdom" | "edge-runtime" | undefined;
        timeout?: number | undefined;
        globals?: boolean | undefined;
        coverage?: {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        } | undefined;
        setupFiles?: string[] | undefined;
    } | undefined;
    observability?: {
        trackTokenUsage?: boolean | undefined;
        logging?: boolean | {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        } | undefined;
        metrics?: boolean | {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        } | undefined;
        opentelemetry?: {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    storage?: {
        type?: "kv" | "d1" | "filesystem" | undefined;
        path?: string | undefined;
        d1Binding?: string | undefined;
        kvBinding?: string | undefined;
    } | undefined;
    name?: string | undefined;
    docs?: {
        cache?: {
            enabled?: boolean | undefined;
            ttl?: number | undefined;
        } | undefined;
        format?: "json" | "yaml" | undefined;
        includeExamples?: boolean | undefined;
        title?: string | undefined;
        ui?: "stoplight" | "redoc" | "swagger" | "scalar" | "rapidoc" | undefined;
        includeSecurity?: boolean | undefined;
        outputDir?: string | undefined;
        description?: string | undefined;
        auth?: {
            requirement?: "public" | "optional" | "required" | undefined;
            redirectTo?: string | undefined;
        } | undefined;
        ai?: {
            enabled?: boolean | undefined;
            model?: string | undefined;
            provider?: "openai" | "anthropic" | "cloudflare" | undefined;
            temperature?: number | undefined;
        } | undefined;
        logo?: string | undefined;
        favicon?: string | undefined;
        theme?: {
            primaryColor?: string | undefined;
            darkMode?: boolean | undefined;
            customCss?: string | undefined;
        } | undefined;
        include?: string[] | undefined;
        exclude?: string[] | undefined;
        servers?: {
            url: string;
            description?: string | undefined;
        }[] | undefined;
        useAI?: boolean | undefined;
        aiAgent?: string | undefined;
    } | undefined;
    security?: {
        requireAuth?: boolean | undefined;
        allowDirectAgentExecution?: boolean | undefined;
        autoPermissions?: boolean | undefined;
        productionEnvironments?: string[] | undefined;
    } | undefined;
    version?: string | undefined;
    api?: {
        execution?: {
            agents?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
            ensembles?: {
                requireExplicit?: boolean | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
    execution?: {
        defaultTimeout?: number | undefined;
        trackHistory?: boolean | undefined;
        maxHistoryEntries?: number | undefined;
        storeStateSnapshots?: boolean | undefined;
    } | undefined;
    discovery?: {
        agents?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            handlerExtensions?: string[] | undefined;
        } | undefined;
        ensembles?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            supportTypeScript?: boolean | undefined;
        } | undefined;
        docs?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            excludeReadme?: boolean | undefined;
        } | undefined;
        scripts?: {
            directory: string;
            patterns: string[];
            enabled?: boolean | undefined;
            configFile?: string | undefined;
            excludeDirs?: string[] | undefined;
            includeExamples?: boolean | undefined;
            entryPoint?: string | undefined;
        } | undefined;
    } | undefined;
    routing?: {
        auth?: {
            defaults?: {
                docs?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                api?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                webhooks?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                forms?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                pages?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
            } | undefined;
            rules?: {
                pattern: string;
                auth?: {
                    requirement?: "public" | "optional" | "required" | undefined;
                    onFailure?: {
                        page?: string | undefined;
                        action?: "redirect" | "error" | "page" | undefined;
                        redirectTo?: string | undefined;
                        preserveReturn?: boolean | undefined;
                    } | undefined;
                    methods?: ("custom" | "bearer" | "apiKey" | "cookie")[] | undefined;
                    customValidator?: string | undefined;
                    roles?: string[] | undefined;
                    permissions?: string[] | undefined;
                    rateLimit?: {
                        requests: number;
                        window: number;
                        keyBy: "apiKey" | "ip" | "user";
                    } | undefined;
                } | undefined;
                priority?: number | undefined;
            }[] | undefined;
        } | undefined;
        basePath?: string | undefined;
        autoDiscover?: boolean | undefined;
    } | undefined;
    testing?: {
        environment?: "node" | "jsdom" | "edge-runtime" | undefined;
        timeout?: number | undefined;
        globals?: boolean | undefined;
        coverage?: {
            lines?: number | undefined;
            functions?: number | undefined;
            branches?: number | undefined;
            statements?: number | undefined;
        } | undefined;
        setupFiles?: string[] | undefined;
    } | undefined;
    observability?: {
        trackTokenUsage?: boolean | undefined;
        logging?: boolean | {
            format?: "json" | "pretty" | undefined;
            level?: "debug" | "info" | "warn" | "error" | undefined;
            enabled?: boolean | undefined;
            context?: string[] | undefined;
            redact?: string[] | undefined;
            events?: ("request" | "response" | "agent:start" | "agent:complete" | "agent:error" | "ensemble:start" | "ensemble:complete" | "ensemble:error" | "cache:hit" | "cache:miss")[] | undefined;
        } | undefined;
        metrics?: boolean | {
            enabled?: boolean | undefined;
            binding?: string | undefined;
            track?: ("error" | "ensemble:execution" | "agent:execution" | "http:request" | "cache:performance")[] | undefined;
            dimensions?: string[] | undefined;
        } | undefined;
        opentelemetry?: {
            headers?: Record<string, string> | undefined;
            samplingRate?: number | undefined;
            enabled?: boolean | undefined;
            endpoint?: string | undefined;
        } | undefined;
    } | undefined;
}>;
/**
 * Inferred types from Zod schemas
 * These should match the interfaces in types.ts
 */
export type ValidatedConductorConfig = z.infer<typeof ConductorConfigSchema>;
export type ValidatedSecurityConfig = z.infer<typeof SecurityConfigOptionsSchema>;
export type ValidatedRoutingConfig = z.infer<typeof RoutingConfigSchema>;
export type ValidatedDocsConfig = z.infer<typeof DocsConfigSchema>;
export type ValidatedTestingConfig = z.infer<typeof TestingConfigSchema>;
export type ValidatedObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;
export type ValidatedExecutionConfig = z.infer<typeof ExecutionConfigSchema>;
export type ValidatedStorageConfig = z.infer<typeof StorageConfigSchema>;
export type ValidatedApiConfig = z.infer<typeof ApiConfigSchema>;
export type ValidatedApiExecutionConfig = z.infer<typeof ApiExecutionConfigSchema>;
/**
 * Validation result type
 */
export type ValidationResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
/**
 * Validate a ConductorConfig object
 *
 * @param config - Raw configuration object
 * @returns Validation result with typed data or error
 *
 * @example
 * ```typescript
 * const result = validateConfig(userConfig);
 * if (result.success) {
 *   console.log('Valid config:', result.data);
 * } else {
 *   console.error('Validation errors:', result.error.format());
 * }
 * ```
 */
export declare function validateConfig(config: unknown): ValidationResult<ValidatedConductorConfig>;
/**
 * Validate and throw if invalid
 *
 * @param config - Raw configuration object
 * @returns Validated configuration
 * @throws {z.ZodError} if validation fails
 */
export declare function validateConfigOrThrow(config: unknown): ValidatedConductorConfig;
/**
 * Format validation errors for user display
 *
 * @param error - Zod validation error
 * @returns Human-readable error messages
 */
export declare function formatValidationErrors(error: z.ZodError): string[];
/**
 * Validate a partial config section
 *
 * @example
 * ```typescript
 * const result = validateSection(DocsConfigSchema, docsConfig);
 * ```
 */
export declare function validateSection<T extends z.ZodType>(schema: T, data: unknown): ValidationResult<z.infer<T>>;
//# sourceMappingURL=schemas.d.ts.map