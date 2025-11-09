/**
 * Client-side hydration utilities
 */
import type { HydrationConfig, ComponentIsland } from '../types/index.js';
/**
 * Render hydration script
 */
export declare function renderHydrationScript(config: HydrationConfig, props: Record<string, unknown>): string;
/**
 * Serialize props for hydration
 */
export declare function serializeProps(props: Record<string, unknown>): string;
/**
 * Create island marker
 */
export declare function createIslandMarker(island: ComponentIsland): string;
/**
 * Close island marker
 */
export declare function closeIslandMarker(): string;
//# sourceMappingURL=hydration.d.ts.map