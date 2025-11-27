/**
 * Run Command
 *
 * Run CLI-triggered ensembles by command name.
 * Ensembles with `trigger: [{ type: cli, command: <name> }]` can be run via CLI.
 *
 * Usage:
 *   conductor run <command>              - Run a CLI-triggered ensemble
 *   conductor run <command> --opt value  - Pass options to the ensemble
 *   conductor run --list                 - List all available CLI commands
 *
 * Example ensemble with CLI trigger:
 *   trigger:
 *     - type: cli
 *       command: docs-generate
 *       description: Generate documentation
 *       options:
 *         - name: format
 *           type: string
 *           default: html
 *         - name: output
 *           type: string
 *           required: true
 */
import { Command } from 'commander';
export declare function createRunCommand(): Command;
//# sourceMappingURL=run.d.ts.map