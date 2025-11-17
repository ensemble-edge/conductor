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


	it('should parse ensemble with webhook expose', () => {
		const yaml = `
name: webhook-enabled
expose:
  - type: webhook
    path: /trigger
    methods: [POST]
    auth:
      type: bearer
      secret: test-secret
flow:
  - agent: handler
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.expose).toHaveLength(1);
		expect(result.expose?.[0].type).toBe('webhook');
		if (result.expose?.[0].type === 'webhook') {
			expect(result.expose[0].path).toBe('/trigger');
		}
	});

	it('should parse ensemble with MCP expose', () => {
		const yaml = `
name: mcp-tool
expose:
  - type: mcp
    auth:
      type: bearer
      secret: test-secret
flow:
  - agent: processor
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.expose).toHaveLength(1);
		expect(result.expose?.[0].type).toBe('mcp');
	});

	it('should parse ensemble with email expose', () => {
		const yaml = `
name: email-triggered
expose:
  - type: email
    addresses:
      - test@example.com
    auth:
      from: ['trusted@example.com']
flow:
  - agent: processor
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.expose).toHaveLength(1);
		expect(result.expose?.[0].type).toBe('email');
		if (result.expose?.[0].type === 'email') {
			expect(result.expose[0].addresses).toContain('test@example.com');
		}
	});

	it('should parse ensemble with public webhook', () => {
		const yaml = `
name: public-webhook
expose:
  - type: webhook
    path: /public
    public: true
flow:
  - agent: handler
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.expose).toHaveLength(1);
		if (result.expose?.[0].type === 'webhook') {
			expect(result.expose[0].public).toBe(true);
		}
	});

	it('should reject expose without auth or public flag', () => {
		const yaml = `
name: insecure
expose:
  - type: webhook
    path: /insecure
flow:
  - agent: handler
		`;

		expect(() => Parser.parseEnsemble(yaml)).toThrow(/auth configuration or explicit public: true/);
	});

	it('should parse ensemble with notifications', () => {
		const yaml = `
name: notifying-ensemble
notifications:
  - type: webhook
    url: https://api.example.com/webhooks
    events:
      - execution.completed
      - execution.failed
    secret: webhook-secret
  - type: email
    to: [admin@example.com]
    events: [execution.failed]
    subject: "Alert: Execution failed"
flow:
  - agent: processor
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.notifications).toHaveLength(2);
		expect(result.notifications?.[0].type).toBe('webhook');
		expect(result.notifications?.[1].type).toBe('email');
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
