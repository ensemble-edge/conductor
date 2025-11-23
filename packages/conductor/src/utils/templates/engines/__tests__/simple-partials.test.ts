/**
 * Simple Template Engine - Partials and Component Loading Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SimpleTemplateEngine } from '../simple.js'
import { ComponentLoader } from '../../../../runtime/component-loader.js'

describe('SimpleTemplateEngine - Partials', () => {
  let engine: SimpleTemplateEngine
  let mockKV: any
  let mockCache: any
  let componentLoader: ComponentLoader

  beforeEach(() => {
    // Mock KV namespace
    mockKV = {
      get: vi.fn(),
      getWithMetadata: vi.fn(),
      list: vi.fn(),
    }

    // Mock Conductor Cache (not Cache API)
    mockCache = {
      get: vi.fn().mockResolvedValue({ success: true, value: null }),
      set: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
      has: vi.fn().mockResolvedValue({ success: true, value: false }),
      clear: vi.fn().mockResolvedValue({ success: true }),
      invalidateByTag: vi.fn().mockResolvedValue({ success: true }),
    }

    engine = new SimpleTemplateEngine()
    componentLoader = new ComponentLoader({
      kv: mockKV,
      cache: mockCache,
    })
  })

  describe('registerPartial', () => {
    it('should register and use a simple partial', async () => {
      engine.registerPartial('header', '<h1>{{title}}</h1>')

      const template = '<div>{{> header}}</div>'
      const result = await engine.render(template, {
        data: { title: 'My Site' },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<div><h1>My Site</h1></div>')
    })

    it('should register multiple partials', async () => {
      engine.registerPartial('header', '<h1>{{title}}</h1>')
      engine.registerPartial('footer', '<footer>{{year}}</footer>')

      const template = '{{> header}}<main>Content</main>{{> footer}}'
      const result = await engine.render(template, {
        data: { title: 'Site', year: 2025 },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<h1>Site</h1><main>Content</main><footer>2025</footer>')
    })

    it('should handle nested partials', async () => {
      engine.registerPartial('nav', '<nav>{{name}}</nav>')
      engine.registerPartial('header', '<header>{{> nav}}</header>')

      const template = '{{> header}}'
      const result = await engine.render(template, {
        data: { name: 'Main Nav' },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<header><nav>Main Nav</nav></header>')
    })
  })

  describe('ComponentLoader integration', () => {
    it('should load partial from ComponentLoader using URI syntax', async () => {
      engine.setComponentLoader(componentLoader)

      const headerComponent = '<header><h1>{{title}}</h1></header>'
      mockKV.get.mockResolvedValue(headerComponent)

      const template = '{{> template://components/header}}'
      const result = await engine.render(template, {
        data: { title: 'My Site' },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<header><h1>My Site</h1></header>')
      expect(mockKV.get).toHaveBeenCalledWith('templates/components/header@latest', 'text')
    })

    it('should default to latest version when not specified', async () => {
      engine.setComponentLoader(componentLoader)

      mockKV.get.mockResolvedValue('<nav>{{title}}</nav>')

      const template = '{{> template://components/nav}}'
      await engine.render(template, {
        data: { title: 'Nav' },
        helpers: {},
        partials: {},
      })

      expect(mockKV.get).toHaveBeenCalledWith('templates/components/nav@latest', 'text')
    })

    it('should load specific version when provided', async () => {
      engine.setComponentLoader(componentLoader)

      mockKV.get.mockResolvedValue('<footer>v1.0.0</footer>')

      const template = '{{> template://components/footer@v1.0.0}}'
      await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(mockKV.get).toHaveBeenCalledWith('templates/components/footer@v1.0.0', 'text')
    })

    it('should use cached component if available', async () => {
      engine.setComponentLoader(componentLoader)

      mockCache.get.mockResolvedValue({
        success: true,
        value: '<cached>Content</cached>',
      })

      const template = '{{> template://components/cached}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<cached>Content</cached>')
      expect(mockKV.get).not.toHaveBeenCalled()
    })

    it('should handle component not found gracefully', async () => {
      engine.setComponentLoader(componentLoader)

      mockKV.get.mockResolvedValue(null)

      const template = '{{> template://components/missing}}'

      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      // Should render an HTML comment with the error
      expect(result).toContain('<!-- Partial error: Component not found')
    })
  })

  describe('partial arguments', () => {
    it('should pass arguments to registered partials', async () => {
      engine.registerPartial(
        'card',
        '<div class="card"><h2>{{title}}</h2><p>{{description}}</p></div>'
      )

      const template = '{{> card title="Welcome" description="Hello World"}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<div class="card"><h2>Welcome</h2><p>Hello World</p></div>')
    })

    it('should pass arguments to ComponentLoader partials', async () => {
      engine.setComponentLoader(componentLoader)

      const cardComponent = '<article><h2>{{heading}}</h2><p>{{text}}</p></article>'
      mockKV.get.mockResolvedValue(cardComponent)

      const template = '{{> template://components/card heading="Title" text="Body"}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<article><h2>Title</h2><p>Body</p></article>')
    })

    it('should support numeric arguments', async () => {
      engine.registerPartial('counter', '<span>Count: {{count}}</span>')

      const template = '{{> counter count=42}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<span>Count: 42</span>')
    })

    it('should support boolean arguments', async () => {
      engine.registerPartial(
        'toggle',
        '<button {{#if active}}class="active"{{/if}}>Toggle</button>'
      )

      const template = '{{> toggle active=true}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toContain('class="active"')
    })

    it('should inherit context variables when no arguments provided', async () => {
      engine.registerPartial('user', '<p>{{name}}</p>')

      const template = '{{> user}}'
      const result = await engine.render(template, {
        data: { name: 'John Doe' },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<p>John Doe</p>')
    })

    it('should override context with arguments', async () => {
      engine.registerPartial('greeting', '<p>Hello {{name}}</p>')

      const template = '{{> greeting name="Jane"}}'
      const result = await engine.render(template, {
        data: { name: 'John' },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<p>Hello Jane</p>')
    })
  })

  describe('complex partial scenarios', () => {
    it('should handle multiple partials with different arguments', async () => {
      engine.registerPartial('card', '<div class="card">{{title}}</div>')

      const template = '{{> card title="First"}}{{> card title="Second"}}{{> card title="Third"}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe(
        '<div class="card">First</div>' +
          '<div class="card">Second</div>' +
          '<div class="card">Third</div>'
      )
    })

    it('should handle partials within loops', async () => {
      engine.registerPartial('item', '<li>{{name}}</li>')

      const template = '<ul>{{#each items}}{{> item}}{{/each}}</ul>'
      const result = await engine.render(template, {
        data: {
          items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
        },
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>')
    })

    it('should handle partials within conditionals', async () => {
      engine.registerPartial('success', '<div class="success">Success!</div>')
      engine.registerPartial('error', '<div class="error">Error!</div>')

      const template = '{{#if success}}{{> success}}{{else}}{{> error}}{{/if}}'

      const successResult = await engine.render(template, {
        data: { success: true },
        helpers: {},
        partials: {},
      })

      const errorResult = await engine.render(template, {
        data: { success: false },
        helpers: {},
        partials: {},
      })

      expect(successResult).toBe('<div class="success">Success!</div>')
      expect(errorResult).toBe('<div class="error">Error!</div>')
    })

    it('should mix registered and ComponentLoader partials', async () => {
      engine.registerPartial('header', '<header>Site Header</header>')
      engine.setComponentLoader(componentLoader)

      mockKV.get.mockResolvedValue('<footer>Site Footer</footer>')

      const template = '{{> header}}<main>Content</main>{{> template://components/footer}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe(
        '<header>Site Header</header><main>Content</main><footer>Site Footer</footer>'
      )
    })
  })

  describe('error handling', () => {
    it('should handle missing registered partial gracefully', async () => {
      const template = '{{> missingPartial}}'

      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      // Should render an HTML comment with the error
      expect(result).toContain('<!-- Partial error: Partial not found')
    })

    it('should show helpful error when ComponentLoader not configured', async () => {
      const template = '{{> template://components/header}}'

      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      // Should render an HTML comment explaining ComponentLoader is not configured
      expect(result).toContain('<!-- Partial error: Component loader not configured')
    })

    it('should handle malformed partial arguments', async () => {
      engine.registerPartial('test', '{{value}}')

      // Missing quote at end
      const template = '{{> test value="broken}}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      // Should handle gracefully without crashing
      expect(result).toBeDefined()
    })
  })

  describe('whitespace handling', () => {
    it('should handle partials with whitespace around name', async () => {
      engine.registerPartial('header', '<h1>Header</h1>')

      const template = '{{>   header   }}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('<h1>Header</h1>')
    })

    it('should handle partials with whitespace in arguments', async () => {
      engine.registerPartial('card', '{{title}}')

      const template = '{{> card   title="Test"   }}'
      const result = await engine.render(template, {
        data: {},
        helpers: {},
        partials: {},
      })

      expect(result).toBe('Test')
    })
  })
})
