/**
 * Parser Tests
 *
 * Tests for YAML parsing and validation using actual Parser static API.
 * Target: 90%+ coverage with ~50 test cases (simplified from 100)
 */

import { describe, it, expect } from 'vitest';
import { Parser, type AgentFlowStep, type FlowStepType } from '../../../src/runtime/parser';

/**
 * Type guard to check if a flow step is an agent step
 */
function isAgentStep(step: FlowStepType): step is AgentFlowStep {
  return 'agent' in step && typeof (step as AgentFlowStep).agent === 'string';
}

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
			const step = result.flow![0];
			expect(isAgentStep(step)).toBe(true);
			if (isAgentStep(step)) {
				expect(step.agent).toBe('greeter');
			}
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


	it('should parse ensemble with webhook trigger', () => {
		const yaml = `
name: webhook-enabled
trigger:
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
		expect(result.trigger).toHaveLength(1);
		expect(result.trigger?.[0].type).toBe('webhook');
		if (result.trigger?.[0].type === 'webhook') {
			expect(result.trigger[0].path).toBe('/trigger');
		}
	});

	it('should parse ensemble with MCP trigger', () => {
		const yaml = `
name: mcp-tool
trigger:
  - type: mcp
    auth:
      type: bearer
      secret: test-secret
flow:
  - agent: processor
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.trigger).toHaveLength(1);
		expect(result.trigger?.[0].type).toBe('mcp');
	});

	it('should parse ensemble with email trigger', () => {
		const yaml = `
name: email-triggered
trigger:
  - type: email
    addresses:
      - test@example.com
    auth:
      from: ['trusted@example.com']
flow:
  - agent: processor
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.trigger).toHaveLength(1);
		expect(result.trigger?.[0].type).toBe('email');
		if (result.trigger?.[0].type === 'email') {
			expect(result.trigger[0].addresses).toContain('test@example.com');
		}
	});

	it('should parse ensemble with public webhook', () => {
		const yaml = `
name: public-webhook
trigger:
  - type: webhook
    path: /public
    public: true
flow:
  - agent: handler
		`;

		const result = Parser.parseEnsemble(yaml);
		expect(result.trigger).toHaveLength(1);
		if (result.trigger?.[0].type === 'webhook') {
			expect(result.trigger[0].public).toBe(true);
		}
	});

	it('should reject trigger without auth or public flag', () => {
		const yaml = `
name: insecure
trigger:
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


		it('should reject invalid cron trigger', () => {
			const yaml = `
name: test
trigger:
  - type: cron
    cron: ""
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

	describe('Flow Control Features', () => {
		it('should parse parallel flow step', () => {
			const yaml = `
name: parallel-test
flow:
  - type: parallel
    steps:
      - agent: step1
      - agent: step2
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'parallel').toBe(true);
		});

		it('should parse branch flow step with then/else', () => {
			const yaml = `
name: branch-test
flow:
  - type: branch
    condition: input.value > 0
    then:
      - agent: positive-handler
    else:
      - agent: negative-handler
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'branch').toBe(true);
		});

		it('should parse foreach flow step', () => {
			const yaml = `
name: foreach-test
flow:
  - type: foreach
    items: \${input.items}
    maxConcurrency: 5
    step:
      agent: processor
      input:
        item: \${item}
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'foreach').toBe(true);
		});

		it('should parse try/catch flow step', () => {
			const yaml = `
name: try-catch-test
flow:
  - type: try
    steps:
      - agent: risky-operation
    catch:
      - agent: error-handler
    finally:
      - agent: cleanup
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'try').toBe(true);
		});

		it('should parse switch/case flow step', () => {
			const yaml = `
name: switch-test
flow:
  - type: switch
    value: \${input.type}
    cases:
      typeA:
        - agent: handler-a
      typeB:
        - agent: handler-b
    default:
      - agent: default-handler
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'switch').toBe(true);
		});

		it('should parse while loop flow step', () => {
			const yaml = `
name: while-test
flow:
  - type: while
    condition: \${hasMore}
    maxIterations: 100
    steps:
      - agent: batch-processor
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'while').toBe(true);
		});

		it('should parse map-reduce flow step', () => {
			const yaml = `
name: map-reduce-test
flow:
  - type: map-reduce
    items: \${input.documents}
    maxConcurrency: 10
    map:
      agent: analyzer
      input:
        doc: \${item}
    reduce:
      agent: aggregator
      input:
        results: \${results}
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect('type' in step && step.type === 'map-reduce').toBe(true);
		});

		it('should parse agent step with retry config', () => {
			const yaml = `
name: retry-test
flow:
  - agent: api-caller
    retry:
      attempts: 3
      backoff: exponential
      initialDelay: 1000
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect(isAgentStep(step)).toBe(true);
			if (isAgentStep(step)) {
				expect(step.retry?.attempts).toBe(3);
				expect(step.retry?.backoff).toBe('exponential');
			}
		});

		it('should parse agent step with timeout config', () => {
			const yaml = `
name: timeout-test
flow:
  - agent: slow-operation
    timeout: 5000
    onTimeout:
      fallback: { status: "timeout" }
      error: false
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect(isAgentStep(step)).toBe(true);
			if (isAgentStep(step)) {
				expect(step.timeout).toBe(5000);
				expect(step.onTimeout?.error).toBe(false);
			}
		});

		it('should parse agent step with condition/when', () => {
			const yaml = `
name: conditional-test
flow:
  - agent: optional-step
    when: \${input.enabled === true}
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
			const step = result.flow![0];
			expect(isAgentStep(step)).toBe(true);
			if (isAgentStep(step)) {
				expect(step.when).toBeDefined();
			}
		});

		it('should parse nested control flow steps', () => {
			const yaml = `
name: nested-test
flow:
  - type: try
    steps:
      - type: parallel
        steps:
          - agent: task1
          - agent: task2
    catch:
      - agent: error-handler
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(1);
		});

		it('should auto-generate flow from inline agents', () => {
			const yaml = `
name: auto-flow-test
agents:
  - name: step1
    operation: code
  - name: step2
    operation: think
			`;

			const result = Parser.parseEnsemble(yaml);
			expect(result.flow).toHaveLength(2);
			const step1 = result.flow![0];
			const step2 = result.flow![1];
			expect(isAgentStep(step1) && step1.agent === 'step1').toBe(true);
			expect(isAgentStep(step2) && step2.agent === 'step2').toBe(true);
		});
	});
});
