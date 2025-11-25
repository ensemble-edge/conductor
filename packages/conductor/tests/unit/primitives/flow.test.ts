/**
 * Flow Control Primitives Tests
 *
 * Tests for flow control functions
 */

import { describe, it, expect } from 'vitest'
import {
	parallel,
	race,
	branch,
	ifThen,
	ifThenElse,
	switchStep,
	foreach,
	map,
	repeat,
	whileStep,
	doWhile,
	doUntil,
	tryStep,
	fallback,
	mapReduce,
} from '../../../src/primitives/flow.js'
import { step } from '../../../src/primitives/step.js'

describe('Flow Control Primitives', () => {
	describe('parallel()', () => {
		it('should create a parallel step with default waitFor: all', () => {
			const result = parallel([
				step('fetch-users'),
				step('fetch-products'),
			])

			expect(result.type).toBe('parallel')
			expect(result.steps).toHaveLength(2)
			expect(result.waitFor).toBe('all')
		})

		it('should support waitFor: any', () => {
			const result = parallel([
				step('primary'),
				step('fallback'),
			], { waitFor: 'any' })

			expect(result.waitFor).toBe('any')
		})

		it('should support waitFor: first', () => {
			const result = parallel([
				step('fast'),
				step('slow'),
			], { waitFor: 'first' })

			expect(result.waitFor).toBe('first')
		})
	})

	describe('race()', () => {
		it('should create a parallel step with waitFor: first', () => {
			const result = race([
				step('api-1'),
				step('api-2'),
			])

			expect(result.type).toBe('parallel')
			expect(result.waitFor).toBe('first')
		})
	})

	describe('branch()', () => {
		it('should create a branch step with then', () => {
			const result = branch('${input.premium}', {
				then: [step('premium-flow')],
			})

			expect(result.type).toBe('branch')
			expect(result.condition).toBe('${input.premium}')
			expect(result.then).toHaveLength(1)
			expect(result.else).toBeUndefined()
		})

		it('should create a branch step with then and else', () => {
			const result = branch('${input.valid}', {
				then: [step('process')],
				else: [step('error')],
			})

			expect(result.then).toHaveLength(1)
			expect(result.else).toHaveLength(1)
		})
	})

	describe('ifThen()', () => {
		it('should create a branch with only then', () => {
			const result = ifThen('${input.sendEmail}', [
				step('send-email'),
			])

			expect(result.type).toBe('branch')
			expect(result.condition).toBe('${input.sendEmail}')
			expect(result.then).toHaveLength(1)
		})
	})

	describe('ifThenElse()', () => {
		it('should create a branch with both then and else', () => {
			const result = ifThenElse(
				'${input.premium}',
				[step('premium')],
				[step('standard')]
			)

			expect(result.type).toBe('branch')
			expect(result.then).toHaveLength(1)
			expect(result.else).toHaveLength(1)
			expect(result.then[0].agent).toBe('premium')
			expect(result.else![0].agent).toBe('standard')
		})
	})

	describe('switchStep()', () => {
		it('should create a switch step with cases', () => {
			const result = switchStep('${input.type}', {
				create: [step('handle-create')],
				update: [step('handle-update')],
				delete: [step('handle-delete')],
			})

			expect(result.type).toBe('switch')
			expect(result.value).toBe('${input.type}')
			expect(Object.keys(result.cases)).toHaveLength(3)
		})

		it('should support default case', () => {
			const result = switchStep('${input.type}', {
				known: [step('handle-known')],
			}, [step('handle-unknown')])

			expect(result.default).toHaveLength(1)
		})
	})

	describe('foreach()', () => {
		it('should create a foreach step', () => {
			const result = foreach('${input.items}', step('process-item'))

			expect(result.type).toBe('foreach')
			expect(result.items).toBe('${input.items}')
			expect(result.step.agent).toBe('process-item')
		})

		it('should support maxConcurrency', () => {
			const result = foreach('${input.items}', step('process'), {
				maxConcurrency: 5,
			})

			expect(result.maxConcurrency).toBe(5)
		})

		it('should support breakWhen', () => {
			const result = foreach('${input.items}', step('process'), {
				breakWhen: '${item.invalid}',
			})

			expect(result.breakWhen).toBe('${item.invalid}')
		})
	})

	describe('map()', () => {
		it('should be an alias for foreach', () => {
			const result = map('${input.ids}', step('fetch-by-id'))

			expect(result.type).toBe('foreach')
			expect(result.items).toBe('${input.ids}')
		})
	})

	describe('repeat()', () => {
		it('should create a foreach over a range', () => {
			const result = repeat(3, [step('retry')])

			expect(result.type).toBe('foreach')
			expect(result.items).toContain('Array.from')
			expect(result.items).toContain('3')
		})
	})

	describe('whileStep()', () => {
		it('should create a while step with default maxIterations', () => {
			const result = whileStep('${state.hasMore}', [
				step('fetch-page'),
			])

			expect(result.type).toBe('while')
			expect(result.condition).toBe('${state.hasMore}')
			expect(result.steps).toHaveLength(1)
			expect(result.maxIterations).toBe(100)
		})

		it('should support custom maxIterations', () => {
			const result = whileStep('${state.retry}', [step('attempt')], {
				maxIterations: 5,
			})

			expect(result.maxIterations).toBe(5)
		})
	})

	describe('doWhile()', () => {
		it('should create steps that execute once then loop', () => {
			const result = doWhile([step('fetch')], '${state.hasMore}')

			// First element should be the step
			expect(result[0].agent).toBe('fetch')
			// Second element should be a while loop
			expect(result[1].type).toBe('while')
		})
	})

	describe('doUntil()', () => {
		it('should create steps that execute until condition is true', () => {
			const result = doUntil([step('poll')], '${state.complete}')

			expect(result).toHaveLength(2)
			expect(result[0].agent).toBe('poll')
		})
	})

	describe('tryStep()', () => {
		it('should create a try step', () => {
			const result = tryStep([step('risky')])

			expect(result.type).toBe('try')
			expect(result.steps).toHaveLength(1)
		})

		it('should support catch handler', () => {
			const result = tryStep([step('risky')], {
				catch: [step('handle-error')],
			})

			expect(result.catch).toHaveLength(1)
		})

		it('should support finally handler', () => {
			const result = tryStep([step('open')], {
				finally: [step('close')],
			})

			expect(result.finally).toHaveLength(1)
		})

		it('should support both catch and finally', () => {
			const result = tryStep([step('operation')], {
				catch: [step('error')],
				finally: [step('cleanup')],
			})

			expect(result.catch).toHaveLength(1)
			expect(result.finally).toHaveLength(1)
		})
	})

	describe('fallback()', () => {
		it('should throw for empty steps', () => {
			expect(() => fallback([])).toThrow('fallback requires at least one step')
		})

		it('should return single step unchanged', () => {
			const result = fallback([step('only')])

			expect(result.agent).toBe('only')
		})

		it('should create nested try/catch chain for multiple steps', () => {
			const result = fallback([
				step('primary'),
				step('secondary'),
				step('tertiary'),
			])

			// Should be: try primary catch try secondary catch tertiary
			expect(result.type).toBe('try')
		})
	})

	describe('mapReduce()', () => {
		it('should create a map-reduce step', () => {
			const result = mapReduce(
				'${input.documents}',
				step('analyze'),
				step('aggregate')
			)

			expect(result.type).toBe('map-reduce')
			expect(result.items).toBe('${input.documents}')
			expect(result.map.agent).toBe('analyze')
			expect(result.reduce.agent).toBe('aggregate')
		})

		it('should support maxConcurrency', () => {
			const result = mapReduce(
				'${input.items}',
				step('process'),
				step('combine'),
				{ maxConcurrency: 10 }
			)

			expect(result.maxConcurrency).toBe(10)
		})
	})
})
