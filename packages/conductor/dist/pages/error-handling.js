/**
 * Error handling utilities for Pages
 */
/**
 * Register 404 handler with custom page
 */
export function register404Handler(app, notFoundPage) {
    app.notFound(async (c) => {
        if (!notFoundPage) {
            return c.html('<h1>404 Not Found</h1>', 404);
        }
        try {
            const result = await notFoundPage.execute({
                input: {
                    path: c.req.path,
                    method: c.req.method,
                    message: 'Page not found',
                    searchEnabled: true,
                    helpfulLinks: [
                        { text: 'Home', url: '/' },
                        { text: 'Blog', url: '/blog' },
                    ],
                },
                env: c.env,
                ctx: c.executionCtx,
                state: {},
                previousOutputs: {},
            });
            if (!result.success) {
                console.error('404 page render error:', result.error);
                return c.html('<h1>404 Not Found</h1>', 404);
            }
            const output = result.output;
            return c.html(output.html, 404, output.headers);
        }
        catch (error) {
            console.error('404 page execution error:', error);
            return c.html('<h1>404 Not Found</h1>', 404);
        }
    });
}
/**
 * Register 500 handler with custom page
 */
export function register500Handler(app, errorPage) {
    app.onError(async (err, c) => {
        console.error('Unhandled page error:', err);
        if (!errorPage) {
            return c.html('<h1>500 Internal Server Error</h1>', 500);
        }
        try {
            const result = await errorPage.execute({
                input: {
                    error: err.message,
                    stack: err.stack,
                    path: c.req.path,
                },
                env: c.env,
                ctx: c.executionCtx,
                state: {},
                previousOutputs: {},
            });
            if (!result.success) {
                return c.html('<h1>500 Internal Server Error</h1>', 500);
            }
            const output = result.output;
            return c.html(output.html, 500, output.headers);
        }
        catch (error) {
            console.error('500 page execution error:', error);
            return c.html('<h1>500 Internal Server Error</h1>', 500);
        }
    });
}
