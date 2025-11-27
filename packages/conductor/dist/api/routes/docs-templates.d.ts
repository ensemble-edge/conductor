/**
 * Documentation HTML Templates
 *
 * Auto-generated HTML templates for the /docs routes.
 * Uses a minimal, clean design inspired by modern documentation sites.
 * Supports customization via DocsConfig (theme, branding, etc.)
 */
import type { DocsConfig, DocsUIFramework } from '../../config/types.js';
import type { EnsembleOutput } from '../../runtime/output-types.js';
/**
 * Theme configuration derived from DocsConfig
 */
export interface DocsTheme {
    title?: string;
    description?: string;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    customCss?: string;
    darkMode?: boolean;
}
/**
 * Get theme from DocsConfig
 */
export declare function getThemeFromConfig(config?: DocsConfig): DocsTheme;
/**
 * Landing page
 */
export interface DocsLandingProps {
    title: string;
    description: string;
    agentCount: number;
    ensembleCount: number;
    builtInAgentCount: number;
    customAgentCount: number;
    theme?: DocsTheme;
}
export declare function renderDocsLanding(props: DocsLandingProps): string;
/**
 * Agents list page
 */
export interface AgentsListProps {
    builtInAgents: Array<{
        name: string;
        operation: string;
        description: string;
        builtIn: boolean;
    }>;
    customAgents: Array<{
        name: string;
        operation: string;
        description: string;
        builtIn: boolean;
    }>;
    theme?: DocsTheme;
}
export declare function renderAgentsList(props: AgentsListProps): string;
/**
 * Agent detail page
 */
export interface AgentDetailProps {
    name: string;
    operation: string;
    description: string;
    builtIn: boolean;
    configSchema?: Record<string, unknown>;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    examples?: unknown[];
    config?: Record<string, unknown>;
    theme?: DocsTheme;
}
export declare function renderAgentDetail(props: AgentDetailProps): string;
/**
 * Ensembles list page
 */
export interface EnsemblesListProps {
    ensembles: Array<{
        name: string;
        description: string;
        source: 'yaml' | 'typescript';
        triggerCount: number;
        stepCount: number;
    }>;
    theme?: DocsTheme;
}
export declare function renderEnsemblesList(props: EnsemblesListProps): string;
/**
 * Ensemble detail page
 */
export interface EnsembleDetailProps {
    name: string;
    description: string;
    source: 'yaml' | 'typescript';
    triggers: Array<{
        type: string;
        path?: string;
        methods?: string[];
        cron?: string;
    }>;
    steps: Array<{
        index: number;
        type: string;
        agent?: string;
        condition?: string;
    }>;
    inlineAgents: Array<{
        name: string;
        operation: string;
    }>;
    inputSchema?: Record<string, unknown>;
    outputSchema?: EnsembleOutput;
    theme?: DocsTheme;
}
export declare function renderEnsembleDetail(props: EnsembleDetailProps): string;
/**
 * OpenAPI UI page with configurable UI framework
 */
export interface OpenAPIUIProps {
    title: string;
    specUrl: string;
    ui?: DocsUIFramework;
    theme?: DocsTheme;
}
/**
 * Generate OpenAPI UI based on selected framework
 */
export declare function renderOpenAPIUI(props: OpenAPIUIProps): string;
//# sourceMappingURL=docs-templates.d.ts.map