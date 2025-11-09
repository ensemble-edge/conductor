/**
 * Unified Router
 *
 * Central routing system with type-specific defaults and path-based rules
 */
import type { ConductorConfig, RouteAuthConfig, ResolvedRouteAuthConfig, RouteMatch, MemberType } from './config.js';
import type { AuthValidationResult, AuthContext } from '../auth/types.js';
/**
 * Route registration options
 */
export interface RouteRegistrationOptions {
    pattern: string | 'default';
    path?: string;
    methods: string[];
    memberType: MemberType;
    memberName: string;
    auth?: Partial<RouteAuthConfig>;
    priority?: number;
    handler?: (request: Request, env: any, ctx: ExecutionContext, auth: AuthContext) => Promise<Response>;
    /** Directory path for 'default' route resolution */
    memberPath?: string;
}
/**
 * Unified Router
 */
export declare class UnifiedRouter {
    private routes;
    private config;
    private validators;
    private customValidatorRegistry;
    constructor(config?: ConductorConfig);
    /**
     * Initialize validators from environment
     */
    init(env: any): Promise<void>;
    /**
     * Register a route
     */
    register(options: RouteRegistrationOptions): void;
    /**
     * Resolve default path from member directory structure
     */
    private resolveDefaultPath;
    /**
     * Get default priority for member type
     */
    private getDefaultPriority;
    /**
     * Match route pattern
     */
    private matchPattern;
    /**
     * Find matching route
     */
    match(path: string, method: string): RouteMatch | null;
    /**
     * Resolve auth config by merging defaults and rules
     */
    private resolveAuthConfig;
    /**
     * Authenticate request
     */
    authenticate(request: Request, env: any, auth: ResolvedRouteAuthConfig): Promise<AuthValidationResult>;
    /**
     * Handle request
     */
    handle(request: Request, env: any, ctx: ExecutionContext): Promise<Response | null>;
    /**
     * Handle auth failure
     */
    private handleAuthFailure;
}
//# sourceMappingURL=router.d.ts.map