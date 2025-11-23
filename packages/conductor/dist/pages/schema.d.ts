/**
 * Zod schema validation for Pages
 */
import { z } from 'zod';
export declare const PageOperationSchema: z.ZodObject<{
    name: z.ZodString;
    operation: z.ZodString;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
    handler: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    operation: string;
    config: Record<string, any>;
    handler?: ((...args: unknown[]) => unknown) | undefined;
}, {
    name: string;
    operation: string;
    config: Record<string, any>;
    handler?: ((...args: unknown[]) => unknown) | undefined;
}>;
export declare const RouteConfigSchema: z.ZodObject<{
    path: z.ZodString;
    methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>, "many">>;
    auth: z.ZodOptional<z.ZodEnum<["none", "required", "optional"]>>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        requests: z.ZodNumber;
        window: z.ZodNumber;
        key: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["ip", "user"]>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    }, "strip", z.ZodTypeAny, {
        requests: number;
        window: number;
        key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
    }, {
        requests: number;
        window: number;
        key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
    }>>;
    cors: z.ZodOptional<z.ZodObject<{
        origin: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        methods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        allowHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        exposeHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credentials: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        methods?: string[] | undefined;
        origin?: string | string[] | undefined;
        allowHeaders?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
    }, {
        methods?: string[] | undefined;
        origin?: string | string[] | undefined;
        allowHeaders?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
    }>>;
    middleware: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    path: string;
    methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
    auth?: "none" | "required" | "optional" | undefined;
    rateLimit?: {
        requests: number;
        window: number;
        key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    cors?: {
        methods?: string[] | undefined;
        origin?: string | string[] | undefined;
        allowHeaders?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
    } | undefined;
    middleware?: any[] | undefined;
}, {
    path: string;
    methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
    auth?: "none" | "required" | "optional" | undefined;
    rateLimit?: {
        requests: number;
        window: number;
        key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    cors?: {
        methods?: string[] | undefined;
        origin?: string | string[] | undefined;
        allowHeaders?: string[] | undefined;
        exposeHeaders?: string[] | undefined;
        credentials?: boolean | undefined;
    } | undefined;
    middleware?: any[] | undefined;
}>;
export declare const ResponsesConfigSchema: z.ZodOptional<z.ZodObject<{
    html: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
    }, {
        enabled: boolean;
    }>>;
    json: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        transform: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        transform?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        enabled: boolean;
        transform?: ((...args: unknown[]) => unknown) | undefined;
    }>>;
    stream: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        chunkSize: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        chunkSize?: number | undefined;
    }, {
        enabled: boolean;
        chunkSize?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    json?: {
        enabled: boolean;
        transform?: ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    html?: {
        enabled: boolean;
    } | undefined;
    stream?: {
        enabled: boolean;
        chunkSize?: number | undefined;
    } | undefined;
}, {
    json?: {
        enabled: boolean;
        transform?: ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    html?: {
        enabled: boolean;
    } | undefined;
    stream?: {
        enabled: boolean;
        chunkSize?: number | undefined;
    } | undefined;
}>>;
export declare const CacheConfigSchema: z.ZodOptional<z.ZodObject<{
    enabled: z.ZodBoolean;
    ttl: z.ZodNumber;
    vary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    keyGenerator: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    ttl: number;
    vary?: string[] | undefined;
    tags?: string[] | undefined;
    keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
}, {
    enabled: boolean;
    ttl: number;
    vary?: string[] | undefined;
    tags?: string[] | undefined;
    keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
}>>;
export declare const PageRouteConfigSchema: z.ZodObject<{
    name: z.ZodString;
    operation: z.ZodLiteral<"page">;
    route: z.ZodObject<{
        path: z.ZodString;
        methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>, "many">>;
        auth: z.ZodOptional<z.ZodEnum<["none", "required", "optional"]>>;
        rateLimit: z.ZodOptional<z.ZodObject<{
            requests: z.ZodNumber;
            window: z.ZodNumber;
            key: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["ip", "user"]>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
        }, "strip", z.ZodTypeAny, {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        }, {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        }>>;
        cors: z.ZodOptional<z.ZodObject<{
            origin: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            methods: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            allowHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            exposeHeaders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            credentials: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        }, {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        }>>;
        middleware: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
        auth?: "none" | "required" | "optional" | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: any[] | undefined;
    }, {
        path: string;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
        auth?: "none" | "required" | "optional" | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: any[] | undefined;
    }>;
    beforeRender: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        operation: z.ZodString;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        handler: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }>, "many">>;
    afterRender: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        operation: z.ZodString;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
        handler: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }>, "many">>;
    responses: z.ZodOptional<z.ZodObject<{
        html: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled: boolean;
        }>>;
        json: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            transform: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        }, {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        }>>;
        stream: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            chunkSize: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            chunkSize?: number | undefined;
        }, {
            enabled: boolean;
            chunkSize?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        json?: {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        html?: {
            enabled: boolean;
        } | undefined;
        stream?: {
            enabled: boolean;
            chunkSize?: number | undefined;
        } | undefined;
    }, {
        json?: {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        html?: {
            enabled: boolean;
        } | undefined;
        stream?: {
            enabled: boolean;
            chunkSize?: number | undefined;
        } | undefined;
    }>>;
    layout: z.ZodOptional<z.ZodString>;
    layoutProps: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    cache: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        ttl: z.ZodNumber;
        vary: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        keyGenerator: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        ttl: number;
        vary?: string[] | undefined;
        tags?: string[] | undefined;
        keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
    }, {
        enabled: boolean;
        ttl: number;
        vary?: string[] | undefined;
        tags?: string[] | undefined;
        keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
    }>>;
    component: z.ZodOptional<z.ZodString>;
    componentPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    operation: "page";
    route: {
        path: string;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
        auth?: "none" | "required" | "optional" | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: any[] | undefined;
    };
    cache?: {
        enabled: boolean;
        ttl: number;
        vary?: string[] | undefined;
        tags?: string[] | undefined;
        keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    component?: string | undefined;
    layout?: string | undefined;
    beforeRender?: {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    afterRender?: {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    responses?: {
        json?: {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        html?: {
            enabled: boolean;
        } | undefined;
        stream?: {
            enabled: boolean;
            chunkSize?: number | undefined;
        } | undefined;
    } | undefined;
    layoutProps?: Record<string, any> | undefined;
    componentPath?: string | undefined;
}, {
    name: string;
    operation: "page";
    route: {
        path: string;
        methods?: ("POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD")[] | undefined;
        auth?: "none" | "required" | "optional" | undefined;
        rateLimit?: {
            requests: number;
            window: number;
            key?: "user" | "ip" | ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        cors?: {
            methods?: string[] | undefined;
            origin?: string | string[] | undefined;
            allowHeaders?: string[] | undefined;
            exposeHeaders?: string[] | undefined;
            credentials?: boolean | undefined;
        } | undefined;
        middleware?: any[] | undefined;
    };
    cache?: {
        enabled: boolean;
        ttl: number;
        vary?: string[] | undefined;
        tags?: string[] | undefined;
        keyGenerator?: ((...args: unknown[]) => unknown) | undefined;
    } | undefined;
    component?: string | undefined;
    layout?: string | undefined;
    beforeRender?: {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    afterRender?: {
        name: string;
        operation: string;
        config: Record<string, any>;
        handler?: ((...args: unknown[]) => unknown) | undefined;
    }[] | undefined;
    responses?: {
        json?: {
            enabled: boolean;
            transform?: ((...args: unknown[]) => unknown) | undefined;
        } | undefined;
        html?: {
            enabled: boolean;
        } | undefined;
        stream?: {
            enabled: boolean;
            chunkSize?: number | undefined;
        } | undefined;
    } | undefined;
    layoutProps?: Record<string, any> | undefined;
    componentPath?: string | undefined;
}>;
export type PageRouteConfig = z.infer<typeof PageRouteConfigSchema>;
//# sourceMappingURL=schema.d.ts.map