/**
 * Project Validator - Validates Conductor project structure
 *
 * Checks YAML syntax, member references, and project structure.
 * Separates validation logic for testability and reusability.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { MemberType } from '../types/constants';
/**
 * Project validator for Conductor projects
 */
export class ProjectValidator {
    constructor(cwd) {
        this.cwd = cwd;
        this.members = new Map();
        this.membersDir = path.join(cwd, 'members');
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
        // Validate members
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
        // Check members directory exists
        if (!fs.existsSync(this.membersDir)) {
            errors.push({
                file: 'members/',
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
     * Validate all members
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
        for (const memberName of memberDirs) {
            const result = await this.validateMember(memberName);
            errors.push(...result.errors);
            warnings.push(...result.warnings);
        }
        return { errors, warnings };
    }
    /**
     * Validate a single member
     */
    async validateMember(memberName) {
        const errors = [];
        const warnings = [];
        const memberYamlPath = path.join(this.membersDir, memberName, 'member.yaml');
        const memberImplPath = path.join(this.membersDir, memberName, 'index.ts');
        // Check member.yaml exists
        if (!fs.existsSync(memberYamlPath)) {
            errors.push({
                file: `members/${memberName}/`,
                message: 'Missing member.yaml',
            });
            return { errors, warnings };
        }
        // Parse and validate member.yaml
        try {
            const yamlContent = fs.readFileSync(memberYamlPath, 'utf-8');
            const memberConfig = YAML.parse(yamlContent);
            // Validate required fields
            if (!memberConfig.name) {
                errors.push({
                    file: `members/${memberName}/member.yaml`,
                    message: 'Missing required field: name',
                });
            }
            if (!memberConfig.type) {
                errors.push({
                    file: `members/${memberName}/member.yaml`,
                    message: 'Missing required field: type',
                });
            }
            else {
                // Validate member type
                if (!this.isValidMemberType(memberConfig.type)) {
                    errors.push({
                        file: `members/${memberName}/member.yaml`,
                        message: `Invalid member type: ${memberConfig.type}`,
                    });
                }
            }
            // Store validated member
            if (memberConfig.name) {
                this.members.set(memberConfig.name, memberConfig);
            }
        }
        catch (error) {
            errors.push({
                file: `members/${memberName}/member.yaml`,
                message: `Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
        // Check implementation exists (warning only for non-Function members)
        if (!fs.existsSync(memberImplPath)) {
            warnings.push({
                file: `members/${memberName}/`,
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
            const ensembleConfig = YAML.parse(yamlContent);
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
                // Validate member references in flow
                for (let i = 0; i < ensembleConfig.flow.length; i++) {
                    const step = ensembleConfig.flow[i];
                    if (!step.member) {
                        errors.push({
                            file: `ensembles/${ensembleFile}`,
                            message: `Flow step ${i + 1} missing required field: member`,
                        });
                    }
                    else if (!this.members.has(step.member)) {
                        errors.push({
                            file: `ensembles/${ensembleFile}`,
                            message: `References unknown member: ${step.member}`,
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
     * Check if a member type is valid
     */
    isValidMemberType(type) {
        const validTypes = [
            MemberType.Function,
            MemberType.Think,
            MemberType.Data,
            MemberType.API,
            MemberType.MCP,
            MemberType.Scoring,
        ];
        return validTypes.includes(type);
    }
    /**
     * Get validated members
     */
    getMembers() {
        return this.members;
    }
}
