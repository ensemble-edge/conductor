/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */
import { Parser, } from './parser.js';
/**
 * Type guard to check if a flow step is an agent step (not a control flow step)
 */
function isAgentStep(step) {
    return 'agent' in step && typeof step.agent === 'string';
}
import { StateManager } from './state-manager.js';
import { FunctionAgent } from '../agents/function-agent.js';
import { CodeAgent } from '../agents/code-agent.js';
import { ThinkAgent } from '../agents/think-agent.js';
import { StorageAgent } from '../agents/storage-agent.js';
import { DataAgent } from '../agents/data-agent.js';
import { APIAgent } from '../agents/api-agent.js';
import { EmailAgent } from '../agents/email/email-agent.js';
import { SmsMember } from '../agents/sms/sms-agent.js';
import { FormAgent } from '../agents/form/form-agent.js';
import { HtmlMember } from '../agents/html/html-agent.js';
import { PdfMember } from '../agents/pdf/pdf-agent.js';
import { getBuiltInRegistry } from '../agents/built-in/registry.js';
import { Result } from '../types/result.js';
import { Errors, AgentExecutionError, EnsembleExecutionError, } from '../errors/error-types.js';
import { Operation } from '../types/constants.js';
import { ScoringExecutor, EnsembleScorer, } from './scoring/index.js';
import { createLogger, createObservabilityManager, generateExecutionId, } from '../observability/index.js';
import { NotificationManager } from './notifications/index.js';
import { hasGlobalScriptLoader, getGlobalScriptLoader, parseScriptURI, isScriptReference, } from '../utils/script-loader.js';
/**
 * Core execution engine for ensembles with Result-based error handling
 */
export class Executor {
    constructor(config) {
        this.env = config.env;
        this.ctx = config.ctx;
        this.agentRegistry = new Map();
        this.observabilityConfig = config.observability;
        this.requestId = config.requestId;
        this.auth = config.auth;
        this.logger = config.logger || createLogger({ serviceName: 'executor' }, this.env.ANALYTICS);
    }
    /**
     * Register an agent for use in ensembles
     */
    registerAgent(agent) {
        this.agentRegistry.set(agent.getName(), agent);
    }
    /**
     * Resolve an agent by reference with explicit error handling
     * Supports both simple names and versioned references (name@version)
     *
     * Loading priority:
     * 1. Check built-in agents (scrape, validate, rag, hitl, fetch)
     * 2. Check user-defined agents (registered via registerAgent)
     * 3. Error if not found
     *
     * @param agentRef - Agent reference (e.g., "greet" or "analyze-company@production")
     * @returns Result containing the agent or an error
     */
    async resolveAgent(agentRef) {
        const { name, version } = Parser.parseAgentReference(agentRef);
        // If no version specified, check both built-in and user registries
        if (!version) {
            // 1. Check if it's a built-in agent first
            const builtInRegistry = getBuiltInRegistry();
            if (builtInRegistry.isBuiltIn(name)) {
                try {
                    // Create a minimal AgentConfig for built-in agents
                    const config = {
                        name: name,
                        operation: builtInRegistry.getMetadata(name)?.operation || Operation.code,
                        config: {},
                    };
                    const agent = await builtInRegistry.create(name, config, this.env);
                    return Result.ok(agent);
                }
                catch (error) {
                    return Result.err(Errors.agentConfig(name, `Failed to load built-in agent: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            }
            // 2. Check user-defined agent registry
            const agent = this.agentRegistry.get(name);
            if (!agent) {
                return Result.err(Errors.agentNotFound(name));
            }
            return Result.ok(agent);
        }
        // Version specified - check cache first
        const versionedKey = `${name}@${version}`;
        if (this.agentRegistry.has(versionedKey)) {
            const agent = this.agentRegistry.get(versionedKey);
            return Result.ok(agent);
        }
        // Try to load from local registry (Edgit not yet integrated)
        const localAgent = this.agentRegistry.get(name);
        if (localAgent) {
            // Cache it under versioned key
            this.agentRegistry.set(versionedKey, localAgent);
            return Result.ok(localAgent);
        }
        // Not found
        return Result.err(Errors.agentConfig(agentRef, 'Versioned agent loading requires Edgit integration. ' +
            'Register agents manually using executor.registerAgent()'));
    }
    /**
     * Create an agent instance from config
     * Used for dynamically loading agents from Edgit
     */
    createAgentFromConfig(config) {
        switch (config.operation) {
            case Operation.think:
                return Result.ok(new ThinkAgent(config));
            case Operation.storage:
                return Result.ok(new StorageAgent(config));
            case Operation.data:
                return Result.ok(new DataAgent(config));
            case Operation.http:
                return Result.ok(new APIAgent(config));
            case Operation.email:
                return Result.ok(new EmailAgent(config));
            case Operation.sms:
                return Result.ok(new SmsMember(config));
            case Operation.form:
                return Result.ok(new FormAgent(config));
            case Operation.html:
                return Result.ok(new HtmlMember(config));
            case Operation.pdf:
                return Result.ok(new PdfMember(config));
            case Operation.code:
                // Try to create CodeAgent (supports both inline and script:// URIs)
                const codeAgent = CodeAgent.fromConfig(config);
                if (codeAgent) {
                    return Result.ok(codeAgent);
                }
                // Fallback to FunctionAgent for backwards compatibility
                const inlineAgent = FunctionAgent.fromConfig(config);
                if (inlineAgent) {
                    return Result.ok(inlineAgent);
                }
                return Result.err(Errors.agentConfig(config.name, 'Code agents require either a script:// URI or an inline handler function'));
            case Operation.tools:
                return Result.err(Errors.agentConfig(config.name, 'MCP agent type not yet implemented'));
            case Operation.scoring:
                return Result.err(Errors.agentConfig(config.name, 'Scoring agent type not yet implemented'));
            default:
                return Result.err(Errors.agentConfig(config.name, `Unknown agent operation: ${config.operation}`));
        }
    }
    /**
     * Execute a single flow step with all associated logic
     * Only handles AgentFlowStep - control flow steps should use GraphExecutor
     * @private
     */
    async executeStep(step, flowContext, stepIndex) {
        const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, scoringExecutor, } = flowContext;
        const agentStartTime = Date.now();
        // Resolve input interpolations
        let resolvedInput;
        if (step.input) {
            // User specified explicit input mapping
            resolvedInput = Parser.resolveInterpolation(step.input, executionContext);
        }
        else if (stepIndex > 0 && ensemble.flow) {
            // Default to previous agent's output for chaining
            const previousStep = ensemble.flow[stepIndex - 1];
            const previousAgentName = isAgentStep(previousStep) ? previousStep.agent : undefined;
            if (previousAgentName) {
                const previousResult = executionContext[previousAgentName];
                resolvedInput = previousResult?.output || {};
            }
            else {
                resolvedInput = executionContext.input || {};
            }
        }
        else {
            // First step with no input - use original ensemble input
            resolvedInput = executionContext.input || {};
        }
        // Resolve agent - error handling is explicit
        const agentResult = await this.resolveAgent(step.agent);
        if (!agentResult.success) {
            return Result.err(new EnsembleExecutionError(ensemble.name, step.agent, agentResult.error));
        }
        const agent = agentResult.value;
        // Create scoped observability for this agent
        const agentObservability = flowContext.observability.forAgent(step.agent, stepIndex);
        const agentLogger = agentObservability.getLogger();
        const agentMetrics = agentObservability.getMetrics();
        // Log agent start if configured
        if (flowContext.observability.shouldLogEvent('agent:start')) {
            agentLogger.info('Agent execution started', {
                agentName: step.agent,
                stepIndex,
                ensembleName: ensemble.name,
            });
        }
        // Create agent execution context with observability
        const agentContext = {
            input: resolvedInput,
            env: this.env,
            ctx: this.ctx,
            previousOutputs: executionContext,
            logger: agentLogger,
            metrics: agentMetrics,
            executionId: flowContext.executionId,
            requestId: this.requestId,
            auth: this.auth,
        };
        // Add state context if available and track updates
        let getPendingUpdates = null;
        if (stateManager && step.state) {
            const { context, getPendingUpdates: getUpdates } = stateManager.getStateForAgent(step.agent, step.state);
            agentContext.state = context.state;
            agentContext.setState = context.setState;
            getPendingUpdates = getUpdates;
        }
        // Execute agent (with scoring if configured)
        let response;
        let scoringResult;
        if (step.scoring && scoringState && ensembleScorer) {
            // Execute with scoring and retry logic
            const scoringConfig = step.scoring;
            const scoredResult = await scoringExecutor.executeWithScoring(
            // Agent execution function
            async () => {
                const resp = await agent.execute(agentContext);
                // Apply state updates after each attempt
                if (stateManager && getPendingUpdates) {
                    const { updates, newLog } = getPendingUpdates();
                    flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
                }
                return resp;
            }, 
            // Evaluator function
            async (output, attempt, previousScore) => {
                // Resolve the evaluator agent
                const evaluatorResult = await this.resolveAgent(scoringConfig.evaluator);
                if (!evaluatorResult.success) {
                    throw new Error(`Failed to resolve evaluator agent: ${evaluatorResult.error.message}`);
                }
                const evaluator = evaluatorResult.value;
                // Create evaluation context with the output to score
                const evalContext = {
                    input: {
                        output: output.success ? output.data : null,
                        attempt,
                        previousScore,
                        criteria: scoringConfig.criteria || ensemble.scoring?.criteria,
                    },
                    env: this.env,
                    ctx: this.ctx,
                    previousOutputs: executionContext,
                };
                // Execute evaluator
                const evalResponse = await evaluator.execute(evalContext);
                if (!evalResponse.success) {
                    throw new Error(`Evaluator failed: ${evalResponse.error || 'Unknown error'}`);
                }
                // Parse evaluator output as ScoringResult
                const evalData = evalResponse.data;
                const score = typeof evalData === 'number'
                    ? evalData
                    : typeof evalData === 'object' && evalData !== null && 'score' in evalData
                        ? evalData.score
                        : typeof evalData === 'object' && evalData !== null && 'value' in evalData
                            ? evalData.value
                            : 0;
                const threshold = scoringConfig.thresholds?.minimum || ensemble.scoring?.defaultThresholds?.minimum || 0.7;
                return {
                    score,
                    passed: score >= threshold,
                    feedback: typeof evalData === 'object' && evalData !== null && 'feedback' in evalData
                        ? String(evalData.feedback)
                        : typeof evalData === 'object' && evalData !== null && 'message' in evalData
                            ? String(evalData.message)
                            : '',
                    breakdown: typeof evalData === 'object' && evalData !== null && 'breakdown' in evalData
                        ? evalData.breakdown
                        : {},
                    metadata: {
                        attempt,
                        evaluator: scoringConfig.evaluator,
                        timestamp: Date.now(),
                    },
                };
            }, scoringConfig);
            // Extract response and scoring result
            response = scoredResult.output;
            scoringResult = scoredResult.score;
            // Update scoring state
            scoringState.scoreHistory.push({
                agent: step.agent,
                score: scoringResult.score,
                passed: scoringResult.passed,
                feedback: scoringResult.feedback,
                breakdown: scoringResult.breakdown,
                timestamp: Date.now(),
                attempt: scoredResult.attempts,
            });
            // Track retry count
            scoringState.retryCount[step.agent] = scoredResult.attempts - 1;
            // Handle scoring status
            if (scoredResult.status === 'max_retries_exceeded') {
                this.logger.warn('Agent exceeded max retries', {
                    agentName: step.agent,
                    score: scoringResult.score,
                    attempts: scoredResult.attempts,
                    ensembleName: ensemble.name,
                });
            }
        }
        else {
            // Normal execution without scoring
            response = await agent.execute(agentContext);
            // Apply pending state updates
            if (stateManager && getPendingUpdates) {
                const { updates, newLog } = getPendingUpdates();
                flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
            }
        }
        // Track metrics
        const agentDuration = Date.now() - agentStartTime;
        metrics.agents.push({
            name: step.agent,
            duration: agentDuration,
            cached: response.cached,
            success: response.success,
        });
        if (response.cached) {
            metrics.cacheHits++;
            // Log cache hit if configured
            if (flowContext.observability.shouldLogEvent('cache:hit')) {
                agentLogger.debug('Cache hit', { agentName: step.agent });
            }
            // Record cache metric
            agentMetrics.recordCachePerformance(true, step.agent);
        }
        else {
            // Record cache miss metric
            agentMetrics.recordCachePerformance(false, step.agent);
        }
        // Record agent execution metric
        agentMetrics.recordAgentExecution(step.agent, agentDuration, response.success, response.cached);
        // Handle agent execution errors explicitly
        if (!response.success) {
            // Log agent error if configured
            if (flowContext.observability.shouldLogEvent('agent:error')) {
                agentLogger.error('Agent execution failed', new Error(response.error || 'Unknown error'), {
                    agentName: step.agent,
                    durationMs: agentDuration,
                    stepIndex,
                });
            }
            // Record error metric
            agentMetrics.recordError('AgentExecutionError', step.agent);
            return Result.err(new AgentExecutionError(step.agent, response.error || 'Unknown error', undefined));
        }
        // Log agent completion if configured
        if (flowContext.observability.shouldLogEvent('agent:complete')) {
            agentLogger.info('Agent execution completed', {
                agentName: step.agent,
                durationMs: agentDuration,
                stepIndex,
                cached: response.cached,
            });
        }
        // Store agent output in context for future interpolations
        // Use step ID if provided, otherwise use agent name
        const contextKey = step.id || step.agent;
        executionContext[contextKey] = {
            output: response.data,
        };
        // Update state context with new state from immutable StateManager
        if (flowContext.stateManager) {
            executionContext.state = flowContext.stateManager.getState();
        }
        // Update scoring context for interpolations
        if (scoringState) {
            executionContext.scoring = scoringState;
        }
        return Result.ok(undefined);
    }
    /**
     * Execute ensemble flow from a given step
     * @private
     */
    async executeFlow(flowContext, startStep = 0) {
        const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, startTime, } = flowContext;
        // Execute flow steps sequentially from startStep
        if (!ensemble.flow || ensemble.flow.length === 0) {
            return Result.err(new EnsembleExecutionError(ensemble.name, 'validation', new Error('Ensemble has no flow steps defined')));
        }
        for (let i = startStep; i < ensemble.flow.length; i++) {
            const step = ensemble.flow[i];
            // Only process agent steps - control flow steps (parallel, branch, etc.)
            // should use GraphExecutor for proper handling
            if (!isAgentStep(step)) {
                return Result.err(new EnsembleExecutionError(ensemble.name, 'flow', new Error(`Control flow step type "${step.type}" requires GraphExecutor. ` +
                    `Use GraphExecutor.execute() for ensembles with parallel, branch, foreach, try, switch, while, or map-reduce steps.`)));
            }
            const stepResult = await this.executeStep(step, flowContext, i);
            if (!stepResult.success) {
                return Result.err(stepResult.error);
            }
        }
        // Calculate final ensemble score if scoring was enabled
        if (scoringState && ensembleScorer && scoringState.scoreHistory.length > 0) {
            scoringState.finalScore = ensembleScorer.calculateEnsembleScore(scoringState.scoreHistory);
            scoringState.qualityMetrics = ensembleScorer.calculateQualityMetrics(scoringState.scoreHistory);
        }
        // Resolve final output
        let finalOutput;
        if (ensemble.output) {
            // User specified output interpolation
            finalOutput = Parser.resolveInterpolation(ensemble.output, executionContext);
        }
        else if (ensemble.flow.length > 0) {
            // Default to last agent's output
            const lastStep = ensemble.flow[ensemble.flow.length - 1];
            const lastMemberName = isAgentStep(lastStep) ? lastStep.agent : undefined;
            if (lastMemberName) {
                const lastResult = executionContext[lastMemberName];
                finalOutput = lastResult?.output;
            }
            else {
                finalOutput = {};
            }
        }
        else {
            // No flow steps - return empty
            finalOutput = {};
        }
        // Calculate total duration
        metrics.totalDuration = Date.now() - startTime;
        // Get state report if available
        const stateReport = flowContext.stateManager?.getAccessReport();
        // Build execution output with scoring data
        const executionOutput = {
            output: finalOutput,
            metrics,
            stateReport,
        };
        // Add scoring data if available
        if (scoringState) {
            executionOutput.scoring = scoringState;
        }
        return Result.ok(executionOutput);
    }
    /**
     * Register inline agents defined in an ensemble's agents array
     *
     * Supports:
     * 1. script:// URIs - Resolved from bundled scripts (Works in Workers!)
     * 2. Pre-compiled handlers - Function objects passed in config.handler
     * 3. Inline code strings - DEPRECATED, only works in test environments
     *
     * @private
     */
    registerInlineAgents(ensemble) {
        if (!ensemble.agents || ensemble.agents.length === 0) {
            return;
        }
        for (const agentDef of ensemble.agents) {
            // Skip if not a valid agent definition object
            if (typeof agentDef !== 'object' || agentDef === null) {
                continue;
            }
            const name = agentDef.name;
            const operation = agentDef.operation;
            const config = agentDef.config;
            if (!name || !operation) {
                this.logger.warn('Skipping inline agent without name or operation', { agentDef });
                continue;
            }
            // Skip if already registered
            if (this.agentRegistry.has(name)) {
                this.logger.debug('Inline agent already registered', { name });
                continue;
            }
            // Build AgentConfig from the inline definition
            const agentConfig = {
                name,
                operation: operation,
                config: config || {},
            };
            // Handle code/function operations
            if (operation === Operation.code || operation === 'function') {
                const scriptRef = config?.script;
                const inlineCode = config?.code || config?.function;
                const precompiledHandler = config?.handler;
                // Priority 1: Script reference - resolve from bundled scripts
                // Supports both formats: "script://path" and "scripts/path"
                if (isScriptReference(scriptRef)) {
                    try {
                        const handler = this.resolveScriptHandler(scriptRef, name);
                        agentConfig.config = { ...config, handler };
                    }
                    catch (error) {
                        this.logger.error('Failed to resolve script', error instanceof Error ? error : undefined, { name, scriptRef });
                        continue;
                    }
                }
                // Priority 2: Pre-compiled handler function (already a function object)
                else if (typeof precompiledHandler === 'function') {
                    // Handler is already compiled, nothing to do
                    this.logger.debug('Using pre-compiled handler', { name });
                }
                // Priority 3: Inline code string - NOT SUPPORTED
                // Inline code uses new Function() which is blocked in Cloudflare Workers
                else if (typeof inlineCode === 'string') {
                    this.logger.error('Inline code is not supported', new Error(`Agent "${name}" uses inline code (config.code) which is not supported.\n` +
                        `Cloudflare Workers block new Function() and eval() for security.\n\n` +
                        `To fix this, migrate to bundled scripts:\n` +
                        `1. Create a file: scripts/${name}.ts\n` +
                        `2. Export your function: export default async function(context) { ... }\n` +
                        `3. Update your ensemble to use: config.script: "scripts/${name}"\n\n` +
                        `See: https://docs.ensemble.ai/conductor/guides/migrate-inline-code`), { name });
                    continue;
                }
            }
            // Create and register the agent
            const agentResult = this.createAgentFromConfig(agentConfig);
            if (agentResult.success) {
                this.agentRegistry.set(name, agentResult.value);
                this.logger.debug('Registered inline agent', { name, operation });
            }
            else {
                this.logger.warn('Failed to create inline agent', {
                    name,
                    error: agentResult.error.message,
                });
            }
        }
    }
    /**
     * Resolve a script:// URI to a handler function from bundled scripts
     * @private
     */
    resolveScriptHandler(scriptUri, agentName) {
        if (!hasGlobalScriptLoader()) {
            const scriptPath = parseScriptURI(scriptUri);
            throw new Error(`Cannot resolve script "${scriptUri}" for agent "${agentName}".\n\n` +
                `Script loader not initialized. For Cloudflare Workers:\n` +
                `1. Ensure scripts/${scriptPath}.ts exists with a default export\n` +
                `2. Initialize the script loader in your worker entry:\n\n` +
                `   import { scriptsMap } from 'virtual:conductor-scripts'\n` +
                `   import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'\n` +
                `   setGlobalScriptLoader(createScriptLoader(scriptsMap))`);
        }
        const scriptLoader = getGlobalScriptLoader();
        const handler = scriptLoader.resolve(scriptUri);
        // Wrap to match expected signature (handler receives full context)
        return async (context) => {
            return handler(context);
        };
    }
    /**
     * Execute an ensemble with Result-based error handling
     * @param ensemble - Parsed ensemble configuration
     * @param input - Input data for the ensemble
     * @returns Result containing execution output or error
     */
    async executeEnsemble(ensemble, input) {
        const startTime = Date.now();
        const executionId = generateExecutionId();
        // Initialize observability for this execution
        const observability = createObservabilityManager(this.observabilityConfig, {
            requestId: this.requestId,
            executionId,
            ensembleName: ensemble.name,
            environment: this.env.ENVIRONMENT,
        }, this.env.ANALYTICS);
        const ensembleLogger = observability.getLogger();
        const ensembleMetrics = observability.getMetrics();
        // Log ensemble start if configured
        if (observability.shouldLogEvent('ensemble:start')) {
            ensembleLogger.info('Ensemble execution started', {
                ensembleName: ensemble.name,
                executionId,
            });
        }
        const metrics = {
            ensemble: ensemble.name,
            totalDuration: 0,
            agents: [],
            cacheHits: 0,
        };
        // Register inline agents from the ensemble's agents array
        // This enables ensembles to define agents with inline code that work without
        // separate agent files (e.g., operation: code with config.code)
        this.registerInlineAgents(ensemble);
        // Send execution.started notification (fire and forget)
        this.ctx.waitUntil(NotificationManager.emitExecutionStarted(ensemble, executionId, input, this.env));
        // Initialize state manager if configured
        const stateManager = ensemble.state ? new StateManager(ensemble.state) : null;
        // Initialize scoring if enabled
        let scoringState = null;
        let ensembleScorer = null;
        const scoringExecutor = new ScoringExecutor();
        if (ensemble.scoring?.enabled) {
            ensembleScorer = new EnsembleScorer(ensemble.scoring);
            scoringState = {
                scoreHistory: [],
                retryCount: {},
                qualityMetrics: undefined,
                finalScore: undefined,
            };
        }
        // Context for resolving interpolations
        const executionContext = {
            input,
            state: stateManager ? stateManager.getState() : {},
            scoring: scoringState || {},
        };
        // Create flow execution context with observability
        const flowContext = {
            ensemble,
            executionContext,
            metrics,
            stateManager,
            scoringState,
            ensembleScorer,
            scoringExecutor,
            startTime,
            observability,
            executionId,
        };
        // Execute flow from the beginning
        const result = await this.executeFlow(flowContext, 0);
        // Record ensemble execution metric
        const totalDuration = Date.now() - startTime;
        ensembleMetrics.recordEnsembleExecution(ensemble.name, totalDuration, result.success);
        // Log ensemble completion/error
        if (result.success) {
            if (observability.shouldLogEvent('ensemble:complete')) {
                ensembleLogger.info('Ensemble execution completed', {
                    ensembleName: ensemble.name,
                    executionId,
                    durationMs: totalDuration,
                    agentCount: metrics.agents.length,
                    cacheHits: metrics.cacheHits,
                });
            }
        }
        else {
            if (observability.shouldLogEvent('ensemble:error')) {
                ensembleLogger.error('Ensemble execution failed', result.error, {
                    ensembleName: ensemble.name,
                    executionId,
                    durationMs: totalDuration,
                });
            }
            ensembleMetrics.recordError('EnsembleExecutionError', result.error.code);
        }
        // Send notifications based on result
        if (result.success) {
            // execution.completed
            this.ctx.waitUntil(NotificationManager.emitExecutionCompleted(ensemble, executionId, result.value.output, result.value.metrics.totalDuration, this.env));
        }
        else {
            // execution.failed
            const error = new Error(result.error.message);
            error.stack = result.error.stack;
            this.ctx.waitUntil(NotificationManager.emitExecutionFailed(ensemble, executionId, error, Date.now() - startTime, this.env));
        }
        return result;
    }
    /**
     * Load and execute an ensemble from YAML with Result-based error handling
     */
    async executeFromYAML(yamlContent, input) {
        // Parse YAML
        const parseResult = Result.fromThrowable(() => Parser.parseEnsemble(yamlContent));
        if (!parseResult.success) {
            return Result.err(Errors.ensembleParse('unknown', parseResult.error.message));
        }
        const ensemble = parseResult.value;
        // Validate agent references
        const availableMembers = new Set(this.agentRegistry.keys());
        const validationResult = Result.fromThrowable(() => Parser.validateAgentReferences(ensemble, availableMembers));
        if (!validationResult.success) {
            return Result.err(Errors.ensembleParse(ensemble.name, validationResult.error.message));
        }
        // Execute the ensemble
        return await this.executeEnsemble(ensemble, input);
    }
    /**
     * Get all registered agent names (both built-in and user-defined)
     */
    getRegisteredMembers() {
        const builtInRegistry = getBuiltInRegistry();
        const builtInNames = builtInRegistry.getAvailableNames();
        const userDefinedNames = Array.from(this.agentRegistry.keys());
        // Combine both, user-defined agents take precedence (can override built-in)
        const allNames = new Set([...builtInNames, ...userDefinedNames]);
        return Array.from(allNames);
    }
    /**
     * Check if a agent is registered (checks both built-in and user-defined)
     */
    hasMember(agentName) {
        const builtInRegistry = getBuiltInRegistry();
        return builtInRegistry.isBuiltIn(agentName) || this.agentRegistry.has(agentName);
    }
    /**
     * Get all built-in agent metadata
     */
    getBuiltInMembers() {
        const builtInRegistry = getBuiltInRegistry();
        return builtInRegistry.list();
    }
    /**
     * Resume execution from suspended state
     * Used for HITL approval workflows and webhook resumption
     */
    async resumeExecution(suspendedState, resumeInput) {
        const ensemble = suspendedState.ensemble;
        const executionContext = suspendedState.executionContext;
        // Merge resume input if provided (e.g., HITL approval data)
        if (resumeInput) {
            executionContext.resumeInput = resumeInput;
        }
        // Restore state manager if it existed
        let stateManager = null;
        if (suspendedState.stateSnapshot) {
            // Create state manager from snapshot
            if (ensemble.state) {
                stateManager = new StateManager(ensemble.state);
                // TODO: Restore state from snapshot
                // This requires StateManager to support state restoration
            }
        }
        // Restore scoring state if it existed
        let scoringState = null;
        let ensembleScorer = null;
        const scoringExecutor = new ScoringExecutor();
        if (suspendedState.scoringSnapshot) {
            scoringState = suspendedState.scoringSnapshot;
            if (ensemble.scoring?.enabled) {
                ensembleScorer = new EnsembleScorer(ensemble.scoring);
            }
        }
        // Restore metrics
        const metrics = {
            ensemble: ensemble.name,
            totalDuration: 0,
            agents: suspendedState.metrics.agents || [],
            cacheHits: suspendedState.metrics.cacheHits || 0,
        };
        const startTime = suspendedState.metrics.startTime || Date.now();
        // Update execution context with restored state
        if (stateManager) {
            executionContext.state = stateManager.getState();
        }
        if (scoringState) {
            executionContext.scoring = scoringState;
        }
        // Restore or generate execution ID
        const executionId = suspendedState.executionId || generateExecutionId();
        // Initialize observability for resumed execution
        const observability = createObservabilityManager(this.observabilityConfig, {
            requestId: this.requestId,
            executionId,
            ensembleName: ensemble.name,
            environment: this.env.ENVIRONMENT,
        }, this.env.ANALYTICS);
        // Create flow execution context
        const flowContext = {
            ensemble,
            executionContext,
            metrics,
            stateManager,
            scoringState,
            ensembleScorer,
            scoringExecutor,
            startTime,
            observability,
            executionId,
        };
        // Resume from the specified step
        const resumeFromStep = suspendedState.resumeFromStep;
        // Execute flow from the resume point
        return await this.executeFlow(flowContext, resumeFromStep);
    }
}
