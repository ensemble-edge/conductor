/**
 * Documentation Routes
 *
 * Auto-generated documentation pages for agents and ensembles.
 * Provides human-readable HTML documentation alongside the JSON API.
 *
 * Routes:
 *   /docs              → Landing page with navigation (or first markdown page)
 *   /docs/:slug        → Markdown pages from docs/ directory
 *   /docs/agents       → List all agents (HTML)
 *   /docs/agents/:name → Individual agent documentation
 *   /docs/ensembles    → List all ensembles (HTML)
 *   /docs/ensembles/:name → Individual ensemble documentation
 *   /docs/api          → Interactive OpenAPI UI
 *   /docs/openapi.json → Raw OpenAPI spec
 *
 * Configuration:
 *   Reads from docs/docs.yaml (preferred) or conductor.config.ts docs section.
 *   Supports: route (path, auth, priority), title, description, logo, favicon, theme, ui framework.
 *
 * The docs/ directory is a first-class component directory:
 *   - docs/docs.yaml → Definition file (like agents have route config)
 *   - docs/*.md → Markdown pages auto-routed to /docs/:slug
 *   - Navigation auto-generated from file structure + frontmatter
 */
import { Hono } from 'hono';
declare const docs: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default docs;
//# sourceMappingURL=docs.d.ts.map