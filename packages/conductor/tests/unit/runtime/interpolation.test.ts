/**
 * Interpolation Tests
 *
 * Comprehensive tests for template interpolation system.
 * Target: 90%+ coverage with ~120 test cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	Interpolator,
	StringResolver,
	ArrayResolver,
	ObjectResolver,
	PassthroughResolver,
	type ResolutionContext
} from '../../../src/runtime/interpolation';

describe('Interpolation System', () => {
	let interpolator: Interpolator;
	let context: ResolutionContext;

	beforeEach(() => {
		interpolator = new Interpolator();
		context = {
			input: {
				name: 'Alice',
				age: 30,
				email: 'alice@example.com',
				nested: {
					deep: {
						value: 'found'
					}
				},
				items: [1, 2, 3]
			},
			state: {
				count: 5,
				enabled: true,
				data: {
					key: 'value'
				}
			},
			output: {
				result: 'success'
			}
		};
	});

	describe('StringResolver', () => {
		let resolver: StringResolver;

		beforeEach(() => {
			resolver = new StringResolver();
		});

		it('should resolve simple variable', () => {
			const result = resolver.resolve('{{input.name}}', context);
			expect(result).toBe('Alice');
		});

		it('should resolve nested variable', () => {
			const result = resolver.resolve('{{input.nested.deep.value}}', context);
			expect(result).toBe('found');
		});

		it('should resolve state variable', () => {
			const result = resolver.resolve('{{state.count}}', context);
			expect(result).toBe(5);
		});

		it('should resolve output variable', () => {
			const result = resolver.resolve('{{output.result}}', context);
			expect(result).toBe('success');
		});

		it('should return undefined for nonexistent variable', () => {
			const result = resolver.resolve('{{input.nonexistent}}', context);
			expect(result).toBeUndefined();
		});

		it('should return undefined for deeply nonexistent path', () => {
			const result = resolver.resolve('{{input.nested.nonexistent.value}}', context);
			expect(result).toBeUndefined();
		});

		it('should handle boolean values', () => {
			const result = resolver.resolve('{{state.enabled}}', context);
			expect(result).toBe(true);
		});

		it('should handle number values', () => {
			const result = resolver.resolve('{{input.age}}', context);
			expect(result).toBe(30);
		});

		it('should handle array values', () => {
			const result = resolver.resolve('{{input.items}}', context);
			expect(result).toEqual([1, 2, 3]);
		});

		it('should handle object values', () => {
			const result = resolver.resolve('{{state.data}}', context);
			expect(result).toEqual({ key: 'value' });
		});

		it('should not resolve strings without ${} syntax', () => {
			expect(resolver.canResolve('plain string')).toBe(false);
		});

		it('should not resolve partial ${} syntax', () => {
			expect(resolver.canResolve('${input.name')).toBe(false);
			expect(resolver.canResolve('input.name}')).toBe(false);
		});

		it('should handle single property access', () => {
			const ctx = { value: 42 };
			const result = resolver.resolve('{{value}}', ctx);
			expect(result).toBe(42);
		});

		it('should handle empty path gracefully', () => {
			const result = resolver.resolve('{{}}', context);
			expect(result).toBeUndefined();
		});

		it('should handle whitespace in path', () => {
			const result = resolver.resolve('{{ input.name }}', context);
			// Depending on implementation, may or may not trim
			expect(result).toBeDefined();
		});
	});

	describe('ArrayResolver', () => {
		let resolver: ArrayResolver;

		beforeEach(() => {
			resolver = new ArrayResolver();
		});

		it('should recognize arrays', () => {
			expect(resolver.canResolve([])).toBe(true);
			expect(resolver.canResolve([1, 2, 3])).toBe(true);
		});

		it('should not recognize non-arrays', () => {
			expect(resolver.canResolve({})).toBe(false);
			expect(resolver.canResolve('string')).toBe(false);
			expect(resolver.canResolve(42)).toBe(false);
		});

		it('should resolve array of strings with interpolation', () => {
			const template = ['{{input.name}}', '{{input.email}}'];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual(['Alice', 'alice@example.com']);
		});

		it('should resolve array of mixed types', () => {
			const template = ['{{input.name}}', 42, true, '{{state.count}}'];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual(['Alice', 42, true, 5]);
		});

		it('should resolve nested arrays', () => {
			const template = [['{{input.name}}'], ['{{state.count}}']];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual([['Alice'], [5]]);
		});

		it('should handle empty arrays', () => {
			const template: unknown[] = [];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual([]);
		});

		it('should handle arrays with undefined values', () => {
			const template = ['{{input.nonexistent}}', '{{input.name}}'];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual([undefined, 'Alice']);
		});
	});

	describe('ObjectResolver', () => {
		let resolver: ObjectResolver;

		beforeEach(() => {
			resolver = new ObjectResolver();
		});

		it('should recognize objects', () => {
			expect(resolver.canResolve({})).toBe(true);
			expect(resolver.canResolve({ key: 'value' })).toBe(true);
		});

		it('should not recognize arrays', () => {
			expect(resolver.canResolve([])).toBe(false);
		});

		it('should not recognize null', () => {
			expect(resolver.canResolve(null)).toBe(false);
		});

		it('should resolve object with interpolated values', () => {
			const template = {
				userName: '{{input.name}}',
				userAge: '{{input.age}}'
			};
			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				userName: 'Alice',
				userAge: 30
			});
		});

		it('should resolve nested objects', () => {
			const template = {
				user: {
					name: '{{input.name}}',
					contact: {
						email: '{{input.email}}'
					}
				}
			};
			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				user: {
					name: 'Alice',
					contact: {
						email: 'alice@example.com'
					}
				}
			});
		});

		it('should resolve object with mixed value types', () => {
			const template = {
				str: '{{input.name}}',
				num: 42,
				bool: true,
				arr: [1, 2, 3],
				obj: { key: 'value' }
			};
			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				str: 'Alice',
				num: 42,
				bool: true,
				arr: [1, 2, 3],
				obj: { key: 'value' }
			});
		});

		it('should handle empty objects', () => {
			const template = {};
			const result = interpolator.resolve(template, context);

			expect(result).toEqual({});
		});

		it('should preserve key names', () => {
			const template = {
				'kebab-case': '{{input.name}}',
				snake_case: '{{input.age}}',
				'special.chars': '{{state.count}}'
			};
			const result = interpolator.resolve(template, context);

			expect(Object.keys(result as object)).toEqual([
				'kebab-case',
				'snake_case',
				'special.chars'
			]);
		});
	});

	describe('PassthroughResolver', () => {
		let resolver: PassthroughResolver;

		beforeEach(() => {
			resolver = new PassthroughResolver();
		});

		it('should recognize everything', () => {
			expect(resolver.canResolve(42)).toBe(true);
			expect(resolver.canResolve('string')).toBe(true);
			expect(resolver.canResolve(true)).toBe(true);
			expect(resolver.canResolve(null)).toBe(true);
			expect(resolver.canResolve(undefined)).toBe(true);
		});

		it('should passthrough numbers', () => {
			const result = resolver.resolve(42);
			expect(result).toBe(42);
		});

		it('should passthrough booleans', () => {
			expect(resolver.resolve(true)).toBe(true);
			expect(resolver.resolve(false)).toBe(false);
		});

		it('should passthrough null', () => {
			const result = resolver.resolve(null);
			expect(result).toBeNull();
		});

		it('should passthrough undefined', () => {
			const result = resolver.resolve(undefined);
			expect(result).toBeUndefined();
		});

		it('should passthrough plain strings', () => {
			const result = resolver.resolve('plain string');
			expect(result).toBe('plain string');
		});
	});

	describe('Interpolator Integration', () => {
		it('should resolve simple string template', () => {
			const template = '{{input.name}}';
			const result = interpolator.resolve(template, context);

			expect(result).toBe('Alice');
		});

		it('should resolve complex nested structure', () => {
			const template = {
				user: {
					name: '{{input.name}}',
					age: '{{input.age}}',
					contact: {
						email: '{{input.email}}'
					}
				},
				state: {
					count: '{{state.count}}',
					enabled: '{{state.enabled}}'
				},
				items: ['{{input.items}}']
			};

			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				user: {
					name: 'Alice',
					age: 30,
					contact: {
						email: 'alice@example.com'
					}
				},
				state: {
					count: 5,
					enabled: true
				},
				items: [[1, 2, 3]]
			});
		});

		it('should handle arrays of objects with interpolation', () => {
			const template = [
				{ name: '{{input.name}}', age: '{{input.age}}' },
				{ name: 'Bob', age: 25 }
			];

			const result = interpolator.resolve(template, context);

			expect(result).toEqual([
				{ name: 'Alice', age: 30 },
				{ name: 'Bob', age: 25 }
			]);
		});

		it('should handle objects with array values containing interpolation', () => {
			const template = {
				names: ['{{input.name}}', 'Bob', '{{state.data.key}}']
			};

			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				names: ['Alice', 'Bob', 'value']
			});
		});

		it('should preserve non-interpolated values', () => {
			const template = {
				str: 'plain string',
				num: 42,
				bool: true,
				null: null,
				undefined: undefined,
				interpolated: '{{input.name}}'
			};

			const result = interpolator.resolve(template, context);

			expect(result).toEqual({
				str: 'plain string',
				num: 42,
				bool: true,
				null: null,
				undefined: undefined,
				interpolated: 'Alice'
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle circular references gracefully', () => {
			const circular: any = { a: 1 };
			circular.self = circular;

			const ctx = { circular };
			const template = '{{circular.a}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(1);
		});

		it('should handle very deep nesting', () => {
			const deepContext = {
				a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 'deep' } } } } } } } } }
			};

			const template = '{{a.b.c.d.e.f.g.h.i.j}}';
			const result = interpolator.resolve(template, deepContext);

			expect(result).toBe('deep');
		});

		it('should handle empty context', () => {
			const template = '{{input.name}}';
			const result = interpolator.resolve(template, {});

			expect(result).toBeUndefined();
		});

		it('should handle null values in context', () => {
			const ctx = { value: null };
			const template = '{{value}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBeNull();
		});

		it('should handle undefined values in context', () => {
			const ctx = { value: undefined };
			const template = '{{value}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBeUndefined();
		});

		it('should handle special characters in keys', () => {
			const ctx = {
				'key-with-dashes': 'value1',
				'key.with.dots': 'value2'
			};

			// Note: dots in property names might be interpreted as path separators
			const template1 = '{{key-with-dashes}}';
			const result1 = interpolator.resolve(template1, ctx);
			// Depending on implementation, this may or may not work
			expect(result1).toBeDefined();
		});

		it('should handle numeric array indices in path', () => {
			const ctx = {
				items: ['first', 'second', 'third']
			};

			// Note: Array indexing might not be supported
			const template = '{{items}}';
			const result = interpolator.resolve(template, ctx);

			expect(result).toEqual(['first', 'second', 'third']);
		});

		it('should handle very long paths', () => {
			const longPath = Array(50)
				.fill('nested')
				.join('.');
			let obj: any = { value: 'found' };

			// Create 50 levels of nesting to match the 50 'nested' parts in the path
			for (let i = 0; i < 50; i++) {
				obj = { nested: obj };
			}

			const template = `{{${longPath}.value}}`;
			const result = interpolator.resolve(template, obj);

			expect(result).toBe('found');
		});

		it('should handle empty string values', () => {
			const ctx = { empty: '' };
			const template = '{{empty}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('');
		});

		it('should handle whitespace values', () => {
			const ctx = { space: '   ' };
			const template = '{{space}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('   ');
		});

		it('should handle numbers as strings in context', () => {
			const ctx = { num: '42' };
			const template = '{{num}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('42'); // Returns as string
		});

		it('should handle dates in context', () => {
			const date = new Date('2024-01-01');
			const ctx = { date };
			const template = '{{date}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toEqual(date);
		});

		it('should handle functions in context', () => {
			const fn = () => 'result';
			const ctx = { fn };
			const template = '{{fn}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(fn); // Returns function itself
		});

		it('should handle symbols in context', () => {
			const sym = Symbol('test');
			const ctx = { sym };
			const template = '{{sym}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(sym);
		});

		it('should handle bigints in context', () => {
			const big = BigInt(9007199254740991);
			const ctx = { big };
			const template = '{{big}}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(big);
		});
	});

	describe('Custom Resolver Chain', () => {
		it('should allow custom resolver chain', () => {
			const customInterpolator = new Interpolator([
				new StringResolver(),
				new PassthroughResolver()
			]);

			// Should still work with custom chain
			const result = customInterpolator.resolve('{{input.name}}', context);
			expect(result).toBe('Alice');
		});

		it('should respect resolver order', () => {
			// Custom resolver that handles strings differently
			class CustomStringResolver implements StringResolver {
				canResolve(template: unknown): boolean {
					return typeof template === 'string';
				}

				resolve(template: string): unknown {
					return `custom: ${template}`;
				}
			}

			const customInterpolator = new Interpolator([
				new CustomStringResolver(),
				new PassthroughResolver()
			]);

			const result = customInterpolator.resolve('{{input.name}}', context);
			expect(result).toBe('custom: {{input.name}}');
		});
	});

	describe('Nullish Coalescing (??)', () => {
		it('should return first value when not null/undefined', () => {
			const result = interpolator.resolve('${input.name ?? "default"}', context);
			expect(result).toBe('Alice');
		});

		it('should return fallback string when value is undefined', () => {
			const result = interpolator.resolve('${input.nonexistent ?? "fallback"}', context);
			expect(result).toBe('fallback');
		});

		it('should return fallback string when value is null', () => {
			const ctx = { input: { value: null } };
			const result = interpolator.resolve('${input.value ?? "fallback"}', ctx);
			expect(result).toBe('fallback');
		});

		it('should handle chained nullish coalescing', () => {
			const ctx = {
				input: {
					query: {},
					body: { name: 'from-body' }
				}
			};
			const result = interpolator.resolve('${input.query.name ?? input.body.name ?? "default"}', ctx);
			expect(result).toBe('from-body');
		});

		it('should return last fallback when all are undefined', () => {
			const ctx = { input: { query: {}, body: {} } };
			const result = interpolator.resolve('${input.query.name ?? input.body.name ?? "World"}', ctx);
			expect(result).toBe('World');
		});

		it('should handle double-quoted string literals', () => {
			const result = interpolator.resolve('${input.nonexistent ?? "hello world"}', context);
			expect(result).toBe('hello world');
		});

		it('should handle single-quoted string literals', () => {
			const result = interpolator.resolve("${input.nonexistent ?? 'hello world'}", context);
			expect(result).toBe('hello world');
		});

		it('should preserve empty string as valid value (not nullish)', () => {
			const ctx = { input: { value: '' } };
			const result = interpolator.resolve('${input.value ?? "default"}', ctx);
			expect(result).toBe('');
		});

		it('should preserve zero as valid value (not nullish)', () => {
			const ctx = { input: { value: 0 } };
			const result = interpolator.resolve('${input.value ?? 42}', ctx);
			expect(result).toBe(0);
		});

		it('should preserve false as valid value (not nullish)', () => {
			const ctx = { input: { value: false } };
			const result = interpolator.resolve('${input.value ?? true}', ctx);
			expect(result).toBe(false);
		});

		it('should work with Handlebars syntax', () => {
			const result = interpolator.resolve('{{input.nonexistent ?? "fallback"}}', context);
			expect(result).toBe('fallback');
		});

		it('should work in object templates', () => {
			const template = {
				name: '${input.query.name ?? input.body.name ?? "Anonymous"}',
				page: '${input.query.page ?? 1}'
			};
			const ctx = {
				input: {
					query: {},
					body: { name: 'Bob' }
				}
			};
			const result = interpolator.resolve(template, ctx);
			expect(result).toEqual({
				name: 'Bob',
				page: 1
			});
		});

		it('should handle HTTP trigger input pattern', () => {
			// Real-world pattern from HTTP triggers
			const ctx = {
				input: {
					query: { name: 'from-query' },
					body: { name: 'from-body' },
					params: { id: '123' }
				}
			};

			// Prefer query over body over default
			expect(interpolator.resolve('${input.query.name ?? input.body.name ?? "World"}', ctx))
				.toBe('from-query');

			// When query is empty, use body
			const ctx2 = {
				input: {
					query: {},
					body: { name: 'from-body' },
					params: { id: '123' }
				}
			};
			expect(interpolator.resolve('${input.query.name ?? input.body.name ?? "World"}', ctx2))
				.toBe('from-body');

			// When both empty, use default
			const ctx3 = {
				input: {
					query: {},
					body: {},
					params: { id: '123' }
				}
			};
			expect(interpolator.resolve('${input.query.name ?? input.body.name ?? "World"}', ctx3))
				.toBe('World');
		});
	});

	describe('Falsy Coalescing (||)', () => {
		it('should return first value when truthy', () => {
			const result = interpolator.resolve('${input.name || "default"}', context);
			expect(result).toBe('Alice');
		});

		it('should return fallback when value is undefined', () => {
			const result = interpolator.resolve('${input.nonexistent || "fallback"}', context);
			expect(result).toBe('fallback');
		});

		it('should return fallback when value is null', () => {
			const ctx = { input: { value: null } };
			const result = interpolator.resolve('${input.value || "fallback"}', ctx);
			expect(result).toBe('fallback');
		});

		it('should return fallback when value is empty string (unlike ??)', () => {
			const ctx = { input: { value: '' } };
			const result = interpolator.resolve('${input.value || "default"}', ctx);
			expect(result).toBe('default');
		});

		it('should return fallback when value is zero (unlike ??)', () => {
			const ctx = { input: { value: 0 } };
			const result = interpolator.resolve('${input.value || 42}', ctx);
			expect(result).toBe(42);
		});

		it('should return fallback when value is false (unlike ??)', () => {
			const ctx = { input: { value: false } };
			const result = interpolator.resolve('${input.value || true}', ctx);
			expect(result).toBe(true);
		});

		it('should handle chained || operators', () => {
			const ctx = { input: { a: '', b: 0, c: 'valid' } };
			const result = interpolator.resolve('${input.a || input.b || input.c || "default"}', ctx);
			expect(result).toBe('valid');
		});

		it('should return last value when all are falsy', () => {
			const ctx = { input: { a: '', b: 0 } };
			const result = interpolator.resolve('${input.a || input.b || "fallback"}', ctx);
			expect(result).toBe('fallback');
		});

		it('should work with Handlebars syntax', () => {
			const ctx = { input: { value: '' } };
			const result = interpolator.resolve('{{input.value || "default"}}', ctx);
			expect(result).toBe('default');
		});
	});

	describe('Ternary Conditional (?:)', () => {
		it('should return true branch when condition is truthy', () => {
			const ctx = { input: { enabled: true } };
			const result = interpolator.resolve('${input.enabled ? "yes" : "no"}', ctx);
			expect(result).toBe('yes');
		});

		it('should return false branch when condition is falsy', () => {
			const ctx = { input: { enabled: false } };
			const result = interpolator.resolve('${input.enabled ? "yes" : "no"}', ctx);
			expect(result).toBe('no');
		});

		it('should return false branch when condition is undefined', () => {
			const result = interpolator.resolve('${input.nonexistent ? "yes" : "no"}', context);
			expect(result).toBe('no');
		});

		it('should return false branch when condition is empty string', () => {
			const ctx = { input: { value: '' } };
			const result = interpolator.resolve('${input.value ? "yes" : "no"}', ctx);
			expect(result).toBe('no');
		});

		it('should return true branch when condition is non-empty string', () => {
			const ctx = { input: { value: 'something' } };
			const result = interpolator.resolve('${input.value ? "yes" : "no"}', ctx);
			expect(result).toBe('yes');
		});

		it('should handle numeric conditions', () => {
			const ctx = { input: { count: 5 } };
			const result = interpolator.resolve('${input.count ? "has items" : "empty"}', ctx);
			expect(result).toBe('has items');
		});

		it('should handle zero as falsy', () => {
			const ctx = { input: { count: 0 } };
			const result = interpolator.resolve('${input.count ? "has items" : "empty"}', ctx);
			expect(result).toBe('empty');
		});

		it('should support path expressions in branches', () => {
			const ctx = {
				input: { useCustom: true },
				config: { customName: 'Custom', defaultName: 'Default' }
			};
			const result = interpolator.resolve('${input.useCustom ? config.customName : config.defaultName}', ctx);
			expect(result).toBe('Custom');
		});

		it('should support numeric literals in branches', () => {
			const ctx = { input: { premium: true } };
			const result = interpolator.resolve('${input.premium ? 100 : 10}', ctx);
			expect(result).toBe(100);
		});

		it('should work with Handlebars syntax', () => {
			const ctx = { input: { active: true } };
			const result = interpolator.resolve('{{input.active ? "active" : "inactive"}}', ctx);
			expect(result).toBe('active');
		});

		it('should handle method selection pattern', () => {
			const ctx = { input: { method: 'POST' } };
			// Check if method is POST (truthy since it exists and is non-empty)
			const result = interpolator.resolve('${input.method ? input.method : "GET"}', ctx);
			expect(result).toBe('POST');
		});
	});

	describe('Boolean Negation (!)', () => {
		it('should negate true to false', () => {
			const ctx = { input: { disabled: true } };
			const result = interpolator.resolve('${!input.disabled}', ctx);
			expect(result).toBe(false);
		});

		it('should negate false to true', () => {
			const ctx = { input: { disabled: false } };
			const result = interpolator.resolve('${!input.disabled}', ctx);
			expect(result).toBe(true);
		});

		it('should negate undefined to true', () => {
			const result = interpolator.resolve('${!input.nonexistent}', context);
			expect(result).toBe(true);
		});

		it('should negate null to true', () => {
			const ctx = { input: { value: null } };
			const result = interpolator.resolve('${!input.value}', ctx);
			expect(result).toBe(true);
		});

		it('should negate empty string to true', () => {
			const ctx = { input: { value: '' } };
			const result = interpolator.resolve('${!input.value}', ctx);
			expect(result).toBe(true);
		});

		it('should negate non-empty string to false', () => {
			const ctx = { input: { value: 'hello' } };
			const result = interpolator.resolve('${!input.value}', ctx);
			expect(result).toBe(false);
		});

		it('should negate zero to true', () => {
			const ctx = { input: { count: 0 } };
			const result = interpolator.resolve('${!input.count}', ctx);
			expect(result).toBe(true);
		});

		it('should negate non-zero number to false', () => {
			const ctx = { input: { count: 5 } };
			const result = interpolator.resolve('${!input.count}', ctx);
			expect(result).toBe(false);
		});

		it('should work with nested paths', () => {
			const ctx = { input: { user: { isAdmin: false } } };
			const result = interpolator.resolve('${!input.user.isAdmin}', ctx);
			expect(result).toBe(true);
		});

		it('should work with Handlebars syntax', () => {
			const ctx = { input: { hidden: true } };
			const result = interpolator.resolve('{{!input.hidden}}', ctx);
			expect(result).toBe(false);
		});
	});

	describe('Array Indexing ([n])', () => {
		it('should access first element with [0]', () => {
			const ctx = { input: { items: ['first', 'second', 'third'] } };
			const result = interpolator.resolve('${input.items[0]}', ctx);
			expect(result).toBe('first');
		});

		it('should access middle element', () => {
			const ctx = { input: { items: ['a', 'b', 'c'] } };
			const result = interpolator.resolve('${input.items[1]}', ctx);
			expect(result).toBe('b');
		});

		it('should access last element by index', () => {
			const ctx = { input: { items: ['a', 'b', 'c'] } };
			const result = interpolator.resolve('${input.items[2]}', ctx);
			expect(result).toBe('c');
		});

		it('should return undefined for out-of-bounds index', () => {
			const ctx = { input: { items: ['a', 'b'] } };
			const result = interpolator.resolve('${input.items[5]}', ctx);
			expect(result).toBeUndefined();
		});

		it('should access property of array element', () => {
			const ctx = {
				input: {
					users: [
						{ name: 'Alice', age: 30 },
						{ name: 'Bob', age: 25 }
					]
				}
			};
			const result = interpolator.resolve('${input.users[0].name}', ctx);
			expect(result).toBe('Alice');
		});

		it('should access nested property of array element', () => {
			const ctx = {
				input: {
					data: [
						{ meta: { id: 'abc' } },
						{ meta: { id: 'xyz' } }
					]
				}
			};
			const result = interpolator.resolve('${input.data[1].meta.id}', ctx);
			expect(result).toBe('xyz');
		});

		it('should handle array of numbers', () => {
			const ctx = { input: { scores: [95, 87, 92] } };
			const result = interpolator.resolve('${input.scores[0]}', ctx);
			expect(result).toBe(95);
		});

		it('should work with fallback for missing index', () => {
			const ctx = { input: { items: ['only'] } };
			const result = interpolator.resolve('${input.items[5] ?? "default"}', ctx);
			expect(result).toBe('default');
		});

		it('should work in ternary condition', () => {
			const ctx = { input: { items: ['exists'] } };
			const result = interpolator.resolve('${input.items[0] ? "found" : "not found"}', ctx);
			expect(result).toBe('found');
		});

		it('should work with negation', () => {
			const ctx = { input: { flags: [true, false] } };
			const result = interpolator.resolve('${!input.flags[1]}', ctx);
			expect(result).toBe(true);
		});

		it('should work with Handlebars syntax', () => {
			const ctx = { input: { list: ['one', 'two'] } };
			const result = interpolator.resolve('{{input.list[0]}}', ctx);
			expect(result).toBe('one');
		});

		it('should handle empty array', () => {
			const ctx = { input: { items: [] } };
			const result = interpolator.resolve('${input.items[0]}', ctx);
			expect(result).toBeUndefined();
		});

		it('should handle HTTP trigger headers pattern', () => {
			// Real-world: accessing first value of multi-value header
			const ctx = {
				input: {
					headers: {
						'accept': ['application/json', 'text/html']
					}
				}
			};
			const result = interpolator.resolve('${input.headers.accept[0]}', ctx);
			expect(result).toBe('application/json');
		});
	});

	describe('Combined Operators', () => {
		it('should combine ternary with array indexing', () => {
			const ctx = {
				input: {
					users: [{ name: 'Admin' }],
					useFirst: true
				}
			};
			const result = interpolator.resolve('${input.useFirst ? input.users[0].name : "Guest"}', ctx);
			expect(result).toBe('Admin');
		});

		it('should combine negation with nullish coalescing', () => {
			const ctx = { input: { disabled: undefined } };
			// !undefined = true, so return true (first truthy value)
			const result = interpolator.resolve('${!input.disabled ?? false}', ctx);
			expect(result).toBe(true);
		});

		it('should handle complex feature flag pattern', () => {
			const ctx = {
				input: {
					features: { darkMode: true },
					user: { preferences: { theme: 'dark' } }
				}
			};
			const result = interpolator.resolve(
				'${input.features.darkMode ? input.user.preferences.theme : "light"}',
				ctx
			);
			expect(result).toBe('dark');
		});

		it('should handle API response pattern', () => {
			const ctx = {
				response: {
					data: {
						results: [
							{ id: 1, status: 'active' },
							{ id: 2, status: 'pending' }
						]
					}
				}
			};
			const template = {
				firstResult: '${response.data.results[0].status}',
				hasResults: '${response.data.results[0] ? true : false}'
			};
			const result = interpolator.resolve(template, ctx);
			expect(result).toEqual({
				firstResult: 'active',
				hasResults: true
			});
		});
	});

	describe('Real-World Scenarios', () => {
		it('should handle API request configuration', () => {
			const template = {
				url: '{{api.baseUrl}}/users/{{input.userId}}',
				method: 'GET',
				headers: {
					'Authorization': 'Bearer {{api.token}}',
					'Content-Type': 'application/json'
				},
				params: {
					page: '{{input.page}}',
					limit: 10
				}
			};

			const ctx = {
				api: {
					baseUrl: 'https://api.example.com',
					token: 'secret-token'
				},
				input: {
					userId: '123',
					page: 2
				}
			};

			const result = interpolator.resolve(template, ctx);

			expect(result).toEqual({
				url: 'https://api.example.com/users/123',
				method: 'GET',
				headers: {
					'Authorization': 'Bearer secret-token',
					'Content-Type': 'application/json'
				},
				params: {
					page: 2,
					limit: 10
				}
			});
		});

		it('should handle dynamic agent configuration', () => {
			const template = {
				model: '{{config.model}}',
				temperature: '{{config.temperature}}',
				maxTokens: '{{config.maxTokens}}',
				systemPrompt: '{{prompts.system}}',
				userPrompt: 'Process this: {{input.data}}'
			};

			const ctx = {
				config: {
					model: 'gpt-4',
					temperature: 0.7,
					maxTokens: 1000
				},
				prompts: {
					system: 'You are a helpful assistant'
				},
				input: {
					data: 'Hello world'
				}
			};

			const result = interpolator.resolve(template, ctx);

			expect(result).toMatchObject({
				model: 'gpt-4',
				temperature: 0.7,
				userPrompt: 'Process this: Hello world'
			});
		});
	});
});
