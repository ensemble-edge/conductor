/**
 * Authentication Middleware
 *
 * Validates API keys and sets auth context.
 */
export function createAuthMiddleware(config) {
    return async (c, next) => {
        // Extract API key from header
        const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
        // Check if anonymous access is allowed
        if (!apiKey && config.allowAnonymous) {
            c.set('auth', {
                authenticated: false,
                tier: 'free',
            });
            await next();
            return;
        }
        // Validate API key
        if (!apiKey) {
            return c.json({
                error: 'Unauthorized',
                message: 'API key is required',
                timestamp: Date.now(),
            }, 401);
        }
        // Check if API key is valid
        const isValid = config.apiKeys?.includes(apiKey);
        if (!isValid) {
            return c.json({
                error: 'Unauthorized',
                message: 'Invalid credentials',
                timestamp: Date.now(),
            }, 401);
        }
        // Set auth context
        // In production, look up user details from database
        c.set('auth', {
            authenticated: true,
            apiKey: apiKey,
            userId: `user_${apiKey.substring(0, 8)}`,
            tier: 'pro',
        });
        await next();
    };
}
/**
 * Require authentication middleware
 */
export function requireAuth() {
    return async (c, next) => {
        const auth = c.get('auth');
        if (!auth?.authenticated) {
            return c.json({
                error: 'Unauthorized',
                message: 'Authentication required',
                timestamp: Date.now(),
            }, 401);
        }
        await next();
    };
}
