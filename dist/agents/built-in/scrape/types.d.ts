/**
 * Scrape Agent - Type Definitions
 */
export type ScrapeStrategy = 'fast' | 'balanced' | 'aggressive';
export type ReturnFormat = 'markdown' | 'html' | 'text';
export interface ScrapeConfig {
    strategy?: ScrapeStrategy;
    returnFormat?: ReturnFormat;
    blockResources?: boolean;
    userAgent?: string;
    timeout?: number;
}
export interface ScrapeInput {
    url: string;
}
export interface ScrapeResult {
    url: string;
    markdown?: string;
    html?: string;
    text?: string;
    title?: string;
    tier: 1 | 2 | 3;
    duration: number;
    botProtectionDetected: boolean;
    contentLength: number;
}
export interface BotProtectionResult {
    detected: boolean;
    reasons: string[];
}
//# sourceMappingURL=types.d.ts.map