# Platform Separation Architecture Plan

## Overview

Separate deployment-specific code, configuration, and data to support multiple platforms (Cloudflare, Vercel, etc.) while maintaining platform-specific metadata like model lists that can be updated independently.

## Goals

1. **Platform Abstraction** - Core runtime is platform-agnostic
2. **Data Freshness** - Model lists, capabilities, deprecations updated via `conductor upgrade`
3. **User Warnings** - Upgrade command checks user's configs and warns about deprecations
4. **Extensibility** - Easy to add new platforms without touching core
5. **Maintainability** - Platform data separate from code

---

## Proposed Directory Structure

```
conductor/
├── src/
│   ├── runtime/              # Core (platform-agnostic)
│   ├── members/              # Core (platform-agnostic)
│   ├── platforms/            # NEW: Platform adapters (code)
│   │   ├── base/
│   │   │   ├── platform.ts           # Base platform interface
│   │   │   ├── types.ts              # Platform types
│   │   │   └── registry.ts           # Platform registry pattern
│   │   ├── cloudflare/
│   │   │   ├── index.ts              # Main Cloudflare adapter
│   │   │   ├── ai-provider.ts        # AI binding adapter
│   │   │   ├── storage-provider.ts   # KV/D1/R2 adapters
│   │   │   ├── deployment.ts         # Wrangler integration
│   │   │   └── models.ts             # Model validation/helpers
│   │   └── vercel/                   # Future
│   │       ├── index.ts
│   │       ├── ai-provider.ts
│   │       └── deployment.ts
│   └── ...
├── platforms/                # NEW: Platform data (JSON)
│   ├── cloudflare/
│   │   ├── models.json               # Model list with metadata
│   │   ├── capabilities.json         # Platform capabilities
│   │   ├── bindings.json             # Available bindings (KV, D1, R2, AI, etc.)
│   │   └── deprecations.json         # Deprecation schedule
│   ├── vercel/
│   │   ├── models.json
│   │   └── capabilities.json
│   └── manifest.json                 # Registry of platforms
├── bin/
│   └── commands/
│       ├── upgrade.js                # Enhanced: checks models, updates data
│       ├── check-config.js           # NEW: Validate against platform data
│       └── init.js                   # Updated: choose platform
└── templates/
    ├── default/                      # Platform-agnostic starter
    ├── cloudflare/                   # CF-specific (wrangler.toml, etc.)
    │   ├── wrangler.toml.template
    │   └── src/index.ts
    └── vercel/                       # Vercel-specific (vercel.json, etc.)
        └── vercel.json.template
```

---

## Platform Data Structure

### `platforms/cloudflare/models.json`

```json
{
  "version": "2025-11-02",
  "lastUpdated": "2025-11-02T00:00:00Z",
  "providers": {
    "cloudflare-ai": {
      "name": "Cloudflare Workers AI",
      "models": [
        {
          "id": "@cf/meta/llama-3.1-8b-instruct",
          "name": "Llama 3.1 8B Instruct",
          "family": "llama-3",
          "type": "text-generation",
          "status": "active",
          "introducedAt": "2024-09-15",
          "capabilities": ["chat", "function-calling", "streaming"],
          "contextWindow": 8192,
          "pricing": "free",
          "recommended": true
        },
        {
          "id": "@cf/meta/llama-2-7b-chat-int8",
          "name": "Llama 2 7B Chat",
          "family": "llama-2",
          "type": "text-generation",
          "status": "deprecated",
          "deprecatedAt": "2024-10-01",
          "deprecatedReason": "Replaced by Llama 3.1 with better performance",
          "replacementModel": "@cf/meta/llama-3.1-8b-instruct",
          "endOfLife": "2025-01-01",
          "capabilities": ["chat"],
          "contextWindow": 4096,
          "pricing": "free"
        },
        {
          "id": "@cf/mistral/mistral-7b-instruct-v0.2",
          "name": "Mistral 7B Instruct v0.2",
          "family": "mistral",
          "type": "text-generation",
          "status": "active",
          "introducedAt": "2024-08-01",
          "capabilities": ["chat", "instruct"],
          "contextWindow": 32768,
          "pricing": "free"
        }
      ]
    },
    "openai": {
      "name": "OpenAI (via Cloudflare AI Gateway)",
      "models": [
        {
          "id": "gpt-4-turbo",
          "name": "GPT-4 Turbo",
          "family": "gpt-4",
          "type": "text-generation",
          "status": "active",
          "capabilities": ["chat", "vision", "function-calling"],
          "contextWindow": 128000,
          "pricing": "metered"
        },
        {
          "id": "gpt-4-turbo-preview",
          "name": "GPT-4 Turbo Preview",
          "family": "gpt-4",
          "type": "text-generation",
          "status": "deprecated",
          "deprecatedAt": "2024-11-01",
          "deprecatedReason": "Replaced by stable gpt-4-turbo",
          "replacementModel": "gpt-4-turbo",
          "endOfLife": "2024-12-31"
        },
        {
          "id": "gpt-3.5-turbo",
          "name": "GPT-3.5 Turbo",
          "family": "gpt-3.5",
          "type": "text-generation",
          "status": "active",
          "capabilities": ["chat", "function-calling"],
          "contextWindow": 16385,
          "pricing": "metered"
        }
      ]
    },
    "anthropic": {
      "name": "Anthropic (via Cloudflare AI Gateway)",
      "models": [
        {
          "id": "claude-3-5-sonnet-20241022",
          "name": "Claude 3.5 Sonnet",
          "family": "claude-3.5",
          "type": "text-generation",
          "status": "active",
          "capabilities": ["chat", "vision", "function-calling"],
          "contextWindow": 200000,
          "pricing": "metered",
          "recommended": true
        },
        {
          "id": "claude-3-sonnet-20240229",
          "name": "Claude 3 Sonnet",
          "family": "claude-3",
          "type": "text-generation",
          "status": "deprecated",
          "deprecatedAt": "2024-10-22",
          "deprecatedReason": "Replaced by Claude 3.5 Sonnet",
          "replacementModel": "claude-3-5-sonnet-20241022",
          "endOfLife": "2025-02-28"
        }
      ]
    }
  }
}
```

### `platforms/cloudflare/capabilities.json`

```json
{
  "version": "1.0.0",
  "platform": "cloudflare",
  "features": {
    "bindings": {
      "kv": {
        "supported": true,
        "description": "Workers KV - Global key-value storage",
        "requiredIn": "wrangler.toml"
      },
      "d1": {
        "supported": true,
        "description": "D1 - Serverless SQL database",
        "requiredIn": "wrangler.toml"
      },
      "r2": {
        "supported": true,
        "description": "R2 - Object storage",
        "requiredIn": "wrangler.toml"
      },
      "ai": {
        "supported": true,
        "description": "Workers AI - Inference on Cloudflare's network",
        "requiredIn": "wrangler.toml"
      },
      "queue": {
        "supported": true,
        "description": "Queues - Message queuing",
        "requiredIn": "wrangler.toml"
      },
      "durable-objects": {
        "supported": true,
        "description": "Durable Objects - Stateful coordination",
        "requiredIn": "wrangler.toml"
      }
    },
    "runtime": {
      "nodeCompatibility": false,
      "maxExecutionTime": 30000,
      "maxMemory": "128MB",
      "coldStartOptimized": true
    },
    "deployment": {
      "cli": "wrangler",
      "configFile": "wrangler.toml",
      "supportsEdgeFunctions": true,
      "supportsScheduledJobs": true
    }
  }
}
```

### `platforms/cloudflare/bindings.json`

```json
{
  "version": "1.0.0",
  "bindings": {
    "kv": {
      "type": "KVNamespace",
      "description": "Workers KV binding",
      "required": false,
      "wranglerConfig": {
        "field": "kv_namespaces",
        "example": {
          "binding": "CACHE",
          "id": "your-kv-namespace-id"
        }
      }
    },
    "d1": {
      "type": "D1Database",
      "description": "D1 SQL database binding",
      "required": false,
      "wranglerConfig": {
        "field": "d1_databases",
        "example": {
          "binding": "DB",
          "database_name": "your-database",
          "database_id": "your-database-id"
        }
      }
    },
    "ai": {
      "type": "Ai",
      "description": "Workers AI binding",
      "required": false,
      "wranglerConfig": {
        "field": "ai",
        "example": {
          "binding": "AI"
        }
      }
    }
  }
}
```

### `platforms/manifest.json`

```json
{
  "version": "1.0.0",
  "platforms": {
    "cloudflare": {
      "name": "Cloudflare Workers",
      "status": "stable",
      "defaultTemplate": "cloudflare",
      "dataVersion": "2025-11-02",
      "supportedMemberTypes": ["Think", "Function", "Data", "API", "MCP"],
      "requiresPlatformAdapter": true
    },
    "vercel": {
      "name": "Vercel Edge Functions",
      "status": "planned",
      "defaultTemplate": "vercel",
      "supportedMemberTypes": ["Think", "Function", "API"],
      "requiresPlatformAdapter": true
    },
    "local": {
      "name": "Local Development (Node.js)",
      "status": "planned",
      "defaultTemplate": "default",
      "supportedMemberTypes": ["Think", "Function", "API"],
      "requiresPlatformAdapter": false
    }
  }
}
```

---

## Platform Adapter Interface

### `src/platforms/base/platform.ts`

```typescript
/**
 * Base Platform Adapter Interface
 *
 * All platform adapters must implement this interface to provide
 * platform-specific functionality (AI, storage, deployment)
 */

export interface PlatformAdapter {
  name: string;
  version: string;

  // AI Provider
  ai: {
    /**
     * Execute AI model inference
     */
    run(model: string, input: any): Promise<any>;

    /**
     * Validate model ID against platform's model list
     */
    validateModel(modelId: string): boolean;

    /**
     * Get recommended replacement for deprecated model
     */
    getModelReplacement(modelId: string): string | null;

    /**
     * Check if model is deprecated
     */
    isModelDeprecated(modelId: string): boolean;
  };

  // Storage Provider
  storage: {
    kv: KVAdapter;
    sql: SQLAdapter;
    object: ObjectStorageAdapter;
  };

  // Deployment
  deployment: {
    /**
     * Get deployment command for this platform
     */
    getDeployCommand(): string;

    /**
     * Validate platform-specific config file
     */
    validateConfig(configPath: string): Promise<ValidationResult>;
  };
}

export interface KVAdapter {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface SQLAdapter {
  query(sql: string, params?: any[]): Promise<any>;
}

export interface ObjectStorageAdapter {
  get(key: string): Promise<ReadableStream | null>;
  put(key: string, value: ReadableStream): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### `src/platforms/cloudflare/index.ts`

```typescript
/**
 * Cloudflare Platform Adapter
 */

import { PlatformAdapter } from '../base/platform';
import { loadPlatformData } from './models';

export class CloudflarePlatform implements PlatformAdapter {
  name = 'cloudflare';
  version = '1.0.0';

  private env: Env;
  private modelData: any; // Loaded from platforms/cloudflare/models.json

  constructor(env: Env) {
    this.env = env;
    this.modelData = loadPlatformData('models');
  }

  ai = {
    async run(model: string, input: any) {
      // Use Workers AI binding
      if (!this.env.AI) {
        throw new Error('AI binding not available');
      }
      return await this.env.AI.run(model, input);
    },

    validateModel(modelId: string): boolean {
      // Check against models.json
      for (const provider of Object.values(this.modelData.providers)) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) return true;
      }
      return false;
    },

    getModelReplacement(modelId: string): string | null {
      for (const provider of Object.values(this.modelData.providers)) {
        const model = provider.models.find(m => m.id === modelId);
        if (model && model.replacementModel) {
          return model.replacementModel;
        }
      }
      return null;
    },

    isModelDeprecated(modelId: string): boolean {
      for (const provider of Object.values(this.modelData.providers)) {
        const model = provider.models.find(m => m.id === modelId);
        if (model && model.status === 'deprecated') {
          return true;
        }
      }
      return false;
    }
  };

  storage = {
    kv: {
      async get(key: string) {
        return await this.env.CACHE?.get(key) || null;
      },
      async put(key: string, value: string) {
        await this.env.CACHE?.put(key, value);
      },
      async delete(key: string) {
        await this.env.CACHE?.delete(key);
      }
    },
    // ... sql, object storage
  };

  deployment = {
    getDeployCommand(): string {
      return 'wrangler deploy';
    },

    async validateConfig(configPath: string) {
      // Validate wrangler.toml
      return { valid: true, errors: [], warnings: [] };
    }
  };
}
```

---

## Enhanced Upgrade Command

### `bin/commands/upgrade.js`

```javascript
#!/usr/bin/env node

/**
 * Conductor Upgrade Command
 *
 * 1. Updates Conductor package to latest version
 * 2. Updates platform data files (models.json, etc.)
 * 3. Checks user's member configs for deprecated models
 * 4. Provides migration recommendations
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { glob } = require('glob');
const YAML = require('yaml');

async function upgrade() {
  console.log(chalk.blue('🔄 Upgrading Conductor...\n'));

  // 1. Update Conductor package
  await updateConductorPackage();

  // 2. Update platform data
  await updatePlatformData();

  // 3. Check user's configs
  await checkUserConfigs();

  console.log(chalk.green('\n✅ Upgrade complete!'));
}

async function updateConductorPackage() {
  console.log(chalk.bold('1. Updating @ensemble-edge/conductor package...'));

  // Run npm update
  const { execSync } = require('child_process');
  try {
    execSync('npm update @ensemble-edge/conductor', { stdio: 'inherit' });
    console.log(chalk.green('   ✓ Package updated\n'));
  } catch (error) {
    console.log(chalk.yellow('   ⚠ Manual update required\n'));
  }
}

async function updatePlatformData() {
  console.log(chalk.bold('2. Updating platform data...'));

  // Platform data is bundled with the package, so just report version
  const conductorPath = path.dirname(require.resolve('@ensemble-edge/conductor'));
  const platformPath = path.join(conductorPath, '../platforms');

  if (fs.existsSync(platformPath)) {
    // Read cloudflare models.json
    const modelsPath = path.join(platformPath, 'cloudflare/models.json');
    if (fs.existsSync(modelsPath)) {
      const models = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));
      console.log(chalk.green(`   ✓ Platform data version: ${models.version}`));
      console.log(chalk.gray(`   Last updated: ${models.lastUpdated}\n`));
    }
  }
}

async function checkUserConfigs() {
  console.log(chalk.bold('3. Checking your member configurations...\n'));

  // Find all member.yaml files
  const memberFiles = await glob('members/*/member.yaml');

  if (memberFiles.length === 0) {
    console.log(chalk.gray('   No member configs found\n'));
    return;
  }

  // Load platform model data
  const conductorPath = path.dirname(require.resolve('@ensemble-edge/conductor'));
  const modelsPath = path.join(conductorPath, '../platforms/cloudflare/models.json');

  if (!fs.existsSync(modelsPath)) {
    console.log(chalk.yellow('   ⚠ Could not load model data\n'));
    return;
  }

  const modelData = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));

  // Check each member config
  const issues = [];

  for (const file of memberFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const config = YAML.parse(content);

    if (config.type === 'Think' && config.config?.model) {
      const modelId = config.config.model;
      const modelInfo = findModel(modelData, modelId);

      if (modelInfo) {
        if (modelInfo.status === 'deprecated') {
          issues.push({
            file,
            member: config.name,
            type: 'deprecation',
            model: modelId,
            ...modelInfo
          });
        }
      } else {
        issues.push({
          file,
          member: config.name,
          type: 'unknown',
          model: modelId
        });
      }
    }
  }

  // Report issues
  if (issues.length === 0) {
    console.log(chalk.green('   ✓ All models are up to date!\n'));
    return;
  }

  console.log(chalk.yellow(`   Found ${issues.length} issue(s):\n`));

  for (const issue of issues) {
    if (issue.type === 'deprecation') {
      console.log(chalk.yellow(`   ⚠ ${issue.file}`));
      console.log(chalk.gray(`     Member: ${issue.member}`));
      console.log(chalk.red(`     Model "${issue.model}" is deprecated`));
      console.log(chalk.gray(`     Deprecated: ${issue.deprecatedAt}`));
      console.log(chalk.gray(`     Reason: ${issue.deprecatedReason}`));

      if (issue.endOfLife) {
        const daysUntilEOL = Math.floor(
          (new Date(issue.endOfLife) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilEOL > 0) {
          console.log(chalk.yellow(`     End of life: ${issue.endOfLife} (${daysUntilEOL} days)`));
        } else {
          console.log(chalk.red(`     End of life: ${issue.endOfLife} (EXPIRED)`));
        }
      }

      if (issue.replacementModel) {
        console.log(chalk.green(`     → Recommended: "${issue.replacementModel}"`));
      }
      console.log();
    } else if (issue.type === 'unknown') {
      console.log(chalk.yellow(`   ⚠ ${issue.file}`));
      console.log(chalk.gray(`     Member: ${issue.member}`));
      console.log(chalk.yellow(`     Model "${issue.model}" not found in platform data`));
      console.log(chalk.gray(`     This may be a custom model or typo`));
      console.log();
    }
  }

  // Provide action items
  console.log(chalk.bold('   Recommended actions:'));
  console.log(chalk.gray('   1. Update deprecated models in your member configs'));
  console.log(chalk.gray('   2. Test with the new models'));
  console.log(chalk.gray('   3. Deploy when ready'));
  console.log();
}

function findModel(modelData, modelId) {
  for (const provider of Object.values(modelData.providers)) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return model;
  }
  return null;
}

// Run if called directly
if (require.main === module) {
  upgrade().catch(error => {
    console.error(chalk.red('Error during upgrade:'), error);
    process.exit(1);
  });
}

module.exports = { upgrade };
```

---

## New CLI Command: `conductor check-config`

### `bin/commands/check-config.js`

```javascript
#!/usr/bin/env node

/**
 * Check user's configuration against platform data
 *
 * Validates:
 * - Model IDs against platform model lists
 * - Bindings against platform capabilities
 * - Configuration against platform requirements
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { glob } = require('glob');
const YAML = require('yaml');

async function checkConfig(options = {}) {
  console.log(chalk.blue('🔍 Checking configuration...\n'));

  const platform = options.platform || 'cloudflare';

  // Check members
  await checkMembers(platform);

  // Check ensembles
  await checkEnsembles(platform);

  // Check platform config (wrangler.toml, etc.)
  await checkPlatformConfig(platform);

  console.log(chalk.green('\n✅ Configuration check complete!'));
}

async function checkMembers(platform) {
  console.log(chalk.bold('1. Checking members...\n'));

  const memberFiles = await glob('members/*/member.yaml');

  if (memberFiles.length === 0) {
    console.log(chalk.gray('   No members found\n'));
    return;
  }

  // Load platform data
  const conductorPath = path.dirname(require.resolve('@ensemble-edge/conductor'));
  const modelsPath = path.join(conductorPath, `../platforms/${platform}/models.json`);
  const modelData = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));

  let issueCount = 0;

  for (const file of memberFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const config = YAML.parse(content);

    // Check Think members
    if (config.type === 'Think' && config.config?.model) {
      const model = findModel(modelData, config.config.model);

      if (!model) {
        console.log(chalk.yellow(`   ⚠ ${file}: Unknown model "${config.config.model}"`));
        issueCount++;
      } else if (model.status === 'deprecated') {
        console.log(chalk.red(`   ✗ ${file}: Deprecated model "${config.config.model}"`));
        if (model.replacementModel) {
          console.log(chalk.gray(`     → Use "${model.replacementModel}" instead`));
        }
        issueCount++;
      } else {
        console.log(chalk.green(`   ✓ ${file}: Model "${config.config.model}" is valid`));
      }
    }
  }

  if (issueCount === 0) {
    console.log(chalk.green('   All members are valid!\n'));
  } else {
    console.log(chalk.yellow(`\n   Found ${issueCount} issue(s)\n`));
  }
}

async function checkEnsembles(platform) {
  console.log(chalk.bold('2. Checking ensembles...\n'));

  const ensembleFiles = await glob('ensembles/*.yaml');

  if (ensembleFiles.length === 0) {
    console.log(chalk.gray('   No ensembles found\n'));
    return;
  }

  for (const file of ensembleFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const config = YAML.parse(content);

    console.log(chalk.green(`   ✓ ${file}: ${config.name}`));
  }

  console.log();
}

async function checkPlatformConfig(platform) {
  console.log(chalk.bold('3. Checking platform configuration...\n'));

  if (platform === 'cloudflare') {
    const wranglerPath = path.join(process.cwd(), 'wrangler.toml');

    if (!fs.existsSync(wranglerPath)) {
      console.log(chalk.red('   ✗ wrangler.toml not found\n'));
      return;
    }

    console.log(chalk.green('   ✓ wrangler.toml found\n'));
  }
}

function findModel(modelData, modelId) {
  for (const provider of Object.values(modelData.providers)) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return model;
  }
  return null;
}

// Export for use in other commands
module.exports = { checkConfig };

// Run if called directly
if (require.main === module) {
  checkConfig().catch(error => {
    console.error(chalk.red('Error checking config:'), error);
    process.exit(1);
  });
}
```

---

## Migration Strategy

### Phase 1: Add Platform Data (Non-Breaking)

1. Create `platforms/` directory with Cloudflare data
2. Add `platforms/manifest.json`
3. Add platform data files (models.json, capabilities.json, etc.)
4. Update package.json to include platforms/ in published package

### Phase 2: Enhance CLI Commands

1. Update `conductor upgrade` to check models
2. Add `conductor check-config` command
3. Update `conductor init` to ask for platform choice

### Phase 3: Add Platform Adapters (Breaking - V2)

1. Create `src/platforms/` with adapter interfaces
2. Implement Cloudflare adapter
3. Update members to use platform adapters
4. Update templates for platform-specific setup

### Phase 4: Add New Platforms

1. Add Vercel data and templates
2. Implement Vercel adapter
3. Update CLI to support platform selection

---

## Benefits

### For Users

1. **Stay Current** - Upgrade warns about deprecated models
2. **Avoid Breakage** - Know before models hit EOL
3. **Best Practices** - Recommended models highlighted
4. **Confidence** - Validate configs before deploy

### For Maintainers

1. **Separation** - Platform code isolated from core
2. **Updates** - Change model lists without code changes
3. **Extensibility** - Add platforms without core changes
4. **Testing** - Platform adapters are mockable

### For Ecosystem

1. **Multi-Platform** - Easy to support Vercel, AWS Lambda, etc.
2. **Community** - Others can contribute platform adapters
3. **Standards** - Common interface for all platforms

---

## Example: Upgrade Flow

```bash
$ conductor upgrade

🔄 Upgrading Conductor...

1. Updating @ensemble-edge/conductor package...
   ✓ Package updated to v0.0.2

2. Updating platform data...
   ✓ Platform data version: 2025-11-02
   Last updated: 2025-11-02T00:00:00Z

3. Checking your member configurations...

   Found 2 issue(s):

   ⚠ members/analyze-company/member.yaml
     Member: analyze-company
     Model "claude-3-sonnet-20240229" is deprecated
     Deprecated: 2024-10-22
     Reason: Replaced by Claude 3.5 Sonnet
     End of life: 2025-02-28 (88 days)
     → Recommended: "claude-3-5-sonnet-20241022"

   ⚠ members/extract-data/member.yaml
     Member: extract-data
     Model "@cf/meta/llama-2-7b-chat-int8" is deprecated
     Deprecated: 2024-10-01
     Reason: Replaced by Llama 3.1 with better performance
     End of life: 2025-01-01 (EXPIRED)
     → Recommended: "@cf/meta/llama-3.1-8b-instruct"

   Recommended actions:
   1. Update deprecated models in your member configs
   2. Test with the new models
   3. Deploy when ready

✅ Upgrade complete!
```

---

## Implementation Checklist

- [ ] Create `platforms/` directory structure
- [ ] Add `platforms/cloudflare/models.json` with current models
- [ ] Add `platforms/cloudflare/capabilities.json`
- [ ] Add `platforms/manifest.json`
- [ ] Create `src/platforms/base/platform.ts` interface
- [ ] Implement `CloudflarePlatform` adapter (basic version)
- [ ] Enhance `bin/commands/upgrade.js` with model checking
- [ ] Create `bin/commands/check-config.js`
- [ ] Update `package.json` to include platforms/ in npm package
- [ ] Add platform data to build process
- [ ] Write tests for platform adapters
- [ ] Document platform data format
- [ ] Create guide for adding new platforms

---

## Questions for Review

1. **Data File Location**: Should `platforms/` be in the npm package or fetched from a CDN/repo?
   - Pro (in package): Works offline, versioned with Conductor
   - Pro (remote): Can update without new Conductor release
   - **Recommendation**: Start with in-package, add remote fetch as enhancement

2. **Adapter Timing**: When should we implement full platform adapters?
   - Option A: Now (Phase 3 immediately)
   - Option B: Later (after testing with data files)
   - **Recommendation**: Start with data files, add adapters in v0.1.0

3. **Model List Maintenance**: Who updates `models.json`?
   - Manual updates by maintainer
   - Automated scraping from Cloudflare docs
   - Community contributions
   - **Recommendation**: Start manual, automate later

4. **Breaking Changes**: Should platform adapters be v2.0.0 or v0.1.0?
   - If adapters change member APIs: v2.0.0
   - If adapters are additive: v0.1.0
   - **Recommendation**: Design as additive for v0.1.0

5. **Template Strategy**: Should templates be per-platform or universal?
   - Current: Single template with wrangler.toml
   - Proposed: `templates/cloudflare/`, `templates/vercel/`
   - **Recommendation**: Start with platform-specific templates
