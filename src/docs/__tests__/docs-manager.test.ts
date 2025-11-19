/**
 * DocsManager Tests
 *
 * Tests for markdown documentation management with Handlebars rendering
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DocsManager } from '../docs-manager.js'

describe('DocsManager', () => {
  let manager: DocsManager

  beforeEach(() => {
    manager = new DocsManager()
  })

  describe('loadFromMarkdown', () => {
    it('should load markdown without frontmatter', () => {
      const markdown = '# Hello World\n\nThis is content.'
      const template = manager.loadFromMarkdown(markdown, 'test')

      expect(template.name).toBe('test')
      expect(template.content).toBe(markdown)
      expect(template.metadata).toBeUndefined()
    })

    it('should parse YAML frontmatter', () => {
      const markdown = `---
title: Test Doc
description: A test document
version: 1.0.0
---

# Content

This is the content.`

      const template = manager.loadFromMarkdown(markdown, 'test')

      expect(template.name).toBe('test')
      expect(template.content).toContain('# Content')
      expect(template.content).not.toContain('---')
      expect(template.metadata).toEqual({
        title: 'Test Doc',
        description: 'A test document',
        version: '1.0.0',
      })
    })

    it('should handle frontmatter with quotes', () => {
      const markdown = `---
title: "Quoted Title"
description: 'Single Quoted'
---

Content here`

      const template = manager.loadFromMarkdown(markdown, 'test')

      expect(template.metadata?.title).toBe('Quoted Title')
      expect(template.metadata?.description).toBe('Single Quoted')
    })
  })

  describe('register and get', () => {
    it('should register and retrieve templates', () => {
      const template = manager.loadFromMarkdown('# Test', 'test-doc')
      manager.register(template)

      const retrieved = manager.get('test-doc')
      expect(retrieved).toEqual(template)
    })

    it('should return null for non-existent template', () => {
      const retrieved = manager.get('nonexistent')
      expect(retrieved).toBeNull()
    })

    it('should check if template exists', () => {
      manager.loadFromMarkdown('# Test', 'exists')

      expect(manager.has('exists')).toBe(true)
      expect(manager.has('not-exists')).toBe(false)
    })
  })

  describe('list', () => {
    it('should list all cached templates', () => {
      manager.loadFromMarkdown('# Doc 1', 'doc1')
      manager.loadFromMarkdown('---\ntitle: Doc 2\n---\n# Content', 'doc2')

      const list = manager.list()

      expect(list).toHaveLength(2)
      expect(list[0]).toEqual({ name: 'doc1', title: undefined })
      expect(list[1]).toEqual({ name: 'doc2', title: 'Doc 2' })
    })
  })

  describe('render', () => {
    it('should render markdown with Handlebars variables', async () => {
      const markdown = 'Hello {{name}}!'
      const template = manager.loadFromMarkdown(markdown, 'greeting')

      const rendered = await manager.render(template, {
        variables: { name: 'World' },
      })

      expect(rendered.content).toBe('Hello World!')
    })

    it('should render conditionals', async () => {
      const markdown = `{{#if premium}}Premium{{else}}Free{{/if}}`
      const template = manager.loadFromMarkdown(markdown, 'tier')

      const premium = await manager.render(template, {
        variables: { premium: true },
      })
      expect(premium.content).toBe('Premium')

      const free = await manager.render(template, {
        variables: { premium: false },
      })
      expect(free.content).toBe('Free')
    })

    it('should render loops', async () => {
      const markdown = `{{#each items}}
- {{this}}
{{/each}}`
      const template = manager.loadFromMarkdown(markdown, 'list')

      const rendered = await manager.render(template, {
        variables: { items: ['one', 'two', 'three'] },
      })

      expect(rendered.content).toContain('- one')
      expect(rendered.content).toContain('- two')
      expect(rendered.content).toContain('- three')
    })

    it('should use built-in helpers', async () => {
      const markdown = '{{upper text}} {{lower TEXT}}'
      const template = manager.loadFromMarkdown(markdown, 'helpers')

      const rendered = await manager.render(template, {
        variables: { text: 'hello', TEXT: 'WORLD' },
      })

      expect(rendered.content).toBe('HELLO world')
    })

    it('should skip Handlebars when requested', async () => {
      const markdown = 'Hello {{name}}!'
      const template = manager.loadFromMarkdown(markdown, 'raw')

      const rendered = await manager.render(template, {
        skipHandlebars: true,
      })

      expect(rendered.content).toBe('Hello {{name}}!')
    })

    it('should include metadata in render output', async () => {
      const markdown = `---
title: Test
version: 1.0.0
---

Content`
      const template = manager.loadFromMarkdown(markdown, 'meta')

      const rendered = await manager.render(template)

      expect(rendered.metadata).toEqual({
        title: 'Test',
        version: '1.0.0',
      })
    })
  })

  describe('renderByName', () => {
    it('should render by name from cache', async () => {
      manager.loadFromMarkdown('Hello {{name}}!', 'greeting')

      const rendered = await manager.renderByName('greeting', {
        variables: { name: 'Alice' },
      })

      expect(rendered.content).toBe('Hello Alice!')
    })

    it('should throw if template not found', async () => {
      await expect(manager.renderByName('nonexistent', {})).rejects.toThrow(
        'Docs template not found: nonexistent'
      )
    })
  })

  describe('custom helpers and partials', () => {
    it('should register custom helper', async () => {
      manager.registerHelper('shout', (text: string) => text.toUpperCase() + '!')

      const markdown = '{{shout message}}'
      const template = manager.loadFromMarkdown(markdown, 'custom')

      const rendered = await manager.render(template, {
        variables: { message: 'hello' },
      })

      expect(rendered.content).toBe('HELLO!')
    })

    it('should register partial', async () => {
      manager.registerPartial('header', '# {{title}}\n')

      const markdown = '{{> header title="Welcome"}}\n\nContent here.'
      const template = manager.loadFromMarkdown(markdown, 'with-partial')

      const rendered = await manager.render(template)

      expect(rendered.content).toContain('# Welcome')
      expect(rendered.content).toContain('Content here.')
    })
  })

  describe('clearCache', () => {
    it('should clear all cached templates', () => {
      manager.loadFromMarkdown('# Doc 1', 'doc1')
      manager.loadFromMarkdown('# Doc 2', 'doc2')

      expect(manager.list()).toHaveLength(2)

      manager.clearCache()

      expect(manager.list()).toHaveLength(0)
    })
  })

  describe('caching configuration', () => {
    it('should not cache when disabled', () => {
      const managerNoCache = new DocsManager({ cacheEnabled: false })
      managerNoCache.loadFromMarkdown('# Test', 'test')

      expect(managerNoCache.has('test')).toBe(false)
    })

    it('should cache by default', () => {
      manager.loadFromMarkdown('# Test', 'test')

      expect(manager.has('test')).toBe(true)
    })
  })

  describe('Handlebars configuration', () => {
    it('should disable Handlebars rendering when configured', async () => {
      const noHandlebars = new DocsManager({ handlebarsEnabled: false })
      const markdown = 'Hello {{name}}!'
      const template = noHandlebars.loadFromMarkdown(markdown, 'test')

      const rendered = await noHandlebars.render(template, {
        variables: { name: 'World' },
      })

      expect(rendered.content).toBe('Hello {{name}}!')
    })
  })
})
