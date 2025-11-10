/**
 * Page Member Tests
 *
 * Comprehensive tests for Page member functionality including:
 * - Server-side rendering (SSR)
 * - Static page generation
 * - Hybrid rendering
 * - Client-side hydration (htmx, progressive, islands)
 * - Page head management (meta tags, SEO)
 * - Layout application
 * - Caching strategies
 * - Error page rendering
 * - Props passing and data binding
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PageMember } from '../page-member.js';
// Mock KV namespace for page cache
class MockKVNamespace {
    constructor() {
        this.store = new Map();
    }
    async get(key, type) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiration && Date.now() > item.expiration) {
            this.store.delete(key);
            return null;
        }
        return type === 'json' ? JSON.parse(item.value) : item.value;
    }
    async put(key, value, options) {
        const expiration = options?.expirationTtl
            ? Date.now() + options.expirationTtl * 1000
            : undefined;
        this.store.set(key, { value, expiration });
    }
    async delete(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}
describe('PageMember', () => {
    let mockCache;
    let mockContext;
    beforeEach(() => {
        mockCache = new MockKVNamespace();
        mockContext = {
            input: {},
            env: {
                PAGE_CACHE: mockCache
            },
            logger: {
                info: () => { },
                warn: () => { },
                error: () => { },
                debug: () => { }
            }
        };
    });
    describe('Configuration Validation', () => {
        it('should throw error if no component or componentPath provided', () => {
            const config = {
                name: 'test-page',
                type: 'Page'
            };
            expect(() => new PageMember(config)).toThrow('Page member requires either component or componentPath');
        });
        it('should throw error if invalid render mode', () => {
            const config = {
                name: 'test-page',
                type: 'Page',
                component: '<div>Test</div>',
                renderMode: 'invalid'
            };
            expect(() => new PageMember(config)).toThrow('Invalid render mode');
        });
        it('should throw error if invalid hydration strategy', () => {
            const config = {
                name: 'test-page',
                type: 'Page',
                component: '<div>Test</div>',
                hydration: {
                    strategy: 'invalid'
                }
            };
            expect(() => new PageMember(config)).toThrow('Invalid hydration strategy');
        });
        it('should accept valid configuration', () => {
            const config = {
                name: 'test-page',
                type: 'Page',
                component: '<div>Test</div>',
                renderMode: 'ssr'
            };
            const member = new PageMember(config);
            expect(member).toBeDefined();
            expect(member.name).toBe('test-page');
        });
    });
    describe('Server-Side Rendering (SSR)', () => {
        it('should render simple page with SSR', async () => {
            const config = {
                name: 'ssr-page',
                type: 'Page',
                component: '<div>Hello World</div>',
                renderMode: 'ssr',
                head: {
                    title: 'Test Page'
                }
            };
            const member = new PageMember(config);
            const input = {
                props: {}
            };
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.html).toBeDefined();
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.html).toContain('<title>Test Page</title>');
            expect(result.html).toContain('Hello World');
            expect(result.status).toBe(200);
            expect(result.renderTime).toBeGreaterThanOrEqual(0);
        });
        it('should pass props to component', async () => {
            const config = {
                name: 'props-page',
                type: 'Page',
                component: '<div>{{name}}</div>',
                renderMode: 'ssr'
            };
            const member = new PageMember(config);
            const input = {
                props: { name: 'Alice' }
            };
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.props).toEqual({ name: 'Alice' });
        });
        it('should merge data with props', async () => {
            const config = {
                name: 'data-page',
                type: 'Page',
                component: '<div>Page</div>',
                renderMode: 'ssr'
            };
            const member = new PageMember(config);
            const input = {
                data: { userId: '123' },
                props: { theme: 'dark' }
            };
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.props).toEqual({
                userId: '123',
                theme: 'dark'
            });
        });
        it('should include request context in props', async () => {
            const config = {
                name: 'request-page',
                type: 'Page',
                component: '<div>Page</div>',
                renderMode: 'ssr'
            };
            const member = new PageMember(config);
            const input = {
                request: {
                    url: '/dashboard',
                    method: 'GET',
                    headers: {},
                    query: { page: '1' },
                    params: {},
                    cookies: {}
                }
            };
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.props?.request).toEqual(input.request);
        });
    });
    describe('Static Rendering', () => {
        it('should render static page', async () => {
            const config = {
                name: 'static-page',
                type: 'Page',
                component: '<div>Static Content</div>',
                renderMode: 'static',
                head: {
                    title: 'Static Page'
                }
            };
            const member = new PageMember(config);
            const input = {};
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.html).toContain('Static Content');
            expect(result.html).toContain('<title>Static Page</title>');
        });
    });
    describe('Hybrid Rendering', () => {
        it('should render hybrid page with hydration markers', async () => {
            const config = {
                name: 'hybrid-page',
                type: 'Page',
                component: '<div>Hybrid Content</div>',
                renderMode: 'hybrid',
                hydration: {
                    strategy: 'progressive'
                }
            };
            const member = new PageMember(config);
            const input = {
                props: { userId: '123' }
            };
            const result = (await member['run']({
                ...mockContext,
                input
            }));
            expect(result.html).toContain('Hybrid Content');
            expect(result.html).toContain('data-hydrate="true"');
            expect(result.html).toContain('data-props');
        });
    });
});
