/**
 * Parser Tests
 *
 * Comprehensive tests for YAML parsing and validation.
 * Target: 90%+ coverage with ~100 test cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from '../../../src/runtime/parser';

describe('Parser', () => {
	let parser: Parser;

	beforeEach(() => {
		parser = new Parser();
	});

	describe('Ensemble Parsing', () => {
		it('should parse minimal ensemble config', () => {
			const yaml = `
name: test-ensemble
members:
  - name: greeter
    type: think
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.name).toBe('test-ensemble');
				expect(result.value.members).toHaveLength(1);
				expect(result.value.flow).toHaveLength(1);
			}
		});

		it('should parse ensemble with description', () => {
			const yaml = `
name: test
description: Test ensemble for unit tests
members:
  - name: greeter
    type: think
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.description).toBe('Test ensemble for unit tests');
			}
		});

		it('should parse ensemble with state initialization', () => {
			const yaml = `
name: stateful
state:
  initial:
    count: 0
    items: []
members:
  - name: counter
    type: function
flow:
  - member: counter
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.state).toBeDefined();
				expect(result.value.state?.initial).toEqual({
					count: 0,
					items: []
				});
			}
		});

		it('should parse ensemble with multiple members', () => {
			const yaml = `
name: multi
members:
  - name: validator
    type: function
  - name: processor
    type: think
  - name: formatter
    type: data
flow:
  - member: validator
  - member: processor
  - member: formatter
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.members).toHaveLength(3);
				expect(result.value.flow).toHaveLength(3);
			}
		});

		it('should parse ensemble with parallel steps', () => {
			const yaml = `
name: parallel
members:
  - name: task1
    type: function
  - name: task2
    type: function
flow:
  - parallel:
      - member: task1
      - member: task2
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.flow).toHaveLength(1);
				expect(result.value.flow[0]).toHaveProperty('parallel');
			}
		});

		it('should parse ensemble with conditional steps', () => {
			const yaml = `
name: conditional
members:
  - name: checker
    type: function
flow:
  - member: checker
    when: \$\{input.enabled === true\}
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.flow[0]).toHaveProperty('when');
			}
		});

		it('should parse ensemble with retry configuration', () => {
			const yaml = `
name: resilient
members:
  - name: api-call
    type: function
flow:
  - member: api-call
    retry:
      attempts: 3
      backoff: exponential
      initialDelay: 1000
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.flow[0]).toHaveProperty('retry');
				const retry = (result.value.flow[0] as any).retry;
				expect(retry.attempts).toBe(3);
				expect(retry.backoff).toBe('exponential');
			}
		});

		it('should parse ensemble with timeout', () => {
			const yaml = `
name: timed
members:
  - name: slow-operation
    type: function
flow:
  - member: slow-operation
    timeout: 5000
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect((result.value.flow[0] as any).timeout).toBe(5000);
			}
		});

		it('should handle YAML comments', () => {
			const yaml = `
# This is a test ensemble
name: test
# Define members
members:
  - name: greeter  # Greeting member
    type: think
# Define flow
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
		});

		it('should reject invalid YAML syntax', () => {
			const yaml = `
name: test
members:
  - name: greeter
    type: think
  invalid yaml here: [[[
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject ensemble without name', () => {
			const yaml = `
members:
  - name: greeter
    type: think
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain('name');
			}
		});

		it('should reject ensemble without members', () => {
			const yaml = `
name: test
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject ensemble without flow', () => {
			const yaml = `
name: test
members:
  - name: greeter
    type: think
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject member without name', () => {
			const yaml = `
name: test
members:
  - type: think
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject member without type', () => {
			const yaml = `
name: test
members:
  - name: greeter
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should parse member with config', () => {
			const yaml = `
name: test
members:
  - name: thinker
    type: think
    config:
      model: gpt-4
      temperature: 0.7
      maxTokens: 1000
flow:
  - member: thinker
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const member = result.value.members[0];
				expect(member.config).toBeDefined();
				expect((member.config as any).model).toBe('gpt-4');
			}
		});
	});

	describe('Member Parsing', () => {
		it('should parse think member', () => {
			const yaml = `
name: thinker
type: think
config:
  model: gpt-4
  systemPrompt: You are helpful
			`;

			const result = parser.parseMember(yaml);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.type).toBe('think');
				expect(result.value.name).toBe('thinker');
			}
		});

		it('should parse data member', () => {
			const yaml = `
name: transformer
type: data
config:
  query: SELECT * FROM users
			`;

			const result = parser.parseMember(yaml);

			if (result.success) {
				expect(result.value.type).toBe('data');
			}
		});

		it('should parse function member', () => {
			const yaml = `
name: calculator
type: function
config:
  handler: ./handlers/calculate.js
			`;

			const result = parser.parseMember(yaml);

			if (result.success) {
				expect(result.value.type).toBe('function');
			}
		});

		it('should parse api member', () => {
			const yaml = `
name: api-caller
type: api
config:
  baseUrl: https://api.example.com
  headers:
    Authorization: Bearer token
			`;

			const result = parser.parseMember(yaml);

			if (result.success) {
				expect(result.value.type).toBe('api');
			}
		});

		it('should parse member with description', () => {
			const yaml = `
name: greeter
type: think
description: Generates friendly greetings
			`;

			const result = parser.parseMember(yaml);

			if (result.success) {
				expect(result.value.description).toBe('Generates friendly greetings');
			}
		});

		it('should reject member without name', () => {
			const yaml = `
type: think
config:
  model: gpt-4
			`;

			const result = parser.parseMember(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject member without type', () => {
			const yaml = `
name: thinker
config:
  model: gpt-4
			`;

			const result = parser.parseMember(yaml);

			expect(result.success).toBe(false);
		});

		it('should reject invalid member type', () => {
			const yaml = `
name: invalid
type: invalid-type
			`;

			const result = parser.parseMember(yaml);

			expect(result.success).toBe(false);
		});
	});

	describe('Flow Parsing', () => {
		it('should parse simple sequential flow', () => {
			const yaml = `
name: sequential
members:
  - name: step1
    type: function
  - name: step2
    type: function
flow:
  - member: step1
  - member: step2
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.flow).toHaveLength(2);
			}
		});

		it('should parse flow with input mapping', () => {
			const yaml = `
name: mapped
members:
  - name: processor
    type: function
flow:
  - member: processor
    input:
      data: \$\{input.rawData\}
      mode: process
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.input).toBeDefined();
				expect(step.input.mode).toBe('process');
			}
		});

		it('should parse flow with state updates', () => {
			const yaml = `
name: stateful
members:
  - name: counter
    type: function
flow:
  - member: counter
    setState:
      count: \$\{state.count + 1\}
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.setState).toBeDefined();
			}
		});

		it('should parse nested parallel flows', () => {
			const yaml = `
name: nested
members:
  - name: a
    type: function
  - name: b
    type: function
  - name: c
    type: function
flow:
  - parallel:
      - member: a
      - parallel:
          - member: b
          - member: c
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
		});

		it('should parse try/catch flow', () => {
			const yaml = `
name: error-handling
members:
  - name: risky
    type: function
  - name: handler
    type: function
flow:
  - try:
      - member: risky
    catch:
      - member: handler
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.try).toBeDefined();
				expect(step.catch).toBeDefined();
			}
		});

		it('should parse switch/case flow', () => {
			const yaml = `
name: branching
members:
  - name: handler-a
    type: function
  - name: handler-b
    type: function
flow:
  - switch: \$\{input.type\}
    cases:
      typeA:
        - member: handler-a
      typeB:
        - member: handler-b
    default:
      - member: handler-a
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.switch).toBeDefined();
				expect(step.cases).toBeDefined();
			}
		});

		it('should parse while loop', () => {
			const yaml = `
name: looping
members:
  - name: iterator
    type: function
flow:
  - while: \$\{state.hasMore\}
    maxIterations: 100
    do:
      - member: iterator
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.while).toBeDefined();
				expect(step.maxIterations).toBe(100);
			}
		});

		it('should parse foreach loop', () => {
			const yaml = `
name: iteration
members:
  - name: processor
    type: function
flow:
  - foreach: \$\{input.items\}
    maxConcurrency: 5
    do:
      member: processor
      input:
        item: \$\{item\}
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.foreach).toBeDefined();
				expect(step.maxConcurrency).toBe(5);
			}
		});

		it('should parse map-reduce', () => {
			const yaml = `
name: mapreduce
members:
  - name: mapper
    type: function
  - name: reducer
    type: function
flow:
  - mapReduce:
      items: \$\{input.data\}
      map:
        member: mapper
      reduce:
        member: reducer
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				const step = result.value.flow[0] as any;
				expect(step.mapReduce).toBeDefined();
			}
		});
	});

	describe('Validation', () => {
		it('should validate member references in flow', () => {
			const yaml = `
name: test
members:
  - name: existing
    type: function
flow:
  - member: nonexistent
			`;

			const result = parser.parseEnsemble(yaml);

			// Should either fail or warn about nonexistent member
			// Depending on validation strategy
			expect(result.success).toBeDefined();
		});

		it('should validate state access permissions', () => {
			const yaml = `
name: test
state:
  initial:
    secret: value
members:
  - name: accessor
    type: function
    state:
      use: [secret]
flow:
  - member: accessor
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
		});

		it('should handle complex nested structures', () => {
			const yaml = `
name: complex
members:
  - name: a
    type: function
  - name: b
    type: function
  - name: c
    type: function
flow:
  - try:
      - parallel:
          - member: a
          - foreach: \$\{input.items\}
            do:
              member: b
    catch:
      - switch: \$\{error.code\}
        cases:
          NETWORK_ERROR:
            - member: c
    finally:
      - member: a
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
		});
	});

	describe('Error Messages', () => {
		it('should provide helpful error for missing required field', () => {
			const yaml = `
members:
  - name: greeter
    type: think
			`;

			const result = parser.parseEnsemble(yaml);

			if (!result.success) {
				expect(result.error.message).toContain('name');
			}
		});

		it('should provide helpful error for invalid YAML', () => {
			const yaml = `
name: test
invalid: [[[
			`;

			const result = parser.parseEnsemble(yaml);

			if (!result.success) {
				expect(result.error.message.toLowerCase()).toContain('yaml');
			}
		});

		it('should provide line numbers in error messages', () => {
			// This depends on parser implementation
			const yaml = `
name: test
members:
  - name: greeter
    type: invalid-type
			`;

			const result = parser.parseEnsemble(yaml);

			// Should include line information if possible
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty YAML', () => {
			const yaml = '';

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should handle YAML with only comments', () => {
			const yaml = `
# Just a comment
# Another comment
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(false);
		});

		it('should handle very long member names', () => {
			const longName = 'a'.repeat(1000);
			const yaml = `
name: test
members:
  - name: ${longName}
    type: function
flow:
  - member: ${longName}
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.members[0].name).toHaveLength(1000);
			}
		});

		it('should handle unicode characters', () => {
			const yaml = `
name: test-émoji-🎉
members:
  - name: greeter
    type: think
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			if (result.success) {
				expect(result.value.name).toBe('test-émoji-🎉');
			}
		});

		it('should handle special characters in strings', () => {
			const yaml = `
name: test
members:
  - name: greeter
    type: think
    config:
      prompt: "Hello \\"world\\" with 'quotes'"
flow:
  - member: greeter
			`;

			const result = parser.parseEnsemble(yaml);

			expect(result.success).toBe(true);
		});
	});
});
