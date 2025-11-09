/**
 * Client-side hydration utilities
 */

import type { HydrationConfig, HtmxConfig, ComponentIsland } from '../types/index.js';
import { renderScriptTag } from './head-renderer.js';

/**
 * Render hydration script
 */
export function renderHydrationScript(
	config: HydrationConfig,
	props: Record<string, unknown>
): string {
	switch (config.strategy) {
		case 'none':
			return '';

		case 'htmx':
			return renderHtmxHydration(config.htmx, props);

		case 'progressive':
			return renderProgressiveHydration(config, props);

		case 'islands':
			return renderIslandsHydration(config, props);

		default:
			return '';
	}
}

/**
 * Render htmx hydration
 */
function renderHtmxHydration(
	htmxConfig?: HtmxConfig,
	props?: Record<string, unknown>
): string {
	if (!htmxConfig?.enabled) {
		return '';
	}

	const version = htmxConfig.version || '1.9.10';
	const parts: string[] = [];

	// Load htmx core
	parts.push(renderScriptTag({
		src: `https://unpkg.com/htmx.org@${version}`,
		defer: true,
		integrity: undefined, // Add integrity hash in production
		crossorigin: 'anonymous'
	}));

	// Load extensions
	if (htmxConfig.extensions && htmxConfig.extensions.length > 0) {
		for (const ext of htmxConfig.extensions) {
			parts.push(renderScriptTag({
				src: `https://unpkg.com/htmx.org@${version}/dist/ext/${ext}.js`,
				defer: true
			}));
		}
	}

	// Global htmx config
	if (htmxConfig.config) {
		const configScript = `
			document.addEventListener('DOMContentLoaded', function() {
				if (window.htmx) {
					htmx.config = Object.assign(htmx.config || {}, ${JSON.stringify(htmxConfig.config)});
				}
			});
		`;
		parts.push(renderScriptTag({
			inline: configScript,
			defer: true
		}));
	}

	return parts.join('\n\t');
}

/**
 * Render progressive hydration
 */
function renderProgressiveHydration(
	config: HydrationConfig,
	props: Record<string, unknown>
): string {
	const parts: string[] = [];

	// Include htmx if configured
	if (config.htmx?.enabled) {
		parts.push(renderHtmxHydration(config.htmx, props));
	}

	// Add progressive enhancement script
	if (config.progressive) {
		const { enhanceForms, enhanceLinks, customEnhancements } = config.progressive;

		const progressiveScript = `
			document.addEventListener('DOMContentLoaded', function() {
				${enhanceForms ? enhanceFormsScript() : ''}
				${enhanceLinks ? enhanceLinksScript() : ''}
				${customEnhancements ? enhanceCustomScript(customEnhancements) : ''}
			});
		`;

		parts.push(renderScriptTag({
			inline: progressiveScript,
			defer: true
		}));
	}

	return parts.join('\n\t');
}

/**
 * Enhance forms script
 */
function enhanceFormsScript(): string {
	return `
		// Enhance forms with htmx
		document.querySelectorAll('form:not([data-no-enhance])').forEach(function(form) {
			if (!form.hasAttribute('hx-post') && !form.hasAttribute('hx-get')) {
				form.setAttribute('hx-post', form.action || window.location.href);
				form.setAttribute('hx-target', 'body');
				form.setAttribute('hx-swap', 'outerHTML');
			}
		});
	`;
}

/**
 * Enhance links script
 */
function enhanceLinksScript(): string {
	return `
		// Enhance navigation links with htmx
		document.querySelectorAll('a[href]:not([data-no-enhance]):not([target="_blank"])').forEach(function(link) {
			if (!link.hasAttribute('hx-get')) {
				const href = link.getAttribute('href');
				if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
					link.setAttribute('hx-get', href);
					link.setAttribute('hx-target', 'body');
					link.setAttribute('hx-swap', 'outerHTML');
					link.setAttribute('hx-push-url', 'true');
				}
			}
		});
	`;
}

/**
 * Custom enhancements script
 */
function enhanceCustomScript(enhancements: any[]): string {
	const scripts: string[] = [];

	for (const enhancement of enhancements) {
		const attrs = Object.entries(enhancement.attributes)
			.map(([key, value]) => `element.setAttribute('${key}', '${value}');`)
			.join('\n\t\t\t\t');

		scripts.push(`
			document.querySelectorAll('${enhancement.selector}').forEach(function(element) {
				${attrs}
			});
		`);
	}

	return scripts.join('\n\t\t');
}

/**
 * Render islands hydration
 */
function renderIslandsHydration(
	config: HydrationConfig,
	props: Record<string, unknown>
): string {
	if (!config.islands || config.islands.length === 0) {
		return '';
	}

	const islands = config.islands;
	const islandsData = JSON.stringify(islands);

	const islandsScript = `
		// Island hydration
		(function() {
			const islands = ${islandsData};
			const observers = new Map();

			function hydrateIsland(island) {
				const element = document.querySelector('[data-island-id="' + island.id + '"]');
				if (!element) return;

				// Mark as hydrated
				element.setAttribute('data-hydrated', 'true');

				// Load and hydrate component
				console.log('Hydrating island:', island.id);

				// In production, this would load the component bundle and hydrate
				// For now, just log
			}

			function setupIsland(island) {
				const element = document.querySelector('[data-island-id="' + island.id + '"]');
				if (!element) return;

				switch (island.loadOn) {
					case 'immediate':
						hydrateIsland(island);
						break;

					case 'visible':
						const observer = new IntersectionObserver(function(entries) {
							entries.forEach(function(entry) {
								if (entry.isIntersecting) {
									hydrateIsland(island);
									observer.disconnect();
								}
							});
						});
						observer.observe(element);
						observers.set(island.id, observer);
						break;

					case 'idle':
						if ('requestIdleCallback' in window) {
							requestIdleCallback(function() { hydrateIsland(island); });
						} else {
							setTimeout(function() { hydrateIsland(island); }, 1);
						}
						break;

					case 'interaction':
						function handleInteraction() {
							hydrateIsland(island);
							element.removeEventListener('mouseenter', handleInteraction);
							element.removeEventListener('focus', handleInteraction);
							element.removeEventListener('touchstart', handleInteraction);
						}
						element.addEventListener('mouseenter', handleInteraction, { once: true });
						element.addEventListener('focus', handleInteraction, { once: true });
						element.addEventListener('touchstart', handleInteraction, { once: true });
						break;
				}
			}

			document.addEventListener('DOMContentLoaded', function() {
				islands.forEach(setupIsland);
			});
		})();
	`;

	return renderScriptTag({
		inline: islandsScript,
		defer: true
	});
}

/**
 * Serialize props for hydration
 */
export function serializeProps(props: Record<string, unknown>): string {
	return Buffer.from(JSON.stringify(props)).toString('base64');
}

/**
 * Create island marker
 */
export function createIslandMarker(island: ComponentIsland): string {
	const props = island.props ? serializeProps(island.props) : '';
	const priority = island.priority || 'medium';
	const loadOn = island.loadOn || 'visible';

	return `<div
		data-island-id="${island.id}"
		data-component="${island.component}"
		data-props="${props}"
		data-priority="${priority}"
		data-load-on="${loadOn}"
		data-hydrated="false">`;
}

/**
 * Close island marker
 */
export function closeIslandMarker(): string {
	return `</div>`;
}
