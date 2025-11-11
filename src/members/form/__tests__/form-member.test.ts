/**
 * Form Member Tests
 *
 * Comprehensive tests for Form member functionality including:
 * - Rendering forms with various field types
 * - Validation (required, pattern, email, etc.)
 * - Security features (CSRF, honeypot, rate limiting)
 * - Multi-step forms
 * - Data sanitization
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FormMember } from '../form-member.js'
import type {
  FormMemberConfig,
  FormMemberInput,
  FormMemberOutput,
  FormField,
} from '../types/index.js'
import type { MemberExecutionContext } from '../../../runtime/types.js'

// Mock KV namespace
class MockKVNamespace {
  private store = new Map<string, { value: string; expiration?: number }>()

  async get(key: string, type?: string): Promise<any> {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiration && Date.now() > item.expiration) {
      this.store.delete(key)
      return null
    }
    return type === 'json' ? JSON.parse(item.value) : item.value
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const expiration = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : undefined
    this.store.set(key, { value, expiration })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

describe('FormMember', () => {
  let mockContext: MemberExecutionContext
  let mockCsrfKV: MockKVNamespace
  let mockRateLimitKV: MockKVNamespace

  beforeEach(() => {
    mockCsrfKV = new MockKVNamespace()
    mockRateLimitKV = new MockKVNamespace()

    mockContext = {
      input: {},
      env: {
        CSRF_TOKENS: mockCsrfKV,
        RATE_LIMIT: mockRateLimitKV,
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as MemberExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if no fields or steps provided', () => {
      const config: FormMemberConfig = {
        name: 'test-form',
        type: 'Form',
      }

      expect(() => new FormMember(config)).toThrow(
        'Form member requires either fields or steps configuration'
      )
    })

    it('should throw error if both fields and steps provided', () => {
      const config: FormMemberConfig = {
        name: 'test-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        steps: [{ id: 'step1', title: 'Step 1', fields: [] }],
      }

      expect(() => new FormMember(config)).toThrow('Form member cannot have both fields and steps')
    })

    it('should throw error if CAPTCHA missing siteKey', () => {
      const config: FormMemberConfig = {
        name: 'test-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        captcha: { type: 'turnstile', siteKey: '' },
      }

      expect(() => new FormMember(config)).toThrow('CAPTCHA configuration requires siteKey')
    })

    it('should throw error if CSRF enabled without secret', () => {
      const config: FormMemberConfig = {
        name: 'test-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        csrf: { enabled: true },
      }

      expect(() => new FormMember(config)).toThrow('CSRF protection requires a secret')
    })
  })

  describe('Form Rendering (mode=render)', () => {
    it('should render simple form with text field', async () => {
      const config: FormMemberConfig = {
        name: 'contact-form',
        type: 'Form',
        title: 'Contact Us',
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Name',
            validation: { required: true },
          },
        ],
      }

      const member = new FormMember(config)
      const input: FormMemberInput = { mode: 'render' }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.html).toBeDefined()
      expect(result.html).toContain('Contact Us')
      expect(result.html).toContain('name="name"')
      expect(result.html).toContain('type="text"')
      expect(result.html).toContain('<span class="required">*</span>')
      expect(result.valid).toBe(true)
    })

    it('should render form with multiple field types', async () => {
      const config: FormMemberConfig = {
        name: 'signup-form',
        type: 'Form',
        fields: [
          { name: 'username', type: 'text', label: 'Username' },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'password', type: 'password', label: 'Password' },
          { name: 'age', type: 'number', label: 'Age' },
          {
            name: 'country',
            type: 'select',
            label: 'Country',
            options: ['USA', 'Canada', 'UK'],
          },
          { name: 'subscribe', type: 'checkbox', label: 'Subscribe to newsletter' },
          { name: 'bio', type: 'textarea', label: 'Bio', rows: 4 },
        ],
      }

      const member = new FormMember(config)
      const input: FormMemberInput = { mode: 'render' }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.html).toContain('type="text"')
      expect(result.html).toContain('type="email"')
      expect(result.html).toContain('type="password"')
      expect(result.html).toContain('type="number"')
      expect(result.html).toContain('<select')
      expect(result.html).toContain('type="checkbox"')
      expect(result.html).toContain('<textarea')
    })

    it('should include CSRF token when enabled', async () => {
      const config: FormMemberConfig = {
        name: 'secure-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        csrf: { enabled: true, secret: 'test-secret-key' },
      }

      const member = new FormMember(config)
      const input: FormMemberInput = { mode: 'render' }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.csrfToken).toBeDefined()
      expect(result.html).toContain('name="_csrf"')
      expect(result.html).toContain('type="hidden"')
    })

    it('should include honeypot field when configured', async () => {
      const config: FormMemberConfig = {
        name: 'protected-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        honeypot: '_website',
      }

      const member = new FormMember(config)
      const input: FormMemberInput = { mode: 'render' }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.html).toContain('name="_website"')
      expect(result.html).toContain('position:absolute;left:-9999px;')
    })

    it('should render CAPTCHA widget when configured', async () => {
      const config: FormMemberConfig = {
        name: 'captcha-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        captcha: {
          type: 'turnstile',
          siteKey: 'test-site-key',
          theme: 'light',
        },
      }

      const member = new FormMember(config)
      const input: FormMemberInput = { mode: 'render' }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.html).toContain('cf-turnstile')
      expect(result.html).toContain('data-sitekey="test-site-key"')
      expect(result.html).toContain('challenges.cloudflare.com/turnstile')
    })

    it('should populate field values from data', async () => {
      const config: FormMemberConfig = {
        name: 'edit-form',
        type: 'Form',
        fields: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' },
        ],
      }

      const member = new FormMember(config)
      const input: FormMemberInput = {
        mode: 'render',
        data: { name: 'John Doe', email: 'john@example.com' },
      }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.html).toContain('value="John Doe"')
      expect(result.html).toContain('value="john@example.com"')
    })
  })

  describe('Form Validation (mode=validate)', () => {
    it('should validate required fields', async () => {
      const config: FormMemberConfig = {
        name: 'required-form',
        type: 'Form',
        fields: [
          { name: 'name', type: 'text', validation: { required: true } },
          { name: 'email', type: 'email', validation: { required: true } },
        ],
      }

      const member = new FormMember(config)
      const input: FormMemberInput = {
        mode: 'validate',
        data: { name: '', email: '' },
      }

      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors?.some((e) => e.field === 'name' && e.rule === 'required')).toBe(true)
      expect(result.errors?.some((e) => e.field === 'email' && e.rule === 'required')).toBe(true)
    })

    it('should validate email format', async () => {
      const config: FormMemberConfig = {
        name: 'email-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email', validation: { email: true } }],
      }

      const member = new FormMember(config)

      // Invalid email
      let result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { email: 'invalid-email' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].field).toBe('email')
      expect(result.errors?.[0].rule).toBe('email')

      // Valid email
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { email: 'test@example.com' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should validate pattern (regex)', async () => {
      const config: FormMemberConfig = {
        name: 'pattern-form',
        type: 'Form',
        fields: [
          {
            name: 'zipcode',
            type: 'text',
            validation: {
              pattern: {
                regex: '^\\d{5}$',
                message: 'Zipcode must be 5 digits',
              },
            },
          },
        ],
      }

      const member = new FormMember(config)

      // Invalid pattern
      let result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { zipcode: '1234' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toBe('Zipcode must be 5 digits')

      // Valid pattern
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { zipcode: '12345' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should validate min/max for numbers', async () => {
      const config: FormMemberConfig = {
        name: 'number-form',
        type: 'Form',
        fields: [
          {
            name: 'age',
            type: 'number',
            validation: {
              min: { value: 18, message: 'Must be at least 18' },
              max: { value: 100, message: 'Must be at most 100' },
            },
          },
        ],
      }

      const member = new FormMember(config)

      // Below min
      let result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { age: 15 } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toBe('Must be at least 18')

      // Above max
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { age: 150 } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toBe('Must be at most 100')

      // Valid
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { age: 25 } },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should validate minLength/maxLength for strings', async () => {
      const config: FormMemberConfig = {
        name: 'string-form',
        type: 'Form',
        fields: [
          {
            name: 'username',
            type: 'text',
            validation: {
              minLength: { value: 3, message: 'Username must be at least 3 characters' },
              maxLength: { value: 20, message: 'Username must be at most 20 characters' },
            },
          },
        ],
      }

      const member = new FormMember(config)

      // Too short
      let result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { username: 'ab' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toContain('at least 3 characters')

      // Too long
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { username: 'a'.repeat(25) } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toContain('at most 20 characters')

      // Valid
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { username: 'johndoe' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should validate URL format', async () => {
      const config: FormMemberConfig = {
        name: 'url-form',
        type: 'Form',
        fields: [{ name: 'website', type: 'url', validation: { url: true } }],
      }

      const member = new FormMember(config)

      // Invalid URL
      let result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { website: 'not-a-url' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)

      // Valid URL
      result = (await member['run']({
        ...mockContext,
        input: { mode: 'validate', data: { website: 'https://example.com' } },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should validate field matches (password confirmation)', async () => {
      const config: FormMemberConfig = {
        name: 'password-form',
        type: 'Form',
        fields: [
          { name: 'password', type: 'password', label: 'Password' },
          {
            name: 'confirmPassword',
            type: 'password',
            label: 'Confirm Password',
            validation: {
              matches: {
                field: 'password',
                message: 'Passwords must match',
              },
            },
          },
        ],
      }

      const member = new FormMember(config)

      // Non-matching
      let result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { password: 'secret123', confirmPassword: 'different123' },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].message).toBe('Passwords must match')

      // Matching
      result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { password: 'secret123', confirmPassword: 'secret123' },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
    })

    it('should sanitize data after validation', async () => {
      const config: FormMemberConfig = {
        name: 'sanitize-form',
        type: 'Form',
        fields: [
          { name: 'email', type: 'email' },
          { name: 'age', type: 'number' },
          { name: 'subscribe', type: 'checkbox' },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: {
            email: '  TEST@EXAMPLE.COM  ',
            age: '25',
            subscribe: 'true',
          },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
      expect(result.data?.email).toBe('test@example.com') // Lowercase and trimmed
      expect(result.data?.age).toBe(25) // Converted to number
      expect(result.data?.subscribe).toBe(true) // Converted to boolean
    })
  })

  describe('Security Features', () => {
    it('should detect bot via honeypot field', async () => {
      const config: FormMemberConfig = {
        name: 'honeypot-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        honeypot: '_website',
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { email: 'bot@example.com', _website: 'http://spam.com' },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].rule).toBe('honeypot')
    })

    it('should enforce rate limiting', async () => {
      const config: FormMemberConfig = {
        name: 'rate-limited-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
        rateLimit: { max: 3, window: 60 },
      }

      const member = new FormMember(config)
      const input: FormMemberInput = {
        mode: 'validate',
        data: { email: 'test@example.com' },
        request: { ip: '192.168.1.1' },
      }

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const result = (await member['run']({
          ...mockContext,
          input,
        })) as FormMemberOutput
        expect(result.valid).toBe(true)
      }

      // 4th request should be rate limited
      const result = (await member['run']({
        ...mockContext,
        input,
      })) as FormMemberOutput

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].rule).toBe('rate_limit')
      expect(result.rateLimit?.remaining).toBe(0)
    })
  })

  describe('Multi-Step Forms', () => {
    it('should render first step by default', async () => {
      const config: FormMemberConfig = {
        name: 'wizard-form',
        type: 'Form',
        steps: [
          {
            id: 'personal',
            title: 'Personal Info',
            fields: [
              { name: 'name', type: 'text', label: 'Name' },
              { name: 'email', type: 'email', label: 'Email' },
            ],
          },
          {
            id: 'address',
            title: 'Address',
            fields: [
              { name: 'street', type: 'text', label: 'Street' },
              { name: 'city', type: 'text', label: 'City' },
            ],
          },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: { mode: 'render' },
      })) as FormMemberOutput

      expect(result.currentStep).toBe('personal')
      expect(result.html).toContain('Personal Info')
      expect(result.html).toContain('name="name"')
      expect(result.html).toContain('name="email"')
      expect(result.html).not.toContain('name="street"')
    })

    it('should validate current step only', async () => {
      const config: FormMemberConfig = {
        name: 'wizard-form',
        type: 'Form',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [{ name: 'email', type: 'email', validation: { required: true } }],
          },
          {
            id: 'step2',
            title: 'Step 2',
            fields: [{ name: 'phone', type: 'tel', validation: { required: true } }],
          },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          currentStep: 'step1',
          data: { email: '', phone: '' },
        },
      })) as FormMemberOutput

      // Should only validate step1 fields
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].field).toBe('email')
    })

    it('should advance to next step on submit', async () => {
      const config: FormMemberConfig = {
        name: 'wizard-form',
        type: 'Form',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [{ name: 'email', type: 'email' }],
          },
          {
            id: 'step2',
            title: 'Step 2',
            fields: [{ name: 'phone', type: 'tel' }],
          },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'submit',
          currentStep: 'step1',
          data: { email: 'test@example.com' },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
      expect(result.currentStep).toBe('step1')
      expect(result.nextStep).toBe('step2')
      expect(result.isLastStep).toBe(false)
    })

    it('should indicate last step completion', async () => {
      const config: FormMemberConfig = {
        name: 'wizard-form',
        type: 'Form',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [{ name: 'email', type: 'email' }],
          },
          {
            id: 'step2',
            title: 'Step 2',
            fields: [{ name: 'phone', type: 'tel' }],
          },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'submit',
          currentStep: 'step2',
          data: { phone: '555-1234' },
        },
      })) as FormMemberOutput

      expect(result.valid).toBe(true)
      expect(result.isLastStep).toBe(true)
      expect(result.nextStep).toBeUndefined()
    })
  })

  describe('Data Sanitization', () => {
    it('should trim and lowercase email addresses', async () => {
      const config: FormMemberConfig = {
        name: 'sanitize-form',
        type: 'Form',
        fields: [{ name: 'email', type: 'email' }],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { email: '  TEST@EXAMPLE.COM  ' },
        },
      })) as FormMemberOutput

      expect(result.data?.email).toBe('test@example.com')
    })

    it('should convert number strings to numbers', async () => {
      const config: FormMemberConfig = {
        name: 'number-form',
        type: 'Form',
        fields: [{ name: 'age', type: 'number' }],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { age: '25' },
        },
      })) as FormMemberOutput

      expect(result.data?.age).toBe(25)
      expect(typeof result.data?.age).toBe('number')
    })

    it('should handle multi-select values as arrays', async () => {
      const config: FormMemberConfig = {
        name: 'multiselect-form',
        type: 'Form',
        fields: [
          {
            name: 'interests',
            type: 'select',
            multiple: true,
            options: ['Sports', 'Music', 'Reading'],
          },
        ],
      }

      const member = new FormMember(config)
      const result = (await member['run']({
        ...mockContext,
        input: {
          mode: 'validate',
          data: { interests: ['Sports', 'Music'] },
        },
      })) as FormMemberOutput

      expect(Array.isArray(result.data?.interests)).toBe(true)
      expect(result.data?.interests).toEqual(['Sports', 'Music'])
    })
  })
})
