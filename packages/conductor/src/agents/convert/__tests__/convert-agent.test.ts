/**
 * Convert Agent Tests
 *
 * Tests for document format conversion functionality:
 * - HTML → Markdown (turndown)
 * - Markdown → HTML (marked)
 * - Markdown → Frontmatter (gray-matter)
 * - HTML → Text (built-in)
 * - Error handling
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConvertAgent } from '../convert-agent.js'
import type { AgentExecutionContext } from '../../base-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import { Operation } from '../../../types/operation.js'

describe('ConvertAgent', () => {
  let mockContext: AgentExecutionContext

  beforeEach(() => {
    mockContext = {
      input: {},
      env: {},
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if input is missing', async () => {
      const config: AgentConfig = {
        name: 'test-convert',
        operation: Operation.convert,
        config: {
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('config.input is required')
    })

    it('should throw error if from is missing', async () => {
      const config: AgentConfig = {
        name: 'test-convert',
        operation: Operation.convert,
        config: {
          input: '<h1>Test</h1>',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('config.from is required')
    })

    it('should throw error if to is missing', async () => {
      const config: AgentConfig = {
        name: 'test-convert',
        operation: Operation.convert,
        config: {
          input: '<h1>Test</h1>',
          from: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('config.to is required')
    })

    it('should throw error for unsupported conversion', async () => {
      const config: AgentConfig = {
        name: 'test-convert',
        operation: Operation.convert,
        config: {
          input: 'some text',
          from: 'text',
          to: 'pdf',
        },
      }

      const agent = new ConvertAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('unsupported conversion')
    })
  })

  describe('HTML to Markdown', () => {
    it('should convert simple HTML to Markdown', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<h1>Hello World</h1><p>This is a test.</p>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toContain('Hello World')
      expect(result).toContain('This is a test.')
    })

    it('should convert headings with atx style by default', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('# Heading 1')
      expect(result).toContain('## Heading 2')
      expect(result).toContain('### Heading 3')
    })

    it('should convert links to inline Markdown links', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<a href="https://example.com">Click here</a>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('[Click here](https://example.com)')
    })

    it('should convert lists to Markdown lists', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<ul><li>Item 1</li><li>Item 2</li></ul>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      // Turndown may add extra spaces after bullet marker
      expect(result).toMatch(/-\s+Item 1/)
      expect(result).toMatch(/-\s+Item 2/)
    })

    it('should convert bold and italic', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<strong>Bold</strong> and <em>italic</em>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('**Bold**')
      expect(result).toContain('_italic_')
    })

    it('should convert tables with GFM plugin', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: `
            <table>
              <thead>
                <tr><th>Name</th><th>Age</th></tr>
              </thead>
              <tbody>
                <tr><td>Alice</td><td>30</td></tr>
                <tr><td>Bob</td><td>25</td></tr>
              </tbody>
            </table>
          `,
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('Name')
      expect(result).toContain('Age')
      expect(result).toContain('Alice')
      expect(result).toContain('Bob')
      expect(result).toContain('|') // Table pipes
    })

    it('should allow custom turndown options', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '<ul><li>Item</li></ul>',
          from: 'html',
          to: 'markdown',
          turndown: {
            bulletListMarker: '*',
          },
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      // Turndown may add extra spaces after bullet marker
      expect(result).toMatch(/\*\s+Item/)
    })

    it('should handle empty input', async () => {
      const config: AgentConfig = {
        name: 'html-to-md',
        operation: Operation.convert,
        config: {
          input: '',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('')
    })
  })

  describe('Markdown to HTML', () => {
    it('should convert simple Markdown to HTML', async () => {
      const config: AgentConfig = {
        name: 'md-to-html',
        operation: Operation.convert,
        config: {
          input: '# Hello World\n\nThis is a test.',
          from: 'markdown',
          to: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('<h1>')
      expect(result).toContain('Hello World')
      expect(result).toContain('<p>')
      expect(result).toContain('This is a test.')
    })

    it('should convert Markdown links', async () => {
      const config: AgentConfig = {
        name: 'md-to-html',
        operation: Operation.convert,
        config: {
          input: '[Click here](https://example.com)',
          from: 'markdown',
          to: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('<a href="https://example.com">Click here</a>')
    })

    it('should convert code blocks with GFM', async () => {
      const config: AgentConfig = {
        name: 'md-to-html',
        operation: Operation.convert,
        config: {
          input: '```javascript\nconsole.log("hello")\n```',
          from: 'markdown',
          to: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('<code')
      expect(result).toContain('console.log')
    })

    it('should convert tables with GFM', async () => {
      const config: AgentConfig = {
        name: 'md-to-html',
        operation: Operation.convert,
        config: {
          input: '| Name | Age |\n|------|-----|\n| Alice | 30 |',
          from: 'markdown',
          to: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('<table>')
      expect(result).toContain('<th>')
      expect(result).toContain('Alice')
    })

    it('should handle empty input', async () => {
      const config: AgentConfig = {
        name: 'md-to-html',
        operation: Operation.convert,
        config: {
          input: '',
          from: 'markdown',
          to: 'html',
        },
      }

      const agent = new ConvertAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('')
    })
  })

  describe('Markdown to Frontmatter', () => {
    it('should extract YAML frontmatter', async () => {
      const config: AgentConfig = {
        name: 'md-to-fm',
        operation: Operation.convert,
        config: {
          input: `---
title: My Document
author: Alice
date: 2024-01-15
tags:
  - typescript
  - testing
---

# Introduction

This is the body content.`,
          from: 'markdown',
          to: 'frontmatter',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as {
        frontmatter: Record<string, unknown>
        content: string
      }

      expect(result.frontmatter).toEqual({
        title: 'My Document',
        author: 'Alice',
        date: expect.any(Date),
        tags: ['typescript', 'testing'],
      })
      expect(result.content).toContain('# Introduction')
      expect(result.content).toContain('This is the body content.')
    })

    it('should handle document without frontmatter', async () => {
      const config: AgentConfig = {
        name: 'md-to-fm',
        operation: Operation.convert,
        config: {
          input: '# Just a heading\n\nSome content.',
          from: 'markdown',
          to: 'frontmatter',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as {
        frontmatter: Record<string, unknown>
        content: string
      }

      expect(result.frontmatter).toEqual({})
      expect(result.content).toContain('# Just a heading')
    })

    it('should handle empty frontmatter', async () => {
      const config: AgentConfig = {
        name: 'md-to-fm',
        operation: Operation.convert,
        config: {
          input: `---
---

# Content here`,
          from: 'markdown',
          to: 'frontmatter',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as {
        frontmatter: Record<string, unknown>
        content: string
      }

      expect(result.frontmatter).toEqual({})
      expect(result.content).toContain('# Content here')
    })

    it('should handle empty input', async () => {
      const config: AgentConfig = {
        name: 'md-to-fm',
        operation: Operation.convert,
        config: {
          input: '',
          from: 'markdown',
          to: 'frontmatter',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as {
        frontmatter: Record<string, unknown>
        content: string
      }

      expect(result.frontmatter).toEqual({})
      expect(result.content).toBe('')
    })
  })

  describe('HTML to Text', () => {
    it('should strip HTML tags', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toBe('Title This is bold text.')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should remove script tags and content', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '<p>Hello</p><script>alert("evil")</script><p>World</p>',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toBe('Hello World')
      expect(result).not.toContain('alert')
      expect(result).not.toContain('script')
    })

    it('should remove style tags and content', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '<p>Hello</p><style>.red{color:red}</style><p>World</p>',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toBe('Hello World')
      expect(result).not.toContain('color')
      expect(result).not.toContain('style')
    })

    it('should decode HTML entities', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '<p>5 &lt; 10 &amp;&amp; 10 &gt; 5</p>',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toBe('5 < 10 && 10 > 5')
    })

    it('should normalize whitespace', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '<p>  Multiple   spaces   here  </p>',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toBe('Multiple spaces here')
    })

    it('should handle empty input', async () => {
      const config: AgentConfig = {
        name: 'html-to-text',
        operation: Operation.convert,
        config: {
          input: '',
          from: 'html',
          to: 'text',
        },
      }

      const agent = new ConvertAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('')
    })
  })

  describe('Runtime Config Override', () => {
    it('should allow runtime config to override static config', async () => {
      const config: AgentConfig = {
        name: 'override-convert',
        operation: Operation.convert,
        config: {
          input: '<h1>Static</h1>',
          from: 'html',
          to: 'markdown',
        },
      }

      const agent = new ConvertAgent(config)
      const result = await agent['run']({
        ...mockContext,
        config: {
          input: '<h1>Runtime</h1>',
        },
      })

      expect(result).toContain('Runtime')
      expect(result).not.toContain('Static')
    })
  })
})
