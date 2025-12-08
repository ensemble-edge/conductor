/**
 * Check Username Availability Agent
 *
 * This agent checks if a username is available for registration.
 * It's used by the user-registration ensemble to validate usernames
 * before allowing account creation.
 *
 * CUSTOMIZATION:
 *   Replace the mock implementation below with your actual database lookup.
 *   Examples:
 *   - D1 Database: `await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first()`
 *   - KV Store: `await env.USERS_KV.get(`user:${username}`)`
 *   - External API: `await fetch('https://api.example.com/users/check', { ... })`
 */

import type { AgentExecutionContext } from '@ensemble-edge/conductor';

interface CheckUsernameOutput {
  available: boolean;
  message: string;
  suggestions?: string[];
}

/**
 * Mock list of "taken" usernames for demonstration purposes.
 * In production, replace this with a database query.
 */
const MOCK_TAKEN_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'test', 'user', 'demo',
  'support', 'help', 'info', 'contact', 'sales', 'billing', 'api',
  'www', 'mail', 'email',
]);

/**
 * Reserved username patterns that should never be allowed.
 * These are checked regardless of database state.
 */
const RESERVED_PATTERNS = [
  /^admin/i, /^support/i, /^help/i, /^system/i,
  /^root/i, /^moderator/i, /^staff/i,
];

/**
 * Generate alternative username suggestions based on the requested username.
 */
function generateSuggestions(username: string): string[] {
  const base = username.toLowerCase();
  return [
    `${base}${Math.floor(Math.random() * 1000)}`,
    `${base}_${Math.floor(Math.random() * 100)}`,
    `${base}${new Date().getFullYear()}`,
  ];
}

/**
 * Check if a username is available for registration.
 *
 * @param context - The execution context (contains env bindings, input, etc.)
 * @returns Object indicating availability and any suggestions
 */
export default async function checkUsername(context: AgentExecutionContext): Promise<CheckUsernameOutput> {
  const username = (context.input as any)?.username || '';

  // Validate input
  if (!username || typeof username !== 'string') {
    return {
      available: false,
      message: 'Username is required',
    };
  }

  const normalizedUsername = username.toLowerCase().trim();

  // Check against reserved patterns
  for (const pattern of RESERVED_PATTERNS) {
    if (pattern.test(normalizedUsername)) {
      return {
        available: false,
        message: 'This username is reserved and cannot be used',
        suggestions: generateSuggestions(normalizedUsername),
      };
    }
  }

  // ============================================================
  // MOCK IMPLEMENTATION - Replace with your database lookup
  // ============================================================
  //
  // Example with D1 Database:
  // const existing = await context.env.DB
  //   .prepare('SELECT 1 FROM users WHERE LOWER(username) = LOWER(?)')
  //   .bind(username)
  //   .first()
  //
  // Example with KV Store:
  // const existing = await context.env.USERS_KV.get(`username:${normalizedUsername}`)
  //
  // Example with external API:
  // const response = await fetch(`https://api.example.com/users/check/${username}`)
  // const existing = await response.json()
  //
  // ============================================================

  const isTaken = MOCK_TAKEN_USERNAMES.has(normalizedUsername);

  if (isTaken) {
    return {
      available: false,
      message: `The username "${username}" is already taken`,
      suggestions: generateSuggestions(normalizedUsername),
    };
  }

  return {
    available: true,
    message: `The username "${username}" is available`,
  };
}
