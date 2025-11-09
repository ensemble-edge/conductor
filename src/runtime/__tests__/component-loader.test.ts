/**
 * Component Loader Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentLoader, createComponentLoader } from '../component-loader.js';

describe('ComponentLoader', () => {
	let mockKV: any;
	let mockCache: any;
	let loader: ComponentLoader;

	beforeEach(() => {
		// Mock KV namespace
		mockKV = {
			get: vi.fn(),
			getWithMetadata: vi.fn(),
			list: vi.fn()
		};

		// Mock Conductor Cache (not Cache API)
		mockCache = {
			get: vi.fn().mockResolvedValue({ success: true, value: null }),
			set: vi.fn().mockResolvedValue({ success: true }),
			delete: vi.fn().mockResolvedValue({ success: true }),
			has: vi.fn().mockResolvedValue({ success: true, value: false }),
			clear: vi.fn().mockResolvedValue({ success: true }),
			invalidateByTag: vi.fn().mockResolvedValue({ success: true })
		};

		loader = new ComponentLoader({
			kv: mockKV,
			cache: mockCache
		});
	});

	describe('parseURI', () => {
		it('should parse URI with version', () => {
			const result = loader.parseURI('template://components/header@v1.0.0');

			expect(result).toEqual({
				protocol: 'template',
				path: 'components/header',
				version: 'v1.0.0',
				originalURI: 'template://components/header@v1.0.0'
			});
		});

		it('should default to "latest" when version not specified', () => {
			const result = loader.parseURI('template://components/header');

			expect(result).toEqual({
				protocol: 'template',
				path: 'components/header',
				version: 'latest',
				originalURI: 'template://components/header'
			});
		});

		it('should parse prompt URIs', () => {
			const result = loader.parseURI('prompt://analyze-company@v2.1.0');

			expect(result).toEqual({
				protocol: 'prompt',
				path: 'analyze-company',
				version: 'v2.1.0',
				originalURI: 'prompt://analyze-company@v2.1.0'
			});
		});

		it('should parse query URIs', () => {
			const result = loader.parseURI('query://user-analytics');

			expect(result).toEqual({
				protocol: 'query',
				path: 'user-analytics',
				version: 'latest',
				originalURI: 'query://user-analytics'
			});
		});

		it('should parse form URIs', () => {
			const result = loader.parseURI('form://contact@prod');

			expect(result).toEqual({
				protocol: 'form',
				path: 'contact',
				version: 'prod',
				originalURI: 'form://contact@prod'
			});
		});

		it('should parse page URIs', () => {
			const result = loader.parseURI('page://Dashboard@latest');

			expect(result).toEqual({
				protocol: 'page',
				path: 'Dashboard',
				version: 'latest',
				originalURI: 'page://Dashboard@latest'
			});
		});

		it('should handle nested paths', () => {
			const result = loader.parseURI('template://layouts/dashboard/main@v1.0.0');

			expect(result).toEqual({
				protocol: 'template',
				path: 'layouts/dashboard/main',
				version: 'v1.0.0',
				originalURI: 'template://layouts/dashboard/main@v1.0.0'
			});
		});

		it('should throw on invalid URI format', () => {
			expect(() => loader.parseURI('invalid-uri')).toThrow('Invalid component URI');
			expect(() => loader.parseURI('template:/missing-slashes')).toThrow('Invalid component URI');
			expect(() => loader.parseURI('')).toThrow('Invalid component URI');
		});

		it('should throw on invalid protocol', () => {
			expect(() => loader.parseURI('invalid://components/header@latest'))
				.toThrow('Invalid protocol: invalid');
		});

		it('should handle main branch version', () => {
			const result = loader.parseURI('template://components/header@main');

			expect(result.version).toBe('main');
		});

		it('should handle custom version tags', () => {
			const result = loader.parseURI('template://components/header@preview');

			expect(result.version).toBe('preview');
		});
	});

	describe('load', () => {
		it('should load component from KV', async () => {
			const content = '<h1>{{title}}</h1>';
			mockKV.get.mockResolvedValue(content);

			const result = await loader.load('template://components/header@v1.0.0');

			expect(result).toBe(content);
			expect(mockKV.get).toHaveBeenCalledWith('templates/components/header@v1.0.0', 'text');
		});

		it('should return cached component if available', async () => {
			const cachedContent = '<h1>Cached</h1>';
			mockCache.get.mockResolvedValue({ success: true, value: cachedContent });

			const result = await loader.load('template://components/header@latest');

			expect(result).toBe(cachedContent);
			expect(mockKV.get).not.toHaveBeenCalled();
		});

		it('should cache component after loading from KV', async () => {
			const content = '<h1>{{title}}</h1>';
			mockKV.get.mockResolvedValue(content);

			await loader.load('template://components/header@v1.0.0');

			expect(mockCache.set).toHaveBeenCalledWith(
				'components:template://components/header@v1.0.0',
				content,
				{ ttl: 3600 }
			);
		});

		it('should bypass cache when bypass option is true', async () => {
			const cachedContent = '<h1>Cached</h1>';
			const freshContent = '<h1>Fresh</h1>';

			mockCache.get.mockResolvedValue({ success: true, value: cachedContent });
			mockKV.get.mockResolvedValue(freshContent);

			const result = await loader.load('template://components/header@v1.0.0', {
				cache: { bypass: true }
			});

			expect(result).toBe(freshContent);
			expect(mockKV.get).toHaveBeenCalled();
			expect(mockCache.get).not.toHaveBeenCalled();
			expect(mockCache.set).not.toHaveBeenCalled();
		});

		it('should use custom TTL when provided', async () => {
			const content = '<h1>{{title}}</h1>';
			mockKV.get.mockResolvedValue(content);

			await loader.load('template://components/header@v1.0.0', {
				cache: { ttl: 7200 }
			});

			expect(mockCache.set).toHaveBeenCalledWith(
				'components:template://components/header@v1.0.0',
				content,
				{ ttl: 7200 }
			);
		});

		it('should use default TTL when not specified', async () => {
			const content = '<h1>{{title}}</h1>';
			mockKV.get.mockResolvedValue(content);

			await loader.load('template://components/header@v1.0.0', {});

			expect(mockCache.set).toHaveBeenCalledWith(
				'components:template://components/header@v1.0.0',
				content,
				{ ttl: 3600 }
			);
		});

		it('should bypass cache but still load from KV', async () => {
			const content = '<h1>Fresh Content</h1>';
			mockKV.get.mockResolvedValue(content);

			const result = await loader.load('template://components/header@v1.0.0', {
				cache: { bypass: true }
			});

			expect(result).toBe(content);
			expect(mockCache.get).not.toHaveBeenCalled();
		});

		it('should default to latest version', async () => {
			const content = '<h1>Latest</h1>';
			mockKV.get.mockResolvedValue(content);

			await loader.load('template://components/header');

			expect(mockKV.get).toHaveBeenCalledWith('templates/components/header@latest', 'text');
		});

		it('should throw when component not found', async () => {
			mockKV.get.mockResolvedValue(null);

			await expect(loader.load('template://components/missing@v1.0.0'))
				.rejects.toThrow('Component not found');
		});

		it('should load prompt from correct KV key', async () => {
			const content = 'Analyze this company...';
			mockKV.get.mockResolvedValue(content);

			await loader.load('prompt://analyze-company@v2.0.0');

			expect(mockKV.get).toHaveBeenCalledWith('prompts/analyze-company@v2.0.0', 'text');
		});

		it('should load query from correct KV key', async () => {
			const content = 'SELECT * FROM users WHERE active = true';
			mockKV.get.mockResolvedValue(content);

			await loader.load('query://active-users@latest');

			expect(mockKV.get).toHaveBeenCalledWith('queries/active-users@latest', 'text');
		});

		it('should provide helpful error message with deployment instructions', async () => {
			mockKV.get.mockResolvedValue(null);

			try {
				await loader.load('template://components/header@v1.0.0');
				expect.fail('Should have thrown error');
			} catch (error: any) {
				expect(error.message).toContain('Component not found');
				expect(error.message).toContain('edgit components add');
				expect(error.message).toContain('edgit tag create');
				expect(error.message).toContain('edgit deploy set');
			}
		});
	});

	describe('loadJSON', () => {
		it('should load and parse JSON component', async () => {
			const jsonContent = JSON.stringify({ foo: 'bar', count: 42 });
			mockKV.get.mockResolvedValue(jsonContent);

			const result = await loader.loadJSON('config://email-settings@latest');

			expect(result).toEqual({ foo: 'bar', count: 42 });
		});

		it('should throw on invalid JSON', async () => {
			mockKV.get.mockResolvedValue('not valid json');

			await expect(loader.loadJSON('config://settings@latest'))
				.rejects.toThrow('Failed to parse JSON component');
		});

		it('should load form definition as JSON', async () => {
			const formDef = JSON.stringify({
				fields: [
					{ name: 'email', type: 'email', required: true }
				]
			});
			mockKV.get.mockResolvedValue(formDef);

			const result = await loader.loadJSON('form://contact@v1.0.0');

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0].name).toBe('email');
		});
	});

	describe('loadCompiled', () => {
		it('should load and evaluate compiled component', async () => {
			const compiledCode = `
				exports.default = function Component(props) {
					return '<div>' + props.text + '</div>';
				};
			`;
			mockKV.get.mockResolvedValue(compiledCode);

			const component = await loader.loadCompiled('component://Button@latest');

			expect(typeof component).toBe('function');
			expect(component({ text: 'Click me' })).toBe('<div>Click me</div>');
		});

		it('should handle compiled page exports', async () => {
			const compiledPage = `
				exports.default = function Dashboard(props) {
					return '<h1>' + props.title + '</h1>';
				};
				exports.metadata = { title: 'Dashboard' };
			`;
			mockKV.get.mockResolvedValue(compiledPage);

			const page = await loader.loadCompiled<any>('page://Dashboard@v1.0.0');

			expect(typeof page).toBe('function');
			expect(page({ title: 'My Dashboard' })).toBe('<h1>My Dashboard</h1>');
		});

		it('should throw on compilation error', async () => {
			mockKV.get.mockResolvedValue('invalid javascript code }{');

			await expect(loader.loadCompiled('component://Broken@latest'))
				.rejects.toThrow('Failed to load compiled component');
		});
	});

	describe('exists', () => {
		it('should return true if component exists', async () => {
			mockKV.getWithMetadata.mockResolvedValue({
				value: 'content',
				metadata: {}
			});

			const result = await loader.exists('template://components/header@v1.0.0');

			expect(result).toBe(true);
		});

		it('should return false if component does not exist', async () => {
			mockKV.getWithMetadata.mockResolvedValue({
				value: null,
				metadata: null
			});

			const result = await loader.exists('template://components/missing@v1.0.0');

			expect(result).toBe(false);
		});

		it('should return false on error', async () => {
			mockKV.getWithMetadata.mockRejectedValue(new Error('Network error'));

			const result = await loader.exists('template://components/header@v1.0.0');

			expect(result).toBe(false);
		});

		it('should check with default version', async () => {
			mockKV.getWithMetadata.mockResolvedValue({ value: 'content', metadata: {} });

			await loader.exists('template://components/header');

			expect(mockKV.getWithMetadata).toHaveBeenCalledWith('templates/components/header@latest');
		});
	});

	describe('listVersions', () => {
		it('should list all versions of a component', async () => {
			mockKV.list.mockResolvedValue({
				keys: [
					{ name: 'templates/components/header@v1.0.0' },
					{ name: 'templates/components/header@v1.1.0' },
					{ name: 'templates/components/header@latest' }
				]
			});

			const versions = await loader.listVersions('template', 'components/header');

			expect(versions).toEqual(['v1.0.0', 'v1.1.0', 'latest']);
		});

		it('should return empty array if no versions exist', async () => {
			mockKV.list.mockResolvedValue({ keys: [] });

			const versions = await loader.listVersions('template', 'components/missing');

			expect(versions).toEqual([]);
		});

		it('should list versions for prompts', async () => {
			mockKV.list.mockResolvedValue({
				keys: [
					{ name: 'prompts/analyze-company@v1.0.0' },
					{ name: 'prompts/analyze-company@v2.0.0' }
				]
			});

			const versions = await loader.listVersions('prompt', 'analyze-company');

			expect(versions).toEqual(['v1.0.0', 'v2.0.0']);
		});
	});

	describe('invalidateCache', () => {
		it('should delete component from cache', async () => {
			await loader.invalidateCache('template://components/header@v1.0.0');

			expect(mockCache.delete).toHaveBeenCalledWith('components:template://components/header@v1.0.0');
		});

		it('should handle missing cache gracefully', async () => {
			const loaderWithoutCache = new ComponentLoader({ kv: mockKV });

			await expect(loaderWithoutCache.invalidateCache('template://header'))
				.resolves.not.toThrow();
		});
	});

	describe('createComponentLoader', () => {
		it('should create ComponentLoader instance', () => {
			const loader = createComponentLoader({ kv: mockKV });

			expect(loader).toBeInstanceOf(ComponentLoader);
		});

		it('should accept custom default version', () => {
			const loader = createComponentLoader({
				kv: mockKV,
				defaultVersion: 'main'
			});

			const parsed = loader.parseURI('template://components/header');

			expect(parsed.version).toBe('main');
		});
	});

	describe('edge cases', () => {
		it('should handle URIs with special characters in path', () => {
			const result = loader.parseURI('template://components/my-component_v2@latest');

			expect(result.path).toBe('components/my-component_v2');
		});

		it('should handle semver versions', () => {
			const result = loader.parseURI('template://header@v1.2.3-beta.1');

			expect(result.version).toBe('v1.2.3-beta.1');
		});

		it('should handle date-based versions', () => {
			const result = loader.parseURI('template://header@2025-01-09');

			expect(result.version).toBe('2025-01-09');
		});
	});
});
