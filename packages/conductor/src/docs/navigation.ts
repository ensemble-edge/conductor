/**
 * Docs Navigation Builder
 *
 * Builds navigation HTML and renders markdown pages with
 * consistent styling matching the existing docs templates.
 */

import type { DocsNavItem, DocsPage, DocsDefinition } from './types.js'
import type { DocsTheme } from '../api/routes/docs-templates.js'
import { getThemeFromConfig } from '../api/routes/docs-templates.js'

/**
 * Build navigation HTML from nav items
 */
export function buildNavHTML(items: DocsNavItem[], basePath: string): string {
  return items
    .map((item) => {
      const activeClass = item.active ? 'active' : ''
      const icon = item.icon || (item.reserved ? getReservedIcon(item.slug) : '📄')
      return `
        <li>
          <a href="${item.path}" class="${activeClass}">
            <span class="nav-icon">${icon}</span>
            <span class="nav-text">${item.title}</span>
          </a>
        </li>
      `
    })
    .join('')
}

/**
 * Get icon for reserved routes
 */
function getReservedIcon(slug: string): string {
  switch (slug) {
    case 'agents':
      return '🤖'
    case 'ensembles':
      return '🎭'
    case 'api':
      return '📖'
    default:
      return '📄'
  }
}

/**
 * Convert markdown to HTML (simple implementation)
 * For production, consider using marked or similar
 */
export function markdownToHTML(markdown: string): string {
  let html = markdown

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : ''
    return `<pre><code${langClass}>${escapeHTML(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Ordered lists (simple)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content
      .split('|')
      .map((cell: string) => cell.trim())
      .filter(Boolean)
    return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="table">$&</table>')

  // Paragraphs (lines not already converted)
  html = html.replace(/^(?!<[a-z])(.*[^\s].*)$/gm, '<p>$1</p>')

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  // Fix nested tags in paragraphs
  html = html.replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>.*<\/ul>)<\/p>/gs, '$1')
  html = html.replace(/<p>(<pre>.*<\/pre>)<\/p>/gs, '$1')
  html = html.replace(/<p>(<table.*<\/table>)<\/p>/gs, '$1')

  return html
}

/**
 * Escape HTML entities
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Get extended styles for docs pages
 */
export function getDocsPageStyles(theme: DocsTheme): string {
  const primaryColor = theme.primaryColor || '#3b82f6'

  return `
    .docs-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 32px;
      min-height: calc(100vh - 200px);
    }

    @media (max-width: 768px) {
      .docs-layout {
        grid-template-columns: 1fr;
      }
      .docs-sidebar {
        display: none;
      }
    }

    .docs-sidebar {
      position: sticky;
      top: 80px;
      height: fit-content;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    }

    .docs-sidebar h3 {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 12px;
      padding: 0 12px;
    }

    .docs-sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .docs-sidebar li {
      margin: 2px 0;
    }

    .docs-sidebar a {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      color: #475569;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.15s ease;
    }

    .docs-sidebar a:hover {
      background: #f1f5f9;
      color: ${primaryColor};
    }

    .docs-sidebar a.active {
      background: ${primaryColor}15;
      color: ${primaryColor};
      font-weight: 500;
    }

    .nav-icon {
      font-size: 1rem;
      width: 1.5rem;
      text-align: center;
    }

    .docs-content {
      max-width: 800px;
    }

    .docs-content h1 {
      font-size: 2rem;
      margin-bottom: 16px;
      color: #1e293b;
    }

    .docs-content h2 {
      font-size: 1.5rem;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }

    .docs-content h3 {
      font-size: 1.25rem;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #334155;
    }

    .docs-content p {
      margin-bottom: 16px;
      line-height: 1.7;
      color: #475569;
    }

    .docs-content ul, .docs-content ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }

    .docs-content li {
      margin-bottom: 8px;
      line-height: 1.6;
      color: #475569;
    }

    .docs-content pre {
      margin: 16px 0;
      border-radius: 8px;
    }

    .docs-content code {
      font-size: 0.875em;
    }

    .docs-content table {
      margin: 16px 0;
    }

    .docs-content a {
      color: ${primaryColor};
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .docs-content a:hover {
      text-decoration-thickness: 2px;
    }

    .docs-meta {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #64748b;
    }

    .page-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    .page-nav a {
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .page-nav a:hover {
      border-color: ${primaryColor};
      background: ${primaryColor}08;
    }

    .page-nav .label {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 4px;
    }

    .page-nav .title {
      color: ${primaryColor};
      font-weight: 500;
    }

    .page-nav .prev { text-align: left; }
    .page-nav .next { text-align: right; margin-left: auto; }
  `
}

/**
 * Props for rendering a markdown docs page
 */
export interface RenderDocsPageProps {
  page: DocsPage
  renderedContent: string
  navigation: DocsNavItem[]
  basePath: string
  theme: DocsTheme
  definition: DocsDefinition
  prevPage?: DocsNavItem
  nextPage?: DocsNavItem
}

/**
 * Render a markdown docs page with navigation
 */
export function renderDocsPage(props: RenderDocsPageProps): string {
  const { page, renderedContent, navigation, basePath, theme, prevPage, nextPage } = props

  const siteTitle = theme.title || 'API Documentation'
  const navHTML = buildNavHTML(navigation, basePath)
  const contentHTML = markdownToHTML(renderedContent)
  const pageStyles = getDocsPageStyles(theme)

  const prevNavHTML = prevPage
    ? `<a href="${prevPage.path}" class="prev">
         <span class="label">Previous</span>
         <span class="title">← ${prevPage.title}</span>
       </a>`
    : '<span></span>'

  const nextNavHTML = nextPage
    ? `<a href="${nextPage.path}" class="next">
         <span class="label">Next</span>
         <span class="title">${nextPage.title} →</span>
       </a>`
    : '<span></span>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | ${siteTitle}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <meta name="description" content="${page.frontmatter.description || page.title}">
  <style>
    :root {
      --primary-color: ${theme.primaryColor || '#3b82f6'};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #f8fafc;
    }
    a { color: var(--primary-color); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: #1e293b;
      color: #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 14px;
    }
    pre code { background: none; padding: 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 24px 0;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 { font-size: 1.5rem; }
    .header a { color: white; opacity: 0.9; }
    .header a:hover { opacity: 1; text-decoration: none; }
    .nav {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav ul { display: flex; gap: 24px; list-style: none; }
    .nav a { color: #64748b; font-weight: 500; }
    .nav a:hover, .nav a.active { color: var(--primary-color); text-decoration: none; }
    .content { padding: 32px 0; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .table th { background: #f8fafc; font-weight: 600; }
    ${pageStyles}
    ${theme.customCss || ''}
  </style>
</head>
<body>
  <div class="header">
    <div class="container header-inner">
      <div>
        ${theme.logo ? `<img src="${theme.logo}" alt="${siteTitle}" style="height: 32px; margin-right: 12px; vertical-align: middle;">` : ''}
        <h1 style="display: inline-block; vertical-align: middle;">📚 ${siteTitle}</h1>
      </div>
      <a href="${basePath}">Back to Overview</a>
    </div>
  </div>

  <nav class="nav">
    <div class="container">
      <ul>
        <li><a href="${basePath}">Overview</a></li>
        <li><a href="${basePath}/agents">Agents</a></li>
        <li><a href="${basePath}/ensembles">Ensembles</a></li>
        <li><a href="${basePath}/api">API Reference</a></li>
      </ul>
    </div>
  </nav>

  <main class="content">
    <div class="container">
      <div class="docs-layout">
        <aside class="docs-sidebar">
          <h3>Documentation</h3>
          <ul>
            ${navHTML}
          </ul>
        </aside>

        <article class="docs-content">
          ${contentHTML}

          <nav class="page-nav">
            ${prevNavHTML}
            ${nextNavHTML}
          </nav>
        </article>
      </div>
    </div>
  </main>

  <footer style="text-align: center; padding: 32px; color: #64748b; font-size: 0.875rem;">
    <p>Built with <a href="https://github.com/ensemble-edge">Ensemble Edge</a></p>
  </footer>
</body>
</html>`
}
