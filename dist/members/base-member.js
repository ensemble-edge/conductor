/**
 * Base Member class
 *
 * Foundation for all member types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */
/**
 * Base class for all member types
 */
export class BaseMember {
    constructor(config) {
        this.config = config;
        this.name = config.name;
        this.type = config.type;
    }
    /**
     * Execute the member with given input and context
     * @param context - Execution context
     * @returns Member response
     */
    async execute(context) {
        const startTime = Date.now();
        try {
            // Perform the actual work (implemented by subclasses)
            const result = await this.run(context);
            const executionTime = Date.now() - startTime;
            return this.wrapSuccess(result, executionTime, false);
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return this.wrapError(error, executionTime);
        }
    }
    /**
     * Wrap successful execution result
     * @param data - Result data
     * @param executionTime - Time taken in milliseconds
     * @param cached - Whether result was cached
     * @returns Wrapped response
     */
    wrapSuccess(data, executionTime, cached = false) {
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
            cached,
            executionTime,
            metadata: {
                member: this.name,
                type: this.type,
            },
        };
    }
    /**
     * Wrap error response
     * @param error - Error object
     * @param executionTime - Time taken in milliseconds
     * @returns Wrapped error response
     */
    wrapError(error, executionTime) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            cached: false,
            executionTime,
            metadata: {
                member: this.name,
                type: this.type,
            },
        };
    }
    /**
     * Generate cache key for this member's execution
     * @param input - Input data
     * @returns Cache key string
     */
    async generateCacheKey(input) {
        // Create a stable string representation of input
        const inputString = JSON.stringify(this.sortObjectKeys(input));
        // SHA-256 hash for cache key
        const hash = await this.hashString(inputString);
        return `member:${this.name}:${hash}`;
    }
    /**
     * Sort object keys recursively for stable stringification
     * @param obj - Object to sort
     * @returns Sorted object
     */
    sortObjectKeys(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sortObjectKeys(item));
        }
        const sorted = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sorted[key] = this.sortObjectKeys(obj[key]);
        }
        return sorted;
    }
    /**
     * Cryptographically secure SHA-256 hash function
     * @param str - String to hash
     * @returns Hash value (hex string)
     */
    async hashString(str) {
        // Encode string to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        // Calculate SHA-256 hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        // Return first 16 chars for reasonable key length
        return hashHex.substring(0, 16);
    }
    /**
     * Get member configuration
     * @returns Member configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get member name
     * @returns Member name
     */
    getName() {
        return this.name;
    }
    /**
     * Get member type
     * @returns Member type
     */
    getType() {
        return this.type;
    }
}
