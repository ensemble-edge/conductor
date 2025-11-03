# Core Utilities - Complete! ✅

## Summary

Implemented the core utilities system including normalization, URL resolution, and prompt management. This provides the foundation for consistent data handling and template-based prompt generation across the Conductor framework.

**Stats:**
- 🗂️ **8 TypeScript files** created
- 📦 **2 new modules**: `src/utils/`, `src/prompts/`
- ✅ **All files compile successfully**

---

## What Was Built

### 1. Normalization Utilities

**Location:** `src/utils/normalization.ts`

**Purpose:** Provides consistent normalization for common data types with extensible registry pattern.

**Features:**
- **URL Normalizer**: Lowercase, remove trailing slash, sort query parameters
- **Domain Normalizer**: Remove www, protocol, port, and path
- **Company Name Normalizer**: Titlecase, remove legal suffixes (Inc, LLC, Ltd, etc.)
- **Email Normalizer**: Lowercase, Gmail dot removal, plus-addressing handling
- **Registry Pattern**: Extensible system for custom normalizers

**Example Usage:**
```typescript
import { normalize, getGlobalNormalizationRegistry } from './utils';

// Using convenience function
const url = normalize('url', 'https://Example.com/Path/');
// => 'https://example.com/Path'

const domain = normalize('domain', 'https://www.Example.com/path');
// => 'example.com'

const company = normalize('company', 'acme corporation, inc.');
// => 'Acme'

const email = normalize('email', 'User.Name+tag@Gmail.com');
// => 'username@gmail.com'

// Using registry for custom normalizers
const registry = getGlobalNormalizationRegistry();
registry.register(
  {
    name: 'phone',
    description: 'Normalize phone numbers'
  },
  (input) => input.replace(/[^0-9]/g, '')
);

const phone = registry.normalize('phone', '+1 (555) 123-4567');
// => '15551234567'
```

**Normalizer Details:**

1. **URL Normalizer** (`normalizeURL`)
   - Lowercase protocol and hostname
   - Remove trailing slash from pathname
   - Sort query parameters alphabetically
   - Preserve hash fragments

2. **Domain Normalizer** (`normalizeDomain`)
   - Remove `http://` or `https://` protocol
   - Remove `www.` prefix
   - Remove port numbers
   - Remove path, query, and hash
   - Lowercase result

3. **Company Name Normalizer** (`normalizeCompanyName`)
   - Remove legal suffixes: Inc, LLC, Ltd, Corp, Co, LP, LLP, PLC, etc.
   - Titlecase words (preserve all-caps acronyms)
   - Trim whitespace

4. **Email Normalizer** (`normalizeEmail`)
   - Lowercase entire email
   - **Gmail-specific**: Remove dots from local part (gmail ignores dots)
   - **Gmail-specific**: Remove everything after `+` (plus-addressing)
   - Convert `@googlemail.com` to `@gmail.com`

---

### 2. URL Resolver

**Location:** `src/utils/url-resolver.ts`

**Purpose:** Resolve URLs with automatic www fallback, redirect tracking, and reliability features.

**Features:**
- **Automatic www Fallback**: Try both with and without www prefix
- **Protocol Normalization**: Prefer HTTPS over HTTP
- **Redirect Tracking**: Track full redirect chain
- **Timeout Handling**: Configurable request timeouts
- **Custom Headers**: User-Agent and custom header support
- **Batch Resolution**: Resolve multiple URLs in parallel

**Example Usage:**
```typescript
import { resolveURL, URLResolver } from './utils';

// Simple usage
const result = await resolveURL('example.com');
console.log(result);
// {
//   url: 'https://example.com',
//   finalUrl: 'https://www.example.com',
//   statusCode: 200,
//   redirectChain: ['https://example.com', 'https://www.example.com'],
//   headers: { 'content-type': 'text/html', ... },
//   responseTime: 1234,
//   wwwFallbackUsed: false
// }

// Advanced usage with options
const resolver = new URLResolver({
  timeout: 5000,
  tryWwwFallback: true,
  preferHttps: true,
  headers: { 'User-Agent': 'MyBot/1.0' }
});

const resolution = await resolver.resolve('example.com');

// Check if URL is reachable
const isReachable = await resolver.isReachable('example.com');
console.log(isReachable); // true or false

// Batch resolve multiple URLs
const urls = ['google.com', 'github.com', 'stackoverflow.com'];
const results = await resolver.resolveMany(urls);
```

**How www Fallback Works:**
1. Try primary URL first (e.g., `https://example.com`)
2. If fails and `tryWwwFallback` is true:
   - If URL has `www.`, try without it
   - If URL lacks `www.`, try with it
3. Return first successful result
4. Set `wwwFallbackUsed: true` if fallback succeeded

**Use Cases:**
- Scrape member: Ensure URLs are reachable before scraping
- Fetch member: Resolve redirects before making requests
- Validation: Check if URLs are valid and accessible
- Link checking: Verify external links in content

---

### 3. Prompt Management System

**Components:**
1. `src/prompts/prompt-schema.ts` - Schema definitions and validation
2. `src/prompts/prompt-parser.ts` - Template variable substitution
3. `src/prompts/prompt-manager.ts` - Loading, caching, and rendering

#### 3.1 Prompt Schema

**Purpose:** Define structure for YAML-based prompt templates with metadata and variable definitions.

**Schema Structure:**
```typescript
interface PromptTemplate {
  metadata: {
    name: string;
    version: string;
    description?: string;
    author?: string;
    tags?: string[];
  };
  variables?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    required?: boolean;
    default?: any;
    examples?: any[];
  }>;
  template: string;
}
```

**Example YAML Template:**
```yaml
metadata:
  name: "customer-email"
  version: "1.0.0"
  description: "Generate customer support email"
  author: "Conductor Team"
  tags: ["email", "support"]

variables:
  - name: "customerName"
    type: "string"
    description: "Customer's first name"
    required: true
  - name: "issueType"
    type: "string"
    description: "Type of issue"
    required: true
  - name: "priority"
    type: "string"
    description: "Priority level"
    required: false
    default: "normal"

template: |
  Dear {{customerName}},

  Thank you for contacting us about your {{issueType}}.

  {{#if priority == "urgent"}}
  We understand this is urgent and will prioritize your request.
  {{/if}}

  Best regards,
  Customer Support Team
```

**Features:**
- **Variable Validation**: Check types and required fields
- **Default Values**: Auto-apply defaults for missing variables
- **Variable Extraction**: Extract all variables from template
- **Schema Introspection**: Get variable metadata

#### 3.2 Prompt Parser

**Purpose:** Handlebars-style template variable substitution with conditionals and loops.

**Supported Syntax:**

1. **Simple Variables:**
   ```
   Hello {{name}}!
   ```

2. **Nested Properties:**
   ```
   Email: {{user.email}}
   City: {{user.address.city}}
   ```

3. **Array Access:**
   ```
   First item: {{items[0]}}
   ```

4. **Conditional Blocks:**
   ```
   {{#if condition}}
   This shows when condition is truthy
   {{/if}}
   ```

5. **Loop Blocks:**
   ```
   {{#each items}}
   - {{this}} (index: {{index}})
   {{/each}}
   ```

**Example Usage:**
```typescript
import { parseTemplate, PromptParser } from './prompts';

// Simple parsing
const template = "Hello {{name}}! You have {{count}} messages.";
const result = parseTemplate(template, { name: "Alice", count: 5 });
// => "Hello Alice! You have 5 messages."

// Nested properties
const template2 = "Email: {{user.email}}, City: {{user.address.city}}";
const result2 = parseTemplate(template2, {
  user: {
    email: "alice@example.com",
    address: { city: "New York" }
  }
});
// => "Email: alice@example.com, City: New York"

// Conditionals
const template3 = `
Hello {{name}}!
{{#if isPremium}}
You have access to premium features.
{{/if}}
`;
const result3 = parseTemplate(template3, { name: "Bob", isPremium: true });

// Loops
const template4 = `
Items:
{{#each items}}
- {{this}} ({{index}})
{{/each}}
`;
const result4 = parseTemplate(template4, { items: ["Apple", "Banana", "Cherry"] });
// =>
// Items:
// - Apple (0)
// - Banana (1)
// - Cherry (2)

// Advanced parser with options
const parser = new PromptParser({
  strict: true,        // Throw error on missing variables
  escapeHtml: true,    // Escape HTML in substituted values
  allowUndefined: false // Don't allow undefined variables
});

const result5 = parser.parse(template, variables);
```

**Parser Features:**
- **Strict Mode**: Throw errors on missing variables
- **HTML Escaping**: Prevent XSS in web contexts
- **Undefined Handling**: Replace with empty string or throw error
- **Variable Extraction**: Static analysis of templates
- **Nested Resolution**: Deep property access with dot notation
- **Array Iteration**: Loop over arrays with index tracking

#### 3.3 Prompt Manager

**Purpose:** Load, cache, validate, and render prompt templates.

**Features:**
- **YAML/JSON Loading**: Load templates from YAML or JSON strings
- **In-Memory Caching**: Fast lookups for frequently used prompts
- **Version Management**: Store multiple versions of same prompt
- **Variable Validation**: Validate variables before rendering
- **Template Rendering**: Parse and substitute variables

**Example Usage:**
```typescript
import { PromptManager, getGlobalPromptManager } from './prompts';

// Create manager
const manager = new PromptManager({
  cacheEnabled: true,
  strictValidation: true
});

// Load from YAML string
const yaml = `
metadata:
  name: "greeting"
  version: "1.0.0"
  description: "Simple greeting"

variables:
  - name: "name"
    type: "string"
    required: true
  - name: "timeOfDay"
    type: "string"
    required: false
    default: "day"

template: |
  Good {{timeOfDay}}, {{name}}!
`;

const template = manager.loadFromYAML(yaml);

// Register in cache
manager.register(template);

// Render with variables
const rendered = manager.render(template, { name: "Alice" });
console.log(rendered.content);
// => "Good day, Alice!"

// Render by name from cache
const rendered2 = manager.renderByName('greeting', { name: "Bob", timeOfDay: "morning" });
console.log(rendered2.content);
// => "Good morning, Bob!"

// List all cached prompts
const prompts = manager.list();
console.log(prompts);
// => [{ name: 'greeting', version: '1.0.0' }]

// Export template to YAML
const yamlOutput = manager.toYAML(template);
console.log(yamlOutput);

// Global manager instance
const globalManager = getGlobalPromptManager();
globalManager.register(template);
```

**Manager Configuration:**
```typescript
interface PromptManagerConfig {
  cacheEnabled?: boolean;      // Enable/disable caching (default: true)
  strictValidation?: boolean;  // Validate variables before rendering (default: false)
  parserOptions?: {
    strict?: boolean;          // Throw on missing variables (default: false)
    escapeHtml?: boolean;      // Escape HTML in values (default: false)
    allowUndefined?: boolean;  // Allow undefined variables (default: true)
  };
}
```

**Rendered Output:**
```typescript
interface RenderedPrompt {
  content: string;             // Final rendered content
  metadata: {
    name: string;              // Template name
    version: string;           // Template version
    variables: Record<string, any>; // Final variables used (with defaults)
  };
}
```

---

## File Structure

```
conductor/
├── src/
│   ├── utils/
│   │   ├── normalization.ts      # Normalization utilities
│   │   ├── url-resolver.ts       # URL resolution with fallback
│   │   ├── index.ts              # Public exports
│   │   └── __tests__/            # Tests (to be added)
│   │
│   └── prompts/
│       ├── prompt-schema.ts      # Schema definitions
│       ├── prompt-parser.ts      # Template parser
│       ├── prompt-manager.ts     # Manager with caching
│       ├── index.ts              # Public exports
│       └── __tests__/            # Tests (to be added)
```

---

## Integration Points

### 1. With Built-In Members

**Scrape Member:**
```typescript
import { resolveURL } from '../../utils';

async run(context: MemberExecutionContext) {
  // Resolve URL with www fallback
  const resolution = await resolveURL(input.url);
  const finalUrl = resolution.finalUrl;

  // Scrape the resolved URL
  // ...
}
```

**Fetch Member:**
```typescript
import { resolveURL, normalize } from '../../utils';

async run(context: MemberExecutionContext) {
  // Normalize URL before fetching
  const normalizedUrl = normalize('url', input.url);

  // Check if reachable
  const resolution = await resolveURL(normalizedUrl);

  // Fetch from final URL
  // ...
}
```

### 2. With BaseMember

**Normalization Helper:**
```typescript
export abstract class BaseMember {
  protected normalize(type: string, value: string): string {
    return normalize(type, value);
  }

  protected async resolveUrl(url: string): Promise<string> {
    const resolution = await resolveURL(url);
    return resolution.finalUrl;
  }
}
```

### 3. With Prompt-Based Members

**LLM Member (Future):**
```typescript
import { getGlobalPromptManager } from '../../prompts';

export class LLMMember extends BaseMember {
  async run(context: MemberExecutionContext) {
    const promptManager = getGlobalPromptManager();

    // Render prompt with variables
    const rendered = promptManager.renderByName('system-prompt', {
      task: input.task,
      context: input.context
    });

    // Call LLM with rendered prompt
    // ...
  }
}
```

### 4. Future API Endpoints

**Normalize API:**
```typescript
app.post('/api/v1/normalize/:type', async (c) => {
  const type = c.req.param('type');
  const { value } = await c.req.json();
  const result = normalize(type, value);
  return c.json({ normalized: result });
});
```

**Prompt Rendering API:**
```typescript
app.post('/api/v1/prompts/:name/render', async (c) => {
  const name = c.req.param('name');
  const { variables, version } = await c.req.json();

  const manager = getGlobalPromptManager();
  const rendered = manager.renderByName(name, variables, version);

  return c.json(rendered);
});
```

---

## Benefits

### Normalization
- **Consistency**: All URLs, domains, emails normalized the same way
- **Deduplication**: Normalized data makes deduplication easier
- **Comparison**: Compare values accurately after normalization
- **Storage**: Reduce storage by storing normalized versions
- **Extensibility**: Easy to add custom normalizers

### URL Resolution
- **Reliability**: Automatic fallback increases success rate
- **Redirect Handling**: Track redirects for audit and debugging
- **Performance**: Batch resolution for multiple URLs
- **Protocol Upgrade**: Automatic HTTPS preference
- **Timeout Safety**: Prevent hanging requests

### Prompt Management
- **Versioning**: Maintain multiple prompt versions
- **Reusability**: Share prompts across members
- **Validation**: Catch errors before rendering
- **Performance**: Caching reduces repeated parsing
- **Maintainability**: Separate prompts from code
- **Templating**: Powerful variable substitution

---

## Testing Strategy (To Be Implemented)

### Normalization Tests
```typescript
describe('normalizeURL', () => {
  it('should lowercase hostname', () => {
    expect(normalizeURL('https://Example.com')).toBe('https://example.com');
  });

  it('should remove trailing slash', () => {
    expect(normalizeURL('https://example.com/path/')).toBe('https://example.com/path');
  });

  it('should sort query parameters', () => {
    expect(normalizeURL('https://example.com?b=2&a=1')).toBe('https://example.com?a=1&b=2');
  });
});
```

### URL Resolver Tests
```typescript
describe('URLResolver', () => {
  it('should resolve URL with redirects', async () => {
    const result = await resolveURL('example.com');
    expect(result.statusCode).toBe(200);
    expect(result.redirectChain).toContain('https://example.com');
  });

  it('should try www fallback', async () => {
    const result = await resolveURL('nonexistent-without-www.com', { tryWwwFallback: true });
    expect(result.wwwFallbackUsed).toBe(true);
  });
});
```

### Prompt Parser Tests
```typescript
describe('PromptParser', () => {
  it('should substitute simple variables', () => {
    const result = parseTemplate('Hello {{name}}', { name: 'Alice' });
    expect(result).toBe('Hello Alice');
  });

  it('should handle nested properties', () => {
    const result = parseTemplate('Email: {{user.email}}', { user: { email: 'a@b.com' } });
    expect(result).toBe('Email: a@b.com');
  });

  it('should handle conditionals', () => {
    const template = '{{#if show}}Visible{{/if}}';
    expect(parseTemplate(template, { show: true })).toBe('Visible');
    expect(parseTemplate(template, { show: false })).toBe('');
  });
});
```

---

## Next Steps

1. **API Integration (Week 7-10)**
   - Add normalization endpoints
   - Add prompt rendering endpoints
   - Integrate with Hono router

2. **Testing**
   - Unit tests for all normalizers
   - Integration tests for URL resolver
   - Template parsing edge cases
   - YAML parsing validation

3. **Documentation**
   - Usage examples for each utility
   - Best practices guide
   - Performance optimization tips

4. **Enhancements**
   - Add more normalizers (phone, address, etc.)
   - Support custom URL resolution strategies
   - Add prompt inheritance/composition
   - Add prompt analytics (usage tracking)

---

## Summary

The core utilities system provides essential functionality for:
- **Data Normalization**: Consistent handling of URLs, domains, companies, emails
- **URL Resolution**: Reliable URL fetching with www fallback
- **Prompt Management**: YAML-based templates with versioning and variables

All components follow best practices:
- ✅ Registry pattern for extensibility
- ✅ Singleton pattern for global instances
- ✅ Type-safe TypeScript interfaces
- ✅ Comprehensive error handling
- ✅ Performance optimization (caching)
- ✅ Clean separation of concerns

Ready for integration with built-in members and API endpoints!
