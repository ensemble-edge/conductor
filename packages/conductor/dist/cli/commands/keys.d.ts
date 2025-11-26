/**
 * API Key Management CLI Commands
 *
 * Commands for generating, listing, and managing API keys.
 * Keys are stored in Cloudflare KV for use with the built-in API key auth provider.
 *
 * Usage:
 *   conductor keys generate --name "my-key" --permissions "ensemble:*:execute"
 *   conductor keys list
 *   conductor keys revoke <key-id>
 *   conductor keys info <key-id>
 *   conductor keys rotate <key-id>
 */
/**
 * API Key metadata stored in KV
 */
export interface ApiKeyRecord {
    /** Unique key identifier */
    keyId: string;
    /** Human-readable name */
    name: string;
    /** Hashed key (we don't store plaintext) */
    keyHash: string;
    /** Key prefix (for identification) */
    keyPrefix: string;
    /** User/service this key belongs to */
    userId?: string;
    /** Permissions granted to this key */
    permissions: string[];
    /** Creation timestamp */
    createdAt: number;
    /** Expiration timestamp (null = never expires) */
    expiresAt: number | null;
    /** Whether key is active */
    active: boolean;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Key generation options
 */
export interface GenerateKeyOptions {
    name: string;
    permissions?: string[];
    expires?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Generate a new API key
 *
 * @param options Key generation options
 * @returns The generated key (only shown once) and its metadata
 */
export declare function generateApiKey(options: GenerateKeyOptions): {
    key: string;
    keyId: string;
    record: ApiKeyRecord;
};
/**
 * Verify a key against its hash
 */
export declare function verifyKey(key: string, hash: string): boolean;
/**
 * Format expiration for display
 */
export declare function formatExpiration(expiresAt: number | null): string;
/**
 * Check if a key is expired
 */
export declare function isKeyExpired(record: ApiKeyRecord): boolean;
/**
 * Format permissions for display
 */
export declare function formatPermissions(permissions: string[]): string;
/**
 * CLI command handlers
 */
export declare const keysCommands: {
    /**
     * Generate a new API key
     */
    generate: (args: {
        name: string;
        permissions?: string;
        expires?: string;
        userId?: string;
        json?: boolean;
    }) => Promise<{
        key: string;
        keyId: string;
        record: ApiKeyRecord;
    }>;
    /**
     * List all keys (shows metadata only, not the keys themselves)
     */
    list: (args: {
        json?: boolean;
    }) => Promise<void>;
    /**
     * Revoke a key
     */
    revoke: (args: {
        keyId: string;
        json?: boolean;
    }) => Promise<void>;
    /**
     * Show key info (without the key itself)
     */
    info: (args: {
        keyId: string;
        json?: boolean;
    }) => Promise<void>;
    /**
     * Rotate a key (generate new, show instructions to update)
     */
    rotate: (args: {
        keyId: string;
        json?: boolean;
    }) => Promise<{
        newKey: string;
    }>;
};
/**
 * CLI entry point for keys commands
 */
export declare function handleKeysCommand(subcommand: string, args: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=keys.d.ts.map