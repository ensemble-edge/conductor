# Shared Utilities (`lib/`) Directory

This directory contains **shared code** that multiple agents can use. It keeps your codebase DRY (Don't Repeat Yourself) and maintainable.

---

## Purpose

The `lib/` folder is for:
- ✅ Shared utility functions (normalization, validation, parsing)
- ✅ Common types and interfaces
- ✅ Reusable business logic
- ✅ Helper functions used by multiple agents
- ✅ Third-party API clients

**Don't use `lib/` for:**
- ❌ Agent-specific logic (keep it in the agent's directory)
- ❌ One-off utilities used by a single agent

---

## Example Structure

```
lib/
├── README.md                    # This file
├── normalizers.ts               # URL, domain, company normalization
├── validators.ts                # Input validation helpers
├── types.ts                     # Shared TypeScript types
└── __tests__/                   # Tests for shared utilities
    └── normalizers.test.ts
```

---

## Example: Normalizers

```typescript
// lib/normalizers.ts

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.replace(/^www\./, '');
    parsed.protocol = 'https:';
    parsed.hostname = hostname;
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch (error) {
    return url;
  }
}

export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}
```

---

## Using Shared Utilities

```typescript
// agents/domain-classifier/index.ts
import { normalizeDomain } from '../lib/normalizers';
import { validateDomain } from '../lib/validators';
import type { DomainProfile } from '../lib/types';

export default async function classify({ input }: AgentExecutionContext): Promise<DomainProfile> {
  const domain = normalizeDomain(input.domain);

  if (!validateDomain(domain)) {
    throw new Error(`Invalid domain: ${domain}`);
  }

  // Your logic here...
}
```

---

**Keep your code DRY with shared utilities! 🛠️**
