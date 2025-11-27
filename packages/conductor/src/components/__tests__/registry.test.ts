/**
 * Component Registry Tests
 *
 * Tests for ComponentRegistry, SchemaRegistry, PromptRegistry, and ConfigRegistry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ComponentRegistry,
  createComponentRegistry,
  parseNameWithVersion,
} from '../registry.js'
import { validateJsonSchema, type JSONSchema } from '../schemas.js'
import { renderHandlebars } from '../prompts.js'

// Mock KV namespace
const createMockKV = (data: Record<string, any> = {}) => ({
  get: vi.fn(async (key: string) => {
    const value = data[key]
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return value ?? null
  }),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
})

describe('parseNameWithVersion', () => {
  it('should parse name without version', () => {
    const result = parseNameWithVersion('order')
    expect(result).toEqual({ name: 'order', version: 'latest' })
  })

  it('should parse name with version', () => {
    const result = parseNameWithVersion('order@v1.0.0')
    expect(result).toEqual({ name: 'order', version: 'v1.0.0' })
  })

  it('should parse name with semver range', () => {
    const result = parseNameWithVersion('order@^2.0.0')
    expect(result).toEqual({ name: 'order', version: '^2.0.0' })
  })

  it('should parse name with latest', () => {
    const result = parseNameWithVersion('order@latest')
    expect(result).toEqual({ name: 'order', version: 'latest' })
  })

  it('should handle names with hyphens', () => {
    const result = parseNameWithVersion('my-schema@v1.0.0')
    expect(result).toEqual({ name: 'my-schema', version: 'v1.0.0' })
  })

  it('should handle paths with slashes', () => {
    const result = parseNameWithVersion('schemas/order@v1.0.0')
    expect(result).toEqual({ name: 'schemas/order', version: 'v1.0.0' })
  })
})

describe('ComponentRegistry', () => {
  let mockEnv: any
  let registry: ComponentRegistry

  beforeEach(() => {
    mockEnv = {
      EDGIT: createMockKV({
        'components/schemas/order/v1.0.0': {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
          },
          required: ['id', 'amount'],
        },
        'components/prompts/greeting/latest': 'Hello, {{name}}!',
        'components/configs/settings/latest': {
          theme: 'dark',
          maxItems: 100,
        },
      }),
    }
    registry = createComponentRegistry(mockEnv)
  })

  it('should create registry from env', () => {
    expect(registry).toBeInstanceOf(ComponentRegistry)
  })

  it('should have schemas sub-registry', () => {
    expect(registry.schemas).toBeDefined()
  })

  it('should have prompts sub-registry', () => {
    expect(registry.prompts).toBeDefined()
  })

  it('should have configs sub-registry', () => {
    expect(registry.configs).toBeDefined()
  })

  it('should cache resolved components', async () => {
    // First call
    await registry.resolve('schemas/order@v1.0.0')
    // Second call should be cached
    await registry.resolve('schemas/order@v1.0.0')

    const stats = registry.getCacheStats()
    expect(stats.size).toBe(1)
    expect(stats.keys).toContain('schemas/order@v1.0.0')
  })

  it('should clear cache', async () => {
    await registry.resolve('schemas/order@v1.0.0')
    expect(registry.getCacheStats().size).toBe(1)

    registry.clearCache()
    expect(registry.getCacheStats().size).toBe(0)
  })
})

describe('SchemaRegistry', () => {
  let mockEnv: any
  let registry: ComponentRegistry

  beforeEach(() => {
    mockEnv = {
      EDGIT: createMockKV({
        'components/schemas/order/v1.0.0': {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
          },
          required: ['id', 'amount'],
        },
        'components/schemas/order/latest': {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string' },
          },
          required: ['id', 'amount'],
        },
      }),
    }
    registry = createComponentRegistry(mockEnv)
  })

  it('should get schema by name with version', async () => {
    const schema = await registry.schemas.get('order@v1.0.0')
    expect(schema).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
      },
      required: ['id', 'amount'],
    })
  })

  it('should get latest schema when no version specified', async () => {
    const schema = await registry.schemas.get('order')
    expect(schema.properties).toHaveProperty('status')
  })

  it('should validate data against schema', async () => {
    const result = await registry.schemas.validate('order@v1.0.0', {
      id: '123',
      amount: 99.99,
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for invalid data', async () => {
    const result = await registry.schemas.validate('order@v1.0.0', {
      id: '123',
      // missing required 'amount'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].keyword).toBe('required')
  })

  it('should return boolean for isValid', async () => {
    expect(await registry.schemas.isValid('order@v1.0.0', { id: '123', amount: 50 })).toBe(true)
    expect(await registry.schemas.isValid('order@v1.0.0', { id: '123' })).toBe(false)
  })

  it('should check if schema exists', async () => {
    expect(await registry.schemas.exists('order@v1.0.0')).toBe(true)
    expect(await registry.schemas.exists('nonexistent@v1.0.0')).toBe(false)
  })
})

describe('validateJsonSchema', () => {
  it('should validate string type', () => {
    const schema: JSONSchema = { type: 'string' }
    expect(validateJsonSchema(schema, 'hello').valid).toBe(true)
    expect(validateJsonSchema(schema, 123).valid).toBe(false)
  })

  it('should validate number type', () => {
    const schema: JSONSchema = { type: 'number' }
    expect(validateJsonSchema(schema, 123).valid).toBe(true)
    expect(validateJsonSchema(schema, 'hello').valid).toBe(false)
  })

  it('should validate integer type', () => {
    const schema: JSONSchema = { type: 'integer' }
    expect(validateJsonSchema(schema, 123).valid).toBe(true)
    expect(validateJsonSchema(schema, 123.5).valid).toBe(false)
  })

  it('should validate boolean type', () => {
    const schema: JSONSchema = { type: 'boolean' }
    expect(validateJsonSchema(schema, true).valid).toBe(true)
    expect(validateJsonSchema(schema, 'true').valid).toBe(false)
  })

  it('should validate array type', () => {
    const schema: JSONSchema = { type: 'array' }
    expect(validateJsonSchema(schema, [1, 2, 3]).valid).toBe(true)
    expect(validateJsonSchema(schema, 'not array').valid).toBe(false)
  })

  it('should validate object type', () => {
    const schema: JSONSchema = { type: 'object' }
    expect(validateJsonSchema(schema, { foo: 'bar' }).valid).toBe(true)
    expect(validateJsonSchema(schema, []).valid).toBe(false)
  })

  it('should validate null type', () => {
    const schema: JSONSchema = { type: 'null' }
    expect(validateJsonSchema(schema, null).valid).toBe(true)
    expect(validateJsonSchema(schema, undefined).valid).toBe(false)
  })

  it('should validate union types', () => {
    const schema: JSONSchema = { type: ['string', 'number'] }
    expect(validateJsonSchema(schema, 'hello').valid).toBe(true)
    expect(validateJsonSchema(schema, 123).valid).toBe(true)
    expect(validateJsonSchema(schema, true).valid).toBe(false)
  })

  it('should validate required properties', () => {
    const schema: JSONSchema = {
      type: 'object',
      required: ['name', 'age'],
    }
    expect(validateJsonSchema(schema, { name: 'John', age: 30 }).valid).toBe(true)
    expect(validateJsonSchema(schema, { name: 'John' }).valid).toBe(false)
  })

  it('should validate nested properties', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
    }
    expect(validateJsonSchema(schema, { user: { name: 'John' } }).valid).toBe(true)
    expect(validateJsonSchema(schema, { user: { name: 123 } }).valid).toBe(false)
  })

  it('should validate string minLength/maxLength', () => {
    const schema: JSONSchema = { type: 'string', minLength: 3, maxLength: 10 }
    expect(validateJsonSchema(schema, 'hello').valid).toBe(true)
    expect(validateJsonSchema(schema, 'hi').valid).toBe(false)
    expect(validateJsonSchema(schema, 'this is too long').valid).toBe(false)
  })

  it('should validate string pattern', () => {
    const schema: JSONSchema = { type: 'string', pattern: '^[a-z]+$' }
    expect(validateJsonSchema(schema, 'hello').valid).toBe(true)
    expect(validateJsonSchema(schema, 'Hello').valid).toBe(false)
  })

  it('should validate number minimum/maximum', () => {
    const schema: JSONSchema = { type: 'number', minimum: 0, maximum: 100 }
    expect(validateJsonSchema(schema, 50).valid).toBe(true)
    expect(validateJsonSchema(schema, -1).valid).toBe(false)
    expect(validateJsonSchema(schema, 101).valid).toBe(false)
  })

  it('should validate exclusiveMinimum/exclusiveMaximum', () => {
    const schema: JSONSchema = { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 }
    expect(validateJsonSchema(schema, 50).valid).toBe(true)
    expect(validateJsonSchema(schema, 0).valid).toBe(false)
    expect(validateJsonSchema(schema, 100).valid).toBe(false)
  })

  it('should validate array minItems/maxItems', () => {
    const schema: JSONSchema = { type: 'array', minItems: 1, maxItems: 3 }
    expect(validateJsonSchema(schema, [1, 2]).valid).toBe(true)
    expect(validateJsonSchema(schema, []).valid).toBe(false)
    expect(validateJsonSchema(schema, [1, 2, 3, 4]).valid).toBe(false)
  })

  it('should validate array uniqueItems', () => {
    const schema: JSONSchema = { type: 'array', uniqueItems: true }
    expect(validateJsonSchema(schema, [1, 2, 3]).valid).toBe(true)
    expect(validateJsonSchema(schema, [1, 2, 2]).valid).toBe(false)
  })

  it('should validate array items', () => {
    const schema: JSONSchema = {
      type: 'array',
      items: { type: 'number' },
    }
    expect(validateJsonSchema(schema, [1, 2, 3]).valid).toBe(true)
    expect(validateJsonSchema(schema, [1, 'two', 3]).valid).toBe(false)
  })

  it('should validate enum', () => {
    const schema: JSONSchema = { enum: ['red', 'green', 'blue'] }
    expect(validateJsonSchema(schema, 'red').valid).toBe(true)
    expect(validateJsonSchema(schema, 'yellow').valid).toBe(false)
  })

  it('should validate const', () => {
    const schema: JSONSchema = { const: 'fixed' }
    expect(validateJsonSchema(schema, 'fixed').valid).toBe(true)
    expect(validateJsonSchema(schema, 'other').valid).toBe(false)
  })

  it('should validate allOf', () => {
    const schema: JSONSchema = {
      allOf: [
        { type: 'object', required: ['name'] },
        { type: 'object', required: ['age'] },
      ],
    }
    expect(validateJsonSchema(schema, { name: 'John', age: 30 }).valid).toBe(true)
    expect(validateJsonSchema(schema, { name: 'John' }).valid).toBe(false)
  })

  it('should validate anyOf', () => {
    const schema: JSONSchema = {
      anyOf: [{ type: 'string' }, { type: 'number' }],
    }
    expect(validateJsonSchema(schema, 'hello').valid).toBe(true)
    expect(validateJsonSchema(schema, 123).valid).toBe(true)
    expect(validateJsonSchema(schema, true).valid).toBe(false)
  })

  it('should validate oneOf', () => {
    const schema: JSONSchema = {
      oneOf: [
        { type: 'number', minimum: 0 },
        { type: 'number', maximum: 10 },
      ],
    }
    // 5 matches both schemas, so oneOf fails
    expect(validateJsonSchema(schema, 5).valid).toBe(false)
    // -5 only matches the second schema
    expect(validateJsonSchema(schema, -5).valid).toBe(true)
    // 15 only matches the first schema
    expect(validateJsonSchema(schema, 15).valid).toBe(true)
  })

  it('should validate not', () => {
    const schema: JSONSchema = { not: { type: 'string' } }
    expect(validateJsonSchema(schema, 123).valid).toBe(true)
    expect(validateJsonSchema(schema, 'hello').valid).toBe(false)
  })

  it('should handle boolean schemas', () => {
    expect(validateJsonSchema(true, 'anything').valid).toBe(true)
    expect(validateJsonSchema(false, 'anything').valid).toBe(false)
  })

  it('should validate email format', () => {
    const schema: JSONSchema = { type: 'string', format: 'email' }
    expect(validateJsonSchema(schema, 'test@example.com').valid).toBe(true)
    expect(validateJsonSchema(schema, 'invalid-email').valid).toBe(false)
  })

  it('should validate uuid format', () => {
    const schema: JSONSchema = { type: 'string', format: 'uuid' }
    expect(validateJsonSchema(schema, '550e8400-e29b-41d4-a716-446655440000').valid).toBe(true)
    expect(validateJsonSchema(schema, 'not-a-uuid').valid).toBe(false)
  })

  it('should validate date format', () => {
    const schema: JSONSchema = { type: 'string', format: 'date' }
    expect(validateJsonSchema(schema, '2024-01-15').valid).toBe(true)
    expect(validateJsonSchema(schema, '01-15-2024').valid).toBe(false)
  })
})

describe('PromptRegistry', () => {
  let mockEnv: any
  let registry: ComponentRegistry

  beforeEach(() => {
    mockEnv = {
      EDGIT: createMockKV({
        'components/prompts/greeting/latest': 'Hello, {{name}}! Welcome to {{place}}.',
        'components/prompts/greeting/v1.0.0': 'Hi {{name}}!',
        'components/prompts/conditional/latest':
          '{{#if premium}}Premium user: {{name}}{{else}}Free user: {{name}}{{/if}}',
        'components/prompts/list/latest': 'Items: {{#each items}}{{this}}, {{/each}}',
      }),
    }
    registry = createComponentRegistry(mockEnv)
  })

  it('should get prompt template', async () => {
    const template = await registry.prompts.get('greeting@v1.0.0')
    expect(template).toBe('Hi {{name}}!')
  })

  it('should render prompt with variables', async () => {
    const rendered = await registry.prompts.render('greeting', {
      name: 'Alice',
      place: 'Wonderland',
    })
    expect(rendered).toBe('Hello, Alice! Welcome to Wonderland.')
  })

  it('should check if prompt exists', async () => {
    expect(await registry.prompts.exists('greeting')).toBe(true)
    expect(await registry.prompts.exists('nonexistent')).toBe(false)
  })

  it('should list variables in template', async () => {
    const vars = await registry.prompts.listVariables('greeting')
    expect(vars).toContain('name')
    expect(vars).toContain('place')
  })
})

describe('renderHandlebars', () => {
  it('should render simple variables', () => {
    const result = renderHandlebars('Hello, {{name}}!', { name: 'World' })
    expect(result).toBe('Hello, World!')
  })

  it('should render nested variables', () => {
    const result = renderHandlebars('Hello, {{user.name}}!', {
      user: { name: 'Alice' },
    })
    expect(result).toBe('Hello, Alice!')
  })

  it('should handle missing variables', () => {
    const result = renderHandlebars('Hello, {{name}}!', {})
    expect(result).toBe('Hello, !')
  })

  it('should render if blocks (truthy)', () => {
    const template = '{{#if show}}visible{{/if}}'
    expect(renderHandlebars(template, { show: true })).toBe('visible')
    expect(renderHandlebars(template, { show: false })).toBe('')
  })

  it('should render if-else blocks', () => {
    const template = '{{#if premium}}Pro{{else}}Free{{/if}}'
    expect(renderHandlebars(template, { premium: true })).toBe('Pro')
    expect(renderHandlebars(template, { premium: false })).toBe('Free')
  })

  it('should render unless blocks', () => {
    const template = '{{#unless hidden}}visible{{/unless}}'
    expect(renderHandlebars(template, { hidden: false })).toBe('visible')
    expect(renderHandlebars(template, { hidden: true })).toBe('')
  })

  it('should render each blocks with array', () => {
    const template = '{{#each items}}{{this}},{{/each}}'
    expect(renderHandlebars(template, { items: ['a', 'b', 'c'] })).toBe('a,b,c,')
  })

  it('should render each blocks with @index', () => {
    const template = '{{#each items}}{{@index}}:{{this}};{{/each}}'
    expect(renderHandlebars(template, { items: ['a', 'b'] })).toBe('0:a;1:b;')
  })

  it('should render each blocks with object items', () => {
    const template = '{{#each users}}{{name}},{{/each}}'
    expect(
      renderHandlebars(template, {
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      })
    ).toBe('Alice,Bob,')
  })

  it('should render with blocks', () => {
    const template = '{{#with user}}Hello {{name}}!{{/with}}'
    expect(renderHandlebars(template, { user: { name: 'Alice' } })).toBe('Hello Alice!')
  })

  it('should handle sequential conditionals', () => {
    // The lightweight renderer handles sequential (non-nested) conditionals
    // For deeply nested blocks, use a full Handlebars library
    const template = '{{#if premium}}Premium{{/if}} - {{#if verified}}Verified{{/if}}'
    expect(renderHandlebars(template, { premium: true, verified: true })).toBe('Premium - Verified')
    expect(renderHandlebars(template, { premium: false, verified: true })).toBe(' - Verified')
    expect(renderHandlebars(template, { premium: true, verified: false })).toBe('Premium - ')
  })

  it('should handle complex templates', () => {
    const template = `
Project: {{project.name}}
{{#if project.description}}Description: {{project.description}}{{/if}}
Features:
{{#each project.features}}
- {{this}}
{{/each}}
`.trim()

    const result = renderHandlebars(template, {
      project: {
        name: 'MyApp',
        description: 'A great app',
        features: ['Fast', 'Secure', 'Easy'],
      },
    })

    expect(result).toContain('Project: MyApp')
    expect(result).toContain('Description: A great app')
    expect(result).toContain('- Fast')
    expect(result).toContain('- Secure')
    expect(result).toContain('- Easy')
  })
})

describe('ConfigRegistry', () => {
  let mockEnv: any
  let registry: ComponentRegistry

  beforeEach(() => {
    mockEnv = {
      EDGIT: createMockKV({
        'components/configs/settings/latest': {
          theme: {
            primaryColor: '#3B82F6',
            darkMode: true,
          },
          maxItems: 100,
          features: {
            ai: { enabled: true, model: 'gpt-4' },
            analytics: { enabled: false },
          },
        },
        'components/configs/settings/v1.0.0': {
          theme: {
            primaryColor: '#000000',
            darkMode: false,
          },
          maxItems: 50,
        },
      }),
    }
    registry = createComponentRegistry(mockEnv)
  })

  it('should get config by name', async () => {
    const config = await registry.configs.get('settings')
    expect(config.theme.primaryColor).toBe('#3B82F6')
  })

  it('should get config with version', async () => {
    const config = await registry.configs.get('settings@v1.0.0')
    expect(config.theme.primaryColor).toBe('#000000')
  })

  it('should get nested value by path', async () => {
    const color = await registry.configs.getValue('settings', 'theme.primaryColor')
    expect(color).toBe('#3B82F6')
  })

  it('should return undefined for missing path', async () => {
    const value = await registry.configs.getValue('settings', 'nonexistent.path')
    expect(value).toBeUndefined()
  })

  it('should get value with default', async () => {
    const value = await registry.configs.getValueOrDefault('settings', 'nonexistent', 'default')
    expect(value).toBe('default')
  })

  it('should return existing value over default', async () => {
    const value = await registry.configs.getValueOrDefault('settings', 'maxItems', 999)
    expect(value).toBe(100)
  })

  it('should check if config exists', async () => {
    expect(await registry.configs.exists('settings')).toBe(true)
    expect(await registry.configs.exists('nonexistent')).toBe(false)
  })

  it('should check if path exists', async () => {
    expect(await registry.configs.hasPath('settings', 'theme.primaryColor')).toBe(true)
    expect(await registry.configs.hasPath('settings', 'nonexistent')).toBe(false)
  })

  it('should merge config with overrides', async () => {
    const merged = await registry.configs.merge('settings', {
      theme: { primaryColor: '#FF0000' },
      maxItems: 200,
    })

    // Override applied
    expect(merged.theme.primaryColor).toBe('#FF0000')
    expect(merged.maxItems).toBe(200)
    // Original values preserved
    expect(merged.theme.darkMode).toBe(true)
    expect(merged.features.ai.enabled).toBe(true)
  })

  it('should deeply merge nested objects', async () => {
    const merged = await registry.configs.merge('settings', {
      features: { ai: { model: 'claude-3' } },
    })

    // Deep merge
    expect(merged.features.ai.model).toBe('claude-3')
    expect(merged.features.ai.enabled).toBe(true) // Preserved
    expect(merged.features.analytics.enabled).toBe(false) // Preserved
  })
})
