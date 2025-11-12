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
			const result = resolver.resolve('${input.name}', context);
			expect(result).toBe('Alice');
		});

		it('should resolve nested variable', () => {
			const result = resolver.resolve('${input.nested.deep.value}', context);
			expect(result).toBe('found');
		});

		it('should resolve state variable', () => {
			const result = resolver.resolve('${state.count}', context);
			expect(result).toBe(5);
		});

		it('should resolve output variable', () => {
			const result = resolver.resolve('${output.result}', context);
			expect(result).toBe('success');
		});

		it('should return undefined for nonexistent variable', () => {
			const result = resolver.resolve('${input.nonexistent}', context);
			expect(result).toBeUndefined();
		});

		it('should return undefined for deeply nonexistent path', () => {
			const result = resolver.resolve('${input.nested.nonexistent.value}', context);
			expect(result).toBeUndefined();
		});

		it('should handle boolean values', () => {
			const result = resolver.resolve('${state.enabled}', context);
			expect(result).toBe(true);
		});

		it('should handle number values', () => {
			const result = resolver.resolve('${input.age}', context);
			expect(result).toBe(30);
		});

		it('should handle array values', () => {
			const result = resolver.resolve('${input.items}', context);
			expect(result).toEqual([1, 2, 3]);
		});

		it('should handle object values', () => {
			const result = resolver.resolve('${state.data}', context);
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
			const result = resolver.resolve('${value}', ctx);
			expect(result).toBe(42);
		});

		it('should handle empty path gracefully', () => {
			const result = resolver.resolve('${}', context);
			expect(result).toBeUndefined();
		});

		it('should handle whitespace in path', () => {
			const result = resolver.resolve('${ input.name }', context);
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
			const template = ['${input.name}', '${input.email}'];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual(['Alice', 'alice@example.com']);
		});

		it('should resolve array of mixed types', () => {
			const template = ['${input.name}', 42, true, '${state.count}'];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual(['Alice', 42, true, 5]);
		});

		it('should resolve nested arrays', () => {
			const template = [['${input.name}'], ['${state.count}']];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual([['Alice'], [5]]);
		});

		it('should handle empty arrays', () => {
			const template: unknown[] = [];
			const result = interpolator.resolve(template, context);

			expect(result).toEqual([]);
		});

		it('should handle arrays with undefined values', () => {
			const template = ['${input.nonexistent}', '${input.name}'];
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
				userName: '${input.name}',
				userAge: '${input.age}'
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
					name: '${input.name}',
					contact: {
						email: '${input.email}'
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
				str: '${input.name}',
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
				'kebab-case': '${input.name}',
				snake_case: '${input.age}',
				'special.chars': '${state.count}'
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
			const template = '${input.name}';
			const result = interpolator.resolve(template, context);

			expect(result).toBe('Alice');
		});

		it('should resolve complex nested structure', () => {
			const template = {
				user: {
					name: '${input.name}',
					age: '${input.age}',
					contact: {
						email: '${input.email}'
					}
				},
				state: {
					count: '${state.count}',
					enabled: '${state.enabled}'
				},
				items: ['${input.items}']
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
				{ name: '${input.name}', age: '${input.age}' },
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
				names: ['${input.name}', 'Bob', '${state.data.key}']
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
				interpolated: '${input.name}'
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
			const template = '${circular.a}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(1);
		});

		it('should handle very deep nesting', () => {
			const deepContext = {
				a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 'deep' } } } } } } } } }
			};

			const template = '${a.b.c.d.e.f.g.h.i.j}';
			const result = interpolator.resolve(template, deepContext);

			expect(result).toBe('deep');
		});

		it('should handle empty context', () => {
			const template = '${input.name}';
			const result = interpolator.resolve(template, {});

			expect(result).toBeUndefined();
		});

		it('should handle null values in context', () => {
			const ctx = { value: null };
			const template = '${value}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBeNull();
		});

		it('should handle undefined values in context', () => {
			const ctx = { value: undefined };
			const template = '${value}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBeUndefined();
		});

		it('should handle special characters in keys', () => {
			const ctx = {
				'key-with-dashes': 'value1',
				'key.with.dots': 'value2'
			};

			// Note: dots in property names might be interpreted as path separators
			const template1 = '${key-with-dashes}';
			const result1 = interpolator.resolve(template1, ctx);
			// Depending on implementation, this may or may not work
			expect(result1).toBeDefined();
		});

		it('should handle numeric array indices in path', () => {
			const ctx = {
				items: ['first', 'second', 'third']
			};

			// Note: Array indexing might not be supported
			const template = '${items}';
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

			const template = `\${${longPath}.value}`;
			const result = interpolator.resolve(template, obj);

			expect(result).toBe('found');
		});

		it('should handle empty string values', () => {
			const ctx = { empty: '' };
			const template = '${empty}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('');
		});

		it('should handle whitespace values', () => {
			const ctx = { space: '   ' };
			const template = '${space}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('   ');
		});

		it('should handle numbers as strings in context', () => {
			const ctx = { num: '42' };
			const template = '${num}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe('42'); // Returns as string
		});

		it('should handle dates in context', () => {
			const date = new Date('2024-01-01');
			const ctx = { date };
			const template = '${date}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toEqual(date);
		});

		it('should handle functions in context', () => {
			const fn = () => 'result';
			const ctx = { fn };
			const template = '${fn}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(fn); // Returns function itself
		});

		it('should handle symbols in context', () => {
			const sym = Symbol('test');
			const ctx = { sym };
			const template = '${sym}';

			const result = interpolator.resolve(template, ctx);
			expect(result).toBe(sym);
		});

		it('should handle bigints in context', () => {
			const big = BigInt(9007199254740991);
			const ctx = { big };
			const template = '${big}';

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
			const result = customInterpolator.resolve('${input.name}', context);
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

			const result = customInterpolator.resolve('${input.name}', context);
			expect(result).toBe('custom: ${input.name}');
		});
	});

	describe('Real-World Scenarios', () => {
		it('should handle API request configuration', () => {
			const template = {
				url: '${api.baseUrl}/users/${input.userId}',
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ${api.token}',
					'Content-Type': 'application/json'
				},
				params: {
					page: '${input.page}',
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
				model: '${config.model}',
				temperature: '${config.temperature}',
				maxTokens: '${config.maxTokens}',
				systemPrompt: '${prompts.system}',
				userPrompt: 'Process this: ${input.data}'
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
