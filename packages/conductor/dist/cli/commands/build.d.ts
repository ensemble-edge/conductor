/**
 * Build Command
 *
 * Run build triggers for ensembles.
 * Ensembles with `trigger: [{ type: build }]` will be executed at build time.
 *
 * Usage:
 *   conductor build              - Run all build triggers
 *   conductor build --filter docs - Run only 'docs' ensemble
 *   conductor build --dry-run    - Show what would run without executing
 */
import { Command } from 'commander';
export declare function createBuildCommand(): Command;
//# sourceMappingURL=build.d.ts.map