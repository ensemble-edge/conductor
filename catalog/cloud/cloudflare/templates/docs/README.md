# API Documentation

This directory contains standard documentation pages for your API.

## What's Included

- **getting-started.md** - Quick start guide for new users
- **authentication.md** - API key setup and security
- **rate-limits.md** - Usage limits and best practices
- **examples.md** - Real-world usage examples
- **webhooks.md** - Webhook configuration (if applicable)
- **errors.md** - Error codes and handling

## Customization

These pages are templates - **edit them to match your API**:

1. Replace `{{PROJECT_NAME}}` with your project name
2. Update URLs (https://api.example.com → your actual URL)
3. Add your specific rate limits, error codes, etc.
4. Include your organization's branding

## Documentation Generation

These markdown files are automatically included when you run:

```bash
conductor docs generate
```

The OpenAPI spec generator will:
- Include these pages in the generated documentation
- Link them from relevant sections
- Render them with your branding (if using hosted docs)

## Structure

```
docs/
├── getting-started.md   # First page users see
├── authentication.md    # Authentication & security
├── rate-limits.md       # Usage limits
├── errors.md            # Error reference
├── examples.md          # Code examples
└── webhooks.md          # Webhook guide (optional)
```

## Best Practices

1. **Keep docs up-to-date** - Update when you change the API
2. **Test examples** - Ensure all code samples actually work
3. **Add real values** - Use realistic examples, not "foo"/"bar"
4. **Link between pages** - Help users navigate
5. **Version your docs** - Document breaking changes

## AI Enhancement

When using `conductor docs generate --ai`, the docs-writer member will:
- Improve clarity and readability
- Add missing sections
- Generate better examples
- Suggest improvements

## Preview Docs Locally

```bash
# Generate docs
conductor docs generate

# View OpenAPI spec
cat openapi.yaml

# (Coming soon) Serve docs locally
conductor docs serve
```

## Publishing

```bash
# (Coming soon) Publish to Conductor Cloud
conductor docs publish

# Your docs will be available at:
# https://docs.your-project.conductor.dev
```

## Questions?

- [Conductor Docs](https://docs.conductor.dev)
- [GitHub Issues](https://github.com/ensemble-edge/conductor/issues)
- [Discord Community](https://discord.gg/conductor)
