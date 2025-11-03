/**
 * Project Validator - Validates Conductor project structure
 *
 * Checks YAML syntax, member references, and project structure.
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
export interface MemberConfig {
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
    member: string;
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
    private members;
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
     * Validate all members
     */
    private validateMembers;
    /**
     * Validate a single member
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
     * Check if a member type is valid
     */
    private isValidMemberType;
    /**
     * Get validated members
     */
    getMembers(): Map<string, MemberConfig>;
}
//# sourceMappingURL=project-validator.d.ts.map