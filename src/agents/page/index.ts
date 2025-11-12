/**
 * Page Agent - JSX/compiled page components with SSR and hydration
 */

export { PageAgent } from './page-agent.js'
export type {
  PageAgentConfig,
  PageMemberInput,
  PageMemberOutput,
  PageRenderMode,
  HydrationStrategy,
  PageComponentType,
  PageLayout,
  PageHead,
  MetaTag,
  LinkTag,
  ScriptTag,
  OpenGraphTags,
  TwitterCardTags,
  HtmxConfig,
  HydrationConfig,
  ComponentIsland,
  ProgressiveConfig,
  CustomEnhancement,
  SEOConfig,
  AlternateLink,
  PageCacheConfig,
  PageRequestContext,
  SEOData,
  ComponentProps,
  PageComponent,
  LayoutComponent,
} from './types/index.js'

// Re-export utilities for external use
export { renderPageHead } from './utils/head-renderer.js'
export { renderHydrationScript } from './utils/hydration.js'
