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
export type InstructionSource =
  | { type: 'inline'; content: string }
  | { type: 'file'; path: string }
  | { type: 'template'; name: string; variables?: Record<string, unknown> }
  | { type: 'dynamic'; generator: (context: InstructionContext) => string | Promise<string> }

/**
 * Context available during instruction generation
 */
export interface InstructionContext {
  /** Current input to the agent */
  input: Record<string, unknown>
  /** Current state */
  state: Record<string, unknown>
  /** Environment variables */
  env: Record<string, unknown>
  /** Results from previous steps */
  results: Record<string, unknown>
}

/**
 * Instruction configuration
 */
export interface InstructionConfig {
  /** Instruction name/identifier */
  name?: string
  /** The instruction content or source */
  source: InstructionSource
  /** Role for the instruction (system, user, assistant) */
  role?: 'system' | 'user' | 'assistant'
  /** Priority for ordering multiple instructions */
  priority?: number
  /** Conditional application */
  when?: string | ((context: InstructionContext) => boolean)
  /** Variables for template interpolation */
  variables?: Record<string, unknown>
  /** Cache the resolved instruction */
  cache?: boolean
}

/**
 * Instruction class - runtime representation of an instruction
 */
export class Instruction {
  public readonly name?: string
  public readonly source: InstructionSource
  public readonly role: 'system' | 'user' | 'assistant'
  public readonly priority: number
  public readonly when?: string | ((context: InstructionContext) => boolean)
  public readonly variables?: Record<string, unknown>
  public readonly cache: boolean

  constructor(config: InstructionConfig) {
    this.name = config.name
    this.source = config.source
    this.role = config.role ?? 'system'
    this.priority = config.priority ?? 0
    this.when = config.when
    this.variables = config.variables
    this.cache = config.cache ?? false
  }

  /**
   * Check if this is an inline instruction
   */
  isInline(): boolean {
    return this.source.type === 'inline'
  }

  /**
   * Check if this is a file-based instruction
   */
  isFile(): boolean {
    return this.source.type === 'file'
  }

  /**
   * Check if this is a template instruction
   */
  isTemplate(): boolean {
    return this.source.type === 'template'
  }

  /**
   * Check if this is a dynamic instruction
   */
  isDynamic(): boolean {
    return this.source.type === 'dynamic'
  }

  /**
   * Get the raw content (for inline instructions)
   */
  getContent(): string | undefined {
    if (this.source.type === 'inline') {
      return this.source.content
    }
    return undefined
  }

  /**
   * Get the file path (for file instructions)
   */
  getFilePath(): string | undefined {
    if (this.source.type === 'file') {
      return this.source.path
    }
    return undefined
  }

  /**
   * Convert to plain config object
   */
  toConfig(): InstructionConfig {
    return {
      name: this.name,
      source: this.source,
      role: this.role,
      priority: this.priority,
      when: typeof this.when === 'string' ? this.when : undefined,
      variables: this.variables,
      cache: this.cache,
    }
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
export function instruction(
  content: string,
  options?: Omit<InstructionConfig, 'source'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'inline', content },
  })
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
export function systemInstruction(
  content: string,
  options?: Omit<InstructionConfig, 'source' | 'role'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'inline', content },
    role: 'system',
  })
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
export function userInstruction(
  content: string,
  options?: Omit<InstructionConfig, 'source' | 'role'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'inline', content },
    role: 'user',
  })
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
export function assistantInstruction(
  content: string,
  options?: Omit<InstructionConfig, 'source' | 'role'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'inline', content },
    role: 'assistant',
  })
}

/**
 * Create an instruction from a file
 *
 * @example
 * ```typescript
 * const prompt = fileInstruction('prompts/code-review.md');
 * ```
 */
export function fileInstruction(
  path: string,
  options?: Omit<InstructionConfig, 'source'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'file', path },
  })
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
export function templateInstruction(
  name: string,
  variables?: Record<string, unknown>,
  options?: Omit<InstructionConfig, 'source'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'template', name, variables },
  })
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
export function dynamicInstruction(
  generator: (context: InstructionContext) => string | Promise<string>,
  options?: Omit<InstructionConfig, 'source'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'dynamic', generator },
  })
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
export function conditionalInstruction(
  condition: string | ((context: InstructionContext) => boolean),
  content: string,
  options?: Omit<InstructionConfig, 'source' | 'when'>
): Instruction {
  return new Instruction({
    ...options,
    source: { type: 'inline', content },
    when: condition,
  })
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
export function combineInstructions(instructions: Instruction[]): Instruction[] {
  // Sort by priority (higher priority first)
  return [...instructions].sort((a, b) => b.priority - a.priority)
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
export function prompt(config: {
  system?: string | Instruction
  user?: string | Instruction
  examples?: Array<{ user: string; assistant: string }>
  additional?: Instruction[]
}): Instruction[] {
  const instructions: Instruction[] = []

  // Add system instruction
  if (config.system) {
    if (typeof config.system === 'string') {
      instructions.push(systemInstruction(config.system, { priority: 100 }))
    } else {
      instructions.push(config.system)
    }
  }

  // Add examples as few-shot prompts
  if (config.examples) {
    config.examples.forEach((example, index) => {
      instructions.push(userInstruction(example.user, { priority: 50 - index }))
      instructions.push(assistantInstruction(example.assistant, { priority: 50 - index }))
    })
  }

  // Add user instruction
  if (config.user) {
    if (typeof config.user === 'string') {
      instructions.push(userInstruction(config.user, { priority: 0 }))
    } else {
      instructions.push(config.user)
    }
  }

  // Add any additional instructions
  if (config.additional) {
    instructions.push(...config.additional)
  }

  return combineInstructions(instructions)
}

/**
 * Check if a value is an Instruction instance
 */
export function isInstruction(value: unknown): value is Instruction {
  return value instanceof Instruction
}

/**
 * Check if a value is a valid instruction config
 */
export function isInstructionConfig(value: unknown): value is InstructionConfig {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const config = value as Record<string, unknown>
  return typeof config.source === 'object' && config.source !== null
}
