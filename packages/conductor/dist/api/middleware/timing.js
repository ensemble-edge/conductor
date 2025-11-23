/**
 * Timing Middleware
 *
 * Tracks request duration and adds timing headers.
 */
export function timing() {
    return async (c, next) => {
        const startTime = Date.now();
        c.set('startTime', startTime);
        await next();
        const duration = Date.now() - startTime;
        c.header('X-Response-Time', `${duration}ms`);
    };
}
