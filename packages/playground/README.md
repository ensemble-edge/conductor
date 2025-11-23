# Conductor Playground

Development environment for testing Conductor core and plugins locally.

## Purpose

This playground allows you to:
- Test plugins in a real Cloudflare Workers environment
- Develop and debug new features
- Create example applications and patterns
- Integration test across packages before publishing

## Structure

```
playground/
├── ensembles/       # Example ensemble configurations
├── pages/           # Example page configurations
├── agents/          # Custom agent implementations
└── src/             # Worker entry point and utilities
```

## Usage

### Development Server

```bash
cd packages/playground
pnpm dev
```

This starts a local Cloudflare Workers dev server with hot reload.

### Testing Plugins

Add plugins to your configuration and test them locally:

```typescript
// src/index.ts
import { unkeyPlugin } from '@conductor/unkey'

export default {
  plugins: [
    unkeyPlugin
  ]
}
```

### Example Ensembles

Create test ensembles in `ensembles/` directory:

```yaml
# ensembles/test-unkey.yaml
name: test-unkey
flow:
  - name: validate-key
    operation: unkey:validate
    config:
      apiKey: ${input.apiKey}
      apiId: ${env.UNKEY_API_ID}
```

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and configure:

```bash
UNKEY_ROOT_KEY=your_root_key
UNKEY_API_ID=your_api_id
```

## Notes

- This package is **private** and never published
- Use workspace dependencies (`workspace:*`) to always use local packages
- The playground is excluded from release processes
- Add `.dev.vars` to `.gitignore` to keep secrets safe

## Adding New Examples

1. Create ensemble/page in appropriate directory
2. Test with `pnpm dev`
3. Document patterns in comments
4. Consider adding to official examples if useful
