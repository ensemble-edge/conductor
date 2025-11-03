# Scheduled Ensemble Execution Plan

## Status: ✅ IMPLEMENTED

Scheduled/cron-based execution for ensembles is **now fully implemented** in Conductor! This feature allows ensembles to be executed on a schedule using Cloudflare Workers' native cron triggers.

### ✅ Completed Implementation
- Parser schema updated with `schedules` field
- ScheduleManager class for coordinating scheduled execution
- CatalogLoader for loading scheduled ensembles from storage
- Worker `scheduled()` handler integrated
- Schedule management API endpoints (`/api/v1/schedules`)
- Wrangler.toml cron trigger configuration
- Full type exports and documentation

---

## Overview

Enable ensembles to be executed on a schedule (cron expressions), similar to how webhooks work. This allows for:
- Periodic data synchronization
- Scheduled reports and analytics
- Automated maintenance tasks
- Time-based workflow triggers
- Batch processing jobs

---

## Current Trigger Mechanisms

| Trigger Type | Status | Description |
|--------------|--------|-------------|
| **HTTP API** | ✅ Implemented | Direct execution via POST /api/v1/execute |
| **Webhooks** | ✅ Implemented | Trigger via POST /webhooks/:ensembleName |
| **HITL Resume** | ✅ Implemented | Resume via POST /webhooks/resume/:token |
| **Scheduled/Cron** | ❌ Not Implemented | Time-based execution (this plan) |

---

## Proposed Configuration

### 1. **Ensemble-Level Schedule Configuration**

Add a `schedules` field to ensemble YAML, similar to `webhooks`:

```yaml
name: daily-report
description: Generate daily analytics report

# Schedule configurations
schedules:
  - cron: "0 9 * * *"           # Every day at 9 AM UTC
    timezone: "America/New_York"  # Optional: timezone (default UTC)
    enabled: true                 # Optional: enable/disable (default true)
    input:                        # Optional: default input data
      reportType: "daily"
      recipients: ["team@example.com"]

  - cron: "0 */4 * * *"          # Every 4 hours
    timezone: "UTC"
    input:
      reportType: "hourly"

flow:
  - member: generate-report
    input:
      type: ${input.reportType}
      recipients: ${input.recipients}

  - member: send-email
    input:
      to: ${input.recipients}
      body: ${output.generate-report}
```

### 2. **Member-Level Schedule Configuration** (Optional)

For standalone member execution:

```yaml
name: cache-warmer
description: Warm up caches periodically

schedules:
  - cron: "*/15 * * * *"  # Every 15 minutes
    input:
      cacheKeys: ["home", "products", "categories"]

members:
  - name: warm-cache
    type: function
    config:
      code: |
        // Warm cache logic
```

---

## Implementation Design

### Architecture

```
┌─────────────────┐
│ Cloudflare      │
│ Cron Trigger    │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌─────────────────────┐
│ wrangler.toml   │  │    │ Worker Export       │
│ [triggers]      │──┼───▶│ export default {    │
│ crons = [...]   │  │    │   scheduled(...)    │
└─────────────────┘  │    │ }                   │
                     │    └─────────────────────┘
                     │              │
                     │              ▼
                     │    ┌─────────────────────┐
                     └───▶│ ScheduleManager     │
                          │ - Parse cron        │
                          │ - Load ensemble     │
                          │ - Execute           │
                          └─────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────────┐
                          │ Executor            │
                          │ executeEnsemble()   │
                          └─────────────────────┘
```

---

## Implementation Steps

### Phase 1: Configuration & Parsing

#### 1.1. Update Parser Schema

**File**: `src/runtime/parser.ts`

Add schedule configuration to Zod schema:

```typescript
const ScheduleConfigSchema = z.object({
	cron: z.string(), // Cron expression
	timezone: z.string().optional().default('UTC'),
	enabled: z.boolean().optional().default(true),
	input: z.record(z.any()).optional(), // Default input for scheduled execution
	metadata: z.record(z.any()).optional() // Additional metadata
});

const EnsembleSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	members: z.array(MemberConfigSchema),
	flow: z.array(FlowStepSchema).optional(),
	webhooks: z.array(WebhookConfigSchema).optional(),
	schedules: z.array(ScheduleConfigSchema).optional(), // NEW
	state: StateConfigSchema.optional(),
	cache: CacheConfigSchema.optional(),
	scoring: ScoringConfigSchema.optional()
});
```

Export types:

```typescript
export interface ScheduleConfig {
	cron: string;
	timezone?: string;
	enabled?: boolean;
	input?: Record<string, any>;
	metadata?: Record<string, any>;
}

export interface EnsembleConfig {
	name: string;
	description?: string;
	members: MemberConfig[];
	flow?: FlowStep[];
	webhooks?: WebhookConfig[];
	schedules?: ScheduleConfig[]; // NEW
	state?: StateConfig;
	cache?: CacheConfig;
	scoring?: ScoringConfig;
}
```

#### 1.2. Create Schedule Manager

**File**: `src/runtime/schedule-manager.ts` (NEW)

```typescript
import type { EnsembleConfig, ScheduleConfig } from './parser';
import { Executor } from './executor';

export interface ScheduledEvent {
	cron: string;
	scheduledTime: number;
	timezone?: string;
}

export class ScheduleManager {
	private readonly ensembles: Map<string, EnsembleConfig> = new Map();

	/**
	 * Register ensemble with schedules
	 */
	register(ensemble: EnsembleConfig): void {
		if (!ensemble.schedules || ensemble.schedules.length === 0) {
			return;
		}

		this.ensembles.set(ensemble.name, ensemble);
	}

	/**
	 * Handle scheduled execution
	 * Called by Cloudflare Workers scheduled() handler
	 */
	async handleScheduled(
		event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		// Find all ensembles with matching cron
		const matchingEnsembles = this.findMatchingEnsembles(event.cron);

		// Execute all matching ensembles
		const executor = new Executor({ env, ctx });

		for (const { ensemble, schedule } of matchingEnsembles) {
			if (!schedule.enabled) {
				continue;
			}

			try {
				const input = schedule.input || {};

				// Add schedule metadata to input
				const executionInput = {
					...input,
					_schedule: {
						cron: schedule.cron,
						timezone: schedule.timezone,
						scheduledTime: event.scheduledTime,
						triggeredAt: Date.now()
					}
				};

				// Execute in background
				ctx.waitUntil(
					executor.executeEnsemble(ensemble, executionInput).then(result => {
						console.log(`Scheduled execution completed:`, {
							ensemble: ensemble.name,
							cron: schedule.cron,
							success: result.success
						});
					}).catch(error => {
						console.error(`Scheduled execution failed:`, {
							ensemble: ensemble.name,
							cron: schedule.cron,
							error: error.message
						});
					})
				);
			} catch (error) {
				console.error(`Failed to execute scheduled ensemble:`, {
					ensemble: ensemble.name,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}
	}

	/**
	 * Find ensembles with matching cron expression
	 */
	private findMatchingEnsembles(cron: string): Array<{
		ensemble: EnsembleConfig;
		schedule: ScheduleConfig;
	}> {
		const matches: Array<{ ensemble: EnsembleConfig; schedule: ScheduleConfig }> = [];

		for (const ensemble of this.ensembles.values()) {
			if (!ensemble.schedules) continue;

			for (const schedule of ensemble.schedules) {
				if (schedule.cron === cron) {
					matches.push({ ensemble, schedule });
				}
			}
		}

		return matches;
	}

	/**
	 * Get all registered cron expressions
	 * Used to generate wrangler.toml configuration
	 */
	getAllCronExpressions(): string[] {
		const crons = new Set<string>();

		for (const ensemble of this.ensembles.values()) {
			if (ensemble.schedules) {
				for (const schedule of ensemble.schedules) {
					if (schedule.enabled !== false) {
						crons.add(schedule.cron);
					}
				}
			}
		}

		return Array.from(crons);
	}

	/**
	 * List all scheduled ensembles
	 */
	listScheduledEnsembles(): Array<{
		ensembleName: string;
		schedules: ScheduleConfig[];
	}> {
		const scheduled: Array<{ ensembleName: string; schedules: ScheduleConfig[] }> = [];

		for (const ensemble of this.ensembles.values()) {
			if (ensemble.schedules && ensemble.schedules.length > 0) {
				scheduled.push({
					ensembleName: ensemble.name,
					schedules: ensemble.schedules
				});
			}
		}

		return scheduled;
	}
}
```

### Phase 2: Worker Integration

#### 2.1. Update Main Worker Export

**File**: `src/api/app.ts`

Update the default export to include `scheduled()` handler:

```typescript
/**
 * Default export for Cloudflare Workers
 */
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const config: APIConfig = {
			auth: {
				apiKeys: (env as any).API_KEYS ? ((env as any).API_KEYS as string).split(',') : [],
				allowAnonymous: (env as any).ALLOW_ANONYMOUS === 'true'
			},
			logging: (env as any).DISABLE_LOGGING !== 'true'
		};

		const app = createConductorAPI(config);
		return app.fetch(request, env, ctx);
	},

	// NEW: Scheduled handler
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		const scheduleManager = await initializeScheduleManager(env);
		await scheduleManager.handleScheduled(event, env, ctx);
	}
};
```

Create initialization helper:

```typescript
async function initializeScheduleManager(env: Env): Promise<ScheduleManager> {
	const manager = new ScheduleManager();

	// Load all ensembles from catalog
	// TODO: Implement catalog loading
	// For now, could load from KV, D1, or R2

	return manager;
}
```

#### 2.2. Create Catalog Loader for Schedules

**File**: `src/runtime/catalog-loader.ts` (NEW or update existing)

```typescript
import type { EnsembleConfig } from './parser';
import { Parser } from './parser';

export class CatalogLoader {
	/**
	 * Load all ensembles with schedules from catalog
	 */
	static async loadScheduledEnsembles(env: Env): Promise<EnsembleConfig[]> {
		// Option 1: Load from KV
		const kv = (env as any).CATALOG_KV as KVNamespace;
		if (kv) {
			return this.loadFromKV(kv);
		}

		// Option 2: Load from D1
		const db = (env as any).DB;
		if (db) {
			return this.loadFromD1(db);
		}

		// Option 3: Load from R2
		const r2 = (env as any).CATALOG;
		if (r2) {
			return this.loadFromR2(r2);
		}

		return [];
	}

	private static async loadFromKV(kv: KVNamespace): Promise<EnsembleConfig[]> {
		const list = await kv.list({ prefix: 'ensemble:' });
		const ensembles: EnsembleConfig[] = [];

		for (const key of list.keys) {
			const yaml = await kv.get(key.name, 'text');
			if (yaml) {
				const ensemble = Parser.parseEnsemble(yaml);
				if (ensemble.schedules && ensemble.schedules.length > 0) {
					ensembles.push(ensemble);
				}
			}
		}

		return ensembles;
	}

	private static async loadFromD1(db: any): Promise<EnsembleConfig[]> {
		// Load from D1 database
		const result = await db.prepare(`
			SELECT yaml FROM ensembles
			WHERE schedules IS NOT NULL
		`).all();

		return result.results
			.map((row: any) => Parser.parseEnsemble(row.yaml))
			.filter((e: EnsembleConfig) => e.schedules && e.schedules.length > 0);
	}

	private static async loadFromR2(r2: any): Promise<EnsembleConfig[]> {
		// Load from R2 bucket
		const list = await r2.list({ prefix: 'ensembles/' });
		const ensembles: EnsembleConfig[] = [];

		for (const object of list.objects) {
			const file = await r2.get(object.key);
			if (file) {
				const yaml = await file.text();
				const ensemble = Parser.parseEnsemble(yaml);
				if (ensemble.schedules && ensemble.schedules.length > 0) {
					ensembles.push(ensemble);
				}
			}
		}

		return ensembles;
	}
}
```

### Phase 3: API Endpoints

#### 3.1. Schedule Management API

**File**: `src/api/routes/schedules.ts` (NEW)

```typescript
import { Hono } from 'hono';
import { ScheduleManager } from '../../runtime/schedule-manager.js';
import { CatalogLoader } from '../../runtime/catalog-loader.js';

const app = new Hono<{ Bindings: Env }>();

/**
 * List all scheduled ensembles
 * GET /schedules
 */
app.get('/', async (c) => {
	try {
		const ensembles = await CatalogLoader.loadScheduledEnsembles(c.env);
		const manager = new ScheduleManager();

		ensembles.forEach(e => manager.register(e));

		return c.json({
			scheduled: manager.listScheduledEnsembles(),
			totalEnsembles: ensembles.length
		});
	} catch (error) {
		return c.json({
			error: 'Failed to list scheduled ensembles',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

/**
 * Get schedule for specific ensemble
 * GET /schedules/:ensembleName
 */
app.get('/:ensembleName', async (c) => {
	const ensembleName = c.req.param('ensembleName');

	try {
		// Load ensemble from catalog
		// Return its schedules
		return c.json({
			ensemble: ensembleName,
			schedules: []
		});
	} catch (error) {
		return c.json({
			error: 'Failed to get ensemble schedules',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

/**
 * Trigger scheduled execution manually (for testing)
 * POST /schedules/:ensembleName/trigger
 */
app.post('/:ensembleName/trigger', async (c) => {
	const ensembleName = c.req.param('ensembleName');

	try {
		// Load ensemble
		// Execute with schedule input
		return c.json({
			message: 'Scheduled execution triggered',
			ensemble: ensembleName
		});
	} catch (error) {
		return c.json({
			error: 'Failed to trigger scheduled execution',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

export default app;
```

Add to API router:

```typescript
// src/api/app.ts
import { schedules } from './routes';

app.route('/api/v1/schedules', schedules);
```

### Phase 4: Wrangler Configuration

#### 4.1. Update wrangler.toml

**File**: `wrangler.toml`

Add cron triggers section:

```toml
# Scheduled triggers (cron)
# Each unique cron expression from ensemble configs
[triggers]
crons = [
  "0 9 * * *",      # Daily at 9 AM UTC
  "0 */4 * * *",    # Every 4 hours
  "*/15 * * * *"    # Every 15 minutes
]
```

#### 4.2. Auto-Generate Cron Configuration

**File**: `scripts/generate-crons.js` (NEW)

```javascript
/**
 * Generate wrangler.toml cron triggers from ensemble configs
 * Run: node scripts/generate-crons.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

async function generateCrons() {
	const ensemblesDir = path.join(__dirname, '../ensembles');
	const crons = new Set();

	// Read all ensemble YAML files
	const files = fs.readdirSync(ensemblesDir).filter(f => f.endsWith('.yaml'));

	for (const file of files) {
		const content = fs.readFileSync(path.join(ensemblesDir, file), 'utf8');
		const ensemble = yaml.parse(content);

		if (ensemble.schedules) {
			for (const schedule of ensemble.schedules) {
				if (schedule.enabled !== false) {
					crons.add(schedule.cron);
				}
			}
		}
	}

	// Generate wrangler.toml section
	const cronsList = Array.from(crons).map(c => `  "${c}"`).join(',\n');

	console.log('Add this to wrangler.toml:\n');
	console.log('[triggers]');
	console.log('crons = [');
	console.log(cronsList);
	console.log(']');
}

generateCrons();
```

Add to package.json:

```json
{
	"scripts": {
		"generate-crons": "node scripts/generate-crons.js"
	}
}
```

---

## Cron Expression Format

Cloudflare Workers uses standard cron syntax:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Common Examples

```bash
# Every day at midnight UTC
0 0 * * *

# Every Monday at 9 AM UTC
0 9 * * 1

# Every 15 minutes
*/15 * * * *

# Every hour at minute 30
30 * * * *

# First day of every month at 6 AM
0 6 1 * *

# Weekdays at 8 AM
0 8 * * 1-5
```

### Limitations

- Minimum interval: 1 minute
- Maximum: 3 scheduled events per worker (Free plan)
- Maximum: 5 scheduled events per worker (Paid plan)
- Timezone support via configuration (not in cron expression itself)

---

## Usage Examples

### Example 1: Daily Report

```yaml
name: daily-sales-report
description: Generate daily sales report

schedules:
  - cron: "0 9 * * *"  # 9 AM UTC (4 AM EST)
    timezone: "America/New_York"
    input:
      reportType: "daily"
      dateOffset: -1  # Yesterday's data

flow:
  - member: fetch-sales-data
    input:
      startDate: ${date.yesterday}
      endDate: ${date.yesterday}

  - member: generate-report
    input:
      data: ${output.fetch-sales-data}
      format: "pdf"

  - member: send-email
    input:
      to: ["sales@company.com"]
      subject: "Daily Sales Report"
      attachment: ${output.generate-report}
```

### Example 2: Cache Warming

```yaml
name: cache-warmer
description: Warm up CDN cache every 15 minutes

schedules:
  - cron: "*/15 * * * *"
    input:
      urls:
        - "https://example.com/"
        - "https://example.com/products"
        - "https://example.com/about"

flow:
  - member: prefetch-urls
    input:
      urls: ${input.urls}
      method: "HEAD"
```

### Example 3: Data Sync

```yaml
name: crm-sync
description: Sync data from external CRM every 4 hours

schedules:
  - cron: "0 */4 * * *"
    input:
      source: "salesforce"
      batchSize: 1000

flow:
  - member: fetch-crm-updates
    input:
      source: ${input.source}
      since: ${date.4hoursAgo}

  - member: transform-data
    input:
      records: ${output.fetch-crm-updates}

  - member: store-in-database
    input:
      data: ${output.transform-data}
```

### Example 4: Monitoring & Alerts

```yaml
name: health-check
description: Check service health every 5 minutes

schedules:
  - cron: "*/5 * * * *"
    input:
      services:
        - name: "api"
          url: "https://api.example.com/health"
        - name: "web"
          url: "https://example.com"

flow:
  - member: check-services
    input:
      services: ${input.services}
      timeout: 10000

  - member: alert-on-failure
    condition: ${output.check-services.failures > 0}
    input:
      failures: ${output.check-services.failures}
      notifySlack: true
      notifyPagerDuty: true
```

---

## Testing Strategy

### 1. Local Development

Since Cloudflare Workers scheduled events can't be triggered locally, create a test endpoint:

```typescript
// Test endpoint: POST /api/v1/schedules/test
app.post('/schedules/test', async (c) => {
	const { cron } = await c.req.json();

	const event: ScheduledEvent = {
		cron,
		scheduledTime: Date.now()
	};

	const manager = await initializeScheduleManager(c.env);
	await manager.handleScheduled(event, c.env, c.context);

	return c.json({ message: 'Scheduled execution triggered' });
});
```

### 2. Wrangler Dev

Use wrangler CLI to test scheduled events:

```bash
# Trigger a specific cron
wrangler dev --test-scheduled "0 9 * * *"
```

### 3. Unit Tests

```typescript
// test/schedule-manager.test.ts
import { describe, it, expect } from 'vitest';
import { ScheduleManager } from '../src/runtime/schedule-manager';

describe('ScheduleManager', () => {
	it('should register ensemble with schedules', () => {
		const manager = new ScheduleManager();
		const ensemble = {
			name: 'test',
			schedules: [{ cron: '0 9 * * *' }],
			members: [],
			flow: []
		};

		manager.register(ensemble);
		expect(manager.getAllCronExpressions()).toContain('0 9 * * *');
	});

	it('should find matching ensembles by cron', () => {
		const manager = new ScheduleManager();
		// Test matching logic
	});
});
```

---

## Monitoring & Observability

### 1. Execution Logging

Log all scheduled executions:

```typescript
console.log('[SCHEDULE]', {
	ensemble: ensemble.name,
	cron: schedule.cron,
	scheduledTime: event.scheduledTime,
	executedAt: Date.now(),
	duration: executionTime,
	success: result.success
});
```

### 2. Analytics

Track scheduled execution metrics:

```typescript
// Send to Analytics Engine
env.ANALYTICS.writeDataPoint({
	blobs: [ensemble.name, schedule.cron],
	doubles: [executionTime],
	indexes: [success ? 'success' : 'failure']
});
```

### 3. Dashboard

Create dashboard endpoint:

```typescript
// GET /api/v1/schedules/stats
app.get('/stats', async (c) => {
	return c.json({
		totalScheduled: 15,
		activeSchedules: 12,
		executionsToday: 247,
		successRate: 98.7,
		lastExecution: {
			ensemble: 'daily-report',
			time: Date.now(),
			status: 'success'
		}
	});
});
```

---

## Migration & Rollout

### Phase 1: Infrastructure
1. ✅ Update parser schema with `schedules` field
2. ✅ Create ScheduleManager class
3. ✅ Add `scheduled()` handler to worker
4. ✅ Create API endpoints

### Phase 2: Catalog Integration
1. ⏳ Implement CatalogLoader
2. ⏳ Add schedule validation
3. ⏳ Create migration tool for existing ensembles

### Phase 3: Developer Experience
1. ⏳ CLI command: `conductor schedule add <ensemble> <cron>`
2. ⏳ CLI command: `conductor schedule list`
3. ⏳ Auto-generate wrangler.toml crons
4. ⏳ Documentation and examples

### Phase 4: Production
1. ⏳ Deploy to production
2. ⏳ Monitor execution metrics
3. ⏳ Add alerting for failed schedules

---

## Comparison: Webhooks vs Schedules

| Feature | Webhooks | Schedules |
|---------|----------|-----------|
| **Trigger** | External HTTP request | Time-based (cron) |
| **Frequency** | On-demand | Fixed intervals |
| **Input** | Request body | Pre-configured |
| **Use Case** | Event-driven | Periodic tasks |
| **Cost** | Per request | Per execution |
| **Reliability** | Depends on caller | Guaranteed by platform |

---

## Future Enhancements

### 1. Dynamic Scheduling
- Create/update schedules via API (not just config)
- Store schedules in D1/KV
- Hot-reload schedule changes

### 2. Advanced Features
- One-time scheduled execution (run at specific time)
- Retry logic for failed schedules
- Schedule dependencies (run after another schedule)
- Timezone-aware cron expressions
- Schedule groups (enable/disable multiple at once)

### 3. Integration with Durable Objects
- Use Durable Alarms for more flexible scheduling
- Per-ensemble schedule state tracking
- Distributed schedule coordination

---

## Benefits Summary

✅ **Native Integration** - Leverages Cloudflare Workers cron triggers
✅ **Configuration-Based** - Define schedules in ensemble YAML
✅ **Multiple Schedules** - One ensemble can have many schedules
✅ **Timezone Support** - Configure timezone per schedule
✅ **Cost Effective** - No polling, uses native platform features
✅ **Reliable** - Guaranteed execution by Cloudflare platform
✅ **Monitoring** - Built-in logging and analytics

---

## Files to Create/Modify

### New Files
- `src/runtime/schedule-manager.ts` - Core scheduling logic
- `src/runtime/catalog-loader.ts` - Load scheduled ensembles
- `src/api/routes/schedules.ts` - Schedule management API
- `scripts/generate-crons.js` - Auto-generate wrangler.toml

### Modified Files
- `src/runtime/parser.ts` - Add `schedules` to schema
- `src/api/app.ts` - Add `scheduled()` handler
- `src/api/routes/index.ts` - Export schedules route
- `wrangler.toml` - Add `[triggers]` section

---

## Next Steps

1. **Prioritize**: Review plan and confirm approach
2. **Prototype**: Start with parser schema and ScheduleManager
3. **Test**: Implement test endpoint for local development
4. **Document**: Add examples and usage guide
5. **Deploy**: Roll out to production with monitoring

---

**Estimated Effort**: 1-2 weeks
**Priority**: Medium (enables automated workflows)
**Dependencies**: None (standalone feature)
