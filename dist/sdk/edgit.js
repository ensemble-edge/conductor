/**
 * SDK Edgit Integration
 *
 * Helpers for loading components from Edgit
 */
import { Parser } from '../runtime/parser.js';
/**
 * Load a component from Edgit (prompts, queries, templates, etc.)
 *
 * @example
 * ```typescript
 * const prompt = await loadComponent('extraction-prompt@v1.0.0', env);
 * ```
 */
export async function loadComponent(componentRef, env) {
    // Parse component reference (name@version or name@deployment)
    const [name, version] = componentRef.split('@');
    if (!name || !version) {
        throw new Error(`Invalid component reference: ${componentRef}`);
    }
    // TODO: Integrate with Edgit once it's published
    // For now, this is a placeholder showing the interface
    // Expected Edgit integration:
    // import { Edgit } from '@ensemble-edge/edgit';
    // const edgit = new Edgit({ env });
    // return await edgit.getComponent(name, version);
    throw new Error('Edgit integration not yet implemented. Install @ensemble-edge/edgit when available.');
}
/**
 * Load a member configuration from Edgit
 *
 * This loads versioned member.yaml files, enabling configuration-only deployments
 * and A/B testing without code changes.
 *
 * @example
 * ```typescript
 * // Load specific version
 * const config = await loadMemberConfig('analyze-company@v1.0.0', env);
 *
 * // Load production deployment
 * const config = await loadMemberConfig('analyze-company@production', env);
 * ```
 */
export async function loadMemberConfig(memberRef, env) {
    const { name, version } = Parser.parseMemberReference(memberRef);
    if (!version) {
        throw new Error(`Member reference must include version: ${memberRef}`);
    }
    // TODO: Integrate with Edgit once it's published
    // Expected flow:
    // 1. Load member.yaml content from Edgit
    // 2. Parse YAML to get MemberConfig
    // 3. If config references versioned prompts, load those too
    // 4. Return complete, resolved MemberConfig
    // Expected Edgit integration:
    // import { Edgit } from '@ensemble-edge/edgit';
    // const edgit = new Edgit({ env });
    // const yamlContent = await edgit.getComponent(name, version);
    // const config = Parser.parseMember(yamlContent);
    //
    // // If config has prompt reference, resolve it
    // if (config.config?.prompt) {
    //   const promptContent = await loadComponent(config.config.prompt, env);
    //   config.config.systemPrompt = promptContent;
    // }
    //
    // return config;
    throw new Error(`Edgit integration not yet implemented. Cannot load member config: ${memberRef}. ` +
        `Install @ensemble-edge/edgit when available.`);
}
/**
 * Load component metadata
 */
export async function loadComponentMetadata(componentRef, env) {
    const [name, version] = componentRef.split('@');
    // TODO: Integrate with Edgit
    throw new Error('Edgit integration not yet implemented');
}
/**
 * List available component versions
 */
export async function listComponentVersions(componentName, env) {
    // TODO: Integrate with Edgit
    throw new Error('Edgit integration not yet implemented');
}
/**
 * Get component deployment
 */
export async function getComponentDeployment(componentName, deployment, env) {
    // deployment could be 'prod', 'preview', 'staging', etc.
    // This resolves to the actual version
    // TODO: Integrate with Edgit
    throw new Error('Edgit integration not yet implemented');
}
