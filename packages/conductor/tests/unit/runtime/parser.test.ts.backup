/**
 * Parser Tests
 *
 * Tests for YAML parsing and validation using actual Parser static API.
 * Target: 90%+ coverage with ~50 test cases (simplified from 100)
 */

import { describe, it, expect } from 'vitest';
import { Parser } from '../../../src/runtime/parser';

describe('Parser', () => {
	describe('Ensemble Parsing', () => {
		it('should parse minimal ensemble config', () => {
			const yaml = `
name: test-ensemble
flow:
  - agent: greeter
			`;

			const result = Parser.parseEnsemble(yaml);

			expect(result.name).toBe('test-ensemble');
			expect(result.flow).toHaveLength(1);
			expect(result.flow[0].agent).toBe('greeter');
		});

		it('should parse ensemble with description', () => {
			const yaml = `
name: test
description: Test ensemble for unit tests
flow:
  - agent: greeter
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.description).toBe('Test ensemble for unit tests');
		});

		it('should parse ensemble with state initialization', () => {
			const yaml = `
name: stateful
state:
  initial:
    count: 0
    items: []
flow:
  - agent: counter
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.state).toBeDefined();
			expect(result.state?.initial).toEqual({
				count: 0,
				items: []
			});
		});

		it('should parse ensemble with flow input mapping', () => {
			const yaml = `
name: mapped
flow:
  - agent: processor
    input:
      data: \${input.rawData}
      mode: process
			`;

			const result = Parser.parseEnsemble(yaml);
			const step = result.flow[0];
			expect(step.input).toBeDefined();
			expect(step.input?.mode).toBe('process');
		});

		it('should parse ensemble with webhooks', () => {
			const yaml = `
name: webhook-enabled
webhooks:
  - path: /trigger
    method: POST
flow:
  - agent: handler
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.webhooks).toHaveLength(1);
			expect(result.webhooks?.[0].path).toBe('/trigger');
		});

		it('should parse ensemble with schedules', () => {
			const yaml = `
name: scheduled
schedules:
  - cron: "0 0 * * *"
    enabled: true
flow:
  - agent: daily-task
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.schedules).toHaveLength(1);
			expect(result.schedules?.[0].cron).toBe('0 0 * * *');
		});

		it('should parse ensemble with scoring config', () => {
			const yaml = `
name: scored
scoring:
  enabled: true
  defaultThresholds:
    minimum: 0.7
    target: 0.85
flow:
  - agent: evaluator
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.scoring).toBeDefined();
			expect(result.scoring?.enabled).toBe(true);
			expect(result.scoring?.defaultThresholds.minimum).toBe(0.7);
		});

		it('should handle YAML comments', () => {
			const yaml = `
# This is a test ensemble
name: test
# Define flow
flow:
  - agent: greeter  # Greeting step
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.name).toBe('test');
		});

		it('should reject invalid YAML syntax', () => {
			const yaml = `
name: test
flow: [[[
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow();
		});

		it('should reject ensemble without name', () => {
			const yaml = `
flow:
  - agent: greeter
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow(/name/i);
		});

		it('should reject ensemble without flow', () => {
			const yaml = `
name: test
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow(/flow/i);
		});

		it('should reject flow step without agent', () => {
			const yaml = `
name: test
flow:
  - input: { data: test }
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow(/agent/i);
		});

		it('should reject invalid scoring threshold', () => {
			const yaml = `
name: test
scoring:
  enabled: true
  defaultThresholds:
    minimum: 1.5
flow:
  - agent: test
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow();
		});

		it('should reject invalid webhook method', () => {
			const yaml = `
name: test
webhooks:
  - path: /test
    method: DELETE
flow:
  - agent: test
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow();
		});

		it('should reject empty webhook path', () => {
			const yaml = `
name: test
webhooks:
  - path: ""
flow:
  - agent: test
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow(/path/i);
		});

		it('should reject invalid schedule cron', () => {
			const yaml = `
name: test
schedules:
  - cron: ""
flow:
  - agent: test
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow(/cron/i);
		});
	});

	describe('Agent Parsing', () => {
		it('should parse think agent', () => {
			const yaml = `
name: thinker
operation: think
config:
  model: gpt-4
  systemPrompt: You are helpful
			`;

			const result = Parser.parseAgent(yaml);
			expect(result.operation).toBe('think');
			expect(result.name).toBe('thinker');
		});

		it('should parse data agent', () => {
			const yaml = `
name: transformer
operation: storage
config:
  query: SELECT * FROM users
			`;

			const result = Parser.parseAgent(yaml);
			expect(result.operation).toBe('storage');
		});

		it('should parse function agent', () => {
			const yaml = `
name: calculator
operation: code
config:
  handler: ./handlers/calculate.js
			`;

			const result = Parser.parseAgent(yaml);
			expect(result.operation).toBe('code');
		});

		it('should parse agent with description', () => {
			const yaml = `
name: greeter
operation: think
description: Generates friendly greetings
			`;

			const result = Parser.parseAgent(yaml);
			expect(result.description).toBe('Generates friendly greetings');
		});

		it('should reject agent without name', () => {
			const yaml = `
operation: think
config:
  model: gpt-4
			`;

			expect(() => Parser.parseAgent(yaml)).toThrow(/name/i);
		});

		it('should reject agent without operation', () => {
			const yaml = `
name: thinker
config:
  model: gpt-4
			`;

			expect(() => Parser.parseAgent(yaml)).toThrow(/operation/i);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty YAML', () => {
			const yaml = '';
			expect(() => Parser.parseEnsemble(yaml)).toThrow();
		});

		it('should handle YAML with only comments', () => {
			const yaml = `
# Just a comment
# Another comment
			`;

			expect(() => Parser.parseEnsemble(yaml)).toThrow();
		});

		it('should handle very long names', () => {
			const longName = 'a'.repeat(1000);
			const yaml = `
name: ${longName}
flow:
  - agent: test
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.name).toHaveLength(1000);
		});

		it('should handle unicode characters', () => {
			const yaml = `
name: test-émoji-🎉
flow:
  - agent: greeter
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.name).toBe('test-émoji-🎉');
		});

		it('should handle special characters in strings', () => {
			const yaml = `
name: test
flow:
  - agent: greeter
    input:
      message: "Hello \\"world\\" with 'quotes'"
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result).toBeDefined();
		});

		it('should handle missing optional fields', () => {
			const yaml = `
name: test
flow:
  - agent: test
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.description).toBeUndefined();
		});
	});
});
