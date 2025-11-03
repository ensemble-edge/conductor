# **Conductor State Management Integration Guide**

## **Overview**

This guide shows how to integrate workflow state management into our Conductor architecture, allowing data sharing across ensemble members without prop drilling.

## **Key Benefits**

✅ **No Prop Drilling** \- Share data between Step 1 and Step 5 without passing through Steps 2-4  
✅ **Selective Access** \- Members only see state they explicitly declare  
✅ **Type Safety** \- Full TypeScript/Zod schema validation  
✅ **Backwards Compatible** \- Existing ensembles work unchanged  
✅ **Observable** \- Track state access patterns for optimization

## **Architecture Changes**

### 1\. Enhanced Ensemble YAML Structure

**Before (Current):**

```
name: process-order
flow:
  - member: validate-customer
    input:
      id: ${input.customerId}
  
  - member: calculate-pricing
    input:
      # Must pass validation through even if not needed
      validation: ${validate-customer.output}
      items: ${input.items}
```

**After (With State Management):**

```
name: process-order

# NEW: Define shared state
state:
  schema:
    customerId: string
    validationResults: object
    totalPrice: number
  initial:
    totalPrice: 0

flow:
  - member: validate-customer
    state:
      use: [customerId]        # Read these state values
      set: [validationResults] # Write these state values
    input:
      id: ${state.customerId}  # Access state directly
  
  - member: calculate-pricing
    state:
      set: [totalPrice]        # Only declares what it writes
    input:
      items: ${input.items}
  
  - member: apply-discount
    state:
      use: [validationResults, totalPrice]  # Access Step 1's results
      set: [totalPrice]
    input:
      tier: ${state.validationResults.tier}
      basePrice: ${state.totalPrice}
```

### 2\. Conductor Runtime Integration

Add to your existing `conductor/runtime/executor.js`:

```javascript
import { StateManager } from './state-manager.js';

export class ConductorExecutor {
  async executeEnsemble(ensemble, input, context) {
    // Create state manager if ensemble has state config
    const stateManager = ensemble.state 
      ? new StateManager(ensemble.state)
      : null;

    // Your existing execution logic with state injection
    for (const step of ensemble.flow) {
      const memberContext = {
        ...context,
        // Inject state context for this member
        ...(stateManager && step.state 
          ? stateManager.createMemberContext(step.member, step.state)
          : {})
      };

      // Execute with state-aware context
      await this.executeMember(step.member, input, memberContext);
    }
  }
}
```

### 3\. Member Implementation Updates

Members can now access state without changing their signatures:

```javascript
// members/validate-customer/index.js
export default async function validateCustomer({ input, state, setState }) {
  // Read from state (only sees declared 'use' keys)
  const customerId = state.customerId;
  
  // Your validation logic
  const validation = await validateCustomerAPI(customerId);
  
  // Write to state (only declared 'set' keys allowed)
  setState({ 
    validationResults: {
      tier: validation.tier,
      valid: validation.isValid
    }
  });
  
  return { success: true };
}
```

## **Migration Path**

### Phase 1: Add State Management Module

1. Copy `state-manager.js` to `conductor/runtime/`  
2. Update `package.json` to ensure Zod is installed  
3. No breaking changes \- existing ensembles continue working

### Phase 2: Update Conductor Runtime

1. Modify executor to check for state config  
2. Inject state context when available  
3. Maintain backward compatibility for stateless ensembles

### Phase 3: Migrate Ensembles Gradually

1. Identify ensembles with prop drilling  
2. Add state config to YAML  
3. Update members to use state instead of passed values  
4. Test with both old and new patterns

## **Example: Migrating Company Intelligence Ensemble**

Your current `company-intelligence.yaml` likely passes data through multiple steps:

```
# Current - with prop drilling
flow:
  - member: fetch-company-data
    input:
      domain: ${input.domain}
  
  - member: analyze-financials
    input:
      company: ${fetch-company-data.output}  # Pass entire company
  
  - member: fetch-competitors
    input:
      company: ${fetch-company-data.output}  # Duplicate passing
      
  - member: generate-report
    input:
      company: ${fetch-company-data.output}     # Triple passing!
      financials: ${analyze-financials.output}
      competitors: ${fetch-competitors.output}
```

With state management:

```
# Enhanced - with shared state
state:
  schema:
    companyData: object
    financialAnalysis: object
    competitorList: array
    
flow:
  - member: fetch-company-data
    state:
      set: [companyData]
    input:
      domain: ${input.domain}
    setState:
      companyData: ${output}
  
  - member: analyze-financials
    state:
      use: [companyData]
      set: [financialAnalysis]
    # No need to pass company data!
  
  - member: fetch-competitors
    state:
      use: [companyData]
      set: [competitorList]
    # Parallel execution, both access shared state
      
  - member: generate-report
    state:
      use: [companyData, financialAnalysis, competitorList]
    # All data available without prop drilling
```

## **Testing State Management**

Add tests for state isolation:

```javascript
// tests/state-management.test.js
import { createStatefulConductor } from '../conductor/runtime';

test('members only access declared state', async () => {
  const ensemble = {
    state: {
      schema: { secret: 'string', public: 'string' },
      initial: { secret: 'hidden', public: 'visible' }
    },
    flow: [
      {
        member: 'restricted-member',
        state: { use: ['public'] }  // Can't see 'secret'
      }
    ]
  };
  
  const conductor = createStatefulConductor(ensemble);
  const context = await conductor.getMemberContext('restricted-member');
  
  expect(context.state.public).toBe('visible');
  expect(context.state.secret).toBeUndefined();
});
```

## **Observability & Debugging**

The state manager provides access patterns for optimization:

```javascript
const result = await conductor.execute(input, { debug: true });

console.log(result.__stateReport);
// {
//   unusedKeys: ['tempData'],  // State defined but never used
//   heavilyUsedKeys: [
//     { key: 'companyData', usage: 12 }  // Optimize this
//   ],
//   memberAccess: {
//     'fetch-company': [
//       { key: 'companyData', operation: 'write', timestamp: ... }
//     ]
//   }
// }
```

## **Performance Considerations**

1. **State Size**: Keep state minimal \- don't store large documents  
2. **KV Integration**: For large state, store in KV and keep references in state  
3. **Caching**: State can be cached at the ensemble level  
4. **Parallel Access**: Multiple members can read state simultaneously

## **Best Practices**

### DO:

- Define minimal state schemas  
- Use state for cross-cutting concerns (user context, config, accumulations)  
- Validate state updates with Zod schemas  
- Document state dependencies in member docs

### DON'T:

- Store large binary data in state (use R2 references)  
- Mutate state directly (always use setState)  
- Access undeclared state keys  
- Use state as a general data bus

## **Integration with Existing Features**

### With Caching

```
flow:
  - member: expensive-calculation
    state:
      set: [cachedResult]
    cache:
      ttl: 3600
      key: ${state.customerId}-calc  # Cache key can use state
```

### With Evaluations

```
- member: grade-output
  state:
    use: [generatedContent]
    set: [qualityScore]
  input:
    content: ${state.generatedContent}
  condition:
    - if: ${state.qualityScore} < 0.7
      retry: true
```

### With Parallel Execution

```
parallel:
  - member: fetch-social
    state: { set: [socialData] }
  - member: fetch-news  
    state: { set: [newsData] }
  # Both run in parallel, write to different state keys
```

## **Rollback Plan**

If issues arise, reverting is simple:

1. Remove state config from YAML  
2. Update members to use passed inputs again  
3. No runtime changes needed \- backward compatible

## **Next Steps**

1. **Review** the state management implementation files  
2. **Test** with a simple ensemble first  
3. **Migrate** one production ensemble as proof of concept  
4. **Monitor** state access patterns  
5. **Optimize** based on usage data

## **Questions?**

The state management system is designed to fit naturally into your Conductor architecture while solving the prop drilling problem. It maintains your core tenets:

- ✅ **Edge-First**: State lives in Worker memory/KV  
- ✅ **Cache Central**: State can be cached  
- ✅ **YAML Truth**: State schema in YAML  
- ✅ **Git-Native**: All config versioned  
- ✅ **Composable**: Members remain independent  
- ✅ **Observable**: Full state access tracking

This enhancement makes complex multi-member ensembles much cleaner while maintaining the simplicity and elegance of your current design.

### Full Example

```
# Conductor Workflow State Management Extension
# This adds stateful workflow capabilities to Ensemble Edge

# Example: Enhanced ensemble with state management
name: process-customer-order
description: Multi-step order processing with shared state

# NEW: Define shared state schema at the ensemble level
state:
  schema:
    # Global state available to all members
    customerId: string
    orderId: string
    processedItems: array
    validationResults: object
    totalPrice: number
    discountApplied: number
  
  # Initial state values
  initial:
    processedItems: []
    validationResults: {}
    totalPrice: 0
    discountApplied: 0

# Member flow with state management
flow:
  - member: validate-customer
    # Member declares what state it needs
    state:
      use: [customerId]
      set: [validationResults]
    input:
      id: ${input.customerId}
    # Member can update state without returning it
    setState:
      validationResults: ${output.validation}
  
  - member: calculate-pricing
    # This member doesn't need customer validation
    # But needs to track total price
    state:
      use: [orderId]
      set: [totalPrice]
    input:
      items: ${input.items}
    setState:
      totalPrice: ${output.total}
  
  - member: apply-discount
    # Can access validation from step 1 without prop drilling
    state:
      use: [validationResults, totalPrice]
      set: [discountApplied, totalPrice]
    input:
      customerTier: ${state.validationResults.tier}
      basePrice: ${state.totalPrice}
    setState:
      discountApplied: ${output.discount}
      totalPrice: ${output.finalPrice}
  
  - member: process-items
    state:
      use: []  # Doesn't need any state
    input:
      items: ${input.items}
  
  - member: generate-invoice
    # Can access all accumulated state
    state:
      use: [customerId, orderId, totalPrice, discountApplied, processedItems]
    input:
      # Mix of direct input and state
      template: ${input.template}
      # State values are available via ${state.*}
      customerId: ${state.customerId}
      total: ${state.totalPrice}
      discount: ${state.discountApplied}

# Output can include final state
output:
  invoice: ${generate-invoice.output.pdf}
  finalState: ${state}  # Expose final state if needed
```

### State Manager Code Example (JS)

```
// conductor/runtime/state-manager.js
// Workflow State Management for Conductor Runtime

import { z } from 'zod';

/**
 * StateManager handles persistent state across ensemble members
 * without requiring prop drilling through intermediate steps
 */
export class StateManager {
  constructor(stateConfig, initialValues = {}) {
    this.schema = this.parseSchema(stateConfig.schema);
    this.state = { ...stateConfig.initial, ...initialValues };
    this.accessLog = new Map(); // Track which members accessed what
  }

  /**
   * Parse YAML schema definition to Zod schema
   */
  parseSchema(schemaConfig) {
    const schemaObj = {};
    for (const [key, type] of Object.entries(schemaConfig)) {
      schemaObj[key] = this.getZodType(type);
    }
    return z.object(schemaObj);
  }

  getZodType(type) {
    const typeMap = {
      'string': z.string(),
      'number': z.number(),
      'boolean': z.boolean(),
      'array': z.array(z.any()),
      'object': z.record(z.any()),
    };
    return typeMap[type] || z.any();
  }

  /**
   * Get state for a specific member based on declared needs
   */
  getStateForMember(memberName, stateConfig) {
    const { use = [] } = stateConfig || {};
    const memberState = {};
    
    // Only provide the state keys the member declared it needs
    for (const key of use) {
      if (key in this.state) {
        memberState[key] = this.state[key];
        this.logAccess(memberName, key, 'read');
      }
    }
    
    return memberState;
  }

  /**
   * Update state from a member
   */
  setStateFromMember(memberName, updates, stateConfig) {
    const { set = [] } = stateConfig || {};
    
    // Only allow updating declared state keys
    const allowedUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (set.includes(key)) {
        allowedUpdates[key] = value;
        this.logAccess(memberName, key, 'write');
      } else {
        console.warn(`Member ${memberName} tried to set undeclared state key: ${key}`);
      }
    }
    
    // Validate updates against schema
    const partialSchema = z.object(
      Object.fromEntries(
        Object.entries(this.schema.shape).filter(([k]) => k in allowedUpdates)
      )
    );
    
    const validated = partialSchema.parse(allowedUpdates);
    this.state = { ...this.state, ...validated };
    
    return this.state;
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Log state access for debugging and optimization
   */
  logAccess(member, key, operation) {
    if (!this.accessLog.has(member)) {
      this.accessLog.set(member, []);
    }
    this.accessLog.get(member).push({ key, operation, timestamp: Date.now() });
  }

  /**
   * Generate access report for optimization insights
   */
  getAccessReport() {
    const report = {
      unusedKeys: [],
      heavilyUsedKeys: [],
      memberAccess: {}
    };

    const keyUsage = {};
    
    for (const [member, accesses] of this.accessLog.entries()) {
      report.memberAccess[member] = accesses;
      for (const { key, operation } of accesses) {
        keyUsage[key] = (keyUsage[key] || 0) + 1;
      }
    }

    // Find unused state keys
    for (const key of Object.keys(this.state)) {
      if (!keyUsage[key]) {
        report.unusedKeys.push(key);
      } else if (keyUsage[key] > 5) {
        report.heavilyUsedKeys.push({ key, usage: keyUsage[key] });
      }
    }

    return report;
  }
}

/**
 * Enhanced Conductor execution with state management
 */
export class StatefulConductor {
  constructor(ensemble, conductor) {
    this.ensemble = ensemble;
    this.conductor = conductor;
    this.stateManager = ensemble.state 
      ? new StateManager(ensemble.state, ensemble.state.initial)
      : null;
  }

  async execute(input, context) {
    const executionContext = {
      input,
      outputs: {},
      state: this.stateManager?.getState() || {},
      context
    };

    for (const step of this.ensemble.flow) {
      const { member, state: memberStateConfig } = step;
      
      // Prepare member context with state access
      const memberContext = {
        ...executionContext,
        state: this.stateManager 
          ? this.stateManager.getStateForMember(member, memberStateConfig)
          : {},
        setState: (updates) => {
          if (this.stateManager && memberStateConfig) {
            return this.stateManager.setStateFromMember(member, updates, memberStateConfig);
          }
          console.warn(`Member ${member} tried to set state but no state config defined`);
          return {};
        }
      };

      // Execute member with state context
      const result = await this.conductor.executeMember(
        member,
        this.resolveMemberInput(step.input, memberContext),
        memberContext
      );

      // Store output for reference
      executionContext.outputs[member] = result;

      // Apply setState if defined in YAML
      if (step.setState && this.stateManager) {
        const stateUpdates = this.resolveStateUpdates(step.setState, result);
        this.stateManager.setStateFromMember(member, stateUpdates, memberStateConfig);
      }
    }

    // Return final output with optional state
    const finalOutput = this.resolveOutput(this.ensemble.output, {
      ...executionContext,
      state: this.stateManager?.getState() || {}
    });

    // Include access report in debug mode
    if (context.debug && this.stateManager) {
      finalOutput.__stateReport = this.stateManager.getAccessReport();
    }

    return finalOutput;
  }

  /**
   * Resolve input values with state interpolation
   */
  resolveMemberInput(inputConfig, context) {
    if (!inputConfig) return {};
    
    const resolved = {};
    for (const [key, value] of Object.entries(inputConfig)) {
      if (typeof value === 'string' && value.startsWith('${state.')) {
        // Extract state value
        const statePath = value.slice(8, -1);
        resolved[key] = this.getNestedValue(context.state, statePath);
      } else if (typeof value === 'string' && value.startsWith('${')) {
        // Handle other interpolations (input, outputs, etc.)
        resolved[key] = this.resolveInterpolation(value, context);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  /**
   * Resolve state updates from member output
   */
  resolveStateUpdates(setStateConfig, memberOutput) {
    const updates = {};
    for (const [key, value] of Object.entries(setStateConfig)) {
      if (typeof value === 'string' && value.startsWith('${output.')) {
        const outputPath = value.slice(9, -1);
        updates[key] = this.getNestedValue(memberOutput, outputPath);
      } else {
        updates[key] = value;
      }
    }
    return updates;
  }

  /**
   * Helper to get nested object values
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  /**
   * Resolve interpolations in strings
   */
  resolveInterpolation(template, context) {
    // Implementation for ${input.*}, ${output.*}, etc.
    // ... (existing interpolation logic)
  }

  resolveOutput(outputConfig, context) {
    // Implementation for final output resolution
    // ... (existing output logic)
  }
}

/**
 * Factory function to create stateful conductor
 */
export function createStatefulConductor(ensembleYaml) {
  const ensemble = parseYAML(ensembleYaml);
  const conductor = new Conductor(); // Your existing conductor
  return new StatefulConductor(ensemble, conductor);
}

/**
 * Member wrapper that provides state access
 */
export function statefulMember(memberFn, stateConfig) {
  return async function(input, context) {
    const { state, setState } = context;
    
    // Execute member with state context
    const result = await memberFn({
      ...input,
      state,
      setState
    });
    
    return result;
  };
}

// Usage Example:
/*
const conductor = createStatefulConductor(ensembleYaml);
const result = await conductor.execute({
  customerId: 'cust-123',
  orderId: 'order-456',
  items: [...]
});

// Access final state if needed
console.log(result.finalState);

// In debug mode, see state access patterns
console.log(result.__stateReport);
*/
```

### State Manager Example (TS)

```
// conductor/runtime/state-manager.ts
// Type-safe Workflow State Management for Conductor Runtime

import { z, ZodSchema } from 'zod';

/**
 * Type definitions for state configuration
 */
export interface StateConfig<T extends ZodSchema = ZodSchema> {
  schema: T;
  initial?: Partial<z.infer<T>>;
}

export interface MemberStateConfig {
  use?: string[];  // State keys this member reads
  set?: string[];  // State keys this member can write
}

export interface StateContext<T> {
  state: Partial<T>;
  setState: (updates: Partial<T>) => void;
}

/**
 * Create a type-safe state manager for ensembles
 */
export class TypedStateManager<T extends z.ZodRawShape> {
  private schema: z.ZodObject<T>;
  private state: z.infer<z.ZodObject<T>>;
  private accessLog: Map<string, Array<{ key: string; operation: 'read' | 'write'; timestamp: number }>>;
  
  constructor(schema: z.ZodObject<T>, initialState?: Partial<z.infer<z.ZodObject<T>>>) {
    this.schema = schema;
    this.state = { ...schema.parse({}), ...initialState };
    this.accessLog = new Map();
  }

  /**
   * Create a scoped state view for a member
   */
  createMemberContext<K extends keyof z.infer<z.ZodObject<T>>>(
    memberName: string,
    config: { use?: K[]; set?: K[] }
  ): StateContext<Pick<z.infer<z.ZodObject<T>>, K>> {
    const { use = [], set = [] } = config;
    
    // Type-safe state getter
    const getState = () => {
      const memberState: any = {};
      for (const key of use) {
        if (key in this.state) {
          memberState[key] = this.state[key as string];
          this.logAccess(memberName, key as string, 'read');
        }
      }
      return memberState;
    };

    // Type-safe state setter
    const setState = (updates: Partial<Pick<z.infer<z.ZodObject<T>>, K>>) => {
      const allowedUpdates: any = {};
      
      for (const key of Object.keys(updates) as K[]) {
        if (set.includes(key)) {
          allowedUpdates[key] = updates[key];
          this.logAccess(memberName, key as string, 'write');
        } else {
          console.warn(`Member ${memberName} tried to set undeclared state key: ${String(key)}`);
        }
      }
      
      // Validate and merge updates
      const partialSchema = this.schema.partial().pick(
        Object.fromEntries(set.map(k => [k, true])) as any
      );
      
      const validated = partialSchema.parse(allowedUpdates);
      this.state = { ...this.state, ...validated };
    };

    return {
      state: getState(),
      setState
    };
  }

  private logAccess(member: string, key: string, operation: 'read' | 'write') {
    if (!this.accessLog.has(member)) {
      this.accessLog.set(member, []);
    }
    this.accessLog.get(member)!.push({ key, operation, timestamp: Date.now() });
  }

  getState(): z.infer<z.ZodObject<T>> {
    return { ...this.state };
  }

  getAccessReport() {
    // Same as JS implementation
    return {
      unusedKeys: Object.keys(this.state).filter(key => 
        ![...this.accessLog.values()].flat().some(access => access.key === key)
      ),
      memberAccess: Object.fromEntries(this.accessLog)
    };
  }
}

/**
 * Ensemble definition with state management
 */
export interface StatefulEnsemble<TState extends z.ZodRawShape = any> {
  name: string;
  description?: string;
  state?: {
    schema: z.ZodObject<TState>;
    initial?: Partial<z.infer<z.ZodObject<TState>>>;
  };
  flow: Array<{
    member: string;
    state?: MemberStateConfig;
    input?: Record<string, any>;
    setState?: Record<string, string>;
  }>;
  output?: Record<string, any>;
}

/**
 * Create a type-safe ensemble with state management
 */
export function createStatefulEnsemble<TState extends z.ZodRawShape>(
  config: StatefulEnsemble<TState>
): StatefulEnsembleExecutor<TState> {
  return new StatefulEnsembleExecutor(config);
}

/**
 * Executor for stateful ensembles
 */
export class StatefulEnsembleExecutor<TState extends z.ZodRawShape> {
  private ensemble: StatefulEnsemble<TState>;
  private stateManager?: TypedStateManager<TState>;

  constructor(ensemble: StatefulEnsemble<TState>) {
    this.ensemble = ensemble;
    if (ensemble.state) {
      this.stateManager = new TypedStateManager(
        ensemble.state.schema,
        ensemble.state.initial
      );
    }
  }

  async execute(input: Record<string, any>, context?: any) {
    const outputs: Record<string, any> = {};

    for (const step of this.ensemble.flow) {
      // Get state context for this member
      const memberStateContext = this.stateManager && step.state
        ? this.stateManager.createMemberContext(step.member, step.state as any)
        : { state: {}, setState: () => {} };

      // Execute member with state
      const memberInput = this.resolveInput(step.input || {}, {
        input,
        outputs,
        state: memberStateContext.state
      });

      const result = await this.executeMember(
        step.member,
        memberInput,
        memberStateContext
      );

      outputs[step.member] = result;

      // Apply setState from config
      if (step.setState && this.stateManager) {
        const updates = this.resolveStateUpdates(step.setState, result);
        memberStateContext.setState(updates as any);
      }
    }

    return {
      ...this.resolveOutput(this.ensemble.output || {}, {
        input,
        outputs,
        state: this.stateManager?.getState() || {}
      }),
      __state: this.stateManager?.getState(),
      __stateReport: this.stateManager?.getAccessReport()
    };
  }

  private async executeMember(
    name: string,
    input: any,
    stateContext: StateContext<any>
  ): Promise<any> {
    // This would call your actual member execution logic
    console.log(`Executing member: ${name}`, { input, state: stateContext.state });
    
    // Mock implementation - replace with actual member execution
    return { success: true, data: input };
  }

  private resolveInput(config: Record<string, any>, context: any): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.includes('${')) {
        resolved[key] = this.interpolate(value, context);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  private resolveStateUpdates(config: Record<string, string>, output: any): Record<string, any> {
    const updates: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(config)) {
      if (value.startsWith('${output.')) {
        const path = value.slice(9, -1);
        updates[key] = this.getNestedValue(output, path);
      }
    }
    
    return updates;
  }

  private resolveOutput(config: Record<string, any>, context: any): Record<string, any> {
    return this.resolveInput(config, context);
  }

  private interpolate(template: string, context: any): any {
    const regex = /\$\{([^}]+)\}/g;
    let match;
    let result = template;
    
    while ((match = regex.exec(template)) !== null) {
      const path = match[1];
      const value = this.getNestedValue(context, path);
      result = result.replace(match[0], value);
    }
    
    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}

/**
 * Example Usage with Type Safety
 */

// Define your state schema
const orderProcessingState = z.object({
  customerId: z.string(),
  orderId: z.string(),
  processedItems: z.array(z.string()),
  validationResults: z.object({
    tier: z.string(),
    valid: z.boolean()
  }).optional(),
  totalPrice: z.number(),
  discountApplied: z.number()
});

// Create type-safe ensemble
const orderEnsemble = createStatefulEnsemble({
  name: 'process-order',
  state: {
    schema: orderProcessingState,
    initial: {
      processedItems: [],
      totalPrice: 0,
      discountApplied: 0
    }
  },
  flow: [
    {
      member: 'validate-customer',
      state: {
        use: ['customerId'],
        set: ['validationResults']
      },
      input: {
        id: '${input.customerId}'
      }
    },
    {
      member: 'calculate-pricing',
      state: {
        use: ['orderId'],
        set: ['totalPrice']
      },
      input: {
        items: '${input.items}'
      }
    },
    {
      member: 'apply-discount',
      state: {
        use: ['validationResults', 'totalPrice'],
        set: ['discountApplied', 'totalPrice']
      },
      input: {
        tier: '${state.validationResults.tier}',
        basePrice: '${state.totalPrice}'
      }
    }
  ],
  output: {
    finalPrice: '${state.totalPrice}',
    discount: '${state.discountApplied}'
  }
});

// Execute with full type safety
// const result = await orderEnsemble.execute({
//   customerId: 'cust-123',
//   orderId: 'order-456',
//   items: [...]
// });

```

## 