---
"@ensemble-edge/conductor": minor
---

## Conductor 1.1.0 - Component Resolution & Breaking Protocol Changes

### Breaking Changes

**Removed Legacy Protocol Syntax**

All `protocol://` syntax has been removed in favor of unified path-based component references:

- ❌ `prompt://name@version` → ✅ `prompts/name@version`
- ❌ `template://name@version` → ✅ `templates/name@version`
- ❌ `kv://name@version` → ✅ `templates/name@version` (for templates)

**Migration Guide:**

```yaml
# Before (1.0.x)
members:
  - name: analyze
    type: Think
    config:
      prompt: prompt://analyst@v1.0.0

  - name: send-email
    type: Email
    config:
      template: kv://welcome@latest

# After (1.1.0)
members:
  - name: analyze
    type: Think
    config:
      prompt: prompts/analyst@v1.0.0

  - name: send-email
    type: Email
    config:
      template: templates/welcome@latest
```

### New Features

**Smart Component Resolution (Alternative 1)**

Automatic detection and resolution of:
- Inline values (strings, objects, arrays)
- File paths (`./path/to/file`)
- Component references (`type/name@version`)

**Resolution Logic:**

1. Non-string values → used as-is (inline)
2. Multi-line strings → inline content
3. Paths starting with `./` or `/` → file path
4. Pattern `type/name@version` → component reference from Edgit
5. Pattern `type/name` → component reference with `@latest`
6. Everything else → inline string

**Email Member Updates:**

- Integrated component resolver in template rendering
- Now supports all resolution patterns for `template` field
- Backward-compatible test suite updated

**Think Member Updates:**

- Integrated component resolver in prompt loading
- Supports versioned prompts via `prompt: prompts/name@version`
- Seamless Edgit integration for prompt management

### Documentation Updates

- Removed "planned" status from versioned component features (now implemented)
- Fixed member discovery documentation to clarify member vs component references
- Updated HTML member documentation to remove non-existent `protocol://` syntax
- Updated all example ensemble YAML files with new syntax

### Technical Details

**Component Resolver** (`src/utils/component-resolver.ts`):
- `resolveValue()` - Main resolution function
- `isComponentReference()` - Pattern detection for `type/name@version`
- `resolveComponentRef()` - Fetches from Edgit KV or local fallback
- `needsResolution()` - Helper to check if value needs async resolution

**Test Coverage:**
- All 712 tests passing
- 29 component resolver unit tests
- 69 email member tests updated to new syntax
- Integration tests verified with new component resolution

### Upgrade Path

1. **Update all YAML files**: Replace `protocol://` with path-based syntax
2. **Update code**: Replace protocol references in TypeScript/JavaScript
3. **Run tests**: Ensure all component references resolve correctly
4. **Deploy**: Breaking changes are intentional, no backward compatibility
