/**
 * Edge Context
 *
 * Network and infrastructure information from Cloudflare's edge.
 * Includes datacenter location, ASN info, protocol details, and TLS information.
 *
 * Separate from LocationContext (which is about geographic location).
 * EdgeContext is about *how* the request arrived - network path, protocols, etc.
 */
import type { CloudflareRequestCF } from './location.js';
/**
 * Edge context for network/infrastructure information
 *
 * Provides information about how the request arrived:
 * - Which Cloudflare datacenter handled it
 * - Network provider (ASN) information
 * - Protocol details (HTTP version, TLS)
 *
 * @example
 * ```typescript
 * export default async function myAgent(ctx: AgentExecutionContext) {
 *   const { edge } = ctx;
 *
 *   // Check for cloud provider traffic
 *   if (edge.isFromCloudProvider()) {
 *     // Apply stricter rate limiting for potential bots
 *   }
 *
 *   // Log edge location for debugging
 *   console.log(`Served from ${edge.coloName} (${edge.colo})`);
 *
 *   // Check protocol
 *   if (edge.isHTTP2OrHigher()) {
 *     // Can use HTTP/2+ features
 *   }
 * }
 * ```
 */
export interface EdgeContext {
    /** Cloudflare datacenter code (e.g., "DFW", "LHR") */
    colo: string;
    /** Human-readable datacenter city name (e.g., "Dallas", "London") */
    coloName: string;
    /** Autonomous System Number of the request origin */
    asn: number;
    /** Organization name for the ASN (e.g., "Google Cloud", "Comcast") */
    asOrganization: string;
    /** HTTP protocol version (e.g., "HTTP/2", "HTTP/3") */
    httpProtocol: string;
    /** TLS version (e.g., "TLSv1.3") */
    tlsVersion: string;
    /** TLS cipher suite used */
    tlsCipher: string;
    /** Original Accept-Encoding header from client */
    clientAcceptEncoding: string;
    /**
     * Check if request originated from a known cloud provider
     *
     * Useful for detecting potential automated traffic (bots, scrapers, CI/CD)
     *
     * @returns True if ASN matches a known cloud provider
     */
    isFromCloudProvider(): boolean;
    /**
     * Get cloud provider name if request is from one
     *
     * @returns Provider name (e.g., "AWS", "Google Cloud") or null
     */
    getCloudProvider(): string | null;
    /**
     * Check if request originated from a known VPN provider
     *
     * Note: This is based on ASN and is not foolproof.
     * Many VPNs use residential or cloud IPs that won't be detected.
     *
     * @returns True if ASN matches a known VPN provider
     */
    isFromVPN(): boolean;
    /**
     * Get VPN provider name if request is from one
     *
     * @returns Provider name or null
     */
    getVPNProvider(): string | null;
    /**
     * Check if connection uses HTTP/2 or higher
     *
     * @returns True if HTTP/2, HTTP/3, etc.
     */
    isHTTP2OrHigher(): boolean;
    /**
     * Check if connection uses HTTP/3 (QUIC)
     *
     * @returns True if HTTP/3
     */
    isHTTP3(): boolean;
    /**
     * Check if connection uses modern TLS (1.2+)
     *
     * @returns True if TLSv1.2 or TLSv1.3
     */
    isModernTLS(): boolean;
}
/**
 * Create an EdgeContext from Cloudflare's request.cf data
 *
 * @param cf - Cloudflare's request.cf object
 * @returns EdgeContext with network and infrastructure info
 */
export declare function createEdgeContext(cf: CloudflareRequestCF | undefined): EdgeContext;
/**
 * Create a default/empty EdgeContext for testing
 */
export declare function createDefaultEdgeContext(): EdgeContext;
//# sourceMappingURL=edge.d.ts.map