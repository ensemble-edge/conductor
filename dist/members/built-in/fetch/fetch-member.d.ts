/**
 * Fetch Member - HTTP Client with Retry Logic
 *
 * Features:
 * - Configurable retry attempts with exponential backoff
 * - Timeout handling
 * - Custom headers support
 * - Multiple HTTP methods
 */
import { BaseMember, type MemberExecutionContext } from '../../base-member.js';
import type { MemberConfig } from '../../../runtime/parser.js';
import type { FetchResult } from './types.js';
export declare class FetchMember extends BaseMember {
    private readonly env;
    private fetchConfig;
    constructor(config: MemberConfig, env: Env);
    protected run(context: MemberExecutionContext): Promise<FetchResult>;
    private executeRequest;
    private sleep;
}
//# sourceMappingURL=fetch-member.d.ts.map