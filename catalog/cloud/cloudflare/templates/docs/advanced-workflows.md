# Advanced Workflow Features

Conductor provides sophisticated workflow primitives for building resilient, production-ready systems.

## Table of Contents
- [Retry Logic](#retry-logic)
- [Timeout](#timeout)
- [Conditional Execution](#conditional-execution-when)
- [Try/Catch Error Handling](#trycatch-error-handling)
- [Switch/Case Branching](#switchcase-branching)
- [While Loops](#while-loops)
- [Map/Reduce Pattern](#mapreduce-pattern)
- [Early Exit](#early-exit-from-loops)

---

## Retry Logic

Automatically retry failed operations with configurable backoff strategies.

### Configuration

```yaml
- member: call-external-api
  input:
    url: ${input.apiUrl}
  retry:
    attempts: 3                    # Max retry attempts
    backoff: exponential           # linear | exponential | fixed
    initialDelay: 1000             # ms
    maxDelay: 10000                # ms
    retryOn: ["NETWORK_ERROR"]     # Only retry these errors
```

### Backoff Strategies

**Exponential** (recommended for external APIs):
```
Attempt 1: delay = 1000ms
Attempt 2: delay = 2000ms (1000 * 2^1)
Attempt 3: delay = 4000ms (1000 * 2^2)
Attempt 4: delay = 8000ms (1000 * 2^3)
```

**Linear** (steady increase):
```
Attempt 1: delay = 1000ms
Attempt 2: delay = 2000ms (1000 * 2)
Attempt 3: delay = 3000ms (1000 * 3)
```

**Fixed** (constant):
```
All attempts: delay = 1000ms
```

### Selective Retry

Only retry specific error types:

```yaml
retry:
  attempts: 3
  retryOn:
    - "NETWORK_ERROR"
    - "TIMEOUT"
    - "RATE_LIMIT"
  # Won't retry validation errors, auth errors, etc.
```

---

## Timeout

Prevent operations from hanging indefinitely.

### Basic Timeout

```yaml
- member: slow-operation
  input:
    data: ${input.data}
  timeout: 5000  # 5 seconds, then fail
```

### Timeout with Fallback

Return a default value instead of failing:

```yaml
- member: fetch-recommendations
  input:
    userId: ${input.userId}
  timeout: 3000
  onTimeout:
    fallback: []  # Return empty array on timeout
    error: false  # Don't treat as error
```

### Combining Retry + Timeout

```yaml
- member: critical-operation
  input:
    data: ${input.data}
  timeout: 5000      # Each attempt times out after 5s
  retry:
    attempts: 3      # Try up to 3 times
    backoff: exponential
```

**Total max time**: 5s + 10s + 20s = 35 seconds

---

## Conditional Execution (when)

Skip steps based on runtime conditions.

### Basic When

```yaml
- member: send-notification
  input:
    message: ${input.message}
  when: ${input.enableNotifications === true}
```

### Multiple Conditions

```yaml
- member: premium-feature
  input:
    userId: ${input.userId}
  when: ${input.user.isPremium && input.user.verified}
```

### With Previous Results

```yaml
- member: send-followup-email
  input:
    userId: ${input.userId}
  when: ${validate-email.output.deliverable === true}
```

---

## Try/Catch Error Handling

Graceful error handling with cleanup.

### Basic Try/Catch

```yaml
- type: try
  steps:
    - member: risky-operation
      input:
        data: ${input.data}

  catch:
    - member: handle-error
      input:
        error: ${error}  # Error object available in context
```

### Try/Catch/Finally

```yaml
- type: try
  steps:
    - member: acquire-lock
      input:
        resourceId: ${input.resourceId}

    - member: process-resource
      input:
        resourceId: ${input.resourceId}

  catch:
    - member: log-error
      input:
        error: ${error}
        resourceId: ${input.resourceId}

  finally:
    - member: release-lock  # Always runs, even if no error
      input:
        resourceId: ${input.resourceId}
```

### Nested Try/Catch

```yaml
- type: try
  steps:
    - member: primary-service
      input:
        data: ${input.data}

  catch:
    # Try fallback service
    - type: try
      steps:
        - member: fallback-service
          input:
            data: ${input.data}

      catch:
        # Both failed - use cache
        - member: load-from-cache
          input:
            key: ${input.cacheKey}
```

---

## Switch/Case Branching

Cleaner alternative to nested if/else.

### Basic Switch

```yaml
- type: switch
  value: ${input.priority}
  cases:
    urgent:
      - member: handle-urgent
        input:
          data: ${input.data}

    high:
      - member: handle-high
        input:
          data: ${input.data}

    normal:
      - member: handle-normal
        input:
          data: ${input.data}

  default:
    - member: handle-low
      input:
        data: ${input.data}
```

### With Previous Results

```yaml
- type: switch
  value: ${analyze.output.category}
  cases:
    fraud:
      - member: flag-for-review
      - member: notify-security

    suspicious:
      - member: additional-checks

    clean:
      - member: approve-transaction
```

### Multiple Steps Per Case

```yaml
- type: switch
  value: ${input.accountType}
  cases:
    premium:
      - member: unlock-premium-features
      - member: load-premium-settings
      - member: track-premium-usage

    basic:
      - member: load-basic-features
```

---

## While Loops

Iterate until a condition is met.

### Basic While

```yaml
- type: while
  condition: ${batch.output.hasMore === true}
  maxIterations: 100  # Safety limit
  steps:
    - member: fetch-batch
      input:
        cursor: ${batch.output.nextCursor}

    - member: process-batch
      input:
        items: ${fetch-batch.output.items}
```

### Pagination Example

```yaml
- type: while
  condition: ${fetch-page.output.nextPageToken !== null}
  maxIterations: 50
  steps:
    - member: fetch-page
      input:
        pageToken: ${fetch-page.output.nextPageToken || null}

    - member: store-results
      input:
        results: ${fetch-page.output.results}
```

### Safety Limits

**Always** set `maxIterations` to prevent infinite loops:

```yaml
maxIterations: 100  # Loop will stop after 100 iterations
```

If limit is reached, the workflow throws an error.

---

## Map/Reduce Pattern

Process large datasets efficiently.

### Basic Map/Reduce

```yaml
- type: map-reduce
  items: ${input.documents}
  maxConcurrency: 10

  map:
    member: analyze-document
    input:
      document: ${item}

  reduce:
    member: aggregate-results
    input:
      results: ${results}  # Array of all map results
```

### Real-World Example: Sentiment Analysis

```yaml
- type: map-reduce
  items: ${input.reviews}
  maxConcurrency: 20

  map:
    member: analyze-sentiment
    input:
      text: ${item.text}
      reviewer: ${item.author}

  reduce:
    member: calculate-average-sentiment
    input:
      sentiments: ${results}
```

### Parallel Processing

Map phase processes items in parallel (up to `maxConcurrency`):

```
Items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
maxConcurrency: 3

Batch 1: [1, 2, 3]  -> parallel
Batch 2: [4, 5, 6]  -> parallel
Batch 3: [7, 8, 9]  -> parallel
Batch 4: [10]       -> single

Then reduce: aggregate all results
```

---

## Early Exit from Loops

Stop iteration when condition is met.

### ForEach with Break

```yaml
- type: foreach
  items: ${input.searchTargets}
  maxConcurrency: 5
  breakWhen: ${check-target.output.found === true}

  step:
    member: check-target
    input:
      target: ${item}
      query: ${input.searchQuery}
```

### Use Cases

**Search until found**:
```yaml
- type: foreach
  items: ${input.databases}
  breakWhen: ${search-db.output.found === true}
  step:
    member: search-db
    input:
      db: ${item}
      query: ${input.query}
```

**Validation - stop on first error**:
```yaml
- type: foreach
  items: ${input.records}
  breakWhen: ${validate-record.output.valid === false}
  step:
    member: validate-record
    input:
      record: ${item}
```

**Rate limiting - stop at threshold**:
```yaml
- type: foreach
  items: ${input.requests}
  breakWhen: ${check-rate-limit.output.limitExceeded === true}
  step:
    member: check-rate-limit
    input:
      request: ${item}
```

---

## Combining Features

### Resilient API Call

```yaml
- member: fetch-data
  input:
    url: ${input.url}
  retry:
    attempts: 3
    backoff: exponential
    retryOn: ["NETWORK_ERROR", "TIMEOUT"]
  timeout: 5000
  when: ${input.enableFetch === true}
```

### Fault-Tolerant Pipeline

```yaml
- type: try
  steps:
    - member: primary-processor
      input:
        data: ${input.data}
      timeout: 10000
      retry:
        attempts: 2
        backoff: exponential

  catch:
    - type: switch
      value: ${error.code}
      cases:
        TIMEOUT:
          - member: queue-for-later
            input:
              data: ${input.data}

        VALIDATION_ERROR:
          - member: fix-and-retry
            input:
              data: ${input.data}
              error: ${error}

      default:
        - member: log-unknown-error
          input:
            error: ${error}
```

### Batch Processing with Retries

```yaml
- type: map-reduce
  items: ${input.records}
  maxConcurrency: 10

  map:
    member: process-record
    input:
      record: ${item}
    retry:
      attempts: 2
      backoff: linear
    timeout: 3000

  reduce:
    member: aggregate-successes
    input:
      results: ${results}
```

---

## Best Practices

### 1. Always Set Timeouts on External Calls

```yaml
# ❌ Bad - can hang forever
- member: call-api
  input:
    url: ${input.url}

# ✅ Good - bounded execution time
- member: call-api
  input:
    url: ${input.url}
  timeout: 5000
```

### 2. Use Exponential Backoff for External APIs

```yaml
# ✅ Good - respects rate limits
- member: call-api
  retry:
    attempts: 3
    backoff: exponential  # 1s, 2s, 4s
    initialDelay: 1000
```

### 3. Selective Retry

```yaml
# ❌ Bad - retries everything
- member: process
  retry:
    attempts: 3

# ✅ Good - only retry transient errors
- member: process
  retry:
    attempts: 3
    retryOn: ["NETWORK_ERROR", "TIMEOUT", "RATE_LIMIT"]
```

### 4. Always Set maxIterations on While Loops

```yaml
# ❌ Bad - could loop forever
- type: while
  condition: ${hasMore}
  steps: [...]

# ✅ Good - safety limit
- type: while
  condition: ${hasMore}
  maxIterations: 100
  steps: [...]
```

### 5. Use Finally for Cleanup

```yaml
# ✅ Good - always cleanup
- type: try
  steps:
    - member: acquire-resource
    - member: use-resource
  finally:
    - member: release-resource  # Always runs
```

---

## Performance Considerations

### Concurrency Limits

Control parallelism to avoid overwhelming systems:

```yaml
- type: foreach
  items: ${largeArray}
  maxConcurrency: 10  # Only 10 at a time
  step: ...
```

### Timeout + Retry Totals

Be aware of cumulative time:

```yaml
timeout: 5000
retry:
  attempts: 3
  backoff: exponential
  initialDelay: 1000

# Total possible time:
# Try 1: 5s timeout + 1s delay
# Try 2: 5s timeout + 2s delay
# Try 3: 5s timeout
# = 18 seconds maximum
```

### Early Exit Optimization

Stop processing when possible:

```yaml
# Instead of processing all 1000 items
- type: foreach
  items: ${largeArray}
  breakWhen: ${found}  # Exit early when found
  step: ...
```

---

## Examples

Complete example: [advanced-workflow.yaml](../ensembles/advanced-workflow.yaml)

More patterns: [parallel-workflow.yaml](../ensembles/parallel-workflow.yaml)
