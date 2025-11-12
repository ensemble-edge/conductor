/**
 * Form HTML rendering utilities
 */
import type { FormAgentConfig, FormField, FormStep, ValidationError } from '../types/index.js';
export interface RenderOptions {
    config: FormAgentConfig;
    fields: FormField[];
    data: Record<string, unknown>;
    errors: ValidationError[];
    csrfToken?: string;
    currentStep?: string;
    stepInfo?: FormStep;
}
/**
 * Render complete form HTML
 */
export declare function renderForm(options: RenderOptions): Promise<string>;
//# sourceMappingURL=renderer.d.ts.map