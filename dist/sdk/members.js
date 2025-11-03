/**
 * Type-Safe Member Execution Helpers
 *
 * Provides type-safe wrappers for each built-in member.
 */
/**
 * Type-Safe Member Execution Helpers
 */
export class MemberHelpers {
    constructor(client) {
        this.client = client;
    }
    /**
     * Execute fetch member
     */
    async fetch(input, config) {
        return this.client.execute({
            member: 'fetch',
            input,
            config,
        });
    }
    /**
     * Execute scrape member
     */
    async scrape(input, config) {
        return this.client.execute({
            member: 'scrape',
            input,
            config,
        });
    }
    /**
     * Execute validate member
     */
    async validate(input, config) {
        return this.client.execute({
            member: 'validate',
            input,
            config,
        });
    }
    /**
     * Execute RAG member - index operation
     */
    async ragIndex(content, namespace, config) {
        return this.client.execute({
            member: 'rag',
            input: { operation: 'index', content, namespace },
            config,
        });
    }
    /**
     * Execute RAG member - search operation
     */
    async ragSearch(query, namespace, config) {
        return this.client.execute({
            member: 'rag',
            input: { operation: 'search', query, namespace },
            config,
        });
    }
    /**
     * Execute HITL member - request approval
     */
    async hitlRequest(approvalData, config) {
        return this.client.execute({
            member: 'hitl',
            input: { operation: 'request', approvalData },
            config,
        });
    }
    /**
     * Execute HITL member - respond to approval
     */
    async hitlRespond(approvalId, approved, feedback, config) {
        return this.client.execute({
            member: 'hitl',
            input: { operation: 'respond', approvalId, approved, feedback },
            config,
        });
    }
    /**
     * Execute queries member - from catalog
     */
    async queryCatalog(queryName, input, database, config) {
        return this.client.execute({
            member: 'queries',
            input: { queryName, input, database },
            config,
        });
    }
    /**
     * Execute queries member - inline SQL
     */
    async querySql(sql, params, database, config) {
        return this.client.execute({
            member: 'queries',
            input: { sql, input: params, database },
            config,
        });
    }
    /**
     * Execute queries member - generic
     */
    async queries(input, config) {
        return this.client.execute({
            member: 'queries',
            input,
            config,
        });
    }
}
/**
 * Create member helpers instance
 */
export function createMemberHelpers(client) {
    return new MemberHelpers(client);
}
