# Repository Synchronization Strategy

## Repository Overview

| Repository | Purpose | License | Release Method | Visibility |
|------------|---------|---------|----------------|------------|
| edgit | Component registry & Git management | MIT | NPX package | Public |
| conductor | AI orchestration platform | Apache 2.0 | NPX package | Public |
| docs | Central documentation hub | MIT | Static site | Public |
| cloud | Enterprise cloud services | Proprietary | Cloud deployment | Private |
| examples | Usage examples & templates | MIT | Reference only | Public |

## Synchronization Strategy

### Core Principle
Maintain consistency across public-facing repositories while respecting:
- License differences (MIT vs Apache 2.0)
- Privacy requirements (cloud repo)
- Package distribution needs (npx for edgit/conductor)
- Organizational standards and planning documents

### File Categories to Synchronize

#### 1. Planning & Standards
Organizational planning and standards documents in `.planning/standards/`:
  - `README.md` - Index of standards
  - `code-review-standard.md` - Code review process
  - `docs-authoring-standards.md` - Documentation requirements
  - `sync-strategy-across-repos.md` - This document

**Note**: Keep planning standards minimal - only standards that exist and are actively used. `TESTING.md` lives in repository root, not duplicated in `.planning/standards/`. Additional standards (architecture, security, release) can be added as needed when the organization matures.

#### 2. Community Standards
Files that define how people interact with the project:
- `CODE_OF_CONDUCT.md` - Community behavior standards
- `CONTRIBUTING.md` - How to contribute
- `SECURITY.md` - Security policy and reporting
- `SUPPORT.md` - How to get help

#### 3. GitHub Configuration
Standardized GitHub workflows and templates:
- `.github/ISSUE_TEMPLATE/` - Issue templates
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template  
- `.github/workflows/security.yml` - Security scanning
- `.github/dependabot.yml` - Dependency updates

#### 4. Development Standards
Consistent development experience across repos:
- `.editorconfig` - Editor settings
- `.prettierrc` - Code formatting
- `.eslintrc.js` - Linting rules  
- `commitlint.config.js` - Commit message format
- `.nvmrc` - Node version

#### 5. Legal & Compliance
- `LICENSE` - Varies by repo (MIT vs Apache 2.0)
- `NOTICE` - Required for Apache 2.0 (conductor only)
- `COPYRIGHT` - Copyright notices (standardized format)

### Files NOT to Synchronize

#### Repository-Specific Files
- `.gitignore` - Each repo has unique build artifacts and dependencies
- `package.json` - Different dependencies and scripts
- `README.md` - Unique to each project's purpose
- `tsconfig.json` - May vary based on build targets
- `.npmrc` - Publishing configuration differs

#### Release-Specific Files
For npx-enabled repos (edgit, conductor):
- `bin/` directory - CLI entry points
- `dist/` or `build/` configuration
- `.npmignore` - Package-specific excludes
- `release.config.js` - Release automation

## Copyright & Trademark Standards

### Copyright Format
All repositories must use this copyright format:
```
Copyright (c) 2024-2025 Higher Order Capital
All rights reserved.
```

Update yearly to: `2024-[CURRENT_YEAR]`

### Trademark Notice
Include in appropriate locations (README files, documentation, website footers):
```
Ensemble® is a registered trademark of Higinio O. Maycotte.
```

**Important**: The trademark owner is **Higinio O. Maycotte**, not Higher Order Capital.

### License Headers

**MIT Licensed Files** (edgit, docs, examples):
```
Copyright (c) 2024-2025 Higher Order Capital

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
[rest of MIT license]
```

**Apache 2.0 Licensed Files** (conductor):
```
Copyright 2024-2025 Higher Order Capital

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License...
[rest of Apache 2.0 header]
```

**NOTICE file for Apache 2.0** (conductor only):
```
Ensemble Conductor
Copyright 2024-2025 Higher Order Capital

This product includes software developed at Higher Order Capital.
Ensemble® is a registered trademark of Higinio O. Maycotte.
```

### README Trademark Section
Include in all public repository READMEs:
```markdown
## License

[License Type] - see [LICENSE](LICENSE) file for details.

## Trademark

Ensemble® is a registered trademark of Higinio O. Maycotte.
```

## Contact Information

### Official Domain
All email addresses and documentation URLs must use **ensemble.ai** (not ensemble.dev or other domains):
- Support: `hello@ensemble.ai`
- Security: `security@ensemble.ai`
- Documentation: `https://docs.ensemble.ai`

## Synchronization Approach

### Baseline Strategy: Edgit as Source of Truth

**Edgit** serves as the baseline repository for all sync operations:
1. Edgit is the most mature and complete repository
2. All community standards, dev docs, and configs originate from edgit
3. Other repos sync from edgit with appropriate customizations

### Sync Levels by Repository

#### Full Sync: Conductor
Conductor receives full synchronization from edgit:
- All community standards (CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT)
- All development docs (CLAUDE.md, DEVELOPMENT.md, TESTING.md)
- All dev configs (.editorconfig, commitlint.config.js, .github templates)
- License changed to Apache 2.0 + NOTICE file (vs MIT in edgit)
- Content customized for conductor (agent orchestration vs component versioning)

#### Simplified Sync: Docs & Examples
Docs and examples repos receive essential files only:
- LICENSE (MIT)
- COPYRIGHT
- SUPPORT.md (tailored to docs/examples context)
- CONTRIBUTING.md (simplified for docs/examples contributions)
- CLAUDE.md (lightweight version with commit standards)
- .editorconfig (for consistent editing)

### 1. Master Repository
Use **edgit** as source of truth for:
- All community standards files
- Development documentation structure
- Configuration templates
- `.planning/standards/` directory (must be manually synced to conductor)
- Copyright and trademark templates

### 2. Planning Standards Directory

Structure for `.planning/standards/`:
```
.planning/
└── standards/
    ├── README.md                      # Index of standards
    ├── code-review-standard.md        # Code review process
    ├── docs-authoring-standards.md    # Documentation standards
    └── sync-strategy-across-repos.md  # This document
```

These documents should be:
- Present in edgit (source of truth)
- Copied to conductor during sync
- Not needed in docs/examples (documentation-only repos)
- Updated only in edgit, then synced
- Reviewed quarterly by engineering leadership

### 3. Step-by-Step Sync Process

When synchronizing repositories from edgit:

#### Step 1: Update Legal Files
```bash
# In edgit (baseline):
1. Update LICENSE copyright year if needed
2. Update COPYRIGHT file
3. Update trademark notices in README.md

# Sync to conductor:
1. Copy COPYRIGHT file
2. Replace LICENSE with Apache 2.0 version
3. Create/update NOTICE file with Apache 2.0 requirements
4. Update package.json (license: "Apache-2.0", author: "Higher Order Capital")

# Sync to docs/examples:
1. Copy COPYRIGHT file
2. Copy MIT LICENSE from edgit
3. No NOTICE file needed (MIT doesn't require it)
```

#### Step 2: Sync Community Standards
```bash
# Full sync to conductor:
- Copy CODE_OF_CONDUCT.md as-is
- Copy SECURITY.md as-is
- Customize CONTRIBUTING.md for conductor specifics:
  * Update changeset prompt: "press Enter for conductor" (not edgit)
  * Keep conventional commit examples but adjust scope names
- Customize SUPPORT.md thoroughly:
  * Change "Edgit" → "Conductor" in all text
  * Update docs links: /edgit → /conductor
  * Update GitHub links: edgit repo → conductor repo
  * Update "Contributing to Edgit" → "Contributing to Conductor"

# Simplified sync to docs/examples:
- Copy SUPPORT.md and customize for docs/examples context:
  * Change GitHub Discussions to org-level (not product-specific)
  * Keep links to both edgit and conductor docs (examples covers both)
- Create simplified CONTRIBUTING.md for docs/examples contributions
- CODE_OF_CONDUCT.md and SECURITY.md optional (can reference main repo)
```

#### Step 3: Sync Development Documentation
```bash
# Full sync to conductor:
- Customize CLAUDE.md (change from edgit CLI to conductor runtime)
- Customize DEVELOPMENT.md (change from npm CLI to Cloudflare Workers)
- Customize TESTING.md (change test scenarios for conductor)
- Keep structure and standards identical, change content specifics

# Simplified sync to docs/examples:
- Create lightweight CLAUDE.md with:
  * Repository purpose and structure
  * Git commit standards (NO AI attribution)
  * Basic contribution guidance
  * Links to relevant resources
- NO DEVELOPMENT.md or TESTING.md needed (not development repos)
```

#### Step 4: Sync Development Configs
```bash
# Full sync to conductor:
- Copy .editorconfig as-is
- Copy commitlint.config.js as-is
- Copy .github/PULL_REQUEST_TEMPLATE.md as-is
- Copy .github/dependabot.yml as-is

# Simplified sync to docs/examples:
- Copy .editorconfig only
- Other configs optional based on repo needs
```

#### Step 5: Fix Domain References
```bash
# All repos:
1. Search for "ensemble.dev" or other wrong domains
2. Replace with "ensemble.ai"
3. Update all email addresses:
   - hello@ensemble.ai (not .dev)
   - security@ensemble.ai (not .dev)
4. Update documentation URLs to docs.ensemble.ai
```

#### Step 6: Customize Product-Specific Content
```bash
# Conductor:
- Replace all "edgit" references with "conductor"
- Update from "component versioning" to "agent orchestration"
- Change examples from Git tags to workflow execution
- Update architecture from CLI tool to Cloudflare Workers runtime

# Docs/examples:
- Keep references appropriate to their purpose
- Link to relevant product docs (edgit or conductor)
```

### 4. Override Strategy
Each repo can override organizational defaults by creating local versions. Local files always take precedence except for `.planning/standards/` which should remain synchronized.

### 5. License Handling
```
MIT repos (edgit, docs, examples):
- Standard MIT LICENSE file
- COPYRIGHT file with Higher Order Capital

Apache 2.0 repo (conductor):  
- Apache 2.0 LICENSE file
- NOTICE file with trademark notice
- COPYRIGHT file with Higher Order Capital

Private repo (cloud):
- No public LICENSE file
- Internal COPYRIGHT notice only
```

### 6. NPX Package Considerations

For edgit and conductor:
- Ensure `bin` field in package.json points to CLI entry
- Include copyright header in CLI entry files
- Display trademark notice in CLI help text
- Maintain backward compatibility in CLI commands

### 7. Commit Message Standards

**IMPORTANT**: Follow conventional commits WITHOUT AI attribution:
- ✅ Correct: `fix: update domain references`
- ✅ Correct: `feat(conductor): add workflow execution`
- ❌ Wrong: Adding "🤖 Generated with Claude Code" or "Co-Authored-By: Claude"
- ❌ Wrong: Any AI attribution in commit messages

The CLAUDE.md in each repo explicitly forbids AI attribution in commits. This applies to:
- All sync commits
- All fix commits
- All feature commits

Reference: See "Git Commit Standards" section in any CLAUDE.md file.

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Incomplete SUPPORT.md Customization
**Issue**: Only changing email domains but leaving product names and GitHub links
**Solution**: Use the detailed checklist in Step 2 - change ALL references:
- Product names (Edgit → Conductor)
- GitHub org/repo links
- Documentation paths
- Contributing text

### Pitfall 2: Hidden Product References
**Issue**: Missing edgit references in unexpected places (changeset prompts, example text)
**Solution**: After sync, search entire repo:
```bash
grep -ri "edgit" --include="*.md" . | grep -v node_modules
```

### Pitfall 3: AI Attribution in Commits
**Issue**: Adding Claude/AI attribution despite CLAUDE.md forbidding it
**Solution**: Always use plain conventional commits with NO attribution footer

### Pitfall 4: Wrong GitHub Discussions Links
**Issue**: Using product-specific discussions link in multi-product contexts
**Solution**:
- Edgit repo → edgit/discussions
- Conductor repo → conductor/discussions
- Docs/Examples repos → org-level /orgs/ensemble-edge/discussions

## Maintenance Cadence

### Automated Checks
- Weekly: Verify file consistency across repos
- Weekly: Verify `.planning/standards/` synchronization
- On PR: Check if synchronized files are modified
- On Release: Ensure legal files are current

### Manual Reviews
- Monthly: Review and update shared templates
- Quarterly: Review `.planning/standards/` documents
- Yearly: Update COPYRIGHT years (January)

## Implementation Notes

### Quick Sync Check
Look for these indicators of drift:
1. Different Code of Conduct versions
2. Inconsistent security contact information
3. Varying contribution processes
4. Outdated copyright years
5. Missing trademark notices
6. Out-of-sync `.planning/standards/` files

### Priority Order
When bringing repos into sync:
1. Security and legal files (highest priority)
2. `.planning/standards/` directory
3. Community standards
4. GitHub templates
5. Development tooling

### Special Considerations

**NPX Packages** (edgit, conductor):
- Include copyright in package.json
- Display trademark notice in `--version` output
- Test `npx` command after each release
- Document minimum Node version

**Documentation Repo**:
- Prominent trademark notice on homepage
- Copyright in footer of all pages
- Legal section in documentation

**Cloud Repo**:
- Exclude from public synchronization
- Maintain separate internal standards
- Include enterprise license terms

## Success Metrics

- All repos have current copyright (2024-[CURRENT_YEAR])
- Trademark notices present in all public repos
- `.planning/standards/` identical across all repos
- All public repos have consistent community standards
- Security reporting process is identical across repos
- Development tooling provides same experience
- Legal compliance maintained per license type
- NPX packages remain installable and executable

## Yearly Tasks

### January Updates
1. Update all COPYRIGHT files to include new year
2. Update NOTICE files (Apache 2.0 repos)
3. Update LICENSE copyright years if embedded
4. Verify trademark notices are current
5. Sync changes across all repositories

---

**Goal**: A contributor moving between repos should find familiar processes, standards, and legal notices while respecting each project's unique requirements. All work should properly attribute Higher Order Capital and protect the Ensemble® trademark.