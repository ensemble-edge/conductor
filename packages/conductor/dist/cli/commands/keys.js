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
import { randomBytes } from 'crypto';
/**
 * Generate a new API key
 *
 * @param options Key generation options
 * @returns The generated key (only shown once) and its metadata
 */
export function generateApiKey(options) {
    // Generate unique key ID
    const keyId = `key_${randomBytes(8).toString('hex')}`;
    // Generate the actual API key
    // Format: cnd_live_<32 random bytes as hex>
    const keyBytes = randomBytes(32);
    const key = `cnd_live_${keyBytes.toString('hex')}`;
    // Hash the key for storage (we never store plaintext keys)
    const keyHash = hashKey(key);
    // Parse expiration
    const expiresAt = parseExpiration(options.expires);
    // Create the record
    const record = {
        keyId,
        name: options.name,
        keyHash,
        keyPrefix: key.substring(0, 12), // Store prefix for identification
        userId: options.userId,
        permissions: options.permissions || ['*'], // Default to full access
        createdAt: Date.now(),
        expiresAt,
        active: true,
        metadata: options.metadata,
    };
    return { key, keyId, record };
}
/**
 * Hash an API key for secure storage
 */
function hashKey(key) {
    // Simple hash using built-in crypto
    // In production, use a proper key derivation function
    const { createHash } = require('crypto');
    return createHash('sha256').update(key).digest('hex');
}
/**
 * Verify a key against its hash
 */
export function verifyKey(key, hash) {
    return hashKey(key) === hash;
}
/**
 * Parse expiration string to timestamp
 */
function parseExpiration(expires) {
    if (!expires || expires === 'never') {
        return null;
    }
    const match = expires.match(/^(\d+)(d|w|m|y)$/);
    if (!match) {
        throw new Error(`Invalid expiration format: ${expires}. Use format like "30d", "90d", "1y", or "never"`);
    }
    const [, amount, unit] = match;
    const num = parseInt(amount, 10);
    const ms = {
        d: 24 * 60 * 60 * 1000, // days
        w: 7 * 24 * 60 * 60 * 1000, // weeks
        m: 30 * 24 * 60 * 60 * 1000, // months (approx)
        y: 365 * 24 * 60 * 60 * 1000, // years
    };
    return Date.now() + num * ms[unit];
}
/**
 * Format expiration for display
 */
export function formatExpiration(expiresAt) {
    if (!expiresAt) {
        return 'never';
    }
    const date = new Date(expiresAt);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
/**
 * Check if a key is expired
 */
export function isKeyExpired(record) {
    if (!record.expiresAt) {
        return false;
    }
    return Date.now() > record.expiresAt;
}
/**
 * Format permissions for display
 */
export function formatPermissions(permissions) {
    if (permissions.length === 1 && permissions[0] === '*') {
        return 'full access';
    }
    if (permissions.length > 3) {
        return `${permissions.slice(0, 3).join(', ')} (+${permissions.length - 3} more)`;
    }
    return permissions.join(', ');
}
/**
 * CLI command handlers
 */
export const keysCommands = {
    /**
     * Generate a new API key
     */
    generate: async (args) => {
        const permissions = args.permissions ? args.permissions.split(',').map((p) => p.trim()) : undefined;
        const { key, keyId, record } = generateApiKey({
            name: args.name,
            permissions,
            expires: args.expires || '90d',
            userId: args.userId,
        });
        if (args.json) {
            console.log(JSON.stringify({
                success: true,
                keyId,
                key, // Only shown in JSON output on generation
                name: record.name,
                permissions: record.permissions,
                expiresAt: record.expiresAt,
                createdAt: record.createdAt,
            }, null, 2));
        }
        else {
            console.log('\n✅ API Key generated\n');
            console.log(`Key ID:      ${keyId}`);
            console.log(`Key:         ${key}`);
            console.log(`Name:        ${record.name}`);
            console.log(`Permissions: ${formatPermissions(record.permissions)}`);
            console.log(`Expires:     ${formatExpiration(record.expiresAt)}`);
            console.log('\n⚠️  Save this key now - it won\'t be shown again!\n');
            console.log('To use this key, add it to your Cloudflare KV namespace:');
            console.log(`  wrangler kv:key put --namespace-id=<your-namespace-id> "${key}" '${JSON.stringify(record)}'`);
            console.log('');
        }
        return { key, keyId, record };
    },
    /**
     * List all keys (shows metadata only, not the keys themselves)
     */
    list: async (args) => {
        // Note: In a real implementation, this would read from KV
        // For CLI, we just show instructions
        if (args.json) {
            console.log(JSON.stringify({ message: 'Use wrangler to list keys from your KV namespace' }));
        }
        else {
            console.log('\n📋 API Key Management\n');
            console.log('To list keys, query your Cloudflare KV namespace:');
            console.log('  wrangler kv:key list --namespace-id=<your-namespace-id>');
            console.log('\nTo view a key\'s metadata:');
            console.log('  wrangler kv:key get --namespace-id=<your-namespace-id> "<key-prefix>..."');
            console.log('');
        }
    },
    /**
     * Revoke a key
     */
    revoke: async (args) => {
        if (args.json) {
            console.log(JSON.stringify({ message: `To revoke key ${args.keyId}, delete it from KV` }));
        }
        else {
            console.log('\n🔐 Revoke API Key\n');
            console.log(`To revoke key ${args.keyId}:`);
            console.log('  1. Find the key in your KV namespace');
            console.log('  2. Delete it: wrangler kv:key delete --namespace-id=<id> "<key>"');
            console.log('');
        }
    },
    /**
     * Show key info (without the key itself)
     */
    info: async (args) => {
        if (args.json) {
            console.log(JSON.stringify({ message: `Query your KV namespace for key ${args.keyId}` }));
        }
        else {
            console.log('\n🔍 API Key Info\n');
            console.log(`To view info for key ${args.keyId}:`);
            console.log('  wrangler kv:key get --namespace-id=<your-namespace-id> "<key>"');
            console.log('');
        }
    },
    /**
     * Rotate a key (generate new, show instructions to update)
     */
    rotate: async (args) => {
        // Generate a new key with the same ID prefix for identification
        const newKeyBytes = randomBytes(32);
        const newKey = `cnd_live_${newKeyBytes.toString('hex')}`;
        if (args.json) {
            console.log(JSON.stringify({
                message: `Rotation for ${args.keyId}`,
                newKey,
                instructions: 'Update your KV record with the new key hash',
            }));
        }
        else {
            console.log('\n🔄 Rotate API Key\n');
            console.log(`Old Key ID: ${args.keyId}`);
            console.log(`New Key:    ${newKey}`);
            console.log('\nTo complete rotation:');
            console.log('  1. Update the keyHash in your KV record');
            console.log('  2. Update your application with the new key');
            console.log('  3. The old key will stop working after KV update');
            console.log('\n⚠️  Save the new key now - it won\'t be shown again!\n');
        }
        return { newKey };
    },
};
/**
 * CLI entry point for keys commands
 */
export async function handleKeysCommand(subcommand, args) {
    switch (subcommand) {
        case 'generate':
            await keysCommands.generate(args);
            break;
        case 'list':
            await keysCommands.list(args);
            break;
        case 'revoke':
            await keysCommands.revoke(args);
            break;
        case 'info':
            await keysCommands.info(args);
            break;
        case 'rotate':
            await keysCommands.rotate(args);
            break;
        default:
            console.log(`\n🔑 Conductor API Key Management\n`);
            console.log('Commands:');
            console.log('  generate  Generate a new API key');
            console.log('  list      List all API keys');
            console.log('  revoke    Revoke an API key');
            console.log('  info      Show key information');
            console.log('  rotate    Rotate an API key');
            console.log('\nExamples:');
            console.log('  conductor keys generate --name "my-service" --permissions "ensemble:*:execute"');
            console.log('  conductor keys generate --name "admin" --permissions "*" --expires never');
            console.log('  conductor keys revoke key_abc123');
            console.log('');
    }
}
