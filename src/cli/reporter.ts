/**
 * Reporter - Formats and displays check results
 *
 * Separates presentation logic from validation logic.
 * Supports different output formats (console, JSON, etc.).
 */

import type { CheckResult, Issue, PlatformData } from './config-checker';

export interface ReporterOptions {
	format?: 'console' | 'json';
	verbose?: boolean;
	colors?: boolean;
}

/**
 * Abstract base reporter
 */
export abstract class Reporter {
	constructor(protected options: ReporterOptions = {}) {
		this.options.format = options.format || 'console';
		this.options.verbose = options.verbose ?? true;
		this.options.colors = options.colors ?? true;
	}

	abstract reportHeader(platformData: PlatformData): void;
	abstract reportSection(title: string, result: CheckResult): void;
	abstract reportSummary(totalIssues: number): void;
}

/**
 * Console reporter with colored output
 */
export class ConsoleReporter extends Reporter {
	private readonly chalk: any;

	constructor(options: ReporterOptions = {}) {
		super(options);

		// Dynamically import chalk (supports both ESM and CJS)
		try {
			this.chalk = require('chalk');
		} catch {
			// Fallback: no colors
			this.chalk = this.createFallbackChalk();
		}
	}

	/**
	 * Fallback chalk when module not available
	 */
	private createFallbackChalk() {
		const identity = (str: string) => str;
		return {
			blue: identity,
			green: identity,
			yellow: identity,
			red: identity,
			gray: identity,
			bold: identity
		};
	}

	reportHeader(platformData: PlatformData): void {
		console.log(this.chalk.blue('\n🔍 Checking configuration...\n'));
		console.log(this.chalk.gray(`Platform: cloudflare`));
		console.log(this.chalk.gray(`Data version: ${platformData.models.version}`));
		console.log(this.chalk.gray(`Last updated: ${platformData.models.lastUpdated}\n`));
	}

	reportSection(title: string, result: CheckResult): void {
		console.log(this.chalk.bold(`${title}\n`));

		if (result.issues.length === 0) {
			console.log(this.chalk.gray('   No items found\n'));
			return;
		}

		// Group issues by severity
		const errors = result.issues.filter(i => i.severity === 'error');
		const warnings = result.issues.filter(i => i.severity === 'warning');
		const infos = result.issues.filter(i => i.severity === 'info');

		// Report errors
		for (const issue of errors) {
			this.reportIssue(issue, '✗', this.chalk.red);
		}

		// Report warnings
		for (const issue of warnings) {
			this.reportIssue(issue, '⚠', this.chalk.yellow);
		}

		// Report info (only in verbose mode)
		if (this.options.verbose) {
			for (const issue of infos) {
				this.reportIssue(issue, '✓', this.chalk.green);
			}
		}

		// Summary for this section
		if (errors.length === 0 && warnings.length === 0) {
			console.log(this.chalk.green('   All items are valid!\n'));
		} else {
			console.log();
		}
	}

	private reportIssue(issue: Issue, icon: string, colorFn: (str: string) => string): void {
		console.log(colorFn(`   ${icon} ${issue.file}`));
		console.log(this.chalk.gray(`     ${issue.message}`));

		if (issue.details) {
			for (const [key, value] of Object.entries(issue.details)) {
				if (value && key !== 'member') {
					if (key === 'replacement') {
						console.log(this.chalk.green(`     → Use "${value}" instead`));
					} else if (key === 'endOfLife' && typeof value === 'string') {
						const daysUntilEOL = this.calculateDaysUntilEOL(value);
						if (daysUntilEOL !== null) {
							if (daysUntilEOL > 0) {
								console.log(this.chalk.yellow(`     End of life in ${daysUntilEOL} days (${value})`));
							} else {
								console.log(this.chalk.red(`     End of life: ${value} (EXPIRED)`));
							}
						}
					} else if (key === 'reason') {
						console.log(this.chalk.gray(`     Reason: ${value}`));
					} else if (key === 'suggestion') {
						console.log(this.chalk.gray(`     ${value}`));
					} else if (key === 'provider') {
						console.log(this.chalk.gray(`     Provider: ${value}`));
					}
				}
			}
		}

		console.log();
	}

	private calculateDaysUntilEOL(eolDate: string): number | null {
		try {
			const eol = new Date(eolDate);
			const now = new Date();
			const diffMs = eol.getTime() - now.getTime();
			return Math.floor(diffMs / (1000 * 60 * 60 * 24));
		} catch {
			return null;
		}
	}

	reportSummary(totalIssues: number): void {
		if (totalIssues === 0) {
			console.log(this.chalk.green('\n✅ Configuration check complete - no issues found!\n'));
		} else {
			console.log(this.chalk.yellow(`\n⚠️  Configuration check complete - found ${totalIssues} issue(s)\n`));
			console.log(this.chalk.gray('Run `conductor upgrade` to update platform data'));
			console.log(this.chalk.gray('Review and update your member configurations as needed\n'));
		}
	}
}

/**
 * JSON reporter for programmatic consumption
 */
export class JSONReporter extends Reporter {
	private results: {
		platform?: PlatformData;
		sections: Array<{ title: string; result: CheckResult }>;
		summary?: { totalIssues: number };
	} = {
		sections: []
	};

	reportHeader(platformData: PlatformData): void {
		this.results.platform = platformData;
	}

	reportSection(title: string, result: CheckResult): void {
		this.results.sections.push({ title, result });
	}

	reportSummary(totalIssues: number): void {
		this.results.summary = { totalIssues };
		console.log(JSON.stringify(this.results, null, 2));
	}
}

/**
 * Factory for creating reporters
 */
export function createReporter(options: ReporterOptions = {}): Reporter {
	switch (options.format) {
		case 'json':
			return new JSONReporter(options);
		case 'console':
		default:
			return new ConsoleReporter(options);
	}
}
