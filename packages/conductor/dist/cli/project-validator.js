/**
 * Project Validator - Validates Conductor project structure
 *
 * Checks YAML syntax, agent references, and project structure.
 * Separates validation logic for testability and reusability.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { Operation } from '../types/constants.js';
/**
 * Project validator for Conductor projects
 */
export class ProjectValidator {
    constructor(cwd) {
        this.cwd = cwd;
        this.agents = new Map();
        this.membersDir = path.join(cwd, 'agents');
        this.ensemblesDir = path.join(cwd, 'ensembles');
    }
    /**
     * Validate entire project
     */
    async validate() {
        const errors = [];
        const warnings = [];
        // Check project structure
        const structureResult = this.validateStructure();
        errors.push(...structureResult.errors);
        warnings.push(...structureResult.warnings);
        // Validate agents
        const membersResult = await this.validateMembers();
        errors.push(...membersResult.errors);
        warnings.push(...membersResult.warnings);
        // Validate ensembles
        const ensemblesResult = await this.validateEnsembles();
        errors.push(...ensemblesResult.errors);
        warnings.push(...ensemblesResult.warnings);
        return {
            passed: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate project structure
     */
    validateStructure() {
        const errors = [];
        const warnings = [];
        // Check agents directory exists
        if (!fs.existsSync(this.membersDir)) {
            errors.push({
                file: 'agents/',
                message: 'Members directory not found',
            });
        }
        // Check ensembles directory exists (warning only)
        if (!fs.existsSync(this.ensemblesDir)) {
            warnings.push({
                file: 'ensembles/',
                message: 'Ensembles directory not found',
            });
        }
        return { errors, warnings };
    }
    /**
     * Validate all agents
     */
    async validateMembers() {
        const errors = [];
        const warnings = [];
        if (!fs.existsSync(this.membersDir)) {
            return { errors, warnings };
        }
        const memberDirs = fs
            .readdirSync(this.membersDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
        for (const agentName of memberDirs) {
            const result = await this.validateMember(agentName);
            errors.push(...result.errors);
            warnings.push(...result.warnings);
        }
        return { errors, warnings };
    }
    /**
     * Validate a single agent
     */
    async validateMember(agentName) {
        const errors = [];
        const warnings = [];
        const memberYamlPath = path.join(this.membersDir, agentName, 'agent.yaml');
        const memberImplPath = path.join(this.membersDir, agentName, 'index.ts');
        // Check agent.yaml exists
        if (!fs.existsSync(memberYamlPath)) {
            errors.push({
                file: `agents/${agentName}/`,
                message: 'Missing agent.yaml',
            });
            return { errors, warnings };
        }
        // Parse and validate agent.yaml
        try {
            const yamlContent = fs.readFileSync(memberYamlPath, 'utf-8');
            const agentConfig = YAML.parse(yamlContent, {
                mapAsMap: false,
                logLevel: 'silent',
            });
            // Validate required fields
            if (!agentConfig.name) {
                errors.push({
                    file: `agents/${agentName}/agent.yaml`,
                    message: 'Missing required field: name',
                });
            }
            if (!agentConfig.type) {
                errors.push({
                    file: `agents/${agentName}/agent.yaml`,
                    message: 'Missing required field: type',
                });
            }
            else {
                // Validate agent type
                if (!this.isValidMemberType(agentConfig.type)) {
                    errors.push({
                        file: `agents/${agentName}/agent.yaml`,
                        message: `Invalid agent type: ${agentConfig.type}`,
                    });
                }
                // Validate code operation agents don't use inline code
                if (agentConfig.type === Operation.code && agentConfig.config) {
                    const config = agentConfig.config;
                    if (typeof config.code === 'string') {
                        errors.push({
                            file: `agents/${agentName}/agent.yaml`,
                            message: 'Inline code is not supported in Cloudflare Workers. Use config.script or an index.ts handler instead.',
                        });
                    }
                    if (typeof config.function === 'string') {
                        errors.push({
                            file: `agents/${agentName}/agent.yaml`,
                            message: 'config.function is deprecated. Use config.script or an index.ts handler instead.',
                        });
                    }
                }
            }
            // Store validated agent
            if (agentConfig.name) {
                this.agents.set(agentConfig.name, agentConfig);
            }
        }
        catch (error) {
            errors.push({
                file: `agents/${agentName}/agent.yaml`,
                message: `Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        // Check implementation exists (warning only for non-Function agents)
        if (!fs.existsSync(memberImplPath)) {
            warnings.push({
                file: `agents/${agentName}/`,
                message: 'Missing index.ts implementation',
            });
        }
        return { errors, warnings };
    }
    /**
     * Validate all ensembles
     */
    async validateEnsembles() {
        const errors = [];
        const warnings = [];
        if (!fs.existsSync(this.ensemblesDir)) {
            return { errors, warnings };
        }
        const ensembleFiles = fs
            .readdirSync(this.ensemblesDir)
            .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
        for (const ensembleFile of ensembleFiles) {
            const result = await this.validateEnsemble(ensembleFile);
            errors.push(...result.errors);
            warnings.push(...result.warnings);
        }
        return { errors, warnings };
    }
    /**
     * Validate a single ensemble
     */
    async validateEnsemble(ensembleFile) {
        const errors = [];
        const warnings = [];
        const ensemblePath = path.join(this.ensemblesDir, ensembleFile);
        try {
            const yamlContent = fs.readFileSync(ensemblePath, 'utf-8');
            const ensembleConfig = YAML.parse(yamlContent, {
                mapAsMap: false,
                logLevel: 'silent',
            });
            // Validate required fields
            if (!ensembleConfig.name) {
                errors.push({
                    file: `ensembles/${ensembleFile}`,
                    message: 'Missing required field: name',
                });
            }
            if (!ensembleConfig.flow || !Array.isArray(ensembleConfig.flow)) {
                errors.push({
                    file: `ensembles/${ensembleFile}`,
                    message: 'Missing or invalid field: flow (must be an array)',
                });
            }
            else {
                // Validate agent references in flow
                for (let i = 0; i < ensembleConfig.flow.length; i++) {
                    const step = ensembleConfig.flow[i];
                    if (!step.agent) {
                        errors.push({
                            file: `ensembles/${ensembleFile}`,
                            message: `Flow step ${i + 1} missing required field: agent`,
                        });
                    }
                    else if (!this.agents.has(step.agent)) {
                        errors.push({
                            file: `ensembles/${ensembleFile}`,
                            message: `References unknown agent: ${step.agent}`,
                        });
                    }
                }
            }
        }
        catch (error) {
            errors.push({
                file: `ensembles/${ensembleFile}`,
                message: `Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        return { errors, warnings };
    }
    /**
     * Check if a agent type is valid
     */
    isValidMemberType(type) {
        const validTypes = [
            Operation.code,
            Operation.think,
            Operation.storage,
            Operation.http,
            Operation.tools,
            Operation.scoring,
        ];
        return validTypes.includes(type);
    }
    /**
     * Get validated agents
     */
    getMembers() {
        return this.agents;
    }
}
