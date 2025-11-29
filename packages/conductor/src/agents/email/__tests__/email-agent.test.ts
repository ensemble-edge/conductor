/**
 * Email Agent Tests
 *
 * Comprehensive tests for Email agent functionality including:
 * - Email configuration and validation
 * - Template rendering with variables
 * - Single email sending
 * - Batch email sending
 * - Attachments (base64 and Buffer)
 * - HTML vs plain text content
 * - Variable substitution in templates
 * - Email address validation
 * - Provider configuration
 * - Rate limiting
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailAgent } from '../email-agent.js'
import type {
  EmailMemberInput,
  EmailMemberOutput,
  BatchEmailInput,
  BatchEmailOutput,
  EmailMessage,
  EmailResult,
} from '../types/index.js'
import type { AgentExecutionContext } from '../../base-agent.js'
import { BaseEmailProvider } from '../providers/base.js'
import type { ValidationResult } from '../types/index.js'

// Mock KV namespace for templates
class MockKVNamespace {
  private store = new Map<string, string>()

  async get(key: string, type?: string): Promise<string | null> {
    return this.store.get(key) || null
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

// Mock Email Provider
class MockEmailProvider extends BaseEmailProvider {
  name = 'mock'
  public sentEmails: EmailMessage[] = []
  public shouldFail = false
  public failureError = 'Mock send failure'

  async send(message: EmailMessage): Promise<EmailResult> {
    const validation = this.validateMessage(message)
    if (!validation.valid) {
      return {
        messageId: '',
        status: 'failed',
        provider: this.name,
        error: validation.errors?.join(', '),
      }
    }

    if (this.shouldFail) {
      return {
        messageId: '',
        status: 'failed',
        provider: this.name,
        error: this.failureError,
      }
    }

    this.sentEmails.push(message)

    return {
      messageId: `mock-${Date.now()}-${Math.random()}`,
      status: 'sent',
      provider: this.name,
    }
  }

  async validateConfig(): Promise<ValidationResult> {
    return { valid: true }
  }

  reset(): void {
    this.sentEmails = []
    this.shouldFail = false
  }
}

describe('EmailAgent', () => {
  let mockContext: AgentExecutionContext
  let mockProvider: MockEmailProvider
  let mockTemplateKV: MockKVNamespace

  beforeEach(() => {
    mockProvider = new MockEmailProvider()
    mockTemplateKV = new MockKVNamespace()

    mockContext = {
      input: {},
      env: {
        TEMPLATES: mockTemplateKV,
        EDGIT: mockTemplateKV, // Use same KV for Edgit component resolution
      },
      state: {
        ensembleName: 'test-ensemble',
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if no provider configuration', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {},
      }

      expect(() => new EmailAgent(config)).toThrow('Email agent requires provider configuration')
    })

    it('should accept valid Resend provider configuration', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: {
              apiKey: 'test-api-key',
            },
            from: 'test@example.com',
          },
        },
      }

      expect(() => new EmailAgent(config)).not.toThrow()
    })

    it('should accept valid SMTP provider configuration', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'smtp',
            smtp: {
              host: 'smtp.example.com',
              port: 587,
              secure: true,
              auth: {
                user: 'user@example.com',
                pass: 'password',
              },
            },
            from: 'test@example.com',
          },
        },
      }

      expect(() => new EmailAgent(config)).not.toThrow()
    })

    it('should accept valid Cloudflare provider configuration', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'cloudflare',
            cloudflare: {
              binding: 'EMAIL_BINDING',
              dkim: true,
            },
            from: 'test@example.com',
          },
        },
      }

      expect(() => new EmailAgent(config)).not.toThrow()
    })

    it('should set default rate limit', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'test@example.com',
          },
        },
      }

      const agent = new EmailAgent(config)
      expect(agent['rateLimit']).toBe(10)
    })

    it('should accept custom rate limit', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'test@example.com',
          },
          rateLimit: 5,
        },
      }

      const agent = new EmailAgent(config)
      expect(agent['rateLimit']).toBe(5)
    })

    it('should set tracking flag', () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'test@example.com',
          },
          tracking: true,
        },
      }

      const agent = new EmailAgent(config)
      expect(agent['tracking']).toBe(true)
    })
  })

  describe('Single Email Sending', () => {
    let agent: EmailAgent

    beforeEach(() => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
        },
      }

      agent = new EmailAgent(config)
      // Replace provider with mock
      agent['provider'] = mockProvider
    })

    it('should send basic email with HTML content', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Hello World</h1>',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as EmailMemberOutput

      expect(result.status).toBe('sent')
      expect(result.messageId).toBeDefined()
      expect(result.provider).toBe('mock')
      expect(result.timestamp).toBeDefined()
      expect(mockProvider.sentEmails).toHaveLength(1)
      expect(mockProvider.sentEmails[0].to).toBe('recipient@example.com')
      expect(mockProvider.sentEmails[0].subject).toBe('Test Email')
      expect(mockProvider.sentEmails[0].html).toBe('<h1>Hello World</h1>')
    })

    it('should send email with plain text content', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Hello World',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as EmailMemberOutput

      expect(result.status).toBe('sent')
      expect(mockProvider.sentEmails[0].text).toBe('Hello World')
    })

    it('should send email with both HTML and text', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Hello World</h1>',
        text: 'Hello World',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<h1>Hello World</h1>')
      expect(mockProvider.sentEmails[0].text).toBe('Hello World')
    })

    it('should send email to multiple recipients', async () => {
      const input: EmailMemberInput = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].to).toEqual(['user1@example.com', 'user2@example.com'])
    })

    it('should include CC recipients', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        cc: 'cc@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].cc).toBe('cc@example.com')
    })

    it('should include BCC recipients', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].bcc).toEqual(['bcc1@example.com', 'bcc2@example.com'])
    })

    it('should set from address', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        from: 'custom@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].from).toBe('custom@example.com')
    })

    it('should set reply-to address', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        replyTo: 'reply@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].replyTo).toBe('reply@example.com')
    })

    it('should include custom headers', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Priority': 'high',
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].headers).toMatchObject({
        'X-Custom-Header': 'custom-value',
        'X-Priority': 'high',
      })
    })

    it('should include tags', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
        tags: ['newsletter', 'marketing'],
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].tags).toEqual(['newsletter', 'marketing'])
    })

    it('should include metadata', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
        metadata: {
          userId: '123',
          campaign: 'summer-sale',
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].metadata).toMatchObject({
        userId: '123',
        campaign: 'summer-sale',
      })
    })

    it('should throw error on send failure', async () => {
      mockProvider.shouldFail = true

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow('Email send failed')
    })
  })

  describe('Attachments', () => {
    let agent: EmailAgent

    beforeEach(() => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
        },
      }

      agent = new EmailAgent(config)
      agent['provider'] = mockProvider
    })

    it('should send email with base64 attachment', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>See attachment</p>',
        attachments: [
          {
            filename: 'document.pdf',
            content: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
            contentType: 'application/pdf',
          },
        ],
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].attachments).toHaveLength(1)
      expect(mockProvider.sentEmails[0].attachments![0].filename).toBe('document.pdf')
      expect(mockProvider.sentEmails[0].attachments![0].content).toBe('SGVsbG8gV29ybGQ=')
      expect(mockProvider.sentEmails[0].attachments![0].contentType).toBe('application/pdf')
    })

    it('should send email with Buffer attachment', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>See attachment</p>',
        attachments: [
          {
            filename: 'data.txt',
            content: Buffer.from('Hello World'),
            contentType: 'text/plain',
          },
        ],
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].attachments).toHaveLength(1)
      expect(mockProvider.sentEmails[0].attachments![0].filename).toBe('data.txt')
    })

    it('should send email with multiple attachments', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>See attachments</p>',
        attachments: [
          {
            filename: 'file1.txt',
            content: 'content1',
            contentType: 'text/plain',
          },
          {
            filename: 'file2.pdf',
            content: 'content2',
            contentType: 'application/pdf',
          },
        ],
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].attachments).toHaveLength(2)
      expect(mockProvider.sentEmails[0].attachments![0].filename).toBe('file1.txt')
      expect(mockProvider.sentEmails[0].attachments![1].filename).toBe('file2.pdf')
    })
  })

  describe('Template Rendering', () => {
    let agent: EmailAgent

    beforeEach(async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          templatesKv: mockTemplateKV,
        },
      }

      agent = new EmailAgent(config)
      agent['provider'] = mockProvider
      agent['templateLoader']['kv'] = mockTemplateKV

      // Store test template in KV (Edgit format: components/templates/name/version)
      await mockTemplateKV.put(
        'components/templates/welcome/latest',
        '<h1>Welcome {{name}}!</h1><p>Your email is {{email}}.</p>'
      )
    })

    it('should render inline template with variables', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Welcome',
        // Use template field instead of html field for variable rendering
        template: '<h1>Hello {{name}}</h1>',
        data: { name: 'John' },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<h1>Hello John</h1>')
    })

    it('should render KV template with variables', async () => {
      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Welcome',
        template: 'templates/welcome@latest',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toContain('Welcome John Doe!')
      expect(mockProvider.sentEmails[0].html).toContain('john@example.com')
    })

    it('should handle nested variables', async () => {
      await mockTemplateKV.put(
        'components/templates/nested/latest',
        '<p>{{user.name}} from {{user.company}}</p>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/nested@latest',
        data: {
          user: {
            name: 'John',
            company: 'Acme Corp',
          },
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<p>John from Acme Corp</p>')
    })

    it('should handle conditional blocks', async () => {
      await mockTemplateKV.put(
        'components/templates/conditional/latest',
        '<p>{{#if premium}}Premium User{{/if}}</p>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/conditional@latest',
        data: { premium: true },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<p>Premium User</p>')
    })

    it('should handle each loops (limitation in simple template implementation)', async () => {
      // NOTE: The current simple Handlebars-style template implementation has limitations
      // with #each loops. For production use, consider integrating a full Handlebars library
      // or using a more robust templating engine.
      await mockTemplateKV.put(
        'components/templates/loop/latest',
        '<ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/loop@latest',
        data: {
          items: ['Apple', 'Banana', 'Orange'],
        },
      }

      await agent['run']({ ...mockContext, input })

      const html = mockProvider.sentEmails[0].html
      // This test documents the expected behavior once the template implementation is enhanced
      expect(html).toContain('Apple')
      expect(html).toContain('Banana')
      expect(html).toContain('Orange')
    })

    it('should auto-generate plain text from HTML template', async () => {
      await mockTemplateKV.put(
        'components/templates/htmlonly/latest',
        '<h1>Hello</h1><p>This is a <strong>test</strong> email.</p>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/htmlonly@latest',
        data: {},
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].text).toBeDefined()
      expect(mockProvider.sentEmails[0].text).toContain('Hello')
      expect(mockProvider.sentEmails[0].text).toContain('test')
      expect(mockProvider.sentEmails[0].text).not.toContain('<h1>')
      expect(mockProvider.sentEmails[0].text).not.toContain('<strong>')
    })

    it('should use provided text over auto-generated', async () => {
      await mockTemplateKV.put('components/templates/withtext/latest', '<h1>Hello</h1>')

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/withtext@latest',
        text: 'Custom plain text',
        data: {},
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].text).toBe('Custom plain text')
    })
  })

  describe('HTML Stripping', () => {
    let agent: EmailAgent

    beforeEach(() => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
        },
      }

      agent = new EmailAgent(config)
    })

    it('should strip HTML tags', () => {
      const html = '<h1>Title</h1><p>Paragraph</p>'
      const text = agent['stripHtml'](html)
      // Note: The implementation normalizes multiple spaces to single space
      expect(text).toContain('Title')
      expect(text).toContain('Paragraph')
      expect(text).not.toContain('<h1>')
      expect(text).not.toContain('<p>')
    })

    it('should strip style tags', () => {
      const html = '<style>body { color: red; }</style><p>Content</p>'
      const text = agent['stripHtml'](html)
      expect(text).not.toContain('style')
      expect(text).toBe('Content')
    })

    it('should strip script tags', () => {
      const html = '<script>alert("test");</script><p>Content</p>'
      const text = agent['stripHtml'](html)
      expect(text).not.toContain('script')
      expect(text).toBe('Content')
    })

    it('should decode HTML entities', () => {
      const html = '<p>&lt;hello&gt; &amp; &nbsp; world</p>'
      const text = agent['stripHtml'](html)
      expect(text).toBe('<hello> & world')
    })

    it('should normalize whitespace', () => {
      const html = '<p>Hello   \n\n   World</p>'
      const text = agent['stripHtml'](html)
      expect(text).toBe('Hello World')
    })
  })

  describe('Batch Email Sending', () => {
    let agent: EmailAgent

    beforeEach(async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          rateLimit: 100, // High rate limit for testing
          templatesKv: mockTemplateKV,
        },
      }

      agent = new EmailAgent(config)
      agent['provider'] = mockProvider
      agent['templateLoader']['kv'] = mockTemplateKV
    })

    it('should send batch emails to multiple recipients', async () => {
      await mockTemplateKV.put(
        'components/templates/batch/latest',
        '<p>Hello {{name}}, your order {{orderId}} is ready.</p>'
      )

      const input: BatchEmailInput = {
        recipients: [
          { email: 'user1@example.com', data: { name: 'Alice', orderId: '001' } },
          { email: 'user2@example.com', data: { name: 'Bob', orderId: '002' } },
          { email: 'user3@example.com', data: { name: 'Charlie', orderId: '003' } },
        ],
        subject: 'Order Ready',
        template: 'templates/batch@latest',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as BatchEmailOutput

      expect(result.sent).toBe(3)
      expect(result.failed).toBe(0)
      expect(result.messageIds).toHaveLength(3)
      expect(mockProvider.sentEmails).toHaveLength(3)

      // Check personalization
      expect(mockProvider.sentEmails[0].html).toContain('Alice')
      expect(mockProvider.sentEmails[0].html).toContain('001')
      expect(mockProvider.sentEmails[1].html).toContain('Bob')
      expect(mockProvider.sentEmails[1].html).toContain('002')
      expect(mockProvider.sentEmails[2].html).toContain('Charlie')
      expect(mockProvider.sentEmails[2].html).toContain('003')
    })

    it('should merge common data with recipient data', async () => {
      await mockTemplateKV.put(
        'components/templates/batch-common/latest',
        '<p>Hi {{name}}, sale ends {{saleDate}}!</p>'
      )

      const input: BatchEmailInput = {
        recipients: [
          { email: 'user1@example.com', data: { name: 'Alice' } },
          { email: 'user2@example.com', data: { name: 'Bob' } },
        ],
        subject: 'Sale Ending',
        template: 'templates/batch-common@latest',
        commonData: { saleDate: '2024-12-31' },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toContain('Alice')
      expect(mockProvider.sentEmails[0].html).toContain('2024-12-31')
      expect(mockProvider.sentEmails[1].html).toContain('Bob')
      expect(mockProvider.sentEmails[1].html).toContain('2024-12-31')
    })

    it('should handle partial failures in batch', async () => {
      await mockTemplateKV.put(
        'components/templates/batch/latest',
        '<p>Hello {{name}}, your order {{orderId}} is ready.</p>'
      )

      const input: BatchEmailInput = {
        recipients: [
          { email: 'valid@example.com', data: { name: 'Valid' } },
          { email: 'invalid-email', data: { name: 'Invalid' } },
          { email: 'another@example.com', data: { name: 'Another' } },
        ],
        subject: 'Test',
        template: 'templates/batch@latest',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as BatchEmailOutput

      expect(result.sent).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].email).toBe('invalid-email')
    })

    it('should track errors for failed emails', async () => {
      await mockTemplateKV.put(
        'components/templates/batch/latest',
        '<p>Hello {{name}}, your order {{orderId}} is ready.</p>'
      )

      mockProvider.shouldFail = true

      const input: BatchEmailInput = {
        recipients: [
          { email: 'user1@example.com', data: { name: 'Alice' } },
          { email: 'user2@example.com', data: { name: 'Bob' } },
        ],
        subject: 'Test',
        template: 'templates/batch@latest',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as BatchEmailOutput

      expect(result.sent).toBe(0)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors![0].error).toBe('Mock send failure')
    })

    it('should respect rate limiting in batch sends', async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          rateLimit: 10, // 10 emails per second
        },
      }

      const rateLimitedMember = new EmailAgent(config)
      rateLimitedMember['provider'] = mockProvider

      const input: BatchEmailInput = {
        recipients: [
          { email: 'user1@example.com', data: {} },
          { email: 'user2@example.com', data: {} },
          { email: 'user3@example.com', data: {} },
        ],
        subject: 'Test',
        template: '<p>Test</p>',
      }

      const startTime = Date.now()
      await rateLimitedMember['run']({ ...mockContext, input })
      const duration = Date.now() - startTime

      // With rate limit of 10/sec, 3 emails should take at least 200ms
      expect(duration).toBeGreaterThanOrEqual(180)
    })
  })

  describe('Email Validation', () => {
    let agent: EmailAgent

    beforeEach(() => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
        },
      }

      agent = new EmailAgent(config)
      agent['provider'] = mockProvider
    })

    it('should reject invalid email addresses', async () => {
      const input: EmailMemberInput = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow()
    })

    it('should reject empty recipient', async () => {
      const input: EmailMemberInput = {
        to: '',
        subject: 'Test',
        html: '<p>Test</p>',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow()
    })

    it('should reject empty subject', async () => {
      const input: EmailMemberInput = {
        to: 'test@example.com',
        subject: '',
        html: '<p>Test</p>',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow()
    })

    it('should reject email without content', async () => {
      const input: EmailMemberInput = {
        to: 'test@example.com',
        subject: 'Test',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow()
    })

    it('should accept valid email format', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        '123@example.com',
      ]

      for (const email of validEmails) {
        const input: EmailMemberInput = {
          to: email,
          subject: 'Test',
          html: '<p>Test</p>',
        }

        const result = await agent['run']({ ...mockContext, input })
        expect(result.status).toBe('sent')
      }
    })
  })

  describe('Tracking Headers', () => {
    it('should add tracking headers when enabled', async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          tracking: true,
        },
      }

      const agent = new EmailAgent(config)
      agent['provider'] = mockProvider

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].headers).toMatchObject({
        'X-Conductor-Tracking': 'enabled',
        'X-Conductor-Ensemble': 'test-ensemble',
      })
    })

    it('should not add tracking headers when disabled', async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          tracking: false,
        },
      }

      const agent = new EmailAgent(config)
      agent['provider'] = mockProvider

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }

      await agent['run']({ ...mockContext, input })

      const headers = mockProvider.sentEmails[0].headers || {}
      expect(headers['X-Conductor-Tracking']).toBeUndefined()
    })

    it('should merge tracking headers with custom headers', async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          tracking: true,
        },
      }

      const agent = new EmailAgent(config)
      agent['provider'] = mockProvider

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        headers: {
          'X-Custom': 'value',
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].headers).toMatchObject({
        'X-Custom': 'value',
        'X-Conductor-Tracking': 'enabled',
        'X-Conductor-Ensemble': 'test-ensemble',
      })
    })
  })

  describe('Provider Validation', () => {
    it('should validate provider configuration before sending', async () => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
        },
      }

      const agent = new EmailAgent(config)

      // Mock provider that fails validation
      const invalidProvider = new MockEmailProvider()
      invalidProvider.validateConfig = async () => ({
        valid: false,
        errors: ['Invalid API key', 'Missing domain'],
      })
      agent['provider'] = invalidProvider

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'Provider validation failed: Invalid API key, Missing domain'
      )
    })
  })

  describe('Variable Substitution Edge Cases', () => {
    let agent: EmailAgent

    beforeEach(() => {
      const config = {
        name: 'test-email',
        type: 'Email',
        config: {
          provider: {
            provider: 'resend',
            resend: { apiKey: 'test-key' },
            from: 'sender@example.com',
          },
          templatesKv: mockTemplateKV,
        },
      }

      agent = new EmailAgent(config)
      agent['provider'] = mockProvider
      agent['templateLoader']['kv'] = mockTemplateKV
    })

    it('should handle undefined variables gracefully', async () => {
      await mockTemplateKV.put(
        'components/templates/undefined/latest',
        '<p>Hello {{name}}, you have {{count}} items.</p>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/undefined@latest',
        data: {},
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<p>Hello , you have  items.</p>')
    })

    it('should handle deeply nested properties', async () => {
      await mockTemplateKV.put(
        'components/templates/nested-deep/latest',
        '<p>{{user.profile.address.city}}</p>'
      )

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/nested-deep@latest',
        data: {
          user: {
            profile: {
              address: {
                city: 'New York',
              },
            },
          },
        },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<p>New York</p>')
    })

    it('should handle variables with special characters', async () => {
      await mockTemplateKV.put('components/templates/special/latest', '<p>Price: {{price}}</p>')

      const input: EmailMemberInput = {
        to: 'recipient@example.com',
        subject: 'Test',
        template: 'templates/special@latest',
        data: { price: '$99.99' },
      }

      await agent['run']({ ...mockContext, input })

      expect(mockProvider.sentEmails[0].html).toBe('<p>Price: $99.99</p>')
    })
  })
})
