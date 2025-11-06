/**
 * Reporter - Formats and displays check results
 *
 * Separates presentation logic from validation logic.
 * Supports different output formats (console, JSON, etc.).
 */
import type { CheckResult, PlatformData } from './config-checker.js';
export interface ReporterOptions {
    format?: 'console' | 'json';
    verbose?: boolean;
    colors?: boolean;
}
/**
 * Abstract base reporter
 */
export declare abstract class Reporter {
    protected options: ReporterOptions;
    constructor(options?: ReporterOptions);
    abstract reportHeader(platformData: PlatformData): void;
    abstract reportSection(title: string, result: CheckResult): void;
    abstract reportSummary(totalIssues: number): void;
}
/**
 * Console reporter with colored output
 */
export declare class ConsoleReporter extends Reporter {
    private readonly chalk;
    constructor(options?: ReporterOptions);
    /**
     * Fallback chalk when module not available
     */
    private createFallbackChalk;
    reportHeader(platformData: PlatformData): void;
    reportSection(title: string, result: CheckResult): void;
    private reportIssue;
    private calculateDaysUntilEOL;
    reportSummary(totalIssues: number): void;
}
/**
 * JSON reporter for programmatic consumption
 */
export declare class JSONReporter extends Reporter {
    private results;
    reportHeader(platformData: PlatformData): void;
    reportSection(title: string, result: CheckResult): void;
    reportSummary(totalIssues: number): void;
}
/**
 * Factory for creating reporters
 */
export declare function createReporter(options?: ReporterOptions): Reporter;
//# sourceMappingURL=reporter.d.ts.map