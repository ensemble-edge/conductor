/**
 * Configuration Checker - Validates project configuration
 *
 * Separates validation logic from presentation via Reporter pattern.
 * Extensible and testable design following SRP.
 */
export interface CheckResult {
    passed: boolean;
    issues: Issue[];
}
export interface Issue {
    severity: 'error' | 'warning' | 'info';
    file: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface PlatformData {
    models: {
        version: string;
        lastUpdated: string;
        providers: Record<string, ProviderData>;
    };
}
export interface ProviderData {
    models: ModelInfo[];
}
export interface ModelInfo {
    id: string;
    status?: 'active' | 'deprecated';
    deprecatedReason?: string;
    endOfLife?: string;
    replacementModel?: string;
}
export interface MemberConfig {
    name: string;
    type: string;
    config?: {
        model?: string;
        [key: string]: unknown;
    };
}
export interface EnsembleConfig {
    name: string;
    flow: unknown[];
    [key: string]: unknown;
}
/**
 * Configuration checker for Conductor projects
 */
export declare class ConfigChecker {
    private readonly cwd;
    private readonly platformData;
    constructor(cwd: string, platformData: PlatformData);
    /**
     * Run all checks and return aggregated results
     */
    checkAll(): Promise<CheckResult>;
    /**
     * Check member configurations
     */
    checkMembers(): Promise<CheckResult>;
    /**
     * Check a single member file
     */
    private checkMemberFile;
    /**
     * Check model configuration
     */
    private checkModel;
    /**
     * Check ensemble configurations
     */
    checkEnsembles(): Promise<CheckResult>;
    /**
     * Check a single ensemble file
     */
    private checkEnsembleFile;
    /**
     * Check platform-specific configuration
     */
    checkPlatformConfig(): Promise<CheckResult>;
    /**
     * Find a model by ID across all providers
     */
    private findModel;
    /**
     * Get provider name for a model
     */
    private getProviderForModel;
}
//# sourceMappingURL=config-checker.d.ts.map