/**
 * CLI Members Command
 *
 * List and inspect members.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getBuiltInRegistry } from '../../members/built-in/registry.js';
import { createClient } from '../../sdk/client.js';

export function createMembersCommand(): Command {
	const members = new Command('members').description('Manage and inspect members');

	// List members
	members
		.command('list')
		.description('List all available members')
		.option('--remote', 'List from API instead of local')
		.option('--api-url <url>', 'API URL (default: from CONDUCTOR_API_URL env)')
		.option('--api-key <key>', 'API key (default: from CONDUCTOR_API_KEY env)')
		.option('--output <format>', 'Output format: json, table, or simple (default: table)', 'table')
		.action(async (options: Record<string, unknown>) => {
			try {
				let membersList: Array<Record<string, unknown>>;

				if (options.remote as boolean) {
					// Get from API
					const apiUrl = (options.apiUrl as string) || process.env.CONDUCTOR_API_URL;
					const apiKey = (options.apiKey as string | undefined) || process.env.CONDUCTOR_API_KEY;

					if (!apiUrl) {
						console.error(
							chalk.red('Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url')
						);
						process.exit(1);
					}

					const client = createClient({ baseUrl: apiUrl, apiKey });
					membersList = (await client.listMembers()) as unknown as Array<Record<string, unknown>>;
				} else {
					// Get from local registry
					const registry = getBuiltInRegistry();
					const builtInMembers = registry.list();
					membersList = builtInMembers.map((m) => ({
						name: m.name,
						type: m.type,
						version: m.version,
						description: m.description,
						builtIn: true
					}));
				}

				// Output
				if (options.output === 'json') {
					console.log(JSON.stringify(membersList, null, 2));
				} else if (options.output === 'simple') {
					membersList.forEach((m) => console.log(m.name as string));
				} else {
					// Table output
					console.log('');
					console.log(chalk.bold('Available Members:'));
					console.log('');
					membersList.forEach((m) => {
						console.log(
							`${chalk.cyan((m.name as string).padEnd(15))} ${chalk.dim((m.type as string).padEnd(10))} ${(m.description as string | undefined) || ''}`
						);
					});
					console.log('');
					console.log(chalk.dim(`Total: ${membersList.length} members`));
				}
			} catch (error) {
				console.error(chalk.red('Error:'), (error as Error).message);
				process.exit(1);
			}
		});

	// Info command
	members
		.command('info')
		.description('Get detailed information about a member')
		.argument('<name>', 'Member name')
		.option('--remote', 'Get info from API instead of local')
		.option('--api-url <url>', 'API URL (default: from CONDUCTOR_API_URL env)')
		.option('--api-key <key>', 'API key (default: from CONDUCTOR_API_KEY env)')
		.option('--output <format>', 'Output format: json or pretty (default: pretty)', 'pretty')
		.action(async (memberName: string, options: Record<string, unknown>) => {
			try {
				let memberInfo: Record<string, unknown>;

				if (options.remote as boolean) {
					// Get from API
					const apiUrl = (options.apiUrl as string) || process.env.CONDUCTOR_API_URL;
					const apiKey = (options.apiKey as string | undefined) || process.env.CONDUCTOR_API_KEY;

					if (!apiUrl) {
						console.error(
							chalk.red('Error: API URL not configured. Set CONDUCTOR_API_URL or use --api-url')
						);
						process.exit(1);
					}

					const client = createClient({ baseUrl: apiUrl, apiKey });
					memberInfo = (await client.getMember(memberName)) as unknown as Record<string, unknown>;
				} else {
					// Get from local registry
					const registry = getBuiltInRegistry();

					if (!registry.isBuiltIn(memberName)) {
						console.error(chalk.red(`Error: Member not found: ${memberName}`));
						process.exit(1);
					}

					const metadata = registry.getMetadata(memberName);
					memberInfo = {
						name: metadata!.name,
						type: metadata!.type,
						version: metadata!.version,
						description: metadata!.description,
						builtIn: true,
						config: {
							schema: metadata!.configSchema,
							defaults: {}
						},
						input: {
							schema: metadata!.inputSchema,
							examples: metadata!.examples
						},
						output: {
							schema: metadata!.outputSchema
						},
						tags: metadata!.tags,
						documentation: metadata!.documentation
					};
				}

				// Output
				if (options.output === 'json') {
					console.log(JSON.stringify(memberInfo, null, 2));
				} else {
					// Pretty output
					console.log('');
					console.log(chalk.bold.cyan(memberInfo.name as string));
					console.log(chalk.dim(`Version: ${memberInfo.version as string}`));
					console.log('');
					console.log(chalk.bold('Description:'));
					console.log((memberInfo.description as string | undefined) || 'No description');
					console.log('');

					const tags = memberInfo.tags as string[] | undefined;
					if (tags && tags.length > 0) {
						console.log(chalk.bold('Tags:'));
						console.log(tags.join(', '));
						console.log('');
					}

					const input = memberInfo.input as Record<string, unknown> | undefined;
					if (input?.schema) {
						console.log(chalk.bold('Input Schema:'));
						console.log(JSON.stringify(input.schema, null, 2));
						console.log('');
					}

					const examples = input?.examples as unknown[] | undefined;
					if (examples && examples.length > 0) {
						console.log(chalk.bold('Examples:'));
						examples.forEach((example: unknown, i: number) => {
							console.log(chalk.dim(`Example ${i + 1}:`));
							console.log(JSON.stringify(example, null, 2));
						});
						console.log('');
					}

					const config = memberInfo.config as Record<string, unknown> | undefined;
					if (config?.schema) {
						console.log(chalk.bold('Config Schema:'));
						console.log(JSON.stringify(config.schema, null, 2));
						console.log('');
					}

					if (memberInfo.documentation) {
						console.log(chalk.bold('Documentation:'));
						console.log(memberInfo.documentation as string);
						console.log('');
					}
				}
			} catch (error) {
				console.error(chalk.red('Error:'), (error as Error).message);
				process.exit(1);
			}
		});

	return members;
}
