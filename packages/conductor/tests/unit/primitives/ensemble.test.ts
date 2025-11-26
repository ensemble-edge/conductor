/**
 * Ensemble Primitives Tests
 *
 * Tests for ensemble creation and configuration
 */

import { describe, it, expect, vi } from 'vitest'
import {
	createEnsemble,
	Ensemble,
	isEnsemble,
	ensembleFromConfig,
} from '../../../src/primitives/ensemble.js'
import { step, sequence } from '../../../src/primitives/step.js'
import { parallel } from '../../../src/primitives/flow.js'

describe('Ensemble Primitives', () => {
	describe('createEnsemble()', () => {
		it('should create a basic ensemble with static steps', () => {
			const ensemble = createEnsemble({
				name: 'test-ensemble',
				steps: [
					step('fetch'),
					step('transform'),
					step('store'),
				],
			})

			expect(ensemble.name).toBe('test-ensemble')
			expect(ensemble.isDynamic).toBe(false)
			expect(ensemble.flow).toHaveLength(3)
		})

		it('should require a name', () => {
			expect(() =>
				createEnsemble({
					name: '',
					steps: [step('test')],
				})
			).toThrow('Ensemble name is required')
		})

		it('should require steps', () => {
			expect(() =>
				createEnsemble({
					name: 'test',
					steps: undefined as any,
				})
			).toThrow('Ensemble steps are required')
		})

		it('should support version and description', () => {
			const ensemble = createEnsemble({
				name: 'test',
				version: '1.0.0',
				description: 'A test ensemble',
				steps: [step('test')],
			})

			expect(ensemble.version).toBe('1.0.0')
			expect(ensemble.description).toBe('A test ensemble')
		})

		it('should support dynamic steps', () => {
			const ensemble = createEnsemble({
				name: 'dynamic',
				steps: (context) => {
					return [step('generated')]
				},
			})

			expect(ensemble.isDynamic).toBe(true)
			expect(ensemble.staticSteps).toBeUndefined()
		})

		it('should support async dynamic steps', () => {
			const ensemble = createEnsemble({
				name: 'async-dynamic',
				steps: async (context) => {
					return [step('async-generated')]
				},
			})

			expect(ensemble.isDynamic).toBe(true)
		})

		it('should support state configuration', () => {
			const ensemble = createEnsemble({
				name: 'stateful',
				steps: [step('test')],
				state: {
					schema: { counter: 'number', data: 'object' },
					initial: { counter: 0 },
				},
			})

			expect(ensemble.state).toEqual({
				schema: { counter: 'number', data: 'object' },
				initial: { counter: 0 },
			})
		})

		it('should support triggers', () => {
			const ensemble = createEnsemble({
				name: 'triggered',
				steps: [step('test')],
				trigger: [
					{
						type: 'http',
						path: '/api/trigger',
						methods: ['POST'],
					},
				],
			})

			expect(ensemble.trigger).toHaveLength(1)
			expect(ensemble.trigger![0].type).toBe('http')
		})

		it('should support lifecycle hooks', () => {
			const beforeFn = vi.fn()
			const afterFn = vi.fn()
			const errorFn = vi.fn().mockReturnValue('retry')

			const ensemble = createEnsemble({
				name: 'hooked',
				steps: [step('test')],
				beforeExecute: beforeFn,
				afterExecute: afterFn,
				onError: errorFn,
			})

			expect(ensemble.hooks?.beforeExecute).toBe(beforeFn)
			expect(ensemble.hooks?.afterExecute).toBe(afterFn)
			expect(ensemble.hooks?.onError).toBe(errorFn)
		})

		it('should support inline agent definitions', () => {
			const ensemble = createEnsemble({
				name: 'with-agents',
				steps: [step('inline-agent')],
				agents: [
					{
						name: 'inline-agent',
						operation: 'think',
						config: { prompt: 'Test' },
					},
				],
			})

			expect(ensemble.agents).toHaveLength(1)
			expect(ensemble.agents![0].name).toBe('inline-agent')
		})
	})

	describe('Ensemble class', () => {
		describe('resolveSteps()', () => {
			it('should return static steps for static ensemble', async () => {
				const ensemble = createEnsemble({
					name: 'static',
					steps: [step('one'), step('two')],
				})

				const mockContext = {
					input: {},
					state: {},
					env: {},
					ctx: { waitUntil: vi.fn(), passThroughOnException: vi.fn() },
				}

				const steps = await ensemble.resolveSteps(mockContext)
				expect(steps).toHaveLength(2)
			})

			it('should call dynamic step generator', async () => {
				const generator = vi.fn().mockResolvedValue([step('dynamic')])

				const ensemble = createEnsemble({
					name: 'dynamic',
					steps: generator,
				})

				const mockContext = {
					input: { foo: 'bar' },
					state: {},
					env: {},
					ctx: { waitUntil: vi.fn(), passThroughOnException: vi.fn() },
				}

				const steps = await ensemble.resolveSteps(mockContext)
				expect(generator).toHaveBeenCalledWith(mockContext)
				expect(steps).toHaveLength(1)
			})
		})

		describe('flow getter', () => {
			it('should return static steps', () => {
				const ensemble = createEnsemble({
					name: 'test',
					steps: [step('a'), step('b')],
				})

				expect(ensemble.flow).toHaveLength(2)
			})

			it('should return empty array for dynamic ensemble', () => {
				const ensemble = createEnsemble({
					name: 'dynamic',
					steps: () => [step('dynamic')],
				})

				expect(ensemble.flow).toEqual([])
			})
		})

		describe('toConfig()', () => {
			it('should convert ensemble to plain config object', () => {
				const ensemble = createEnsemble({
					name: 'configurable',
					description: 'Test',
					steps: [step('a')],
					state: { schema: { x: 'number' } },
				})

				const config = ensemble.toConfig()

				expect(config.name).toBe('configurable')
				expect(config.description).toBe('Test')
				expect(config.flow).toHaveLength(1)
				expect(config.state).toEqual({ schema: { x: 'number' } })
			})
		})
	})

	describe('isEnsemble()', () => {
		it('should return true for Ensemble instances', () => {
			const ensemble = createEnsemble({
				name: 'test',
				steps: [step('a')],
			})

			expect(isEnsemble(ensemble)).toBe(true)
		})

		it('should return false for non-Ensemble values', () => {
			expect(isEnsemble({})).toBe(false)
			expect(isEnsemble(null)).toBe(false)
			expect(isEnsemble('string')).toBe(false)
			expect(isEnsemble({ name: 'fake', steps: [] })).toBe(false)
		})
	})

	describe('ensembleFromConfig()', () => {
		it('should create an Ensemble from a plain config', () => {
			const config = {
				name: 'from-config',
				description: 'Created from config',
				flow: [step('a'), step('b')],
				state: { schema: { counter: 'number' } },
			}

			const ensemble = ensembleFromConfig(config)

			expect(ensemble.name).toBe('from-config')
			expect(ensemble.description).toBe('Created from config')
			expect(ensemble.flow).toHaveLength(2)
			expect(ensemble.state).toEqual({ schema: { counter: 'number' } })
		})

		it('should handle config with triggers', () => {
			const config = {
				name: 'triggered',
				flow: [step('test')],
				trigger: [
					{ type: 'webhook' as const, path: '/hook' },
				],
			}

			const ensemble = ensembleFromConfig(config)
			expect(ensemble.trigger).toHaveLength(1)
		})
	})

	describe('Complex Ensemble Patterns', () => {
		it('should support pipeline pattern', () => {
			const pipeline = createEnsemble({
				name: 'data-pipeline',
				steps: sequence(
					step('extract'),
					step('transform'),
					step('load')
				),
			})

			expect(pipeline.flow).toHaveLength(3)
		})

		it('should support parallel processing pattern', () => {
			const parallelPipeline = createEnsemble({
				name: 'parallel-pipeline',
				steps: [
					parallel([
						step('fetch-a'),
						step('fetch-b'),
						step('fetch-c'),
					]),
					step('merge'),
				],
			})

			expect(parallelPipeline.flow).toHaveLength(2)
			expect(parallelPipeline.flow[0].type).toBe('parallel')
		})

		it('should support context-aware dynamic steps', () => {
			const adaptive = createEnsemble({
				name: 'adaptive',
				steps: (context) => {
					const sources = (context.input.sources as string[]) || []
					return [
						parallel(
							sources.map((url) =>
								step(`fetch-${url}`, {
									operation: 'http',
									config: { url },
								})
							)
						),
						step('merge'),
					]
				},
			})

			expect(adaptive.isDynamic).toBe(true)
		})
	})
})
