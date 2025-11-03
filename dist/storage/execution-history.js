/**
 * Execution History Storage
 *
 * Store and retrieve execution history for debugging.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Execution history manager
 */
export class ExecutionHistory {
    constructor(storagePath = './.conductor/history') {
        this.storagePath = storagePath;
    }
    /**
     * Initialize storage directory
     */
    async initialize() {
        await fs.mkdir(this.storagePath, { recursive: true });
    }
    /**
     * Store execution record
     */
    async store(record) {
        await this.initialize();
        const filePath = path.join(this.storagePath, `${record.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');
    }
    /**
     * Get execution record by ID
     */
    async get(executionId) {
        try {
            const filePath = path.join(this.storagePath, `${executionId}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /**
     * List all execution records
     */
    async list(options) {
        try {
            await this.initialize();
            const files = await fs.readdir(this.storagePath);
            const jsonFiles = files.filter((f) => f.endsWith('.json'));
            // Read all records
            const records = await Promise.all(jsonFiles.map(async (file) => {
                const content = await fs.readFile(path.join(this.storagePath, file), 'utf-8');
                return JSON.parse(content);
            }));
            // Filter
            let filtered = records;
            if (options?.type) {
                filtered = filtered.filter((r) => r.type === options.type);
            }
            if (options?.status) {
                filtered = filtered.filter((r) => r.status === options.status);
            }
            // Sort by timestamp (newest first)
            filtered.sort((a, b) => b.startTime - a.startTime);
            // Limit
            if (options?.limit) {
                filtered = filtered.slice(0, options.limit);
            }
            return filtered;
        }
        catch {
            return [];
        }
    }
    /**
     * Get logs for an execution
     */
    async getLogs(executionId) {
        const record = await this.get(executionId);
        return record?.logs || [];
    }
    /**
     * Get state snapshots for an execution
     */
    async getStateSnapshots(executionId) {
        const record = await this.get(executionId);
        return record?.stateSnapshots || [];
    }
    /**
     * Delete old execution records
     */
    async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) {
        try {
            const files = await fs.readdir(this.storagePath);
            const jsonFiles = files.filter((f) => f.endsWith('.json'));
            let deletedCount = 0;
            const now = Date.now();
            for (const file of jsonFiles) {
                const filePath = path.join(this.storagePath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const record = JSON.parse(content);
                // Delete if older than maxAge
                if (now - record.endTime > maxAge) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }
            return deletedCount;
        }
        catch {
            return 0;
        }
    }
}
/**
 * Generate unique execution ID
 */
export function generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
