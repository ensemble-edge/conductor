/**
 * Instruction Primitives
 *
 * Provides primitives for defining instructions, prompts, and system messages
 * that guide agent behavior. Instructions are the primary way to configure
 * how AI agents (think operation) behave.
 */
/**
 * Instruction source types
 */
export type InstructionSource = {
    type: 'inline';
    content: string;
} | {
    type: 'file';
    path: string;
} | {
    type: 'template';
    name: string;
    variables?: Record<string, unknown>;
} | {
    type: 'dynamic';
    generator: (context: InstructionContext) => string | Promise<string>;
};
/**
 * Context available during instruction generation
 */
export interface InstructionContext {
    /** Current input to the agent */
    input: Record<string, unknown>;
    /** Current state */
    state: Record<string, unknown>;
    /** Environment variables */
    env: Record<string, unknown>;
    /** Results from previous steps */
    results: Record<string, unknown>;
}
/**
 * Instruction configuration
 */
export interface InstructionConfig {
    /** Instruction name/identifier */
    name?: string;
    /** The instruction content or source */
    source: InstructionSource;
    /** Role for the instruction (system, user, assistant) */
    role?: 'system' | 'user' | 'assistant';
    /** Priority for ordering multiple instructions */
    priority?: number;
    /** Conditional application */
    when?: string | ((context: InstructionContext) => boolean);
    /** Variables for template interpolation */
    variables?: Record<string, unknown>;
    /** Cache the resolved instruction */
    cache?: boolean;
}
/**
 * Instruction class - runtime representation of an instruction
 */
export declare class Instruction {
    readonly name?: string;
    readonly source: InstructionSource;
    readonly role: 'system' | 'user' | 'assistant';
    readonly priority: number;
    readonly when?: string | ((context: InstructionContext) => boolean);
    readonly variables?: Record<string, unknown>;
    readonly cache: boolean;
    constructor(config: InstructionConfig);
    /**
     * Check if this is an inline instruction
     */
    isInline(): boolean;
    /**
     * Check if this is a file-based instruction
     */
    isFile(): boolean;
    /**
     * Check if this is a template instruction
     */
    isTemplate(): boolean;
    /**
     * Check if this is a dynamic instruction
     */
    isDynamic(): boolean;
    /**
     * Get the raw content (for inline instructions)
     */
    getContent(): string | undefined;
    /**
     * Get the file path (for file instructions)
     */
    getFilePath(): string | undefined;
    /**
     * Convert to plain config object
     */
    toConfig(): InstructionConfig;
}
/**
 * Create an instruction from inline content
 *
 * @example
 * ```typescript
 * const systemPrompt = instruction(`
 *   You are a helpful assistant specialized in data analysis.
 *   Always provide clear explanations with your results.
 * `);
 * ```
 */
export declare function instruction(content: string, options?: Omit<InstructionConfig, 'source'>): Instruction;
/**
 * Create a system instruction
 *
 * @example
 * ```typescript
 * const system = systemInstruction(`
 *   You are an expert code reviewer.
 *   Focus on security, performance, and maintainability.
 * `);
 * ```
 */
export declare function systemInstruction(content: string, options?: Omit<InstructionConfig, 'source' | 'role'>): Instruction;
/**
 * Create a user instruction (for few-shot examples or context)
 *
 * @example
 * ```typescript
 * const context = userInstruction(`
 *   Here is the code to review:
 *   ${state.code}
 * `);
 * ```
 */
export declare function userInstruction(content: string, options?: Omit<InstructionConfig, 'source' | 'role'>): Instruction;
/**
 * Create an assistant instruction (for few-shot examples)
 *
 * @example
 * ```typescript
 * const example = assistantInstruction(`
 *   I found 3 potential issues in the code...
 * `);
 * ```
 */
export declare function assistantInstruction(content: string, options?: Omit<InstructionConfig, 'source' | 'role'>): Instruction;
/**
 * Create an instruction from a file
 *
 * @example
 * ```typescript
 * const prompt = fileInstruction('prompts/code-review.md');
 * ```
 */
export declare function fileInstruction(path: string, options?: Omit<InstructionConfig, 'source'>): Instruction;
/**
 * Create an instruction from a named template
 *
 * @example
 * ```typescript
 * const prompt = templateInstruction('code-review', {
 *   language: 'typescript',
 *   focusAreas: ['security', 'performance']
 * });
 * ```
 */
export declare function templateInstruction(name: string, variables?: Record<string, unknown>, options?: Omit<InstructionConfig, 'source'>): Instruction;
/**
 * Create a dynamic instruction that's generated at runtime
 *
 * @example
 * ```typescript
 * const dynamicPrompt = dynamicInstruction(async (ctx) => {
 *   const guidelines = await fetchGuidelines(ctx.input.projectId);
 *   return `Review code following these guidelines:\n${guidelines}`;
 * });
 * ```
 */
export declare function dynamicInstruction(generator: (context: InstructionContext) => string | Promise<string>, options?: Omit<InstructionConfig, 'source'>): Instruction;
/**
 * Create a conditional instruction
 *
 * @example
 * ```typescript
 * const securityPrompt = conditionalInstruction(
 *   'input.includeSecurityReview',
 *   'Pay special attention to security vulnerabilities.'
 * );
 * ```
 */
export declare function conditionalInstruction(condition: string | ((context: InstructionContext) => boolean), content: string, options?: Omit<InstructionConfig, 'source' | 'when'>): Instruction;
/**
 * Combine multiple instructions into an ordered list
 *
 * @example
 * ```typescript
 * const instructions = combineInstructions([
 *   systemInstruction('You are an expert...'),
 *   conditionalInstruction('input.verbose', 'Be very detailed.'),
 *   fileInstruction('prompts/guidelines.md')
 * ]);
 * ```
 */
export declare function combineInstructions(instructions: Instruction[]): Instruction[];
/**
 * Create a prompt object for agent configuration
 *
 * @example
 * ```typescript
 * const agentPrompt = prompt({
 *   system: 'You are a helpful assistant.',
 *   user: 'Analyze the following data: ${input.data}',
 *   examples: [
 *     { user: 'Example input', assistant: 'Example output' }
 *   ]
 * });
 * ```
 */
export declare function prompt(config: {
    system?: string | Instruction;
    user?: string | Instruction;
    examples?: Array<{
        user: string;
        assistant: string;
    }>;
    additional?: Instruction[];
}): Instruction[];
/**
 * Check if a value is an Instruction instance
 */
export declare function isInstruction(value: unknown): value is Instruction;
/**
 * Check if a value is a valid instruction config
 */
export declare function isInstructionConfig(value: unknown): value is InstructionConfig;
//# sourceMappingURL=instruction.d.ts.map