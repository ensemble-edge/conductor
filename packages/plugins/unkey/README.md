# @conductor/unkey

Unkey authentication plugin for Conductor. Provides API key validation, creation, and management using [Unkey](https://unkey.dev).

## Installation

```bash
npm install @conductor/unkey @ensemble-edge/conductor
# or
pnpm add @conductor/unkey @ensemble-edge/conductor
```

## Usage

### Basic Setup

```typescript
import { unkeyPlugin } from '@conductor/unkey'

export default {
  plugins: [
    unkeyPlugin
  ]
}
```

### With Configuration

```typescript
import { createUnkeyPlugin } from '@conductor/unkey'

export default {
  plugins: [
    createUnkeyPlugin({
      rootKey: env.UNKEY_ROOT_KEY,
      apiId: env.UNKEY_API_ID,
      cache: true,
      cacheTtl: 3600
    })
  ]
}
```

## Operations

### `unkey:validate`

Validate an API key.

**YAML Example:**
```yaml
operations:
  - operation: unkey:validate
    config:
      apiKey: ${input.apiKey}
      apiId: ${env.UNKEY_API_ID}
```

**Config:**
- `apiKey` (string, required): API key to validate
- `apiId` (string, optional): Unkey API ID (defaults to plugin config)

**Returns:**
- `valid` (boolean): Whether the key is valid
- `keyId` (string | null): Key ID if valid
- `ownerId` (string | null): Owner ID if valid
- `meta` (object | null): Key metadata if valid
- `remaining` (number | null): Remaining requests if valid
- `error` (string | null): Error message if invalid

### `unkey:create`

Create a new API key.

**YAML Example:**
```yaml
operations:
  - operation: unkey:create
    config:
      apiId: ${env.UNKEY_API_ID}
      prefix: user_
      ownerId: ${input.userId}
      meta:
        email: ${input.email}
      remaining: 1000
```

**Config:**
- `apiId` (string, optional): Unkey API ID
- `prefix` (string, optional): Key prefix
- `byteLength` (number, optional): Bytes of randomness (default: 16)
- `ownerId` (string, optional): Owner ID
- `meta` (object, optional): Key metadata
- `expires` (number, optional): Expiration timestamp (ms)
- `remaining` (number, optional): Remaining requests
- `refill` (object, optional): Refill configuration
- `ratelimit` (object, optional): Rate limit configuration

**Returns:**
- `key` (string): The generated API key
- `keyId` (string): The key ID

### `unkey:revoke`

Revoke an API key.

**YAML Example:**
```yaml
operations:
  - operation: unkey:revoke
    config:
      keyId: ${input.keyId}
```

**Config:**
- `keyId` (string, required): Key ID to revoke

**Returns:**
- `success` (boolean): Whether revocation succeeded
- `keyId` (string): The revoked key ID

## Complete Example

```yaml
# ensemble.yaml
name: api-key-management
flow:
  # Validate incoming API key
  - name: validate
    operation: unkey:validate
    config:
      apiKey: ${input.apiKey}

  # Check if valid
  - name: check-auth
    operation: custom-code
    config:
      code: |
        if (!state.validate.valid) {
          throw new Error('Invalid API key')
        }

  # Create new API key for user
  - name: create-key
    operation: unkey:create
    config:
      prefix: user_
      ownerId: ${state.validate.ownerId}
      meta:
        createdAt: ${Date.now()}
      remaining: 10000
      ratelimit:
        type: fast
        limit: 100
        duration: 60000

  # Return new key
  - name: respond
    operation: transform
    config:
      input: ${create-key.output}
      pick: [key, keyId]
      defaults:
        message: "API key created successfully"
```

## Environment Variables

Required:
- `UNKEY_ROOT_KEY` - Unkey root key for management operations

Optional:
- `UNKEY_API_ID` - Default Unkey API ID (can be overridden per operation)

## Configuration Options

```typescript
interface UnkeyPluginConfig {
  rootKey?: string      // Unkey root key
  apiId?: string        // Default Unkey API ID
  cache?: boolean       // Enable validation caching
  cacheTtl?: number     // Cache TTL in seconds
}
```

## TypeScript Types

```typescript
import type { UnkeyPluginConfig } from '@conductor/unkey'

const config: UnkeyPluginConfig = {
  rootKey: process.env.UNKEY_ROOT_KEY,
  apiId: process.env.UNKEY_API_ID,
  cache: true
}
```

## Rate Limiting Example

```yaml
operations:
  - operation: unkey:create
    config:
      prefix: api_
      ownerId: ${input.userId}
      ratelimit:
        type: fast           # or 'consistent'
        limit: 100           # 100 requests
        duration: 60000      # per 60 seconds (1 minute)
```

## Refill Example

```yaml
operations:
  - operation: unkey:create
    config:
      prefix: api_
      remaining: 1000
      refill:
        interval: daily      # or 'monthly'
        amount: 1000         # refill amount
```

## License

Apache-2.0

## Links

- [Conductor Documentation](https://docs.ensemble.ai/conductor)
- [Unkey Documentation](https://docs.unkey.dev)
- [GitHub Repository](https://github.com/ensemble-edge/conductor)
