/**
 * Webhook Routes
 *
 * Lists registered webhook endpoints from ensemble configurations.
 *
 * Note: User-defined webhook triggers (e.g., /webhooks/github) are registered
 * dynamically via the trigger system in built-in-triggers.ts. Users can define
 * any path they want for their webhooks - we recommend /webhooks/* for clarity.
 *
 * DEPRECATED: The legacy /webhooks/:ensembleName endpoint has been removed.
 * Use trigger configuration in ensemble YAML instead.
 *
 * For workflow resumption (HITL), use /callbacks/resume/:token
 *
 * @see https://docs.ensemble.ai/api/http/webhooks
 * @see https://docs.ensemble.ai/conductor/agents/hitl
 */
import { Hono } from 'hono';
import { CatalogLoader } from '../../runtime/catalog-loader.js';
import { createLogger } from '../../observability/index.js';
const app = new Hono();
const logger = createLogger({ serviceName: 'api-webhooks' });
/**
 * List all configured webhooks
 * GET /webhooks
 *
 * Returns a list of all webhook endpoints configured via ensemble triggers.
 */
app.get('/', async (c) => {
    const env = c.env;
    try {
        // Load all ensembles with webhook triggers from catalog
        const ensembles = await CatalogLoader.loadAllEnsembles(env);
        // Extract webhook configurations
        const webhooks = ensembles
            .filter((e) => e.trigger && e.trigger.length > 0)
            .flatMap((e) => (e.trigger || [])
            .filter((t) => t.type === 'webhook' || t.type === 'http')
            .map((t) => ({
            ensemble: e.name,
            path: t.path,
            methods: t.methods || ['POST'],
            public: t.public || false,
            auth: t.auth
                ? { type: 'type' in t.auth ? t.auth.type : t.auth.requirement }
                : undefined,
        })));
        return c.json({
            webhooks,
            count: webhooks.length,
            hint: 'User-defined webhooks are registered via trigger config in ensemble YAML. We recommend using /webhooks/* paths for clarity.',
        });
    }
    catch (error) {
        logger.error('Failed to list webhooks', error instanceof Error ? error : undefined);
        return c.json({
            error: 'Failed to list webhooks',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
export default app;
