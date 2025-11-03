# Conductor Observability

Production-ready logging, tracing, and metrics for Cloudflare Workers.

## Overview

This observability system follows **Cloudflare Workers Observability best practices** (2025):

- ✅ **Structured JSON logging** - Automatic field extraction in Workers Logs dashboard
- ✅ **Debug mode** - Set `DEBUG=true` for verbose logging during development
- ✅ **Analytics Engine** - High-cardinality metrics with SQL querying
- ✅ **Child loggers** - Scoped context for request/execution tracking
- ✅ **OpenTelemetry** (optional) - Integration with Datadog, Honeycomb, etc.

## Quick Start

### Basic Usage

```typescript
import { createLogger } from './observability';

const logger = createLogger();

logger.info('Application started');
logger.warn('Rate limit approaching', { userId: '123', usage: 95 });
logger.error('Failed to process request', error, { requestId: 'req_456' });
```

### With Analytics Engine

```typescript
import { createLogger } from './observability';

const logger = createLogger({}, env.ANALYTICS);

// Log as usual
logger.info('Request processed');

// Record metrics
logger.metric('request.duration', {
	blobs: ['POST', '/api/execute'],
	doubles: [123.45], // duration in ms
	indexes: ['request.duration']
});
```

### Debug Mode

```bash
# Set in wrangler.jsonc
{
  "vars": {
    "DEBUG": "true"
  }
}
```

Or programmatically:

```typescript
const logger = createLogger({ debug: true });
logger.debug('Detailed debug info'); // Only shown in debug mode
```

### Child Loggers (Scoped Context)

```typescript
// Create logger with request context
const requestLogger = logger.child({
	requestId: 'req_789',
	userId: 'alice',
	path: '/api/execute'
});

// All logs include the context automatically
requestLogger.info('Starting execution'); // Includes requestId, userId, path
requestLogger.warn('Slow query detected'); // Includes requestId, userId, path
requestLogger.error('Execution failed', error); // Includes requestId, userId, path
```

### Execution Context Pattern

```typescript
// In Executor
class Executor {
	constructor(
		private readonly logger: Logger
	) {}

	async executeEnsemble(ensemble: EnsembleConfig, input: any) {
		const executionId = generateId();

		// Create execution-scoped logger
		const execLogger = this.logger.child({
			executionId,
			ensembleName: ensemble.name
		});

		execLogger.info('Execution started', {
			inputKeys: Object.keys(input)
		});

		for (const [index, step] of ensemble.flow.entries()) {
			// Create step-scoped logger
			const stepLogger = execLogger.child({
				stepIndex: index,
				memberName: step.member
			});

			stepLogger.debug('Executing step');

			try {
				const result = await this.executeStep(step);
				stepLogger.info('Step completed', {
					durationMs: result.duration
				});
			} catch (error) {
				stepLogger.error('Step failed', error);
				throw error;
			}
		}

		execLogger.info('Execution completed');
	}
}
```

## Configuration

### LoggerConfig

```typescript
interface LoggerConfig {
	/**
	 * Minimum log level (debug, info, warn, error)
	 * @default 'info' in production, 'debug' when DEBUG=true
	 */
	level?: LogLevel;

	/**
	 * Service name for log identification
	 * @default 'conductor'
	 */
	serviceName?: string;

	/**
	 * Environment name
	 * @default 'production'
	 */
	environment?: string;

	/**
	 * Enable debug mode
	 * @default false (or true if DEBUG env var is set)
	 */
	debug?: boolean;

	/**
	 * Enable Analytics Engine integration
	 * @default true
	 */
	enableAnalytics?: boolean;

	/**
	 * Base context included in all logs
	 */
	baseContext?: LogContext;
}
```

### Example Configuration

```typescript
const logger = createLogger({
	level: LogLevel.INFO,
	serviceName: 'my-conductor-app',
	environment: 'production',
	enableAnalytics: true,
	baseContext: {
		version: '1.0.0',
		region: 'us-east-1'
	}
}, env.ANALYTICS);
```

## Viewing Logs

### Cloudflare Dashboard

1. Go to **Workers & Pages** → Your Worker → **Logs**
2. Use the Query Builder to filter and analyze logs:

```sql
-- Find all errors
SELECT * FROM logs WHERE level = 'error'

-- Slow requests
SELECT * FROM logs WHERE context.durationMs > 1000

-- Specific user
SELECT * FROM logs WHERE context.userId = 'alice'

-- Execution timeline
SELECT * FROM logs
WHERE context.executionId = 'exec_123'
ORDER BY timestamp
```

### Local Development

```bash
# Tail logs in real-time
wrangler tail

# With filtering
wrangler tail --format pretty | grep "ERROR"
```

## Analytics Engine Queries

Query metrics using SQL API:

```sql
-- Average execution time
SELECT
  AVG(double1) as avg_duration_ms
FROM ANALYTICS_ENGINE
WHERE blob1 = 'ensemble.execution'

-- Request volume by endpoint
SELECT
  blob1 as endpoint,
  COUNT(*) as requests
FROM ANALYTICS_ENGINE
WHERE index1 = 'request.duration'
GROUP BY blob1
ORDER BY requests DESC

-- P95 latency
SELECT
  APPROX_PERCENTILE(double1, 0.95) as p95_ms
FROM ANALYTICS_ENGINE
WHERE blob1 = 'request.duration'
```

## OpenTelemetry Integration (Optional)

For teams using external observability platforms:

```typescript
import { createOpenTelemetryLogger } from './observability';

const logger = createOpenTelemetryLogger({
	exporterUrl: 'https://api.honeycomb.io',
	serviceName: 'conductor',
	samplingRate: 0.1, // Sample 10% of requests
	headers: {
		'x-honeycomb-team': env.HONEYCOMB_API_KEY
	},
	enableConsoleLogging: true // Also log to Workers Logs
});

logger.info('Using OpenTelemetry integration');
```

**Note**: OpenTelemetry adds 50-100ms latency due to external HTTP calls. Use only when needed.

## Best Practices

### 1. Use Structured Context

```typescript
// ❌ BAD: Unstructured logging
logger.info(`User alice executed workflow in 123ms`);

// ✅ GOOD: Structured logging
logger.info('Workflow executed', {
	userId: 'alice',
	workflowName: 'user-onboarding',
	durationMs: 123
});
```

### 2. Leverage Child Loggers

```typescript
// ❌ BAD: Repeating context in every log
logger.info('Request started', { requestId: 'req_123', userId: 'alice' });
logger.info('Processing', { requestId: 'req_123', userId: 'alice' });
logger.info('Done', { requestId: 'req_123', userId: 'alice' });

// ✅ GOOD: Use child logger
const reqLogger = logger.child({ requestId: 'req_123', userId: 'alice' });
reqLogger.info('Request started');
reqLogger.info('Processing');
reqLogger.info('Done');
```

### 3. Use Appropriate Log Levels

```typescript
logger.debug('Variable x = 5'); // Verbose troubleshooting
logger.info('User logged in'); // Normal operational events
logger.warn('Rate limit at 90%'); // Concerning but not critical
logger.error('Database connection failed', error); // Requires attention
```

### 4. Include Rich Context

```typescript
logger.error('Member execution failed', error, {
	memberName: 'analyze-request',
	attemptNumber: 3,
	durationMs: 5432,
	inputSize: input.length,
	userId: 'alice'
});
```

### 5. Use Metrics for High-Volume Data

```typescript
// ❌ BAD: Logging every request (expensive at scale)
logger.info('Request processed', { duration: 123 });

// ✅ GOOD: Use Analytics Engine for metrics
logger.metric('request.duration', {
	blobs: ['POST', '/api/execute', 'success'],
	doubles: [123],
	indexes: ['request.duration']
});

// Still log important events
logger.info('High-value transaction processed', {
	transactionId: 'tx_789',
	amount: 10000
});
```

## Migration from console.log

Replace all `console.log` calls:

```typescript
// Before
console.log('Starting execution');
console.log('Step completed:', step.member);
console.error('Failed:', error);

// After
logger.info('Starting execution');
logger.info('Step completed', { memberName: step.member });
logger.error('Execution failed', error);
```

## Performance

- **Zero overhead** for logs below configured level
- **~0.1ms** per log call (JSON serialization)
- **Async Analytics Engine writes** don't block requests
- **OpenTelemetry**: Adds 50-100ms per request (use only when needed)

## Limits (Cloudflare Workers Logs)

- **5 billion logs/day** per account (free tier)
- **256 KB max** per log entry (truncated if larger)
- **Head sampling** applied after daily limit
- **90 days** retention

## Examples

See `src/runtime/executor.ts` for production usage examples.

## References

- [Cloudflare Workers Observability](https://developers.cloudflare.com/workers/observability/)
- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Workers Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/)
