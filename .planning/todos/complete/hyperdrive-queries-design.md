# Hyperdrive Integration & Queries Member - Design

## Overview

Add Hyperdrive support as a 5th memory tier ("Analytical Memory") and create a first-class `queries` member that treats SQL like prompts - storable, parameterized, and reusable across workflows.

---

## 1. Hyperdrive Integration

### What is Hyperdrive?

Cloudflare Hyperdrive is a connection pooling and caching service for databases:
- Connects to external databases (Postgres, MySQL, etc.)
- Provides connection pooling
- Edge caching for query results
- Low-latency access from Workers

### Why Add It?

**Current Limitation:**
- D1 is good for small-scale structured data
- No access to existing databases (production DBs, data warehouses, analytics DBs)
- Can't leverage existing data infrastructure

**With Hyperdrive:**
- ✅ Connect to multiple production databases
- ✅ Query analytics databases from edge
- ✅ Access data warehouses (Postgres, MySQL)
- ✅ Cached queries for performance
- ✅ Connection pooling for reliability

### Architecture

#### A. Storage Layer

**New: `HyperdriveRepository`**

```typescript
// src/storage/hyperdrive-repository.ts

export interface HyperdriveConfig {
  /**
   * Hyperdrive binding name
   */
  bindingName: string;

  /**
   * Database type (for dialect-specific SQL)
   */
  databaseType: 'postgres' | 'mysql' | 'mariadb';

  /**
   * Schema name (optional)
   */
  schema?: string;

  /**
   * Connection options
   */
  options?: {
    /**
     * Query timeout (ms)
     */
    timeout?: number;

    /**
     * Read-only mode
     */
    readOnly?: boolean;
  };
}

export class HyperdriveRepository {
  constructor(
    private readonly hyperdrive: Hyperdrive,
    private readonly config: HyperdriveConfig
  ) {}

  /**
   * Execute a raw SQL query
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<Result<T[], ConductorError>>;

  /**
   * Execute a query with named parameters
   */
  async queryNamed<T = any>(
    sql: string,
    params: Record<string, any>
  ): Promise<Result<T[], ConductorError>>;

  /**
   * Execute a write query (INSERT, UPDATE, DELETE)
   */
  async execute(
    sql: string,
    params?: any[]
  ): Promise<Result<{ rowsAffected: number }, ConductorError>>;

  /**
   * Begin a transaction
   */
  async transaction<T>(
    callback: (tx: HyperdriveTransaction) => Promise<T>
  ): Promise<Result<T, ConductorError>>;

  /**
   * Get table metadata
   */
  async getTableInfo(tableName: string): Promise<Result<TableMetadata, ConductorError>>;

  /**
   * List tables in schema
   */
  async listTables(): Promise<Result<string[], ConductorError>>;
}
```

#### B. Memory Layer - "Analytical Memory"

**New 5th Memory Tier:**

```typescript
// src/runtime/memory/analytical-memory.ts

export interface AnalyticalMemoryConfig {
  /**
   * Hyperdrive bindings to use
   */
  databases: {
    [alias: string]: {
      binding: Hyperdrive;
      type: 'postgres' | 'mysql' | 'mariadb';
      schema?: string;
    };
  };

  /**
   * Default database alias
   */
  defaultDatabase?: string;

  /**
   * Cache TTL for query results (seconds)
   */
  cacheTTL?: number;
}

export class AnalyticalMemory {
  constructor(
    private readonly env: Env,
    private readonly config: AnalyticalMemoryConfig
  ) {}

  /**
   * Query a specific database
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    database?: string
  ): Promise<T[]>;

  /**
   * Query with named parameters
   */
  async queryNamed<T = any>(
    sql: string,
    params: Record<string, any>,
    database?: string
  ): Promise<T[]>;

  /**
   * Execute across multiple databases (federated query)
   */
  async queryMultiple(queries: {
    database: string;
    sql: string;
    params?: any[];
  }[]): Promise<Map<string, any[]>>;

  /**
   * Get database connection info
   */
  getDatabases(): string[];

  /**
   * Check if database is available
   */
  hasDatabase(alias: string): boolean;
}
```

#### C. Updated Memory Manager

```typescript
// src/runtime/memory/memory-manager.ts

export class MemoryManager {
  private workingMemory: WorkingMemory;
  private sessionMemory: SessionMemory | null = null;
  private longTermMemory: LongTermMemory | null = null;
  private semanticMemory: SemanticMemory | null = null;
  private analyticalMemory: AnalyticalMemory | null = null; // ← NEW

  constructor(
    private readonly env: Env,
    private readonly config: MemoryConfig,
    private readonly userId?: string,
    private readonly sessionId?: string
  ) {
    // ... existing initialization ...

    // Create analytical memory if Hyperdrive bindings available
    if (config.layers.analytical && config.analyticalConfig) {
      this.analyticalMemory = new AnalyticalMemory(env, config.analyticalConfig);
    }
  }

  // ==================== Analytical Memory ====================

  /**
   * Query analytical database
   */
  async queryAnalytical<T = any>(
    sql: string,
    params?: any[],
    database?: string
  ): Promise<T[]> {
    if (!this.analyticalMemory) {
      return [];
    }
    return await this.analyticalMemory.query(sql, params, database);
  }

  /**
   * Get available databases
   */
  getAnalyticalDatabases(): string[] {
    if (!this.analyticalMemory) {
      return [];
    }
    return this.analyticalMemory.getDatabases();
  }
}
```

---

## 2. Queries Member

### Concept: SQL as Prompts

**Key Insight:** SQL queries should be treated like prompts:
- **Stored** in catalog alongside agents
- **Versioned** and tracked
- **Parameterized** with input schemas
- **Reusable** across workflows
- **Composable** with other members

### Why?

**Current Problem:**
```typescript
// Hardcoded SQL in agent
const users = await db.query(
  'SELECT * FROM users WHERE created_at > $1',
  [date]
);
```

**With Queries Member:**
```yaml
# catalog/queries/recent-users.yml
name: recent-users
type: queries
version: 1.0.0
description: Get users created after a date

input:
  date: string  # ISO date

query: |
  SELECT
    id,
    email,
    name,
    created_at,
    plan_type
  FROM users
  WHERE created_at > :date
  ORDER BY created_at DESC

config:
  database: production
  cacheTTL: 300
  maxRows: 1000
```

Then use it:
```typescript
// In agent
const result = await members.queries({
  queryName: 'recent-users',
  input: { date: '2024-01-01' }
});
```

### Architecture

#### A. Queries Member Implementation

```typescript
// src/members/built-in/queries/queries-member.ts

export interface QueriesInput {
  /**
   * Query name (from catalog) OR inline SQL
   */
  queryName?: string;
  sql?: string;

  /**
   * Query parameters
   */
  input?: Record<string, any>;

  /**
   * Database alias (if multiple)
   */
  database?: string;
}

export interface QueriesConfig {
  /**
   * Default database
   */
  defaultDatabase?: string;

  /**
   * Cache TTL (seconds)
   */
  cacheTTL?: number;

  /**
   * Max rows to return
   */
  maxRows?: number;

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Read-only mode (prevent writes)
   */
  readOnly?: boolean;

  /**
   * Query transformation
   */
  transform?: 'none' | 'camelCase' | 'snakeCase';
}

export interface QueriesOutput {
  /**
   * Query results
   */
  rows: any[];

  /**
   * Row count
   */
  count: number;

  /**
   * Columns returned
   */
  columns: string[];

  /**
   * Execution time (ms)
   */
  executionTime: number;

  /**
   * Cache hit?
   */
  cached: boolean;

  /**
   * Database used
   */
  database: string;
}

export class QueriesMember extends BaseMember<QueriesInput, QueriesOutput, QueriesConfig> {
  name = 'queries';
  type = 'data' as const;
  version = '1.0.0';
  description = 'Execute SQL queries across Hyperdrive-connected databases';

  async execute(context: MemberExecutionContext<QueriesInput>): Promise<MemberResult<QueriesOutput>> {
    const { input, env } = context;
    const config = this.getEffectiveConfig(context);

    // 1. Resolve query (from catalog or inline)
    const query = input.queryName
      ? await this.loadQueryFromCatalog(input.queryName)
      : { sql: input.sql!, params: {} };

    // 2. Validate query (if read-only, prevent writes)
    if (config.readOnly && this.isWriteQuery(query.sql)) {
      return {
        success: false,
        error: 'Write operations not allowed in read-only mode'
      };
    }

    // 3. Interpolate parameters
    const { sql, params } = this.interpolateParams(query.sql, input.input || {});

    // 4. Execute query via Hyperdrive
    const database = input.database || config.defaultDatabase || 'default';
    const hyperdrive = env[database]; // Hyperdrive binding

    const startTime = Date.now();
    const result = await hyperdrive.query(sql, params);
    const executionTime = Date.now() - startTime;

    // 5. Transform results
    const rows = config.transform === 'camelCase'
      ? this.toCamelCase(result.rows)
      : result.rows;

    // 6. Apply row limit
    const limitedRows = config.maxRows
      ? rows.slice(0, config.maxRows)
      : rows;

    return {
      success: true,
      data: {
        rows: limitedRows,
        count: limitedRows.length,
        columns: result.columns,
        executionTime,
        cached: result.cached || false,
        database
      }
    };
  }

  private async loadQueryFromCatalog(queryName: string): Promise<{ sql: string; params: any }> {
    // Load from catalog (similar to how agents load)
    // This would integrate with the catalog system
  }

  private interpolateParams(sql: string, params: Record<string, any>): { sql: string; params: any[] } {
    // Convert named parameters (:paramName) to positional ($1, $2)
    // or keep named based on database type
  }

  private isWriteQuery(sql: string): boolean {
    const upperSQL = sql.trim().toUpperCase();
    return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)/.test(upperSQL);
  }

  private toCamelCase(rows: any[]): any[] {
    // Transform snake_case columns to camelCase
  }
}
```

#### B. Query Catalog Structure

```yaml
# catalog/queries/user-analytics.yml
name: user-analytics
type: queries
version: 1.0.0
description: Get user analytics aggregated by date

tags:
  - analytics
  - users
  - reporting

input:
  startDate:
    type: string
    required: true
    description: Start date (ISO format)

  endDate:
    type: string
    required: true
    description: End date (ISO format)

  planType:
    type: string
    required: false
    description: Filter by plan type

query: |
  SELECT
    DATE(created_at) as signup_date,
    COUNT(*) as user_count,
    COUNT(CASE WHEN plan_type = :planType THEN 1 END) as plan_users,
    SUM(CASE WHEN verified = true THEN 1 ELSE 0 END) as verified_users
  FROM users
  WHERE created_at BETWEEN :startDate AND :endDate
  {{#if planType}}
    AND plan_type = :planType
  {{/if}}
  GROUP BY DATE(created_at)
  ORDER BY signup_date DESC

config:
  database: analytics
  cacheTTL: 3600
  maxRows: 1000
  readOnly: true
  transform: camelCase

examples:
  - name: Weekly signups
    input:
      startDate: '2024-01-01'
      endDate: '2024-01-07'
    output:
      rows:
        - signupDate: '2024-01-07'
          userCount: 42
          planUsers: 12
          verifiedUsers: 38
```

#### C. Usage in Agents

**Example 1: Simple Query**

```yaml
# catalog/agents/report-generator.yml
name: report-generator
steps:
  - name: fetch-data
    member: queries
    input:
      queryName: user-analytics
      input:
        startDate: "{{ context.startDate }}"
        endDate: "{{ context.endDate }}"
    config:
      database: analytics
```

**Example 2: Chained Queries**

```yaml
# catalog/agents/customer-insights.yml
name: customer-insights
steps:
  - name: get-recent-customers
    member: queries
    input:
      queryName: recent-customers
      input:
        days: 30
    output: customers

  - name: get-customer-orders
    member: queries
    input:
      sql: |
        SELECT * FROM orders
        WHERE customer_id = ANY(:customerIds)
      input:
        customerIds: "{{ customers.rows | map('id') }}"
    config:
      database: production

  - name: analyze-sentiment
    member: validate
    input:
      content: "{{ orders.rows | map('feedback') }}"
      evalType: nlp
```

#### D. Multi-Database Support

**Env Configuration:**

```toml
# wrangler.toml
[env.production]
[[env.production.hyperdrive]]
binding = "PROD_DB"
id = "xxxx"
database = "production"

[[env.production.hyperdrive]]
binding = "ANALYTICS_DB"
id = "yyyy"
database = "analytics"

[[env.production.hyperdrive]]
binding = "DATA_WAREHOUSE"
id = "zzzz"
database = "warehouse"
```

**Query Usage:**

```typescript
// Query production DB
const users = await members.queries({
  queryName: 'active-users',
  database: 'PROD_DB'
});

// Query analytics DB
const metrics = await members.queries({
  queryName: 'daily-metrics',
  database: 'ANALYTICS_DB'
});

// Federated query (multiple DBs)
const combined = await members.queries({
  queryName: 'cross-database-report',
  databases: ['PROD_DB', 'ANALYTICS_DB']
});
```

---

## 3. Integration with Existing Systems

### A. Memory Integration

**Analytical Memory as 5th Tier:**

```typescript
// In agent execution
const memory = new MemoryManager(env, {
  layers: {
    working: true,
    session: true,
    longTerm: true,
    semantic: true,
    analytical: true // ← NEW
  },
  analyticalConfig: {
    databases: {
      production: { binding: env.PROD_DB, type: 'postgres' },
      analytics: { binding: env.ANALYTICS_DB, type: 'postgres' },
      warehouse: { binding: env.DATA_WAREHOUSE, type: 'postgres' }
    },
    defaultDatabase: 'production'
  }
});

// Use analytical memory
const results = await memory.queryAnalytical(
  'SELECT * FROM users WHERE id = $1',
  [userId],
  'production'
);
```

### B. RAG Member Integration

**Enhanced RAG with Analytical Memory:**

```yaml
# catalog/members/enhanced-rag.yml
name: enhanced-rag
steps:
  # 1. Query structured data
  - name: query-facts
    member: queries
    input:
      queryName: user-facts
      input:
        userId: "{{ context.userId }}"

  # 2. Search semantic memory
  - name: search-knowledge
    member: rag
    input:
      operation: search
      query: "{{ context.question }}"
      namespace: user-docs

  # 3. Combine and generate
  - name: generate-answer
    member: fetch  # Or LLM member
    input:
      prompt: |
        Facts: {{ query-facts.rows }}
        Knowledge: {{ search-knowledge.results }}
        Question: {{ context.question }}
```

### C. Validation with Queries

**Data Quality Checks:**

```yaml
# catalog/queries/data-quality-check.yml
name: data-quality-check
query: |
  SELECT
    'missing_emails' as check_name,
    COUNT(*) as issue_count
  FROM users
  WHERE email IS NULL OR email = ''

  UNION ALL

  SELECT
    'duplicate_emails',
    COUNT(*) - COUNT(DISTINCT email)
  FROM users
  WHERE email IS NOT NULL
```

---

## 4. Benefits

### Queries as First-Class Citizens

1. **Reusability**
   - Store queries in catalog
   - Version control
   - Share across agents/ensembles

2. **Maintainability**
   - Centralized query management
   - Easy to update
   - Type-safe inputs

3. **Composability**
   - Chain with other members
   - Use in workflows
   - Combine with RAG, validation, etc.

4. **Observability**
   - Track query execution
   - Monitor performance
   - Cache hit rates

5. **Safety**
   - Parameter validation
   - Read-only modes
   - Query timeouts
   - Row limits

### Hyperdrive as Memory Tier

1. **Unified Interface**
   - Same API as other memory layers
   - Integrated with MemoryManager
   - Consistent error handling

2. **Performance**
   - Edge caching
   - Connection pooling
   - Low latency

3. **Flexibility**
   - Multiple databases
   - Different database types
   - Cross-database queries

4. **Scalability**
   - Handles high query volume
   - Efficient connection management
   - Cloudflare's infrastructure

---

## 5. Implementation Plan

### Phase 1: Hyperdrive Storage

1. Create `HyperdriveRepository` class
2. Add connection management
3. Implement query execution
4. Add transaction support
5. Test with Postgres/MySQL

### Phase 2: Analytical Memory

1. Create `AnalyticalMemory` class
2. Integrate with `MemoryManager`
3. Add multi-database support
4. Implement caching layer
5. Add federation (cross-DB queries)

### Phase 3: Queries Member

1. Create `QueriesMember` class
2. Implement catalog integration
3. Add parameter interpolation
4. Build query validation
5. Add result transformation

### Phase 4: Catalog Integration

1. Define query catalog schema
2. Add query loader
3. Implement versioning
4. Add validation
5. Create examples

### Phase 5: Documentation & Examples

1. Write usage guides
2. Create example queries
3. Document best practices
4. Add security guidelines
5. Create migration guide

---

## 6. Example Use Cases

### Use Case 1: Customer Support Agent

```yaml
name: support-agent
description: AI agent with access to customer data

memory:
  layers:
    working: true
    session: true
    analytical: true
  analyticalConfig:
    databases:
      production: { binding: PROD_DB }

steps:
  # Get customer info
  - name: fetch-customer
    member: queries
    input:
      queryName: customer-profile
      input:
        customerId: "{{ context.customerId }}"

  # Get recent orders
  - name: fetch-orders
    member: queries
    input:
      queryName: recent-orders
      input:
        customerId: "{{ context.customerId }}"
        days: 90

  # Get support tickets
  - name: fetch-tickets
    member: queries
    input:
      queryName: support-history
      input:
        customerId: "{{ context.customerId }}"

  # Generate response
  - name: generate-response
    member: fetch
    input:
      url: "{{ llmEndpoint }}"
      method: POST
      body:
        prompt: |
          Customer: {{ fetch-customer.rows[0] }}
          Orders: {{ fetch-orders.rows }}
          Tickets: {{ fetch-tickets.rows }}
          Question: {{ context.question }}
```

### Use Case 2: Analytics Dashboard

```yaml
name: analytics-dashboard
description: Real-time analytics from multiple sources

steps:
  # User metrics
  - name: user-metrics
    member: queries
    input:
      queryName: user-growth-metrics
      input:
        startDate: "{{ context.startDate }}"
        endDate: "{{ context.endDate }}"
    config:
      database: ANALYTICS_DB

  # Revenue metrics
  - name: revenue-metrics
    member: queries
    input:
      queryName: revenue-by-plan
      input:
        startDate: "{{ context.startDate }}"
        endDate: "{{ context.endDate }}"
    config:
      database: ANALYTICS_DB

  # Combine
  - name: combine-metrics
    member: fetch
    input:
      url: "{{ apiEndpoint }}/aggregate"
      method: POST
      body:
        users: "{{ user-metrics.rows }}"
        revenue: "{{ revenue-metrics.rows }}"
```

### Use Case 3: Data Pipeline

```yaml
name: data-sync-pipeline
description: Sync data between databases

steps:
  # Extract from source
  - name: extract
    member: queries
    input:
      queryName: incremental-users
      input:
        lastSyncTime: "{{ context.lastSync }}"
    config:
      database: PROD_DB

  # Transform
  - name: transform
    member: validate
    input:
      content: "{{ extract.rows }}"
      evalType: rule
      rules:
        - email_valid: "email contains '@'"
        - name_present: "name != null"

  # Load to warehouse
  - name: load
    member: queries
    input:
      sql: |
        INSERT INTO users_staging
        SELECT * FROM json_populate_recordset(null::users_staging, :data)
      input:
        data: "{{ transform.valid }}"
    config:
      database: DATA_WAREHOUSE
```

---

## 7. Security Considerations

### Query Validation

- Prevent SQL injection via parameterization
- Validate query patterns in catalog
- Enforce read-only for sensitive DBs

### Access Control

- Database-level permissions
- Query-level ACLs in catalog
- User/role-based access

### Audit Logging

- Log all query executions
- Track who executed what
- Monitor for suspicious patterns

---

## 8. Performance Considerations

### Caching Strategy

- Edge cache for frequent queries
- TTL-based invalidation
- Smart cache keys (query + params)

### Connection Pooling

- Leverage Hyperdrive pooling
- Efficient connection reuse
- Handle connection failures

### Query Optimization

- Analyze slow queries
- Suggest indexes
- Limit result set sizes

---

## Summary

**Hyperdrive + Queries Member = Powerful Data Access Layer**

1. **Hyperdrive** as 5th memory tier provides structured data access
2. **Queries** as first-class member makes SQL reusable and composable
3. **Catalog integration** treats queries like prompts
4. **Multi-database support** enables complex workflows
5. **Performance + Safety** via caching, validation, and limits

This design aligns perfectly with Conductor's philosophy of composable, edge-native workflows while adding powerful data access capabilities.
