/**
 * Zod schema validation for Pages
 */
import { z } from 'zod';
export const PageOperationSchema = z.object({
    name: z.string(),
    operation: z.string(),
    config: z.record(z.any()),
    handler: z.function().optional(),
});
export const RouteConfigSchema = z.object({
    path: z.string(),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])).optional(),
    auth: z.enum(['none', 'required', 'optional']).optional(),
    rateLimit: z
        .object({
        requests: z.number(),
        window: z.number(),
        key: z.union([z.enum(['ip', 'user']), z.function()]).optional(),
    })
        .optional(),
    cors: z
        .object({
        origin: z.union([z.string(), z.array(z.string())]).optional(),
        methods: z.array(z.string()).optional(),
        allowHeaders: z.array(z.string()).optional(),
        exposeHeaders: z.array(z.string()).optional(),
        credentials: z.boolean().optional(),
    })
        .optional(),
    middleware: z.array(z.any()).optional(),
});
export const ResponsesConfigSchema = z
    .object({
    html: z.object({ enabled: z.boolean() }).optional(),
    json: z
        .object({
        enabled: z.boolean(),
        transform: z.function().optional(),
    })
        .optional(),
    stream: z
        .object({
        enabled: z.boolean(),
        chunkSize: z.number().optional(),
    })
        .optional(),
})
    .optional();
export const CacheConfigSchema = z
    .object({
    enabled: z.boolean(),
    ttl: z.number(),
    vary: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    keyGenerator: z.function().optional(),
})
    .optional();
export const PageRouteConfigSchema = z.object({
    name: z.string(),
    operation: z.literal('page'),
    route: RouteConfigSchema,
    beforeRender: z.array(PageOperationSchema).optional(),
    afterRender: z.array(PageOperationSchema).optional(),
    responses: ResponsesConfigSchema,
    layout: z.string().optional(),
    layoutProps: z.record(z.any()).optional(),
    cache: CacheConfigSchema,
    component: z.string().optional(),
    componentPath: z.string().optional(),
});
