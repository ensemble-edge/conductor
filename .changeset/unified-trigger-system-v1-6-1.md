---
"@ensemble-edge/conductor": minor
---

Add unified trigger system with queue operation

**Breaking Changes:**
- Renamed `expose:` to `trigger:` in ensemble YAML configuration
- Removed `schedules:` array - use `trigger: [{ type: cron }]` instead

**New Features:**
- Added `queue` operation for Cloudflare Queues integration
- Added 5 trigger types: webhook, mcp, email, queue, cron
- Queue triggers support batch processing with configurable sizes
- Cron triggers now part of unified trigger array
- All triggers use consistent discriminated union schema

**Migration Guide:**
```yaml
# Old (v1.6.0)
expose:
  - type: webhook
    path: /endpoint

schedules:
  - cron: "0 0 * * *"

# New (v1.6.1+)
trigger:
  - type: webhook
    path: /endpoint
  - type: cron
    cron: "0 0 * * *"
```

**Documentation:**
- Added comprehensive triggers guide
- Added queue operation documentation
- Updated all examples to use new syntax
