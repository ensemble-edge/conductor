/**
 * Form HTML rendering utilities
 */
import type { FormMemberConfig, FormField, ValidationError } from '../types/index.js';
export interface RenderOptions {
    config: FormMemberConfig;
    fields: FormField[];
    data: Record<string, unknown>;
    errors: ValidationError[];
    csrfToken?: string;
    currentStep?: string;
}
/**
 * Render complete form HTML
 */
export declare function renderForm(options: RenderOptions): Promise<string>;
//# sourceMappingURL=renderer.d.ts.map