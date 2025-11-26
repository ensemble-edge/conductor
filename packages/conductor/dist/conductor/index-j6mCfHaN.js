import { b as BaseAgent } from "./worker-entry-mkMpvQww.js";
class QueriesMember extends BaseAgent {
  constructor(config, env) {
    super(config);
    this.env = env;
    const cfg = config.config;
    this.queriesConfig = {
      defaultDatabase: cfg?.defaultDatabase,
      cacheTTL: cfg?.cacheTTL,
      maxRows: cfg?.maxRows,
      timeout: cfg?.timeout,
      readOnly: cfg?.readOnly !== void 0 ? cfg.readOnly : false,
      transform: cfg?.transform || "none",
      includeMetadata: cfg?.includeMetadata !== void 0 ? cfg.includeMetadata : true
    };
  }
  async run(context) {
    const input = context.input;
    if (!input.queryName && !input.sql) {
      throw new Error("Either queryName or sql must be provided");
    }
    if (input.queryName && input.sql) {
      throw new Error("Cannot specify both queryName and sql");
    }
    const query = input.queryName ? await this.loadQueryFromCatalog(input.queryName) : { sql: input.sql, params: {}, database: input.database };
    const database = input.database || query.database || this.queriesConfig.defaultDatabase;
    if (!database) {
      throw new Error("No database specified and no default database configured");
    }
    const hyperdrive = this.env[database];
    if (!hyperdrive) {
      throw new Error(`Hyperdrive binding not found: ${database}`);
    }
    if (this.queriesConfig.readOnly && this.isWriteQuery(query.sql)) {
      throw new Error("Write operations not allowed in read-only mode");
    }
    const { sql, params } = this.prepareQuery(query.sql, input.input || query.params || {});
    const startTime = Date.now();
    const result = await this.executeQuery(hyperdrive, sql, params);
    const executionTime = Date.now() - startTime;
    let rows = result.rows;
    if (this.queriesConfig.transform === "camelCase") {
      rows = this.toCamelCase(rows);
    } else if (this.queriesConfig.transform === "snakeCase") {
      rows = this.toSnakeCase(rows);
    }
    if (this.queriesConfig.maxRows && rows.length > this.queriesConfig.maxRows) {
      rows = rows.slice(0, this.queriesConfig.maxRows);
    }
    const output = {
      rows,
      count: rows.length,
      metadata: {
        columns: result.columns || [],
        executionTime,
        cached: false,
        // TODO: Implement caching
        database,
        ...this.queriesConfig.includeMetadata && { query: sql }
      }
    };
    return output;
  }
  /**
   * Load query from catalog
   */
  async loadQueryFromCatalog(queryName) {
    throw new Error(
      `Query catalog not yet implemented. Use inline SQL with 'sql' parameter instead of 'queryName'.`
    );
  }
  /**
   * Prepare query with parameters
   */
  prepareQuery(sql, input) {
    if (Array.isArray(input)) {
      return { sql, params: input };
    }
    const params = [];
    let paramIndex = 1;
    const convertedSql = sql.replace(/:(\w+)/g, (match, paramName) => {
      if (!(paramName in input)) {
        throw new Error(`Missing parameter: ${paramName}`);
      }
      params.push(input[paramName]);
      return `$${paramIndex++}`;
    });
    return { sql: convertedSql, params };
  }
  /**
   * Execute query via Hyperdrive/D1
   */
  async executeQuery(hyperdrive, sql, params) {
    let stmt = hyperdrive.prepare(sql);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    const executePromise = stmt.all();
    const result = this.queriesConfig.timeout ? await Promise.race([
      executePromise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Query timeout")), this.queriesConfig.timeout)
      )
    ]) : await executePromise;
    const columns = result.results.length > 0 ? Object.keys(result.results[0]) : result.meta?.columns ? result.meta.columns.map((c) => c.name) : [];
    return {
      rows: result.results,
      columns
    };
  }
  /**
   * Check if query is a write operation
   */
  isWriteQuery(sql) {
    const upperSQL = sql.trim().toUpperCase();
    return /^(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE)/i.test(upperSQL);
  }
  /**
   * Transform object keys to camelCase
   */
  toCamelCase(rows) {
    return rows.map((row) => {
      const transformed = {};
      for (const [key, value] of Object.entries(row)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformed[camelKey] = value;
      }
      return transformed;
    });
  }
  /**
   * Transform object keys to snake_case
   */
  toSnakeCase(rows) {
    return rows.map((row) => {
      const transformed = {};
      for (const [key, value] of Object.entries(row)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        transformed[snakeKey] = value;
      }
      return transformed;
    });
  }
}
export {
  QueriesMember
};
//# sourceMappingURL=index-j6mCfHaN.js.map
