/**
 * Page Member - JSX/compiled page components with SSR and hydration
 */

export { PageMember } from './page-member.js'
export type {
  PageMemberConfig,
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
