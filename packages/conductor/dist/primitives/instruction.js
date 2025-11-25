/**
 * Instruction Primitives
 *
 * Provides primitives for defining instructions, prompts, and system messages
 * that guide agent behavior. Instructions are the primary way to configure
 * how AI agents (think operation) behave.
 */
/**
 * Instruction class - runtime representation of an instruction
 */
export class Instruction {
    constructor(config) {
        this.name = config.name;
        this.source = config.source;
        this.role = config.role ?? 'system';
        this.priority = config.priority ?? 0;
        this.when = config.when;
        this.variables = config.variables;
        this.cache = config.cache ?? false;
    }
    /**
     * Check if this is an inline instruction
     */
    isInline() {
        return this.source.type === 'inline';
    }
    /**
     * Check if this is a file-based instruction
     */
    isFile() {
        return this.source.type === 'file';
    }
    /**
     * Check if this is a template instruction
     */
    isTemplate() {
        return this.source.type === 'template';
    }
    /**
     * Check if this is a dynamic instruction
     */
    isDynamic() {
        return this.source.type === 'dynamic';
    }
    /**
     * Get the raw content (for inline instructions)
     */
    getContent() {
        if (this.source.type === 'inline') {
            return this.source.content;
        }
        return undefined;
    }
    /**
     * Get the file path (for file instructions)
     */
    getFilePath() {
        if (this.source.type === 'file') {
            return this.source.path;
        }
        return undefined;
    }
    /**
     * Convert to plain config object
     */
    toConfig() {
        return {
            name: this.name,
            source: this.source,
            role: this.role,
            priority: this.priority,
            when: typeof this.when === 'string' ? this.when : undefined,
            variables: this.variables,
            cache: this.cache,
        };
    }
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
export function instruction(content, options) {
    return new Instruction({
        ...options,
        source: { type: 'inline', content },
    });
}
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
export function systemInstruction(content, options) {
    return new Instruction({
        ...options,
        source: { type: 'inline', content },
        role: 'system',
    });
}
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
export function userInstruction(content, options) {
    return new Instruction({
        ...options,
        source: { type: 'inline', content },
        role: 'user',
    });
}
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
export function assistantInstruction(content, options) {
    return new Instruction({
        ...options,
        source: { type: 'inline', content },
        role: 'assistant',
    });
}
/**
 * Create an instruction from a file
 *
 * @example
 * ```typescript
 * const prompt = fileInstruction('prompts/code-review.md');
 * ```
 */
export function fileInstruction(path, options) {
    return new Instruction({
        ...options,
        source: { type: 'file', path },
    });
}
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
export function templateInstruction(name, variables, options) {
    return new Instruction({
        ...options,
        source: { type: 'template', name, variables },
    });
}
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
export function dynamicInstruction(generator, options) {
    return new Instruction({
        ...options,
        source: { type: 'dynamic', generator },
    });
}
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
export function conditionalInstruction(condition, content, options) {
    return new Instruction({
        ...options,
        source: { type: 'inline', content },
        when: condition,
    });
}
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
export function combineInstructions(instructions) {
    // Sort by priority (higher priority first)
    return [...instructions].sort((a, b) => b.priority - a.priority);
}
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
export function prompt(config) {
    const instructions = [];
    // Add system instruction
    if (config.system) {
        if (typeof config.system === 'string') {
            instructions.push(systemInstruction(config.system, { priority: 100 }));
        }
        else {
            instructions.push(config.system);
        }
    }
    // Add examples as few-shot prompts
    if (config.examples) {
        config.examples.forEach((example, index) => {
            instructions.push(userInstruction(example.user, { priority: 50 - index }));
            instructions.push(assistantInstruction(example.assistant, { priority: 50 - index }));
        });
    }
    // Add user instruction
    if (config.user) {
        if (typeof config.user === 'string') {
            instructions.push(userInstruction(config.user, { priority: 0 }));
        }
        else {
            instructions.push(config.user);
        }
    }
    // Add any additional instructions
    if (config.additional) {
        instructions.push(...config.additional);
    }
    return combineInstructions(instructions);
}
/**
 * Check if a value is an Instruction instance
 */
export function isInstruction(value) {
    return value instanceof Instruction;
}
/**
 * Check if a value is a valid instruction config
 */
export function isInstructionConfig(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const config = value;
    return typeof config.source === 'object' && config.source !== null;
}
