/**
 * Docs Navigation Builder
 *
 * Builds navigation HTML and renders markdown pages with
 * consistent styling matching the existing docs templates.
 */
import type { DocsNavItem, DocsPage, DocsDefinition } from './types.js';
import type { DocsTheme } from '../api/routes/docs-templates.js';
/**
 * Build navigation HTML from nav items
 */
export declare function buildNavHTML(items: DocsNavItem[], basePath: string): string;
/**
 * Convert markdown to HTML (simple implementation)
 * For production, consider using marked or similar
 */
export declare function markdownToHTML(markdown: string): string;
/**
 * Get extended styles for docs pages
 */
export declare function getDocsPageStyles(theme: DocsTheme): string;
/**
 * Props for rendering a markdown docs page
 */
export interface RenderDocsPageProps {
    page: DocsPage;
    renderedContent: string;
    navigation: DocsNavItem[];
    basePath: string;
    theme: DocsTheme;
    definition: DocsDefinition;
    prevPage?: DocsNavItem;
    nextPage?: DocsNavItem;
}
/**
 * Render a markdown docs page with navigation
 */
export declare function renderDocsPage(props: RenderDocsPageProps): string;
//# sourceMappingURL=navigation.d.ts.map