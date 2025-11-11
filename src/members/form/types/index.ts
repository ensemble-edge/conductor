/**
 * Form Member Types
 *
 * Declarative form generation with validation and security features
 */

import type { MemberConfig } from '../../../runtime/parser.js'
import type { RouteAuthConfig } from '../../../routing/config.js'

/**
 * Supported field types
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'file'
  | 'hidden'

/**
 * Field validation rules
 */
export interface FieldValidation {
  /** Field is required */
  required?: boolean | string // true or custom error message
  /** Regex pattern to match */
  pattern?: string | { regex: string; message: string }
  /** Minimum length/value */
  min?: number | { value: number; message: string }
  /** Maximum length/value */
  max?: number | { value: number; message: string }
  /** Minimum length for strings */
  minLength?: number | { value: number; message: string }
  /** Maximum length for strings */
  maxLength?: number | { value: number; message: string }
  /** Custom validation function name (from context) */
  custom?: string
  /** Email validation */
  email?: boolean | string
  /** URL validation */
  url?: boolean | string
  /** Must match another field */
  matches?: string | { field: string; message: string }
}

/**
 * Select option
 */
export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
  selected?: boolean
}

/**
 * Form field definition
 */
export interface FormField {
  /** Field name (used as form input name) */
  name: string
  /** Field type */
  type: FieldType
  /** Field label */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Default value */
  default?: string | number | boolean
  /** Help text */
  help?: string
  /** Validation rules */
  validation?: FieldValidation
  /** Options for select/radio fields */
  options?: SelectOption[] | string[]
  /** Multiple selection (for select) */
  multiple?: boolean
  /** Field is disabled */
  disabled?: boolean
  /** Field is readonly */
  readonly?: boolean
  /** Autocomplete attribute */
  autocomplete?: string
  /** CSS classes */
  className?: string
  /** Rows for textarea */
  rows?: number
  /** Cols for textarea */
  cols?: number
  /** Accept attribute for file inputs */
  accept?: string
  /** Min attribute (for number/date inputs) */
  min?: string | number
  /** Max attribute (for number/date inputs) */
  max?: string | number
  /** Step attribute (for number inputs) */
  step?: string | number
}

/**
 * Form step (for multi-step forms)
 */
export interface FormStep {
  /** Step ID */
  id: string
  /** Step title */
  title: string
  /** Step description */
  description?: string
  /** Fields in this step */
  fields: FormField[]
  /** Condition to show this step */
  condition?: string
}

/**
 * CAPTCHA configuration
 */
export interface CaptchaConfig {
  /** CAPTCHA type */
  type: 'turnstile' | 'recaptcha' | 'hcaptcha'
  /** Site key */
  siteKey: string
  /** Secret key (for verification) */
  secretKey?: string
  /** Theme */
  theme?: 'light' | 'dark' | 'auto'
  /** Size */
  size?: 'normal' | 'compact'
}

/**
 * CSRF configuration
 */
export interface CsrfConfig {
  /** Enable CSRF protection */
  enabled: boolean
  /** Token field name */
  fieldName?: string
  /** Token cookie name */
  cookieName?: string
  /** Token expiry in seconds */
  expiresIn?: number
  /** Secret for signing tokens */
  secret?: string
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Maximum submissions per window */
  max: number
  /** Time window in seconds */
  window: number
  /** Identifier (IP, user ID, etc.) */
  identifier?: string
}

/**
 * Form styling configuration
 */
export interface FormStyle {
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline'
  /** CSS framework */
  framework?: 'tailwind' | 'bootstrap' | 'custom' | 'none'
  /** Custom CSS classes */
  classes?: {
    form?: string
    field?: string
    label?: string
    input?: string
    error?: string
    help?: string
    button?: string
  }
  /** Include default styles */
  includeDefaultStyles?: boolean
}

/**
 * Form configuration
 */
export interface FormMemberConfig extends MemberConfig {
  /** Route configuration for UnifiedRouter integration */
  route?: {
    /** Route path (defaults to /forms/{form-name}) */
    path?: string
    /** HTTP methods (defaults to ['GET', 'POST']) */
    methods?: string[]
    /** Auth configuration */
    auth?: Partial<RouteAuthConfig>
    /** Priority (defaults to 90 for forms) */
    priority?: number
  }
  /** Form title */
  title?: string
  /** Form description */
  description?: string
  /** Form fields (for single-step forms) */
  fields?: FormField[]
  /** Form steps (for multi-step forms) */
  steps?: FormStep[]
  /** Form action URL */
  action?: string
  /** Form method */
  method?: 'POST' | 'GET'
  /** Submit button text */
  submitText?: string
  /** Success message */
  successMessage?: string
  /** CAPTCHA configuration */
  captcha?: CaptchaConfig
  /** CSRF configuration */
  csrf?: CsrfConfig
  /** Honeypot field name (for bot detection) */
  honeypot?: string
  /** Rate limiting (DEPRECATED: use route.auth.rateLimit instead) */
  rateLimit?: RateLimitConfig
  /** Form styling */
  style?: FormStyle
  /** Custom template for form rendering */
  template?: string
  /** Render as embeddable HTML (default: true) */
  embeddable?: boolean
}

/**
 * Form input
 */
export interface FormMemberInput {
  /** Form data to validate/populate */
  data?: Record<string, unknown>
  /** Current step (for multi-step forms) */
  currentStep?: string
  /** Request context for validation */
  request?: {
    ip?: string
    userAgent?: string
    headers?: Record<string, string>
  }
  /** Validation mode */
  mode?: 'render' | 'validate' | 'submit'
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
  rule?: string
}

/**
 * Form output
 */
export interface FormMemberOutput {
  /** Rendered HTML (if mode=render) */
  html?: string
  /** Validation errors (if mode=validate/submit) */
  errors?: ValidationError[]
  /** Validation success */
  valid?: boolean
  /** Validated and sanitized data */
  data?: Record<string, unknown>
  /** Current step */
  currentStep?: string
  /** Next step */
  nextStep?: string
  /** Is last step */
  isLastStep?: boolean
  /** CSRF token (if enabled) */
  csrfToken?: string
  /** Rate limit info */
  rateLimit?: {
    remaining: number
    reset: number
  }
}
