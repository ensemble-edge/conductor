/**
 * Step Primitives Tests
 *
 * Tests for step creation functions
 */

import { describe, it, expect } from 'vitest'
import {
	step,
	sequence,
	scriptStep,
	httpStep,
	thinkStep,
	storageStep,
	dataStep,
	emailStep,
	agentStep,
} from '../../../src/primitives/step.js'

describe('Step Primitives', () => {
	describe('step()', () => {
		it('should create a basic step with just a name', () => {
			const result = step('my-agent')

			expect(result).toEqual({
				agent: 'my-agent',
			})
		})

		it('should create a step with input mapping', () => {
			const result = step('analyzer', {
				input: { data: '${fetch.output}' },
			})

			expect(result).toEqual({
				agent: 'analyzer',
				input: { data: '${fetch.output}' },
			})
		})

		it('should create a step with operation and config', () => {
			const result = step('think-step', {
				operation: 'think',
				config: {
					model: 'claude-sonnet-4',
					prompt: 'Analyze this data',
				},
			})

			expect(result.agent).toBe('think-step')
			expect((result as any).operation).toBe('think')
			expect((result as any).config).toEqual({
				model: 'claude-sonnet-4',
				prompt: 'Analyze this data',
			})
		})

		it('should create a step with retry configuration', () => {
			const result = step('external-api', {
				retry: {
					attempts: 3,
					backoff: 'exponential',
					initialDelay: 1000,
				},
			})

			expect(result.retry).toEqual({
				attempts: 3,
				backoff: 'exponential',
				initialDelay: 1000,
			})
		})

		it('should create a step with timeout', () => {
			const result = step('slow-operation', {
				timeout: 5000,
			})

			expect(result.timeout).toBe(5000)
		})

		it('should create a step with condition', () => {
			const result = step('conditional', {
				condition: '${input.shouldRun}',
			})

			expect(result.condition).toBe('${input.shouldRun}')
		})

		it('should create a step with state access', () => {
			const result = step('stateful', {
				state: {
					use: ['counter'],
					set: ['result'],
				},
			})

			expect(result.state).toEqual({
				use: ['counter'],
				set: ['result'],
			})
		})
	})

	describe('sequence()', () => {
		it('should return an array of steps', () => {
			const steps = sequence(
				step('first'),
				step('second'),
				step('third')
			)

			expect(steps).toHaveLength(3)
			expect(steps[0].agent).toBe('first')
			expect(steps[1].agent).toBe('second')
			expect(steps[2].agent).toBe('third')
		})
	})

	describe('scriptStep()', () => {
		it('should create a step with code operation and script path', () => {
			const result = scriptStep('transform', 'scripts/transform-data')

			expect(result.agent).toBe('transform')
			expect((result as any).operation).toBe('code')
			expect((result as any).script).toBe('scripts/transform-data')
		})

		it('should allow input mapping', () => {
			const result = scriptStep('transform', 'scripts/transform', {
				input: { data: '${fetch.output}' },
			})

			expect(result.input).toEqual({ data: '${fetch.output}' })
		})
	})

	describe('httpStep()', () => {
		it('should create a step with http operation', () => {
			const result = httpStep('fetch-users', 'https://api.example.com/users')

			expect(result.agent).toBe('fetch-users')
			expect((result as any).operation).toBe('http')
			expect((result as any).config.url).toBe('https://api.example.com/users')
			expect((result as any).config.method).toBe('GET')
		})

		it('should support POST method with body', () => {
			const result = httpStep('create-user', 'https://api.example.com/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: { name: 'John' },
			})

			expect((result as any).config.method).toBe('POST')
			expect((result as any).config.headers).toEqual({ 'Content-Type': 'application/json' })
			expect((result as any).config.body).toEqual({ name: 'John' })
		})
	})

	describe('thinkStep()', () => {
		it('should create a step with think operation', () => {
			const result = thinkStep('analyze', 'Analyze this data')

			expect(result.agent).toBe('analyze')
			expect((result as any).operation).toBe('think')
			expect((result as any).config.prompt).toBe('Analyze this data')
		})

		it('should support model configuration', () => {
			const result = thinkStep('analyze', 'Analyze this', {
				model: 'claude-sonnet-4',
				temperature: 0.7,
				maxTokens: 1000,
			})

			expect((result as any).config).toEqual({
				prompt: 'Analyze this',
				model: 'claude-sonnet-4',
				temperature: 0.7,
				maxTokens: 1000,
			})
		})
	})

	describe('storageStep()', () => {
		it('should create a get step', () => {
			const result = storageStep('cache-get', 'get', {
				binding: 'CACHE',
				key: 'my-key',
			})

			expect(result.agent).toBe('cache-get')
			expect((result as any).operation).toBe('storage')
			expect((result as any).config.action).toBe('get')
			expect((result as any).config.binding).toBe('CACHE')
			expect((result as any).config.key).toBe('my-key')
		})

		it('should create a put step', () => {
			const result = storageStep('cache-put', 'put', {
				binding: 'CACHE',
				key: 'my-key',
				value: '${transform.output}',
			})

			expect((result as any).config.action).toBe('put')
			expect((result as any).config.value).toBe('${transform.output}')
		})
	})

	describe('dataStep()', () => {
		it('should create a step with data operation', () => {
			const result = dataStep('get-users', 'SELECT * FROM users', {
				binding: 'DB',
			})

			expect(result.agent).toBe('get-users')
			expect((result as any).operation).toBe('data')
			expect((result as any).config.query).toBe('SELECT * FROM users')
			expect((result as any).config.binding).toBe('DB')
		})

		it('should support query parameters', () => {
			const result = dataStep('get-user', 'SELECT * FROM users WHERE id = ?', {
				binding: 'DB',
				params: [1],
			})

			expect((result as any).config.params).toEqual([1])
		})
	})

	describe('emailStep()', () => {
		it('should create a step with email operation', () => {
			const result = emailStep('send-notification', {
				to: ['user@example.com'],
				subject: 'Hello',
				body: 'World',
			})

			expect(result.agent).toBe('send-notification')
			expect((result as any).operation).toBe('email')
			expect((result as any).config.to).toEqual(['user@example.com'])
			expect((result as any).config.subject).toBe('Hello')
			expect((result as any).config.body).toBe('World')
		})
	})

	describe('agentStep()', () => {
		it('should create a step referencing an existing agent', () => {
			const result = agentStep('my-analyzer', {
				input: { data: '${fetch.output}' },
			})

			expect(result.agent).toBe('my-analyzer')
			expect(result.input).toEqual({ data: '${fetch.output}' })
		})
	})
})
