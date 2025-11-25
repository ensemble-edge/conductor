/**
 * Reference Primitives Tests
 *
 * Tests for dynamic value references
 */

import { describe, it, expect } from 'vitest'
import {
	ref,
	inputRef,
	stateRef,
	envRef,
	stepRef,
	contextRef,
	outputRef,
	computed,
	template,
	parseRef,
	refMap,
	Reference,
	isReference,
	isComputed,
	isTemplate,
	isRefExpression,
} from '../../../src/primitives/reference.js'

describe('Reference Primitives', () => {
	describe('ref()', () => {
		it('should create a reference from a full path', () => {
			const reference = ref('input.userId')

			expect(reference.source).toBe('input')
			expect(reference.path).toBe('userId')
		})

		it('should handle nested paths', () => {
			const reference = ref('state.user.profile.name')

			expect(reference.source).toBe('state')
			expect(reference.path).toBe('user.profile.name')
		})

		it('should throw for invalid source', () => {
			expect(() => ref('invalid.path')).toThrow('Invalid reference source')
		})

		it('should support default value', () => {
			const reference = ref('input.optional', { default: 'fallback' })

			expect(reference.defaultValue).toBe('fallback')
		})

		it('should support required flag', () => {
			const reference = ref('env.API_KEY', { required: true })

			expect(reference.required).toBe(true)
		})

		it('should support type validation', () => {
			const reference = ref('input.count', { type: 'number' })

			expect(reference.type).toBe('number')
		})
	})

	describe('inputRef()', () => {
		it('should create a reference to input', () => {
			const reference = inputRef('userId')

			expect(reference.source).toBe('input')
			expect(reference.path).toBe('userId')
		})
	})

	describe('stateRef()', () => {
		it('should create a reference to state', () => {
			const reference = stateRef('counter')

			expect(reference.source).toBe('state')
			expect(reference.path).toBe('counter')
		})

		it('should support default value', () => {
			const reference = stateRef('counter', { default: 0 })

			expect(reference.defaultValue).toBe(0)
		})
	})

	describe('envRef()', () => {
		it('should create a reference to env', () => {
			const reference = envRef('API_KEY')

			expect(reference.source).toBe('env')
			expect(reference.path).toBe('API_KEY')
		})

		it('should commonly be required', () => {
			const reference = envRef('SECRET', { required: true })

			expect(reference.required).toBe(true)
		})
	})

	describe('stepRef()', () => {
		it('should create a reference to a step result', () => {
			const reference = stepRef('analyze')

			expect(reference.source).toBe('steps')
			expect(reference.path).toBe('analyze')
		})

		it('should support nested path in result', () => {
			const reference = stepRef('analyze', 'result.score')

			expect(reference.path).toBe('analyze.result.score')
		})
	})

	describe('contextRef()', () => {
		it('should create a reference to context', () => {
			const reference = contextRef('executionId')

			expect(reference.source).toBe('context')
			expect(reference.path).toBe('executionId')
		})
	})

	describe('outputRef()', () => {
		it('should create a reference to output', () => {
			const reference = outputRef('summary')

			expect(reference.source).toBe('output')
			expect(reference.path).toBe('summary')
		})
	})

	describe('Reference class', () => {
		describe('getFullPath()', () => {
			it('should return source.path', () => {
				const reference = ref('input.user.name')

				expect(reference.getFullPath()).toBe('input.user.name')
			})
		})

		describe('toExpression()', () => {
			it('should return ${source.path} format', () => {
				const reference = ref('input.userId')

				expect(reference.toExpression()).toBe('${input.userId}')
			})
		})

		describe('toConfig()', () => {
			it('should return a config object', () => {
				const reference = ref('input.value', { default: 0, required: true, type: 'number' })

				const config = reference.toConfig()

				expect(config.ref).toBe('input.value')
				expect(config.default).toBe(0)
				expect(config.required).toBe(true)
				expect(config.type).toBe('number')
			})
		})
	})

	describe('isReference()', () => {
		it('should return true for Reference instances', () => {
			expect(isReference(ref('input.x'))).toBe(true)
		})

		it('should return false for non-Reference values', () => {
			expect(isReference(null)).toBe(false)
			expect(isReference('string')).toBe(false)
			expect(isReference({})).toBe(false)
		})

		it('should return true for objects with __isReference marker', () => {
			const fakeRef = { __isReference: true, source: 'input', path: 'x' }
			expect(isReference(fakeRef)).toBe(true)
		})
	})

	describe('computed()', () => {
		it('should create a computed value from multiple refs', () => {
			const fullName = computed(
				[inputRef('firstName'), inputRef('lastName')],
				([first, last]) => `${first} ${last}`
			)

			expect(fullName.refs).toHaveLength(2)
			expect(fullName.__isComputed).toBe(true)
			expect(fullName.compute(['John', 'Doe'])).toBe('John Doe')
		})
	})

	describe('isComputed()', () => {
		it('should return true for computed values', () => {
			const comp = computed([inputRef('x')], ([x]) => x)
			expect(isComputed(comp)).toBe(true)
		})

		it('should return false for non-computed values', () => {
			expect(isComputed({})).toBe(false)
			expect(isComputed(ref('input.x'))).toBe(false)
		})
	})

	describe('template()', () => {
		it('should create a template with embedded references', () => {
			const result = template`Hello, ${inputRef('name')}!`

			expect(result.__isTemplate).toBe(true)
			expect(result.refs).toHaveLength(1)
			expect(result.template).toBe('Hello, ${input.name}!')
		})

		it('should handle multiple references', () => {
			const result = template`${inputRef('greeting')}, ${stateRef('user')}!`

			expect(result.refs).toHaveLength(2)
			expect(result.template).toContain('${input.greeting}')
			expect(result.template).toContain('${state.user}')
		})

		it('should handle mixed content', () => {
			const result = template`Order #${inputRef('orderId')} is ${'ready'}`

			expect(result.template).toBe('Order #${input.orderId} is ready')
		})
	})

	describe('isTemplate()', () => {
		it('should return true for template values', () => {
			const tmpl = template`Hello ${inputRef('name')}`
			expect(isTemplate(tmpl)).toBe(true)
		})

		it('should return false for non-template values', () => {
			expect(isTemplate({})).toBe(false)
			expect(isTemplate('string')).toBe(false)
		})
	})

	describe('parseRef()', () => {
		it('should parse a string expression into a Reference', () => {
			const reference = parseRef('${input.userId}')

			expect(reference).not.toBeNull()
			expect(reference!.source).toBe('input')
			expect(reference!.path).toBe('userId')
		})

		it('should return null for non-expression strings', () => {
			expect(parseRef('not an expression')).toBeNull()
			expect(parseRef('${}')).toBeNull()
		})

		it('should return null for invalid sources', () => {
			expect(parseRef('${invalid.path}')).toBeNull()
		})
	})

	describe('isRefExpression()', () => {
		it('should return true for ${...} strings', () => {
			expect(isRefExpression('${input.x}')).toBe(true)
			expect(isRefExpression('${state.counter}')).toBe(true)
		})

		it('should return false for non-expression strings', () => {
			expect(isRefExpression('plain text')).toBe(false)
			expect(isRefExpression('partial ${ref}')).toBe(false)
			expect(isRefExpression(123)).toBe(false)
		})
	})

	describe('refMap()', () => {
		it('should create a map of references', () => {
			const refs = refMap({
				userId: 'input.userId',
				apiKey: 'env.API_KEY',
				result: 'steps.analyze.result',
			})

			expect(refs.userId.source).toBe('input')
			expect(refs.apiKey.source).toBe('env')
			expect(refs.result.source).toBe('steps')
		})

		it('should apply default options to all refs', () => {
			const refs = refMap({
				a: 'input.a',
				b: 'input.b',
			}, { required: true })

			expect(refs.a.required).toBe(true)
			expect(refs.b.required).toBe(true)
		})
	})
})
