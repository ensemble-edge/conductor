/**
 * Page head rendering utilities
 */

import type { PageHead, MetaTag, LinkTag, ScriptTag, SEOConfig } from '../types/index.js';

/**
 * Render page head HTML
 */
export function renderPageHead(head: PageHead, seo?: SEOConfig): string {
	const parts: string[] = [];

	// Charset
	parts.push('<meta charset="UTF-8">');

	// Viewport
	parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');

	// Title
	if (head.title) {
		parts.push(`<title>${escapeHtml(head.title)}</title>`);
	}

	// Meta tags
	if (head.meta) {
		for (const meta of head.meta) {
			parts.push(renderMetaTag(meta));
		}
	}

	// SEO: Canonical
	if (seo?.canonical) {
		parts.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}">`);
	}

	// SEO: Robots
	if (seo?.robots) {
		parts.push(`<meta name="robots" content="${escapeHtml(seo.robots)}">`);
	}

	// SEO: Alternate links
	if (seo?.alternates) {
		for (const alt of seo.alternates) {
			parts.push(`<link rel="alternate" hreflang="${escapeHtml(alt.hreflang)}" href="${escapeHtml(alt.href)}">`);
		}
	}

	// Open Graph tags
	if (head.og) {
		if (head.og.title) {
			parts.push(`<meta property="og:title" content="${escapeHtml(head.og.title)}">`);
		}
		if (head.og.description) {
			parts.push(`<meta property="og:description" content="${escapeHtml(head.og.description)}">`);
		}
		if (head.og.image) {
			parts.push(`<meta property="og:image" content="${escapeHtml(head.og.image)}">`);
		}
		if (head.og.url) {
			parts.push(`<meta property="og:url" content="${escapeHtml(head.og.url)}">`);
		}
		if (head.og.type) {
			parts.push(`<meta property="og:type" content="${escapeHtml(head.og.type)}">`);
		}
		if (head.og.siteName) {
			parts.push(`<meta property="og:site_name" content="${escapeHtml(head.og.siteName)}">`);
		}
		if (head.og.locale) {
			parts.push(`<meta property="og:locale" content="${escapeHtml(head.og.locale)}">`);
		}
	}

	// Twitter Card tags
	if (head.twitter) {
		if (head.twitter.card) {
			parts.push(`<meta name="twitter:card" content="${escapeHtml(head.twitter.card)}">`);
		}
		if (head.twitter.site) {
			parts.push(`<meta name="twitter:site" content="${escapeHtml(head.twitter.site)}">`);
		}
		if (head.twitter.creator) {
			parts.push(`<meta name="twitter:creator" content="${escapeHtml(head.twitter.creator)}">`);
		}
		if (head.twitter.title) {
			parts.push(`<meta name="twitter:title" content="${escapeHtml(head.twitter.title)}">`);
		}
		if (head.twitter.description) {
			parts.push(`<meta name="twitter:description" content="${escapeHtml(head.twitter.description)}">`);
		}
		if (head.twitter.image) {
			parts.push(`<meta name="twitter:image" content="${escapeHtml(head.twitter.image)}">`);
		}
	}

	// Link tags
	if (head.links) {
		for (const link of head.links) {
			parts.push(renderLinkTag(link));
		}
	}

	// Script tags (in head)
	if (head.scripts) {
		for (const script of head.scripts) {
			if (!script.defer && !script.async) {
				parts.push(renderScriptTag(script));
			}
		}
	}

	// SEO: JSON-LD structured data
	if (seo?.jsonLd && seo.jsonLd.length > 0) {
		for (const schema of seo.jsonLd) {
			parts.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
		}
	}

	return parts.join('\n\t');
}

/**
 * Render meta tag
 */
function renderMetaTag(meta: MetaTag): string {
	const attrs: string[] = [];

	if (meta.name) {
		attrs.push(`name="${escapeHtml(meta.name)}"`);
	}
	if (meta.property) {
		attrs.push(`property="${escapeHtml(meta.property)}"`);
	}
	if (meta.content) {
		attrs.push(`content="${escapeHtml(meta.content)}"`);
	}
	if (meta.charset) {
		attrs.push(`charset="${escapeHtml(meta.charset)}"`);
	}
	if (meta.httpEquiv) {
		attrs.push(`http-equiv="${escapeHtml(meta.httpEquiv)}"`);
	}

	return `<meta ${attrs.join(' ')}>`;
}

/**
 * Render link tag
 */
function renderLinkTag(link: LinkTag): string {
	const attrs: string[] = [
		`rel="${escapeHtml(link.rel)}"`,
		`href="${escapeHtml(link.href)}"`
	];

	if (link.type) {
		attrs.push(`type="${escapeHtml(link.type)}"`);
	}
	if (link.media) {
		attrs.push(`media="${escapeHtml(link.media)}"`);
	}
	if (link.crossorigin) {
		attrs.push(`crossorigin="${escapeHtml(link.crossorigin)}"`);
	}
	if (link.integrity) {
		attrs.push(`integrity="${escapeHtml(link.integrity)}"`);
	}

	return `<link ${attrs.join(' ')}>`;
}

/**
 * Render script tag
 */
export function renderScriptTag(script: ScriptTag): string {
	const attrs: string[] = [];

	if (script.src) {
		attrs.push(`src="${escapeHtml(script.src)}"`);
	}
	if (script.type) {
		attrs.push(`type="${escapeHtml(script.type)}"`);
	}
	if (script.async) {
		attrs.push('async');
	}
	if (script.defer) {
		attrs.push('defer');
	}
	if (script.crossorigin) {
		attrs.push(`crossorigin="${escapeHtml(script.crossorigin)}"`);
	}
	if (script.integrity) {
		attrs.push(`integrity="${escapeHtml(script.integrity)}"`);
	}

	if (script.inline) {
		return `<script ${attrs.join(' ')}>${script.inline}</script>`;
	} else {
		return `<script ${attrs.join(' ')}></script>`;
	}
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	return str.replace(/[&<>"']/g, (char) => map[char]);
}
