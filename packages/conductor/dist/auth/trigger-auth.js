/**
 * Trigger Authentication Bridge
 *
 * Bridges trigger auth configuration (from YAML) to the unified auth provider system.
 * This allows triggers to use the same auth mechanisms as API routes.
 *
 * Features:
 * - Unified auth handling for HTTP, Webhook, and MCP triggers
 * - Support for bearer, signature, basic, and apiKey auth
 * - Automatic provider selection based on config
 * - Consistent auth context for all routes
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */
import { BearerValidator } from './providers/bearer.js';
import { createSignatureValidator, signaturePresets, } from './providers/signature.js';
import { BasicAuthValidator, createBasicValidator } from './providers/basic.js';
import { createApiKeyValidator } from './providers/apikey.js';
import { timingSafeEqual } from './utils/crypto.js';
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'trigger-auth' });
/**
 * Simple Bearer Token Validator
 *
 * Used when JWT_SECRET is not available - does simple token comparison.
 * This is the behavior triggers had before the bridge.
 */
class SimpleBearerValidator {
    constructor(secret) {
        this.secret = secret;
    }
    extractToken(request) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    async validate(request, _env) {
        const token = this.extractToken(request);
        if (!token) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
            };
        }
        // Use shared timing-safe comparison (HMAC-based for constant time)
        const isValid = await timingSafeEqual(token, this.secret);
        if (!isValid) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Invalid bearer token',
            };
        }
        return {
            valid: true,
            context: {
                authenticated: true,
                method: 'bearer',
                token,
            },
        };
    }
}
/**
 * Resolve environment variable references in a string
 *
 * Supports two syntaxes:
 * - $env.VAR_NAME (shorthand)
 * - ${env.VAR_NAME} (template syntax)
 *
 * @param value - The string potentially containing env var references
 * @param env - The environment object containing variable values
 * @returns The resolved string, or the original if no env var syntax found
 */
function resolveEnvSecret(value, env) {
    if (!value || typeof value !== 'string') {
        return value;
    }
    // Match $env.VAR_NAME (shorthand syntax)
    const shorthandMatch = value.match(/^\$env\.(\w+)$/);
    if (shorthandMatch) {
        const varName = shorthandMatch[1];
        const resolved = env?.[varName];
        if (resolved === undefined) {
            logger.warn(`Environment variable '${varName}' not found`, { varName });
        }
        return resolved ?? value;
    }
    // Match ${env.VAR_NAME} (template syntax)
    const templateMatch = value.match(/^\$\{env\.(\w+)\}$/);
    if (templateMatch) {
        const varName = templateMatch[1];
        const resolved = env?.[varName];
        if (resolved === undefined) {
            logger.warn(`Environment variable '${varName}' not found`, { varName });
        }
        return resolved ?? value;
    }
    return value;
}
/**
 * Get the appropriate auth validator based on trigger config
 */
export async function getValidatorForTrigger(config, env) {
    // Resolve environment variable references in the secret
    const resolvedSecret = resolveEnvSecret(config.secret, env);
    switch (config.type) {
        case 'bearer':
            // Use JWT validation if JWT_SECRET exists, otherwise simple token match
            if (env.JWT_SECRET) {
                return new BearerValidator({
                    secret: env.JWT_SECRET,
                    issuer: env.JWT_ISSUER,
                    audience: env.JWT_AUDIENCE,
                });
            }
            if (!resolvedSecret) {
                throw new Error('Bearer auth requires a secret');
            }
            return new SimpleBearerValidator(resolvedSecret);
        case 'signature':
            if (!resolvedSecret) {
                throw new Error('Signature auth requires a secret');
            }
            // Use preset if specified
            if (config.preset) {
                const presetConfig = signaturePresets[config.preset](resolvedSecret);
                return createSignatureValidator(presetConfig);
            }
            // Use custom config
            return createSignatureValidator({
                secret: resolvedSecret,
                algorithm: config.algorithm || 'sha256',
                signatureHeader: config.signatureHeader,
                timestampHeader: config.timestampHeader,
                timestampTolerance: config.timestampTolerance,
            });
        case 'basic':
            if (!resolvedSecret) {
                throw new Error('Basic auth requires credentials (format: username:password)');
            }
            return createBasicValidator({
                credentials: resolvedSecret,
                realm: config.realm,
            });
        case 'apiKey': {
            const validator = createApiKeyValidator(env);
            if (!validator) {
                throw new Error('API key auth requires API_KEYS KV namespace to be configured');
            }
            return validator;
        }
        case 'unkey': {
            // Use the Unkey validator for API key management
            const { createUnkeyValidator } = await import('./providers/unkey.js');
            const validator = createUnkeyValidator(env);
            if (!validator) {
                throw new Error('Unkey auth requires UNKEY_ROOT_KEY to be configured');
            }
            return validator;
        }
        default: {
            // TypeScript's exhaustive check - this handles runtime validation for unexpected types
            const unknownType = config.type;
            throw new Error(`Unknown trigger auth type: ${unknownType}`);
        }
    }
}
/**
 * Create auth middleware for triggers using the unified provider system
 *
 * This is the main entry point for trigger auth. It creates a Hono middleware
 * that validates authentication using the appropriate provider.
 *
 * @param authConfig - Auth configuration from trigger YAML
 * @param env - Environment bindings (for KV, secrets, etc.)
 * @returns Hono middleware function
 */
export function createTriggerAuthMiddleware(authConfig, env) {
    return async (c, next) => {
        const validator = await getValidatorForTrigger(authConfig, env);
        const request = c.req.raw;
        try {
            const result = await validator.validate(request, env);
            if (!result.valid) {
                // Build appropriate error response
                const status = result.error === 'expired' ? 401 : 401;
                const response = {
                    error: result.error || 'unauthorized',
                    message: result.message || 'Authentication failed',
                };
                // Add WWW-Authenticate header for basic auth
                if (authConfig.type === 'basic' && validator instanceof BasicAuthValidator) {
                    c.header('WWW-Authenticate', validator.getWWWAuthenticateHeader());
                }
                // Add rate limit info if available
                if (result.ratelimit) {
                    c.header('X-RateLimit-Remaining', result.ratelimit.remaining.toString());
                    c.header('X-RateLimit-Limit', result.ratelimit.limit.toString());
                    c.header('X-RateLimit-Reset', result.ratelimit.reset.toString());
                }
                return c.json(response, status);
            }
            // Store auth context for downstream handlers
            if (result.context) {
                c.set('auth', result.context);
                c.set('authenticated', true);
                if (result.context.user) {
                    c.set('user', result.context.user);
                    c.set('userId', result.context.user.id);
                }
                if (result.context.custom) {
                    c.set('authCustom', result.context.custom);
                }
            }
            await next();
        }
        catch (error) {
            // Handle validation errors gracefully
            logger.error('Validation error', error instanceof Error ? error : undefined, {
                authType: authConfig.type,
            });
            return c.json({
                error: 'auth_error',
                message: error instanceof Error ? error.message : 'Authentication error',
            }, 500);
        }
    };
}
/**
 * Validate trigger auth config
 *
 * Used during build/startup to catch configuration errors early.
 */
export function validateTriggerAuthConfig(config) {
    const errors = [];
    if (!config.type) {
        errors.push('Auth type is required');
        return errors;
    }
    const validTypes = ['bearer', 'signature', 'basic', 'apiKey', 'unkey'];
    if (!validTypes.includes(config.type)) {
        errors.push(`Invalid auth type: ${config.type}. Valid types: ${validTypes.join(', ')}`);
    }
    // Type-specific validation
    switch (config.type) {
        case 'bearer':
        case 'basic':
            if (!config.secret) {
                errors.push(`${config.type} auth requires a secret`);
            }
            break;
        case 'signature':
            if (!config.secret) {
                errors.push('signature auth requires a secret');
            }
            if (config.algorithm && !['sha256', 'sha1', 'sha384', 'sha512'].includes(config.algorithm)) {
                errors.push(`Invalid signature algorithm: ${config.algorithm}`);
            }
            if (config.preset && !['github', 'stripe', 'slack', 'default'].includes(config.preset)) {
                errors.push(`Invalid signature preset: ${config.preset}`);
            }
            break;
    }
    return errors;
}
