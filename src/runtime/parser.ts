/**
 * YAML Parser for Ensemble workflows
 *
 * Parses and validates ensemble YAML files into executable format
 */

import * as YAML from 'yaml';
import { z } from 'zod';

/**
 * Schema for validating ensemble configuration
 */
const EnsembleSchema = z.object({
	name: z.string().min(1, 'Ensemble name is required'),
	description: z.string().optional(),
	state: z.object({
		schema: z.record(z.any()).optional(),
		initial: z.record(z.any()).optional()
	}).optional(),
	flow: z.array(z.object({
		member: z.string().min(1, 'Member name is required'),
		input: z.record(z.any()).optional(),
		state: z.object({
			use: z.array(z.string()).optional(),
			set: z.array(z.string()).optional()
		}).optional(),
		cache: z.object({
			ttl: z.number().positive().optional(),
			bypass: z.boolean().optional()
		}).optional(),
		condition: z.any().optional()
	})),
	output: z.record(z.any()).optional()
});

const MemberSchema = z.object({
	name: z.string().min(1, 'Member name is required'),
	type: z.enum(['Think', 'Function', 'Data', 'API', 'MCP', 'Scoring']),
	description: z.string().optional(),
	config: z.record(z.any()).optional(),
	schema: z.object({
		input: z.record(z.any()).optional(),
		output: z.record(z.any()).optional()
	}).optional()
});

export type EnsembleConfig = z.infer<typeof EnsembleSchema>;
export type MemberConfig = z.infer<typeof MemberSchema>;
export type FlowStep = EnsembleConfig['flow'][number];

export class Parser {
	/**
	 * Parse and validate an ensemble YAML file
	 * @param yamlContent - Raw YAML content as string
	 * @returns Parsed and validated ensemble configuration
	 */
	static parseEnsemble(yamlContent: string): EnsembleConfig {
		try {
			// Parse YAML
			const parsed = YAML.parse(yamlContent);

			if (!parsed) {
				throw new Error('Empty or invalid YAML content');
			}

			// Validate against schema
			const validated = EnsembleSchema.parse(parsed);

			return validated;
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new Error(`Ensemble validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
			}
			throw new Error(`Failed to parse ensemble YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Parse and validate a member YAML file
	 * @param yamlContent - Raw YAML content as string
	 * @returns Parsed and validated member configuration
	 */
	static parseMember(yamlContent: string): MemberConfig {
		try {
			// Parse YAML
			const parsed = YAML.parse(yamlContent);

			if (!parsed) {
				throw new Error('Empty or invalid YAML content');
			}

			// Validate against schema
			const validated = MemberSchema.parse(parsed);

			return validated;
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new Error(`Member validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
			}
			throw new Error(`Failed to parse member YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Resolve input interpolations in the format ${input.x}, ${state.y}, ${member.output.z}
	 * @param template - Template string with interpolations
	 * @param context - Context object containing input, state, and previous outputs
	 * @returns Resolved value
	 */
	static resolveInterpolation(template: any, context: Record<string, any>): any {
		if (typeof template !== 'string') {
			// If it's an object, recursively resolve all string values
			if (typeof template === 'object' && template !== null) {
				if (Array.isArray(template)) {
					return template.map(item => Parser.resolveInterpolation(item, context));
				}
				const resolved: Record<string, any> = {};
				for (const [key, value] of Object.entries(template)) {
					resolved[key] = Parser.resolveInterpolation(value, context);
				}
				return resolved;
			}
			return template;
		}

		// Check if it's an interpolation pattern
		const interpolationPattern = /^\$\{(.+)\}$/;
		const match = template.match(interpolationPattern);

		if (!match) {
			// Not an interpolation, return as-is (or could do inline replacement)
			return template;
		}

		// Extract the path (e.g., "input.domain", "state.companyData", "fetch-data.output")
		const path = match[1];
		const parts = path.split('.');

		// Traverse the context to get the value
		let value: any = context;
		for (const part of parts) {
			if (value && typeof value === 'object' && part in value) {
				value = value[part];
			} else {
				// Path not found, return undefined
				return undefined;
			}
		}

		return value;
	}

	/**
	 * Parse a member reference that may include version
	 * Supports formats:
	 * - "member-name" (no version)
	 * - "member-name@v1.0.0" (semver version)
	 * - "member-name@production" (deployment tag)
	 * - "member-name@latest" (latest tag)
	 *
	 * @param memberRef - Member reference string
	 * @returns Parsed member reference with name and optional version
	 */
	static parseMemberReference(memberRef: string): { name: string; version?: string } {
		const parts = memberRef.split('@');

		if (parts.length === 1) {
			// No version specified
			return { name: parts[0] };
		}

		if (parts.length === 2) {
			// Version specified
			return {
				name: parts[0],
				version: parts[1]
			};
		}

		// Invalid format
		throw new Error(`Invalid member reference format: ${memberRef}. Expected "name" or "name@version"`);
	}

	/**
	 * Validate that all required members exist
	 * @param ensemble - Ensemble configuration
	 * @param availableMembers - Set of available member names
	 */
	static validateMemberReferences(ensemble: EnsembleConfig, availableMembers: Set<string>): void {
		const missingMembers: string[] = [];

		for (const step of ensemble.flow) {
			// Parse member reference to extract name (ignoring version)
			const { name } = Parser.parseMemberReference(step.member);

			if (!availableMembers.has(name)) {
				missingMembers.push(step.member);
			}
		}

		if (missingMembers.length > 0) {
			throw new Error(`Ensemble "${ensemble.name}" references missing members: ${missingMembers.join(', ')}`);
		}
	}
}
