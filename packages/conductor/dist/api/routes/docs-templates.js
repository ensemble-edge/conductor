/**
 * Documentation HTML Templates
 *
 * Auto-generated HTML templates for the /docs routes.
 * Uses a minimal, clean design inspired by modern documentation sites.
 * Supports customization via DocsConfig (theme, branding, etc.)
 */
/**
 * Get theme from DocsConfig
 */
export function getThemeFromConfig(config) {
    return {
        title: config?.title || 'API Documentation',
        description: config?.description,
        logo: config?.logo,
        favicon: config?.favicon,
        primaryColor: config?.theme?.primaryColor || '#3b82f6',
        customCss: config?.theme?.customCss,
        darkMode: config?.theme?.darkMode,
    };
}
/**
 * Generate CSS variables from theme
 */
function themeVariables(theme) {
    return `
    :root {
      --primary-color: ${theme.primaryColor || '#3b82f6'};
      --primary-hover: ${adjustColor(theme.primaryColor || '#3b82f6', -20)};
    }
  `;
}
/**
 * Adjust color brightness (simple implementation)
 */
function adjustColor(hex, amount) {
    // Simple brightness adjustment - for production use a proper color library
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
/**
 * Common styles and layout
 */
const getCommonStyles = (theme) => `
  ${themeVariables(theme)}
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
    padding: 32px 0;
  }
  .header h1 { font-size: 2rem; margin-bottom: 8px; }
  .header p { opacity: 0.9; }
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
  .card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .card h3 { margin-bottom: 8px; }
  .card p { color: #64748b; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-purple { background: #f3e8ff; color: #7c3aed; }
  .badge-gray { background: #f1f5f9; color: #475569; }
  .stat { text-align: center; padding: 24px; }
  .stat-value { font-size: 2.5rem; font-weight: 700; color: var(--primary-color); }
  .stat-label { color: #64748b; margin-top: 4px; }
  .table { width: 100%; border-collapse: collapse; }
  .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  .table th { background: #f8fafc; font-weight: 600; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #1e293b; }
  .breadcrumb { margin-bottom: 16px; color: #64748b; }
  .breadcrumb a { color: #64748b; }
  .empty { text-align: center; padding: 48px; color: #64748b; }
`;
/**
 * Default theme (used when no config provided)
 */
const DEFAULT_THEME = {
    title: 'API Documentation',
    primaryColor: '#3b82f6',
};
/**
 * Base HTML template with theme support
 */
function baseTemplate(title, content, activeNav, theme = DEFAULT_THEME) {
    const siteTitle = theme.title || 'API Documentation';
    const styles = getCommonStyles(theme);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${siteTitle}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <style>${styles}</style>
  ${theme.customCss ? `<style>${theme.customCss}</style>` : ''}
</head>
<body>
  <div class="header">
    <div class="container">
      ${theme.logo ? `<img src="${theme.logo}" alt="${siteTitle}" style="height: 40px; margin-bottom: 8px;">` : ''}
      <h1>📚 ${title}</h1>
      <p>${theme.description || 'Auto-generated documentation for your Conductor project'}</p>
    </div>
  </div>
  <nav class="nav">
    <div class="container">
      <ul>
        <li><a href="/docs" class="${activeNav === 'home' ? 'active' : ''}">Overview</a></li>
        <li><a href="/docs/agents" class="${activeNav === 'agents' ? 'active' : ''}">Agents</a></li>
        <li><a href="/docs/ensembles" class="${activeNav === 'ensembles' ? 'active' : ''}">Ensembles</a></li>
        <li><a href="/docs/api" class="${activeNav === 'api' ? 'active' : ''}">API Reference</a></li>
      </ul>
    </div>
  </nav>
  <main class="content">
    <div class="container">
      ${content}
    </div>
  </main>
  <footer style="text-align: center; padding: 32px; color: #64748b; font-size: 0.875rem;">
    <p>Built with <a href="https://ensemble.dev/conductor">Ensemble Conductor</a></p>
  </footer>
</body>
</html>`;
}
export function renderDocsLanding(props) {
    const content = `
    <div class="grid" style="margin-bottom: 32px;">
      <div class="card stat">
        <div class="stat-value">${props.agentCount}</div>
        <div class="stat-label">Total Agents</div>
        <div style="margin-top: 8px; font-size: 0.875rem; color: #64748b;">
          ${props.builtInAgentCount} built-in · ${props.customAgentCount} custom
        </div>
      </div>
      <div class="card stat">
        <div class="stat-value">${props.ensembleCount}</div>
        <div class="stat-label">Ensembles</div>
      </div>
      <div class="card stat">
        <div class="stat-value">14</div>
        <div class="stat-label">Operation Types</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Quick Links</h2>
      <div class="grid">
        <a href="/docs/agents" class="card" style="text-decoration: none; color: inherit;">
          <h3>🤖 Agents</h3>
          <p>Browse all available agents and their configurations</p>
        </a>
        <a href="/docs/ensembles" class="card" style="text-decoration: none; color: inherit;">
          <h3>🎭 Ensembles</h3>
          <p>Explore workflow orchestrations and their triggers</p>
        </a>
        <a href="/docs/api" class="card" style="text-decoration: none; color: inherit;">
          <h3>📖 API Reference</h3>
          <p>Interactive OpenAPI documentation</p>
        </a>
        <a href="/api/v1/agents" class="card" style="text-decoration: none; color: inherit;">
          <h3>🔌 JSON API</h3>
          <p>Programmatic access to agent metadata</p>
        </a>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">About Conductor</h2>
      <div class="card">
        <p style="margin-bottom: 16px;">
          <strong>Conductor</strong> is an agentic workflow orchestration framework for Cloudflare Workers.
          It enables you to build complex AI-powered workflows using declarative YAML or TypeScript.
        </p>
        <p style="margin-bottom: 16px;">
          <strong>Core concepts:</strong>
        </p>
        <ul style="margin-left: 24px; color: #475569;">
          <li><strong>Agents</strong> — Reusable units of work with specific operations</li>
          <li><strong>Ensembles</strong> — Orchestrations that combine agents into workflows</li>
          <li><strong>Operations</strong> — Atomic execution primitives (think, code, http, storage, etc.)</li>
          <li><strong>Triggers</strong> — HTTP, webhook, cron, email, queue, and MCP invocation methods</li>
        </ul>
      </div>
    </div>
  `;
    return baseTemplate(props.title, content, 'home', props.theme);
}
export function renderAgentsList(props) {
    const renderAgentCard = (agent) => `
    <a href="/docs/agents/${agent.name}" class="card" style="text-decoration: none; color: inherit;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <h3>${agent.name}</h3>
        <span class="badge ${agent.builtIn ? 'badge-blue' : 'badge-green'}">${agent.builtIn ? 'built-in' : 'custom'}</span>
      </div>
      <p style="margin-bottom: 8px;">${agent.description || 'No description'}</p>
      <code>${agent.operation}</code>
    </a>
  `;
    const content = `
    ${props.builtInAgents.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Built-in Agents (${props.builtInAgents.length})</h2>
      <div class="grid">
        ${props.builtInAgents.map(renderAgentCard).join('')}
      </div>
    </div>
    `
        : ''}

    ${props.customAgents.length > 0
        ? `
    <div class="section">
      <h2 class="section-title">Custom Agents (${props.customAgents.length})</h2>
      <div class="grid">
        ${props.customAgents.map(renderAgentCard).join('')}
      </div>
    </div>
    `
        : ''}

    ${props.builtInAgents.length === 0 && props.customAgents.length === 0
        ? `
    <div class="empty">
      <p>No agents found. Create agents in the <code>agents/</code> directory.</p>
    </div>
    `
        : ''}
  `;
    return baseTemplate('Agents', content, 'agents', props.theme);
}
export function renderAgentDetail(props) {
    const renderSchema = (schema, title) => {
        if (!schema || Object.keys(schema).length === 0) {
            return '';
        }
        return `
      <div class="section">
        <h3 class="section-title">${title}</h3>
        <pre><code>${JSON.stringify(schema, null, 2)}</code></pre>
      </div>
    `;
    };
    const content = `
    <div class="breadcrumb">
      <a href="/docs">Docs</a> / <a href="/docs/agents">Agents</a> / ${props.name}
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <h2 style="font-size: 1.75rem;">${props.name}</h2>
        <span class="badge ${props.builtIn ? 'badge-blue' : 'badge-green'}">${props.builtIn ? 'built-in' : 'custom'}</span>
      </div>
      <p style="font-size: 1.1rem; color: #475569; margin-bottom: 16px;">${props.description || 'No description'}</p>
      <div>
        <span class="badge badge-purple">${props.operation}</span>
      </div>
    </div>

    ${renderSchema(props.inputSchema, 'Input Schema')}
    ${renderSchema(props.outputSchema, 'Output Schema')}
    ${renderSchema(props.configSchema, 'Configuration Schema')}
    ${props.config ? renderSchema(props.config, 'Default Configuration') : ''}

    ${props.examples && props.examples.length > 0
        ? `
    <div class="section">
      <h3 class="section-title">Examples</h3>
      <pre><code>${JSON.stringify(props.examples, null, 2)}</code></pre>
    </div>
    `
        : ''}

    <div class="section">
      <h3 class="section-title">Usage</h3>
      <pre><code># In an ensemble YAML file
flow:
  - agent: ${props.name}
    input:
      # Your input here</code></pre>
    </div>
  `;
    return baseTemplate(props.name, content, 'agents', props.theme);
}
export function renderEnsemblesList(props) {
    const renderEnsembleCard = (ensemble) => `
    <a href="/docs/ensembles/${ensemble.name}" class="card" style="text-decoration: none; color: inherit;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <h3>${ensemble.name}</h3>
        <span class="badge badge-gray">${ensemble.source}</span>
      </div>
      <p style="margin-bottom: 12px;">${ensemble.description || 'No description'}</p>
      <div style="display: flex; gap: 16px; font-size: 0.875rem; color: #64748b;">
        <span>📋 ${ensemble.stepCount} steps</span>
        <span>⚡ ${ensemble.triggerCount} triggers</span>
      </div>
    </a>
  `;
    const content = `
    <div class="section">
      <h2 class="section-title">All Ensembles (${props.ensembles.length})</h2>
      ${props.ensembles.length > 0
        ? `
      <div class="grid">
        ${props.ensembles.map(renderEnsembleCard).join('')}
      </div>
      `
        : `
      <div class="empty">
        <p>No ensembles found. Create ensembles in the <code>ensembles/</code> directory.</p>
      </div>
      `}
    </div>
  `;
    return baseTemplate('Ensembles', content, 'ensembles', props.theme);
}
export function renderEnsembleDetail(props) {
    const content = `
    <div class="breadcrumb">
      <a href="/docs">Docs</a> / <a href="/docs/ensembles">Ensembles</a> / ${props.name}
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <h2 style="font-size: 1.75rem;">${props.name}</h2>
        <span class="badge badge-gray">${props.source}</span>
      </div>
      <p style="font-size: 1.1rem; color: #475569;">${props.description || 'No description'}</p>
    </div>

    ${props.triggers.length > 0
        ? `
    <div class="section">
      <h3 class="section-title">Triggers (${props.triggers.length})</h3>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Path / Schedule</th>
              <th>Methods</th>
            </tr>
          </thead>
          <tbody>
            ${props.triggers
            .map((t) => `
              <tr>
                <td><span class="badge badge-purple">${t.type}</span></td>
                <td><code>${t.path || t.cron || '-'}</code></td>
                <td>${t.methods?.join(', ') || '-'}</td>
              </tr>
            `)
            .join('')}
          </tbody>
        </table>
      </div>
    </div>
    `
        : ''}

    ${props.steps.length > 0
        ? `
    <div class="section">
      <h3 class="section-title">Flow Steps (${props.steps.length})</h3>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Agent</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            ${props.steps
            .map((s) => `
              <tr>
                <td>${s.index + 1}</td>
                <td><code>${s.type}</code></td>
                <td>${s.agent ? `<a href="/docs/agents/${s.agent}">${s.agent}</a>` : '-'}</td>
                <td>${s.condition ? `<code>${s.condition}</code>` : '-'}</td>
              </tr>
            `)
            .join('')}
          </tbody>
        </table>
      </div>
    </div>
    `
        : ''}

    ${props.inlineAgents.length > 0
        ? `
    <div class="section">
      <h3 class="section-title">Inline Agents (${props.inlineAgents.length})</h3>
      <div class="grid">
        ${props.inlineAgents
            .map((a) => `
          <div class="card">
            <h4>${a.name}</h4>
            <code>${a.operation}</code>
          </div>
        `)
            .join('')}
      </div>
    </div>
    `
        : ''}

    ${props.inputSchema
        ? `
    <div class="section">
      <h3 class="section-title">Input Schema</h3>
      <pre><code>${JSON.stringify(props.inputSchema, null, 2)}</code></pre>
    </div>
    `
        : ''}

    ${props.outputSchema
        ? `
    <div class="section">
      <h3 class="section-title">Output Schema</h3>
      <pre><code>${JSON.stringify(props.outputSchema, null, 2)}</code></pre>
    </div>
    `
        : ''}

    <div class="section">
      <h3 class="section-title">Execute via API</h3>
      <pre><code>curl -X POST http://localhost:8787/execute/${props.name} \\
  -H "Content-Type: application/json" \\
  -d '{"input": {}}'</code></pre>
    </div>
  `;
    return baseTemplate(props.name, content, 'ensembles', props.theme);
}
/**
 * Generate OpenAPI UI based on selected framework
 */
export function renderOpenAPIUI(props) {
    const ui = props.ui || 'stoplight';
    const theme = props.theme || DEFAULT_THEME;
    const primaryColor = theme.primaryColor || '#3b82f6';
    const baseStyles = `
    body { margin: 0; }
    .back-link {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
      background: white;
      padding: 8px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: ${primaryColor};
      text-decoration: none;
    }
    .back-link:hover { background: #f1f5f9; }
    ${theme.customCss || ''}
  `;
    const backLink = '<a href="/docs" class="back-link">← Back to Docs</a>';
    switch (ui) {
        case 'redoc':
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} | ${theme.title || 'API Documentation'}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <style>${baseStyles}</style>
</head>
<body>
  ${backLink}
  <redoc spec-url="${props.specUrl}"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
        case 'swagger':
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} | ${theme.title || 'API Documentation'}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css">
  <style>${baseStyles}</style>
</head>
<body>
  ${backLink}
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '${props.specUrl}',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`;
        case 'scalar':
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} | ${theme.title || 'API Documentation'}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <style>${baseStyles}</style>
</head>
<body>
  ${backLink}
  <script
    id="api-reference"
    data-url="${props.specUrl}"
    ${theme.darkMode ? 'data-theme="dark"' : ''}
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
        case 'rapidoc':
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} | ${theme.title || 'API Documentation'}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  <style>${baseStyles}</style>
</head>
<body>
  ${backLink}
  <rapi-doc
    spec-url="${props.specUrl}"
    render-style="read"
    ${theme.darkMode ? 'theme="dark"' : ''}
    primary-color="${primaryColor}"
    ${theme.logo ? `logo="${theme.logo}"` : ''}
  ></rapi-doc>
</body>
</html>`;
        case 'stoplight':
        default:
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title} | ${theme.title || 'API Documentation'}</title>
  ${theme.favicon ? `<link rel="icon" href="${theme.favicon}">` : ''}
  <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
  <style>${baseStyles}</style>
</head>
<body>
  ${backLink}
  <elements-api
    apiDescriptionUrl="${props.specUrl}"
    router="hash"
    layout="sidebar"
    ${theme.logo ? `logo="${theme.logo}"` : ''}
  />
</body>
</html>`;
    }
}
