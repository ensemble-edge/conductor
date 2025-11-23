/**
 * Type-Safe Agent Execution Helpers
 *
 * Provides type-safe wrappers for each built-in agent.
 */
/**
 * Type-Safe Agent Execution Helpers
 */
export class MemberHelpers {
    constructor(client) {
        this.client = client;
    }
    /**
     * Execute fetch agent
     */
    async fetch(input, config) {
        return this.client.execute({
            agent: 'fetch',
            input,
            config,
        });
    }
    /**
     * Execute scrape agent
     */
    async scrape(input, config) {
        return this.client.execute({
            agent: 'scrape',
            input,
            config,
        });
    }
    /**
     * Execute validate agent
     */
    async validate(input, config) {
        return this.client.execute({
            agent: 'validate',
            input,
            config,
        });
    }
    /**
     * Execute RAG agent - index operation
     */
    async ragIndex(content, namespace, config) {
        return this.client.execute({
            agent: 'rag',
            input: { operation: 'index', content, namespace },
            config,
        });
    }
    /**
     * Execute RAG agent - search operation
     */
    async ragSearch(query, namespace, config) {
        return this.client.execute({
            agent: 'rag',
            input: { operation: 'search', query, namespace },
            config,
        });
    }
    /**
     * Execute HITL agent - request approval
     */
    async hitlRequest(approvalData, config) {
        return this.client.execute({
            agent: 'hitl',
            input: { operation: 'request', approvalData },
            config,
        });
    }
    /**
     * Execute HITL agent - respond to approval
     */
    async hitlRespond(approvalId, approved, feedback, config) {
        return this.client.execute({
            agent: 'hitl',
            input: { operation: 'respond', approvalId, approved, feedback },
            config,
        });
    }
    /**
     * Execute queries agent - from catalog
     */
    async queryCatalog(queryName, input, database, config) {
        return this.client.execute({
            agent: 'queries',
            input: { queryName, input, database },
            config,
        });
    }
    /**
     * Execute queries agent - inline SQL
     */
    async querySql(sql, params, database, config) {
        return this.client.execute({
            agent: 'queries',
            input: { sql, input: params, database },
            config,
        });
    }
    /**
     * Execute queries agent - generic
     */
    async queries(input, config) {
        return this.client.execute({
            agent: 'queries',
            input,
            config,
        });
    }
}
/**
 * Create agent helpers instance
 */
export function createMemberHelpers(client) {
    return new MemberHelpers(client);
}
