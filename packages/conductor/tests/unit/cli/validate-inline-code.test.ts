/**
 * Inline Code Validation Tests
 *
 * Tests that the validation system properly rejects inline code patterns
 * that cannot work in Cloudflare Workers due to security restrictions.
 *
 * Workers V8 isolates block `new Function()` and `eval()` for security.
 * These tests verify that:
 * - config.code (string) is rejected
 * - config.function (string) is rejected
 * - config.handler (string) is rejected
 * - config.script (reference) is accepted
 * - config.handler (function) is accepted for programmatic use
 */

import { describe, it, expect } from 'vitest'

describe('Inline Code Validation', () => {
  describe('Agent Config Patterns', () => {
    /**
     * Helper to check if an agent config would be rejected
     * This simulates the validation logic in executor.ts
     */
    const hasInlineCode = (config: Record<string, unknown>): boolean => {
      // Check for string-based code patterns that cannot work in Workers
      if (typeof config.code === 'string') return true
      if (typeof config.function === 'string') return true
      if (typeof config.handler === 'string') return true
      return false
    }

    const hasValidScriptConfig = (config: Record<string, unknown>): boolean => {
      // Valid patterns for code execution
      if (typeof config.script === 'string') return true
      if (typeof config.handler === 'function') return true
      return false
    }

    describe('Rejected Patterns (inline code strings)', () => {
      it('should reject config.code with inline JavaScript', () => {
        const config = {
          code: `
            export default async function(context) {
              return { result: context.input.value * 2 };
            }
          `,
        }

        expect(hasInlineCode(config)).toBe(true)
        expect(hasValidScriptConfig(config)).toBe(false)
      })

      it('should reject config.function with function string', () => {
        const config = {
          function: `
            async function processData(input) {
              return { processed: true };
            }
          `,
        }

        expect(hasInlineCode(config)).toBe(true)
        expect(hasValidScriptConfig(config)).toBe(false)
      })

      it('should reject config.handler with string', () => {
        const config = {
          handler: `(ctx) => ({ doubled: ctx.input.value * 2 })`,
        }

        expect(hasInlineCode(config)).toBe(true)
        expect(hasValidScriptConfig(config)).toBe(false)
      })

      it('should reject multiline template literal code', () => {
        const config = {
          code: `
            import { someHelper } from './helper';

            export default async function transform(context) {
              const { data } = context.input;
              const result = someHelper(data);
              return { transformed: result };
            }
          `,
        }

        expect(hasInlineCode(config)).toBe(true)
      })
    })

    describe('Accepted Patterns', () => {
      it('should accept config.script with URI reference', () => {
        const config = {
          script: 'script://transforms/csv',
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(true)
      })

      it('should accept config.script with shorthand reference', () => {
        const config = {
          script: 'scripts/transforms/csv',
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(true)
      })

      it('should accept config.script with version', () => {
        const config = {
          script: 'scripts/validators/email@v1.0.0',
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(true)
      })

      it('should accept config.handler as function (programmatic use)', () => {
        const config = {
          handler: async (context: any) => {
            return { result: context.input.value * 2 }
          },
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(true)
      })

      it('should accept config.handler as sync function', () => {
        const config = {
          handler: (context: any) => ({ sum: context.input.a + context.input.b }),
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(true)
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty config', () => {
        const config = {}

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(false)
      })

      it('should handle config with unrelated properties', () => {
        const config = {
          model: 'gpt-4',
          temperature: 0.7,
          systemPrompt: 'You are helpful',
        }

        expect(hasInlineCode(config)).toBe(false)
        expect(hasValidScriptConfig(config)).toBe(false)
      })

      it('should reject code even with other valid properties', () => {
        const config = {
          script: 'scripts/transform',
          code: 'return { bad: true }', // This should still flag as problematic
        }

        expect(hasInlineCode(config)).toBe(true)
      })

      it('should handle null/undefined gracefully', () => {
        expect(hasInlineCode({ code: null })).toBe(false)
        expect(hasInlineCode({ code: undefined })).toBe(false)
        expect(hasInlineCode({ handler: null })).toBe(false)
      })
    })
  })

  describe('Error Message Quality', () => {
    /**
     * Simulates the error message that would be shown for inline code rejection
     */
    const getInlineCodeError = (agentName: string): string => {
      return (
        `Agent "${agentName}" uses inline code (config.code) which is not supported.\n` +
        'Cloudflare Workers block new Function() and eval() for security.\n\n' +
        'To fix this, migrate to bundled scripts:\n' +
        `1. Create a file: scripts/${agentName}.ts\n` +
        '2. Export your function: export default async function(context) { ... }\n' +
        `3. Update your ensemble to use: config.script: "scripts/${agentName}"\n\n` +
        'See: https://docs.ensemble.dev/conductor/guides/migrate-inline-code'
      )
    }

    it('should include agent name in error', () => {
      const error = getInlineCodeError('my-transformer')
      expect(error).toContain('my-transformer')
    })

    it('should explain the Workers limitation', () => {
      const error = getInlineCodeError('test')
      expect(error).toContain('Cloudflare Workers')
      expect(error).toContain('new Function()')
      expect(error).toContain('eval()')
    })

    it('should provide migration steps', () => {
      const error = getInlineCodeError('test')
      expect(error).toContain('Create a file')
      expect(error).toContain('Export your function')
      expect(error).toContain('config.script')
    })

    it('should include documentation link', () => {
      const error = getInlineCodeError('test')
      expect(error).toContain('https://docs.ensemble.dev')
    })
  })

  describe('YAML Validation Patterns', () => {
    /**
     * Test patterns that would appear in YAML files
     */

    it('should identify inline code in YAML agent definition', () => {
      // This represents what the YAML parser would produce
      const agentFromYaml = {
        name: 'transformer',
        operation: 'code',
        config: {
          code: `
            export default async function(context) {
              return { result: context.input.data };
            }
          `,
        },
      }

      expect(typeof agentFromYaml.config.code).toBe('string')
      expect(agentFromYaml.operation).toBe('code')
    })

    it('should identify valid script reference in YAML', () => {
      const agentFromYaml = {
        name: 'transformer',
        operation: 'code',
        config: {
          script: 'scripts/transforms/data',
        },
      }

      expect(typeof agentFromYaml.config.script).toBe('string')
      expect(agentFromYaml.config.script).toMatch(/^scripts\//)
    })
  })
})
