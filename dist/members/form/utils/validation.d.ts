/**
 * Form field validation utilities
 */
import type { FormField, ValidationError } from '../types/index.js';
import type { MemberExecutionContext } from '../../base-member.js';
/**
 * Validate a single field
 */
export declare function validateField(field: FormField, value: unknown, allData: Record<string, unknown>, context: MemberExecutionContext): Promise<ValidationError[]>;
//# sourceMappingURL=validation.d.ts.map