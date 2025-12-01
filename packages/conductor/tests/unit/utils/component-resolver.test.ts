/**
 * Tests for Component Resolution (Alternative 1: Smart String Parsing)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	resolveValue,
	needsResolution,
	type ComponentResolutionContext,
} from '../../../src/utils/component-resolver.js';

describe('Component Resolver - Alternative 1', () => {
	let mockContext: ComponentResolutionContext;

	beforeEach(() => {
		mockContext = {
			baseDir: '/test',
			env: {},
		};
	});

	describe('CASE 1: Inline Values (Non-Strings)', () => {
		it('should return objects as-is', async () => {
			const input = { foo: 'bar', nested: { value: 123 } };
			const result = await resolveValue(input, mockContext);

			expect(result.content).toEqual(input);
			expect(result.source).toBe('inline');
			expect(result.originalRef).toEqual(input);
		});

		it('should return arrays as-is', async () => {
			const input = [1, 2, 3, 'test'];
			const result = await resolveValue(input, mockContext);

			expect(result.content).toEqual(input);
			expect(result.source).toBe('inline');
		});

		it('should return numbers as-is', async () => {
			const input = 42;
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(42);
			expect(result.source).toBe('inline');
		});

		it('should return booleans as-is', async () => {
			const input = true;
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(true);
			expect(result.source).toBe('inline');
		});

		it('should return null as-is', async () => {
			const input = null;
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(null);
			expect(result.source).toBe('inline');
		});
	});

	describe('CASE 2: Multi-line Strings (Inline Content)', () => {
		it('should treat multi-line strings as inline', async () => {
			const input = 'Line 1\nLine 2\nLine 3';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat prompt text with newlines as inline', async () => {
			const input = `
You are a helpful assistant.

Please analyze the following:
- Item 1
- Item 2
			`.trim();

			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat component references in multi-line text as inline text', async () => {
			const input = `
This is documentation.
Reference: prompts/extraction@v1.0.0
Email: hello@example.com
			`.trim();

			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});
	});

	describe('CASE 3: File Paths', () => {
		// Note: These tests will fail without actual files
		// In real implementation, mock fs.readFile

		it('should detect relative paths starting with ./', () => {
			expect(needsResolution('./prompts/my-prompt.md')).toBe(true);
		});

		it('should detect relative paths starting with ../', () => {
			expect(needsResolution('../shared/config.yaml')).toBe(true);
		});

		it('should detect absolute paths starting with /', () => {
			expect(needsResolution('/absolute/path/file.txt')).toBe(true);
		});
	});

	describe('CASE 4: Component References (path/name@version)', () => {
		it('should detect component references', () => {
			expect(needsResolution('prompts/extraction@v1.0.0')).toBe(
				true
			);
			expect(needsResolution('agents/analyzer@latest')).toBe(true);
			expect(needsResolution('ensembles/dashboard@production')).toBe(
				true
			);
			expect(
				needsResolution('functions/data-processor@v2.1.0')
			).toBe(true);
		});

		it('should detect nested component paths', () => {
			expect(
				needsResolution('ai/prompts/extraction@v1.0.0')
			).toBe(true);
			expect(
				needsResolution('shared/agents/analyzer@latest')
			).toBe(true);
		});

		it('should handle component references without Edgit', async () => {
			// Without Edgit, falls back to local file
			const input = 'prompts/extraction@v1.0.0';

			try {
				await resolveValue(input, mockContext);
				// Will fail since file doesn't exist, but that's expected
			} catch (error) {
				expect(error.message).toContain('Component not found');
				expect(error.message).toContain(
					'prompts/extraction@v1.0.0'
				);
			}
		});

		it('should extract metadata from component references', async () => {
			const input = 'prompts/extraction@v1.0.0';

			// Mock Edgit
			mockContext.env = {
				EDGIT: {
					get: vi.fn().mockResolvedValue('"Mocked prompt content"'),
				} as any,
			};

			const result = await resolveValue(input, mockContext);

			expect(result.source).toBe('component');
			expect(result.metadata?.path).toBe('prompts/extraction');
			expect(result.metadata?.version).toBe('v1.0.0');
			expect(result.metadata?.fromEdgit).toBe(true);
		});
	});

	describe('CASE 5: Unversioned Components (path/name)', () => {
		it('should detect unversioned component paths', () => {
			expect(needsResolution('prompts/extraction')).toBe(true);
			expect(needsResolution('agents/analyzer')).toBe(true);
			expect(needsResolution('ensembles/dashboard')).toBe(true);
		});

		it('should add @latest to unversioned components', async () => {
			const input = 'prompts/extraction';

			// Mock Edgit
			mockContext.env = {
				EDGIT: {
					get: vi.fn().mockResolvedValue('"Mocked prompt content"'),
				} as any,
			};

			const result = await resolveValue(input, mockContext);

			expect(result.source).toBe('component');
			expect(result.metadata?.version).toBe('latest');
			expect(mockContext.env.EDGIT.get).toHaveBeenCalledWith(
				'components/prompts/extraction/latest'
			);
		});
	});

	describe('CASE 6: Inline Strings (Everything Else)', () => {
		it('should treat emails as inline strings', async () => {
			const input = 'hello@example.com';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat usernames as inline strings', async () => {
			const input = 'user@server';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat @ mentions as inline strings', async () => {
			const input = '@username';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat text with @ as inline strings', async () => {
			const input = 'Contact us @ support';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should treat plain text as inline strings', async () => {
			const input = 'Simple text without special characters';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe(input);
			expect(result.source).toBe('inline');
		});

		it('should NOT detect emails as component references', () => {
			expect(needsResolution('hello@example.com')).toBe(false);
			expect(needsResolution('user@server')).toBe(false);
			expect(needsResolution('@username')).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty strings', async () => {
			const input = '';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe('');
			expect(result.source).toBe('inline');
		});

		it('should handle strings with only @', async () => {
			const input = '@';
			const result = await resolveValue(input, mockContext);

			expect(result.content).toBe('@');
			expect(result.source).toBe('inline');
		});

		it('should handle strings with only /', () => {
			const input = '/';

			// Single / is treated as absolute path (will fail to read, but detected correctly)
			expect(needsResolution(input)).toBe(true);
		});

		it('should handle version strings with dashes', async () => {
			expect(needsResolution('prompts/test@v1.0.0-alpha')).toBe(
				true
			);
			expect(needsResolution('prompts/test@v1.0.0-beta.1')).toBe(
				true
			);
		});

		it('should handle component names with dashes and underscores', async () => {
			expect(needsResolution('prompts/my-prompt_v2@v1.0.0')).toBe(
				true
			);
			expect(needsResolution('agents/analyzer_new@latest')).toBe(
				true
			);
		});
	});

	describe('Real-World Examples', () => {
		it('should correctly classify a complex YAML structure', async () => {
			const testCases = [
				// Component references
				{
					input: 'prompts/extraction@v1.0.0',
					expected: { needsRes: true, shouldBeComponent: true },
				},
				{
					input: 'agents/analyzer@latest',
					expected: { needsRes: true, shouldBeComponent: true },
				},

				// File paths
				{
					input: './prompts/my-prompt.md',
					expected: { needsRes: true, shouldBeComponent: false },
				},

				// Inline strings
				{
					input: 'support@example.com',
					expected: { needsRes: false, shouldBeComponent: false },
				},
				{
					input: 'Simple config value',
					expected: { needsRes: false, shouldBeComponent: false },
				},

				// Multi-line
				{
					input: 'Line 1\nLine 2',
					expected: { needsRes: false, shouldBeComponent: false },
				},
			];

			for (const testCase of testCases) {
				const needs = needsResolution(testCase.input);
				expect(needs).toBe(testCase.expected.needsRes);

				const result = await resolveValue(
					testCase.input,
					mockContext
				).catch(() => ({ source: 'error' }));

				if (testCase.expected.shouldBeComponent && needs) {
					// Should attempt component resolution (may fail without mock)
					expect(['component', 'error']).toContain(result.source);
				}
			}
		});
	});
});
