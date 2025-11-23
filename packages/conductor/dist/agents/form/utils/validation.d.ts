/**
 * Form field validation utilities
 */
import type { FormField, ValidationError } from '../types/index.js';
import type { AgentExecutionContext } from '../../base-agent.js';
/**
 * Validate a single field
 */
export declare function validateField(field: FormField, value: unknown, allData: Record<string, unknown>, context: AgentExecutionContext): Promise<ValidationError[]>;
//# sourceMappingURL=validation.d.ts.map