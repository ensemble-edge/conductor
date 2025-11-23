/**
 * Project Validator - Validates Conductor project structure
 *
 * Checks YAML syntax, agent references, and project structure.
 * Separates validation logic for testability and reusability.
 */
export interface ValidationResult {
    passed: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    file: string;
    message: string;
}
export interface ValidationWarning {
    file: string;
    message: string;
}
export interface AgentConfig {
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
}
export interface EnsembleConfig {
    name: string;
    flow: FlowStep[];
    [key: string]: unknown;
}
export interface FlowStep {
    agent: string;
    input?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * Project validator for Conductor projects
 */
export declare class ProjectValidator {
    private readonly cwd;
    private readonly membersDir;
    private readonly ensemblesDir;
    private agents;
    constructor(cwd: string);
    /**
     * Validate entire project
     */
    validate(): Promise<ValidationResult>;
    /**
     * Validate project structure
     */
    private validateStructure;
    /**
     * Validate all agents
     */
    private validateMembers;
    /**
     * Validate a single agent
     */
    private validateMember;
    /**
     * Validate all ensembles
     */
    private validateEnsembles;
    /**
     * Validate a single ensemble
     */
    private validateEnsemble;
    /**
     * Check if a agent type is valid
     */
    private isValidMemberType;
    /**
     * Get validated agents
     */
    getMembers(): Map<string, AgentConfig>;
}
//# sourceMappingURL=project-validator.d.ts.map