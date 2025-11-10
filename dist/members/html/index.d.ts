/**
 * HTML Member - Public API
 *
 * Template rendering with cookie support.
 */
export { HtmlMember } from './html-member.js';
export type { HtmlMemberConfig, HtmlMemberInput, HtmlMemberOutput, Cookie, CookieOptions, TemplateSource, TemplateEngine, HtmlRenderOptions, TemplateContext, EmailHtmlConfig } from './types/index.js';
export { createTemplateEngine, getAvailableEngines } from '../../utils/templates/index.js';
export { loadTemplate, detectTemplateEngine, normalizeTemplateSource } from './utils/template-loader.js';
export { parseCookies, serializeCookie, signCookie, unsignCookie, createSetCookieHeader, createDeleteCookie } from './utils/cookies.js';
//# sourceMappingURL=index.d.ts.map