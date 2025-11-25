/**
 * Configuration Checker - Validates project configuration
 *
 * Separates validation logic from presentation via Reporter pattern.
 * Extensible and testable design following SRP.
 */
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as YAML from 'yaml';
/**
 * Configuration checker for Conductor projects
 */
export class ConfigChecker {
    constructor(cwd, platformData) {
        this.cwd = cwd;
        this.platformData = platformData;
    }
    /**
     * Run all checks and return aggregated results
     */
    async checkAll() {
        const allIssues = [];
        // Check agents
        const agentResult = await this.checkMembers();
        allIssues.push(...agentResult.issues);
        // Check ensembles
        const ensembleResult = await this.checkEnsembles();
        allIssues.push(...ensembleResult.issues);
        // Check platform config
        const platformResult = await this.checkPlatformConfig();
        allIssues.push(...platformResult.issues);
        return {
            passed: allIssues.every((issue) => issue.severity !== 'error'),
            issues: allIssues,
        };
    }
    /**
     * Check agent configurations
     */
    async checkMembers() {
        const issues = [];
        try {
            const memberFiles = await glob('agents/*/agent.yaml', { cwd: this.cwd });
            for (const file of memberFiles) {
                const memberIssues = await this.checkMemberFile(file);
                issues.push(...memberIssues);
            }
        }
        catch (error) {
            issues.push({
                severity: 'error',
                file: 'agents/',
                message: `Failed to check agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return {
            passed: issues.every((issue) => issue.severity !== 'error'),
            issues,
        };
    }
    /**
     * Check a single agent file
     */
    async checkMemberFile(file) {
        const issues = [];
        const filePath = path.join(this.cwd, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const config = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' });
            // Check Think agents for model validation
            if (config.type === 'Think' && config.config?.model) {
                const modelIssues = this.checkModel(file, config);
                issues.push(...modelIssues);
            }
        }
        catch (error) {
            issues.push({
                severity: 'error',
                file,
                message: `Failed to parse: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return issues;
    }
    /**
     * Check model configuration
     */
    checkModel(file, config) {
        const issues = [];
        const modelId = config.config?.model;
        if (!modelId)
            return issues;
        const model = this.findModel(modelId);
        if (!model) {
            issues.push({
                severity: 'warning',
                file,
                message: `Unknown model: "${modelId}"`,
                details: {
                    agent: config.name,
                    suggestion: 'This may be a custom model or typo',
                },
            });
        }
        else if (model.status === 'deprecated') {
            issues.push({
                severity: 'error',
                file,
                message: `Model "${modelId}" is deprecated`,
                details: {
                    agent: config.name,
                    reason: model.deprecatedReason,
                    endOfLife: model.endOfLife,
                    replacement: model.replacementModel,
                },
            });
        }
        else {
            // Model is valid
            issues.push({
                severity: 'info',
                file,
                message: `Valid model: ${modelId}`,
                details: {
                    agent: config.name,
                    provider: this.getProviderForModel(modelId),
                },
            });
        }
        return issues;
    }
    /**
     * Check ensemble configurations
     */
    async checkEnsembles() {
        const issues = [];
        try {
            const ensembleFiles = await glob('ensembles/*.yaml', { cwd: this.cwd });
            for (const file of ensembleFiles) {
                const ensembleIssues = await this.checkEnsembleFile(file);
                issues.push(...ensembleIssues);
            }
        }
        catch (error) {
            issues.push({
                severity: 'error',
                file: 'ensembles/',
                message: `Failed to check ensembles: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return {
            passed: issues.every((issue) => issue.severity !== 'error'),
            issues,
        };
    }
    /**
     * Check a single ensemble file
     */
    async checkEnsembleFile(file) {
        const issues = [];
        const filePath = path.join(this.cwd, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const config = YAML.parse(content, { mapAsMap: false, logLevel: 'silent' });
            issues.push({
                severity: 'info',
                file,
                message: `Valid ensemble: ${config.name || 'unnamed'}`,
                details: { name: config.name },
            });
        }
        catch (error) {
            issues.push({
                severity: 'error',
                file,
                message: `Failed to parse: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return issues;
    }
    /**
     * Check platform-specific configuration
     */
    async checkPlatformConfig() {
        const issues = [];
        // Check for wrangler.toml (Cloudflare)
        const wranglerPath = path.join(this.cwd, 'wrangler.toml');
        if (!fs.existsSync(wranglerPath)) {
            issues.push({
                severity: 'error',
                file: 'wrangler.toml',
                message: 'wrangler.toml not found',
                details: {
                    suggestion: 'Create wrangler.toml for Cloudflare Workers',
                },
            });
        }
        else {
            issues.push({
                severity: 'info',
                file: 'wrangler.toml',
                message: 'Platform configuration found',
            });
        }
        return {
            passed: issues.every((issue) => issue.severity !== 'error'),
            issues,
        };
    }
    /**
     * Find a model by ID across all providers
     */
    findModel(modelId) {
        for (const provider of Object.values(this.platformData.models.providers)) {
            const model = provider.models.find((m) => m.id === modelId);
            if (model)
                return model;
        }
        return null;
    }
    /**
     * Get provider name for a model
     */
    getProviderForModel(modelId) {
        for (const [providerName, providerData] of Object.entries(this.platformData.models.providers)) {
            const model = providerData.models.find((m) => m.id === modelId);
            if (model)
                return providerName;
        }
        return 'unknown';
    }
}
