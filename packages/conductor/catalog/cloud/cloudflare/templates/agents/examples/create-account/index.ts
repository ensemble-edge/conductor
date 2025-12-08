/**
 * Create Account Agent
 *
 * This agent handles user account creation for the registration flow.
 * It's used by the user-registration ensemble after username validation passes.
 *
 * CUSTOMIZATION:
 *   Replace the mock implementation with your actual account creation logic.
 *   Important considerations:
 *   1. ALWAYS hash passwords before storage (use bcrypt, argon2, etc.)
 *   2. Generate secure verification tokens (use crypto.randomUUID or similar)
 *   3. Store user data in your database (D1, KV, external DB)
 *   4. Consider adding email uniqueness validation
 *   5. Log account creation events for audit purposes
 *
 * SECURITY NOTES:
 *   - Never store plain-text passwords
 *   - Use prepared statements to prevent SQL injection
 *   - Validate all input data
 *   - Rate limit account creation to prevent abuse
 */

import type { AgentExecutionContext } from '@ensemble-edge/conductor';

interface CreateAccountInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
}

interface CreateAccountOutput {
  created: boolean;
  userId: string;
  verificationToken: string;
  message: string;
  error?: string;
}

/**
 * Generate a unique user ID.
 * In production, use your database's auto-increment or UUID generation.
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a secure verification token for email confirmation.
 * In production, use crypto.randomUUID() or a secure token library.
 */
function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Hash a password for secure storage.
 * This is a PLACEHOLDER - use a proper hashing library in production!
 *
 * In production, use one of:
 * - bcrypt: `await bcrypt.hash(password, 12)`
 * - argon2: `await argon2.hash(password)`
 * - Web Crypto API with PBKDF2
 */
async function hashPassword(password: string): Promise<string> {
  // ============================================================
  // WARNING: This is NOT secure! Replace with proper hashing!
  // ============================================================
  //
  // Example with bcrypt:
  // import bcrypt from 'bcryptjs'
  // return await bcrypt.hash(password, 12)
  //
  // Example with Web Crypto API (PBKDF2):
  // const encoder = new TextEncoder()
  // const keyMaterial = await crypto.subtle.importKey(
  //   'raw',
  //   encoder.encode(password),
  //   'PBKDF2',
  //   false,
  //   ['deriveBits']
  // )
  // const salt = crypto.getRandomValues(new Uint8Array(16))
  // const derivedBits = await crypto.subtle.deriveBits(
  //   { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  //   keyMaterial,
  //   256
  // )
  // return Buffer.from(derivedBits).toString('hex')
  //
  // ============================================================

  // Mock implementation - just returns a placeholder
  return `hashed_${password.length}_chars`;
}

/**
 * Create a new user account.
 */
export default async function createAccount(context: AgentExecutionContext): Promise<CreateAccountOutput> {
  const input = context.input as CreateAccountInput;
  const { username, email, password, firstName, lastName, dateOfBirth, country } = input;

  // Validate required fields
  if (!username || !email || !password) {
    return {
      created: false,
      userId: '',
      verificationToken: '',
      message: 'Account creation failed',
      error: 'Missing required fields: username, email, and password are required',
    };
  }

  try {
    // Generate unique identifiers
    const userId = generateUserId();
    const verificationToken = generateVerificationToken();

    // Hash the password (IMPORTANT: Use proper hashing in production!)
    const passwordHash = await hashPassword(password);

    // ============================================================
    // MOCK IMPLEMENTATION - Replace with your database operations
    // ============================================================
    //
    // Example with D1 Database:
    // await context.env.DB.prepare(`
    //   INSERT INTO users (
    //     id, username, email, password_hash,
    //     first_name, last_name, date_of_birth, country,
    //     verification_token, email_verified, created_at
    //   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `).bind(
    //   userId, username, email, passwordHash,
    //   firstName, lastName, dateOfBirth, country,
    //   verificationToken, false, new Date().toISOString()
    // ).run()
    //
    // Example with KV Store:
    // await context.env.USERS_KV.put(`user:${userId}`, JSON.stringify({
    //   id: userId,
    //   username,
    //   email,
    //   passwordHash,
    //   firstName,
    //   lastName,
    //   dateOfBirth,
    //   country,
    //   verificationToken,
    //   emailVerified: false,
    //   createdAt: new Date().toISOString(),
    // }))
    // // Also create lookup indexes
    // await context.env.USERS_KV.put(`username:${username}`, userId)
    // await context.env.USERS_KV.put(`email:${email}`, userId)
    //
    // ============================================================

    // Mock: Log the account creation (in production, save to database)
    console.log('[create-account] Mock account created:', {
      userId,
      username,
      email,
      firstName,
      lastName,
      country,
      // Never log passwords or hashes!
    });

    return {
      created: true,
      userId,
      verificationToken,
      message: `Account created successfully for ${username}`,
    };
  } catch (error) {
    console.error('[create-account] Error creating account:', error);

    return {
      created: false,
      userId: '',
      verificationToken: '',
      message: 'Account creation failed',
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
