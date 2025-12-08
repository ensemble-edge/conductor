# Transform Agent

Declarative data transformation operation for returning literal values, modifying objects with pick/omit/defaults, and merging multiple data sources.

## Features

- **Value Mode**: Return literal values with expression interpolation resolved by runtime
- **Input Mode**: Pass through data with optional modifiers (pick, omit, defaults)
- **Merge Mode**: Combine multiple objects or concatenate arrays
- **Edge-Compatible**: No eval or Function - works in Cloudflare Workers
- **Zero Dependencies**: Pure JavaScript object operations

## Why Transform?

The transform agent solves common patterns that previously required custom code agents:

1. **Mock Data**: Return static test data without writing JavaScript
2. **Data Shaping**: Pick/omit fields from API responses before passing to next agent
3. **Configuration Building**: Construct config objects with dynamic values
4. **Data Merging**: Combine outputs from multiple agents

## Basic Usage

### Value Mode - Return Literal Values

The simplest mode: return a literal value. Expressions are resolved by the runtime before the agent runs.

```yaml
agents:
  - name: mock-users
    operation: transform
    config:
      value:
        - { id: 1, name: "Alice", email: "alice@example.com" }
        - { id: 2, name: "Bob", email: "bob@example.com" }

flow:
  - agent: mock-users
```

### Value Mode with Expressions

Build dynamic values using expression interpolation:

```yaml
agents:
  - name: build-config
    operation: transform
    config:
      value:
        app:
          name: ${input.appName}
          environment: ${input.environment}
        database:
          host: ${input.dbHost}
          port: ${input.dbPort}
        features: ${input.features}

input:
  appName:
    type: string
    default: "my-app"
  environment:
    type: string
    default: "production"
  dbHost:
    type: string
    default: "localhost"
  dbPort:
    type: number
    default: 5432
  features:
    type: array
    default:
      - "auth"
      - "notifications"

flow:
  - agent: build-config
```

### Input Mode - Pass Through with Modifiers

Transform existing data by picking, omitting, or adding default fields:

```yaml
agents:
  - name: fetch-user
    operation: http
    config:
      url: https://api.example.com/user/${input.userId}

  - name: clean-user
    operation: transform
    config:
      input: ${fetch-user.output}
      omit: [password, secret, internalId]
      defaults:
        status: "active"

flow:
  - agent: fetch-user
  - agent: clean-user
```

### Merge Mode - Combine Data

Merge multiple objects or concatenate arrays:

```yaml
agents:
  - name: fetch-profile
    operation: http
    config:
      url: https://api.example.com/profile/${input.userId}

  - name: fetch-preferences
    operation: http
    config:
      url: https://api.example.com/preferences/${input.userId}

  - name: combine-data
    operation: transform
    config:
      merge:
        - ${fetch-profile.output}
        - ${fetch-preferences.output}
        - { source: "api", timestamp: ${now} }

flow:
  - agent: fetch-profile
  - agent: fetch-preferences
  - agent: combine-data
```

## Configuration Reference

### TransformConfig

```typescript
interface TransformConfig {
  // Value mode: return this literal value
  value?: unknown

  // Input mode: transform this input
  input?: unknown

  // Merge mode: combine these items
  merge?: unknown[]

  // Modifiers (for input mode)
  pick?: string[]      // Include only these fields
  omit?: string[]      // Exclude these fields
  defaults?: Record<string, unknown>  // Add defaults for missing fields
}
```

### Mode Priority

When multiple modes are specified, they are evaluated in this order:

1. **value** - If `value` is defined (including null), use value mode
2. **merge** - If `merge` is defined, use merge mode
3. **input** - If `input` is defined, use input mode

If none are specified, an error is thrown.

## Detailed Mode Reference

### Value Mode

Returns `config.value` directly. Expressions are already resolved by runtime.

```yaml
# String value
config:
  value: "Hello, World!"

# Number value
config:
  value: 42

# Boolean value
config:
  value: true

# Null value
config:
  value: null

# Object value
config:
  value:
    key: "value"
    nested:
      data: true

# Array value
config:
  value:
    - item1
    - item2
    - item3
```

### Input Mode

Passes through `config.input` with optional modifiers applied.

#### Pick Modifier

Include only specified fields:

```yaml
config:
  input: ${previous.output}
  pick: [id, name, email]

# Input: { id: 1, name: "Alice", email: "alice@example.com", password: "secret" }
# Output: { id: 1, name: "Alice", email: "alice@example.com" }
```

#### Omit Modifier

Exclude specified fields:

```yaml
config:
  input: ${previous.output}
  omit: [password, internalId, secret]

# Input: { id: 1, name: "Alice", password: "secret", internalId: "xyz" }
# Output: { id: 1, name: "Alice" }
```

#### Defaults Modifier

Add default values for missing fields:

```yaml
config:
  input: ${previous.output}
  defaults:
    status: "pending"
    role: "user"

# Input: { id: 1, name: "Alice" }
# Output: { id: 1, name: "Alice", status: "pending", role: "user" }

# Input: { id: 1, name: "Alice", status: "active" }
# Output: { id: 1, name: "Alice", status: "active", role: "user" }
```

#### Combining Modifiers

Modifiers are applied in order: defaults → pick → omit

```yaml
config:
  input: ${previous.output}
  defaults:
    status: "pending"
  pick: [id, name, status]
  omit: [name]

# Input: { id: 1, name: "Alice", password: "secret" }
# After defaults: { id: 1, name: "Alice", password: "secret", status: "pending" }
# After pick: { id: 1, name: "Alice", status: "pending" }
# After omit: { id: 1, status: "pending" }
```

#### Array Input

Modifiers are applied to each item in an array:

```yaml
config:
  input: ${users.output}
  omit: [password]
  defaults:
    verified: false

# Input: [{ id: 1, name: "Alice", password: "x" }, { id: 2, name: "Bob", password: "y" }]
# Output: [{ id: 1, name: "Alice", verified: false }, { id: 2, name: "Bob", verified: false }]
```

### Merge Mode

Combines multiple items into one.

#### Object Merge

Later objects override earlier ones (shallow merge):

```yaml
config:
  merge:
    - { name: "Alice", status: "pending" }
    - { status: "active" }
    - { role: "admin" }

# Output: { name: "Alice", status: "active", role: "admin" }
```

#### Array Concatenation

Arrays are flattened into a single array:

```yaml
config:
  merge:
    - [1, 2, 3]
    - [4, 5]
    - [6]

# Output: [1, 2, 3, 4, 5, 6]
```

#### Primitive Values

For non-mergeable types (strings, numbers), the first item is returned:

```yaml
config:
  merge:
    - "first"
    - "second"

# Output: "first"
```

## Real-World Examples

### CSV Export with Mock Data

```yaml
name: csv-export
description: Export users as CSV

trigger:
  - type: http
    path: /export/users.csv
    methods: [GET]
    public: true

agents:
  - name: mock-users
    operation: transform
    config:
      value:
        - { id: 1, name: "Alice Johnson", email: "alice@example.com", created_at: "2024-01-15" }
        - { id: 2, name: "Bob Smith", email: "bob@example.com", created_at: "2024-01-16" }
        - { id: 3, name: "Carol Williams", email: "carol@example.com", created_at: "2024-01-17" }

flow:
  - agent: mock-users

output:
  status: 200
  headers:
    Content-Disposition: attachment; filename="users.csv"
  format:
    type: csv
    extract: users
  body:
    users: ${mock-users.output}
```

### YAML Configuration Export

```yaml
name: yaml-config
description: Generate YAML configuration dynamically

trigger:
  - type: http
    path: /config.yaml
    methods: [GET]
    public: true

agents:
  - name: build-config
    operation: transform
    config:
      value:
        version: "1.0"
        app:
          name: ${input.appName}
          environment: ${input.environment}
          debug: ${input.debug}
        database:
          host: ${input.dbHost}
          port: ${input.dbPort}
        features: ${input.features}
        logging:
          level: ${input.logLevel}
          format: "json"

flow:
  - agent: build-config

input:
  appName:
    type: string
    default: "my-app"
  environment:
    type: string
    default: "production"
  debug:
    type: boolean
    default: false
  dbHost:
    type: string
    default: "localhost"
  dbPort:
    type: number
    default: 5432
  features:
    type: array
    default: ["auth", "notifications", "analytics"]
  logLevel:
    type: string
    default: "info"

output:
  status: 200
  headers:
    Content-Disposition: attachment; filename="config.yaml"
  format:
    type: yaml
    extract: config
  body:
    config: ${build-config.output}
```

### API Response Sanitization

```yaml
name: get-user-profile
description: Fetch user profile with sensitive data removed

agents:
  - name: fetch-user
    operation: http
    config:
      url: https://api.internal.example.com/users/${input.userId}
      headers:
        Authorization: Bearer ${env.INTERNAL_API_KEY}

  - name: sanitize
    operation: transform
    config:
      input: ${fetch-user.output}
      omit: [password, passwordHash, ssn, internalNotes, adminFlags]
      defaults:
        avatar: "/images/default-avatar.png"
        bio: "No bio provided"

flow:
  - agent: fetch-user
  - agent: sanitize

output:
  body: ${sanitize.output}
```

### Combining Multiple API Results

```yaml
name: dashboard-data
description: Aggregate data from multiple services

agents:
  - name: fetch-user
    operation: http
    config:
      url: https://api.example.com/users/${input.userId}

  - name: fetch-orders
    operation: http
    config:
      url: https://api.example.com/users/${input.userId}/orders

  - name: fetch-notifications
    operation: http
    config:
      url: https://api.example.com/users/${input.userId}/notifications

  - name: combine
    operation: transform
    config:
      merge:
        - user: ${fetch-user.output}
        - orders: ${fetch-orders.output}
        - notifications: ${fetch-notifications.output}
        - meta:
            fetchedAt: ${now}
            version: "v1"

flow:
  - agent: fetch-user
  - agent: fetch-orders
  - agent: fetch-notifications
  - agent: combine

output:
  body: ${combine.output}
```

## Error Handling

### Missing Mode

If no mode is specified, the agent throws an error:

```yaml
# This will throw an error:
agents:
  - name: invalid
    operation: transform
    config: {}  # No value, input, or merge specified
```

Error: `transform operation requires one of: config.value, config.input, or config.merge`

### Empty Merge Array

An empty merge array throws an error:

```yaml
# This will throw an error:
config:
  merge: []
```

Error: `transform merge mode requires a non-empty array`

## Performance

Transform is one of the fastest operations:

- **No I/O**: All operations are in-memory
- **No async**: Synchronous object manipulation
- **No external calls**: Pure JavaScript
- **Typical execution**: <1ms

## Best Practices

1. **Use for Static Data**: Transform is ideal for returning test/mock data
2. **Prefer Transform over Code**: For simple object operations, transform is clearer and safer
3. **Chain Transforms**: Use multiple transform agents for complex pipelines
4. **Sanitize API Responses**: Always omit sensitive fields before returning to clients
5. **Document Defaults**: Make clear what defaults are applied to data

## See Also

- [Ensemble Output Formats](../../../docs/output-formats.md)
- [Expression Interpolation](../../../docs/expressions.md)
- [HTTP Agent](../http/README.md)
