/**
 * HTTP testing utilities
 */
/**
 * Make an HTTP request with retries and assertions
 */
export async function testEndpoint(url, options = {}) {
    const { expectedStatus = 200, headers = {}, retries = 3, retryDelay = 1000 } = options;
    let lastError = null;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { headers });
            if (response.status !== expectedStatus) {
                throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
            }
            const body = await response.text();
            let json = undefined;
            try {
                json = JSON.parse(body);
            }
            catch {
                // Not JSON, that's fine
            }
            return { response, body, json };
        }
        catch (error) {
            lastError = error;
            if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
        }
    }
    throw lastError || new Error('Request failed');
}
/**
 * Test a JSON API endpoint
 */
export async function testJsonEndpoint(url, options = {}) {
    const { method = 'GET', body, ...restOptions } = options;
    const fetchOptions = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...restOptions.headers,
        },
    };
    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }
    const response = await fetch(url, fetchOptions);
    if (restOptions.expectedStatus && response.status !== restOptions.expectedStatus) {
        const text = await response.text();
        throw new Error(`Expected status ${restOptions.expectedStatus}, got ${response.status}. Body: ${text}`);
    }
    return response.json();
}
