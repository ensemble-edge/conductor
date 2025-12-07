/**
 * Info Command - Show project info and component counts
 *
 * This is the authoritative source for project statistics.
 * Ensemble CLI calls this via `npx @ensemble-edge/conductor info --json`
 *
 * Why "info" instead of "status"?
 * - Avoids conflict with potential git-related status commands
 * - Consistent naming across Conductor and Edgit CLIs
 * - Ensemble CLI uses "status" as a user-friendly alias
 *
 * Features:
 * - Counts agents, ensembles, and other components
 * - Shows security settings with actual defaults
 * - Shows projectId from conductor.config.ts
 * - Parses wrangler.toml for Cloudflare services
 * - Supports --json output for programmatic access
 */
import { Command } from 'commander';
export declare function createInfoCommand(): Command;
//# sourceMappingURL=info.d.ts.map