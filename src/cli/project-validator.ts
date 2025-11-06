/**
 * Project Validator - Validates Conductor project structure
 *
 * Checks YAML syntax, member references, and project structure.
 * Separates validation logic for testability and reusability.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'yaml'
import { MemberType } from '../types/constants.js'

export interface ValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  file: string
  message: string
}

export interface ValidationWarning {
  file: string
  message: string
}

export interface MemberConfig {
  name: string
  type: string
  description?: string
  config?: Record<string, unknown>
}

export interface EnsembleConfig {
  name: string
  flow: FlowStep[]
  [key: string]: unknown
}

export interface FlowStep {
  member: string
  input?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Project validator for Conductor projects
 */
export class ProjectValidator {
  private readonly membersDir: string
  private readonly ensemblesDir: string
  private members: Map<string, MemberConfig> = new Map()

  constructor(private readonly cwd: string) {
    this.membersDir = path.join(cwd, 'members')
    this.ensemblesDir = path.join(cwd, 'ensembles')
  }

  /**
   * Validate entire project
   */
  async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check project structure
    const structureResult = this.validateStructure()
    errors.push(...structureResult.errors)
    warnings.push(...structureResult.warnings)

    // Validate members
    const membersResult = await this.validateMembers()
    errors.push(...membersResult.errors)
    warnings.push(...membersResult.warnings)

    // Validate ensembles
    const ensemblesResult = await this.validateEnsembles()
    errors.push(...ensemblesResult.errors)
    warnings.push(...ensemblesResult.warnings)

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate project structure
   */
  private validateStructure(): Pick<ValidationResult, 'errors' | 'warnings'> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check members directory exists
    if (!fs.existsSync(this.membersDir)) {
      errors.push({
        file: 'members/',
        message: 'Members directory not found',
      })
    }

    // Check ensembles directory exists (warning only)
    if (!fs.existsSync(this.ensemblesDir)) {
      warnings.push({
        file: 'ensembles/',
        message: 'Ensembles directory not found',
      })
    }

    return { errors, warnings }
  }

  /**
   * Validate all members
   */
  private async validateMembers(): Promise<Pick<ValidationResult, 'errors' | 'warnings'>> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!fs.existsSync(this.membersDir)) {
      return { errors, warnings }
    }

    const memberDirs = fs
      .readdirSync(this.membersDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const memberName of memberDirs) {
      const result = await this.validateMember(memberName)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }

    return { errors, warnings }
  }

  /**
   * Validate a single member
   */
  private async validateMember(
    memberName: string
  ): Promise<Pick<ValidationResult, 'errors' | 'warnings'>> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const memberYamlPath = path.join(this.membersDir, memberName, 'member.yaml')
    const memberImplPath = path.join(this.membersDir, memberName, 'index.ts')

    // Check member.yaml exists
    if (!fs.existsSync(memberYamlPath)) {
      errors.push({
        file: `members/${memberName}/`,
        message: 'Missing member.yaml',
      })
      return { errors, warnings }
    }

    // Parse and validate member.yaml
    try {
      const yamlContent = fs.readFileSync(memberYamlPath, 'utf-8')
      const memberConfig: MemberConfig = YAML.parse(yamlContent)

      // Validate required fields
      if (!memberConfig.name) {
        errors.push({
          file: `members/${memberName}/member.yaml`,
          message: 'Missing required field: name',
        })
      }

      if (!memberConfig.type) {
        errors.push({
          file: `members/${memberName}/member.yaml`,
          message: 'Missing required field: type',
        })
      } else {
        // Validate member type
        if (!this.isValidMemberType(memberConfig.type)) {
          errors.push({
            file: `members/${memberName}/member.yaml`,
            message: `Invalid member type: ${memberConfig.type}`,
          })
        }
      }

      // Store validated member
      if (memberConfig.name) {
        this.members.set(memberConfig.name, memberConfig)
      }
    } catch (error) {
      errors.push({
        file: `members/${memberName}/member.yaml`,
        message: `Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    // Check implementation exists (warning only for non-Function members)
    if (!fs.existsSync(memberImplPath)) {
      warnings.push({
        file: `members/${memberName}/`,
        message: 'Missing index.ts implementation',
      })
    }

    return { errors, warnings }
  }

  /**
   * Validate all ensembles
   */
  private async validateEnsembles(): Promise<Pick<ValidationResult, 'errors' | 'warnings'>> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!fs.existsSync(this.ensemblesDir)) {
      return { errors, warnings }
    }

    const ensembleFiles = fs
      .readdirSync(this.ensemblesDir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))

    for (const ensembleFile of ensembleFiles) {
      const result = await this.validateEnsemble(ensembleFile)
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }

    return { errors, warnings }
  }

  /**
   * Validate a single ensemble
   */
  private async validateEnsemble(
    ensembleFile: string
  ): Promise<Pick<ValidationResult, 'errors' | 'warnings'>> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const ensemblePath = path.join(this.ensemblesDir, ensembleFile)

    try {
      const yamlContent = fs.readFileSync(ensemblePath, 'utf-8')
      const ensembleConfig: EnsembleConfig = YAML.parse(yamlContent)

      // Validate required fields
      if (!ensembleConfig.name) {
        errors.push({
          file: `ensembles/${ensembleFile}`,
          message: 'Missing required field: name',
        })
      }

      if (!ensembleConfig.flow || !Array.isArray(ensembleConfig.flow)) {
        errors.push({
          file: `ensembles/${ensembleFile}`,
          message: 'Missing or invalid field: flow (must be an array)',
        })
      } else {
        // Validate member references in flow
        for (let i = 0; i < ensembleConfig.flow.length; i++) {
          const step = ensembleConfig.flow[i]

          if (!step.member) {
            errors.push({
              file: `ensembles/${ensembleFile}`,
              message: `Flow step ${i + 1} missing required field: member`,
            })
          } else if (!this.members.has(step.member)) {
            errors.push({
              file: `ensembles/${ensembleFile}`,
              message: `References unknown member: ${step.member}`,
            })
          }
        }
      }
    } catch (error) {
      errors.push({
        file: `ensembles/${ensembleFile}`,
        message: `Invalid YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    return { errors, warnings }
  }

  /**
   * Check if a member type is valid
   */
  private isValidMemberType(type: string): boolean {
    const validTypes: string[] = [
      MemberType.Function,
      MemberType.Think,
      MemberType.Data,
      MemberType.API,
      MemberType.MCP,
      MemberType.Scoring,
    ]
    return validTypes.includes(type)
  }

  /**
   * Get validated members
   */
  getMembers(): Map<string, MemberConfig> {
    return this.members
  }
}
