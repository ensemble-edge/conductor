/**
 * Docs Agent
 *
 * Auto-generate and serve API documentation with:
 * - OpenAPI spec generation
 * - Interactive docs UI (Stoplight, Redoc, Swagger, etc.)
 * - AI-enhanced descriptions
 * - Multiple output formats (YAML, JSON, HTML)
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type {
  DocsAgentConfig,
  DocsMemberInput,
  DocsMemberOutput,
  DocsUIFramework,
} from './types/index.js'

export class DocsMember extends BaseAgent {
  private docsConfig: DocsAgentConfig

  constructor(config: AgentConfig) {
    super(config)
    this.docsConfig = config as AgentConfig & DocsAgentConfig

    // Set defaults
    this.docsConfig.ui = this.docsConfig.ui || 'stoplight'
    this.docsConfig.openApiVersion = this.docsConfig.openApiVersion || '3.1'
    this.docsConfig.paths = this.docsConfig.paths || {
      docs: '/docs',
      yaml: '/openapi.yaml',
      json: '/openapi.json',
    }
  }

  /**
   * Execute docs generation/serving
   */
  protected async run(context: AgentExecutionContext): Promise<DocsMemberOutput> {
    const input = context.input as DocsMemberInput
    const url = new URL(input.request?.url || '')
    const pathname = url.pathname

    // Check cache first
    if (this.docsConfig.cache?.enabled) {
      const cached = await this.checkCache(pathname, context)
      if (cached) {
        return cached
      }
    }

    // Determine what to serve based on path
    if (pathname === this.docsConfig.paths?.docs) {
      return await this.serveDocsUI(context)
    } else if (pathname === this.docsConfig.paths?.yaml) {
      return await this.serveSpec('yaml', context)
    } else if (pathname === this.docsConfig.paths?.json) {
      return await this.serveSpec('json', context)
    }

    return {
      content: 'Not Found',
      contentType: 'text/plain',
      status: 404,
      headers: {},
    }
  }

  /**
   * Serve interactive docs UI
   */
  private async serveDocsUI(context: AgentExecutionContext): Promise<DocsMemberOutput> {
    const ui = this.docsConfig.ui!
    const branding = this.docsConfig.branding
    const specUrl = this.docsConfig.paths!.yaml

    let html = ''

    switch (ui) {
      case 'stoplight':
        html = this.generateStoplightUI(specUrl, branding)
        break
      case 'redoc':
        html = this.generateRedocUI(specUrl, branding)
        break
      case 'swagger':
        html = this.generateSwaggerUI(specUrl, branding)
        break
      case 'scalar':
        html = this.generateScalarUI(specUrl, branding)
        break
      case 'rapidoc':
        html = this.generateRapidocUI(specUrl, branding)
        break
      default:
        html = this.generateStoplightUI(specUrl, branding)
    }

    const output: DocsMemberOutput = {
      content: html,
      contentType: 'text/html; charset=utf-8',
      status: 200,
      headers: {
        'Cache-Control': this.docsConfig.cache?.enabled
          ? `public, max-age=${this.docsConfig.cache.ttl}`
          : 'no-cache',
      },
      cacheStatus: 'miss',
    }

    // Cache if enabled
    if (this.docsConfig.cache?.enabled) {
      await this.cacheOutput(this.docsConfig.paths!.docs, output, context)
    }

    return output
  }

  /**
   * Serve OpenAPI spec
   */
  private async serveSpec(
    format: 'yaml' | 'json',
    context: AgentExecutionContext
  ): Promise<DocsMemberOutput> {
    // Generate or load spec
    const spec = await this.generateSpec(context)

    let content: string
    let contentType: string

    if (format === 'yaml') {
      // Convert to YAML (simplified - would use yaml library)
      content = JSON.stringify(spec, null, 2) // TODO: Use YAML library
      contentType = 'application/x-yaml'
    } else {
      content = JSON.stringify(spec, null, 2)
      contentType = 'application/json'
    }

    const output: DocsMemberOutput = {
      content,
      contentType,
      status: 200,
      headers: {
        'Cache-Control': this.docsConfig.cache?.enabled
          ? `public, max-age=${this.docsConfig.cache.ttl}`
          : 'no-cache',
      },
      cacheStatus: 'miss',
    }

    // Cache if enabled
    if (this.docsConfig.cache?.enabled) {
      const path = format === 'yaml' ? this.docsConfig.paths!.yaml : this.docsConfig.paths!.json
      await this.cacheOutput(path, output, context)
    }

    return output
  }

  /**
   * Generate OpenAPI specification
   */
  private async generateSpec(context: AgentExecutionContext): Promise<any> {
    // If custom spec provided, use it
    if (this.docsConfig.customSpec) {
      return this.docsConfig.customSpec
    }

    // Auto-generate spec
    if (this.docsConfig.autoGenerate?.enabled) {
      return await this.autoGenerateSpec(context)
    }

    // Default minimal spec
    return {
      openapi: '3.1.0',
      info: {
        title: this.docsConfig.branding?.title || 'API Documentation',
        description: this.docsConfig.branding?.description || 'API Documentation',
        version: '1.0.0',
      },
      servers: this.docsConfig.servers || [
        {
          url: '/',
          description: 'Current server',
        },
      ],
      paths: {},
    }
  }

  /**
   * Auto-generate OpenAPI spec from ensembles/agents
   */
  private async autoGenerateSpec(context: AgentExecutionContext): Promise<any> {
    // This would scan your ensembles and agents to generate the spec
    // For now, return a placeholder
    // TODO: Integrate with OpenAPIGenerator from CLI

    return {
      openapi: '3.1.0',
      info: {
        title: this.docsConfig.branding?.title || 'API Documentation',
        description: this.docsConfig.branding?.description || 'Auto-generated API documentation',
        version: '1.0.0',
      },
      servers: this.docsConfig.servers || [],
      paths: {
        '/api/v1/execute': {
          post: {
            summary: 'Execute an ensemble',
            description: 'Execute a named ensemble with input data',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ensemble: { type: 'string' },
                      input: { type: 'object' },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Execution result',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        result: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  }

  /**
   * Generate Stoplight Elements UI
   */
  private generateStoplightUI(specUrl: string, branding?: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || 'API Documentation'}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ''}
	<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
	<link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
	${branding?.customCss ? `<style>${branding.customCss}</style>` : ''}
</head>
<body>
	<elements-api
		apiDescriptionUrl="${specUrl}"
		router="hash"
		layout="sidebar"
		${branding?.logo ? `logo="${branding.logo}"` : ''}
	/>
</body>
</html>`
  }

  /**
   * Generate Redoc UI
   */
  private generateRedocUI(specUrl: string, branding?: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || 'API Documentation'}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ''}
	<style>
		body { margin: 0; padding: 0; }
		${branding?.customCss || ''}
	</style>
</head>
<body>
	<redoc spec-url="${specUrl}"></redoc>
	<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`
  }

  /**
   * Generate Swagger UI
   */
  private generateSwaggerUI(specUrl: string, branding?: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || 'API Documentation'}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ''}
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css">
	<style>
		body { margin: 0; }
		${branding?.customCss || ''}
	</style>
</head>
<body>
	<div id="swagger-ui"></div>
	<script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
	<script>
		window.onload = () => {
			SwaggerUIBundle({
				url: '${specUrl}',
				dom_id: '#swagger-ui',
			});
		};
	</script>
</body>
</html>`
  }

  /**
   * Generate Scalar UI
   */
  private generateScalarUI(specUrl: string, branding?: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || 'API Documentation'}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ''}
	<style>
		body { margin: 0; }
		${branding?.customCss || ''}
	</style>
</head>
<body>
	<script
		id="api-reference"
		data-url="${specUrl}"
		${branding?.theme ? `data-theme="${branding.theme}"` : ''}
	></script>
	<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`
  }

  /**
   * Generate RapiDoc UI
   */
  private generateRapidocUI(specUrl: string, branding?: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${branding?.title || 'API Documentation'}</title>
	${branding?.favicon ? `<link rel="icon" href="${branding.favicon}">` : ''}
	<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
	<style>
		${branding?.customCss || ''}
	</style>
</head>
<body>
	<rapi-doc
		spec-url="${specUrl}"
		render-style="read"
		${branding?.primaryColor ? `theme="dark" primary-color="${branding.primaryColor}"` : ''}
		${branding?.logo ? `logo="${branding.logo}"` : ''}
	></rapi-doc>
</body>
</html>`
  }

  /**
   * Check cache
   */
  private async checkCache(
    path: string,
    context: AgentExecutionContext
  ): Promise<DocsMemberOutput | null> {
    if (!this.docsConfig.cache?.enabled) {
      return null
    }

    const cacheKey = `docs:${this.name}:${path}`
    const cached = await context.env.DOCS_CACHE?.get(cacheKey, 'json')

    if (cached) {
      return { ...(cached as DocsMemberOutput), cacheStatus: 'hit' }
    }

    return null
  }

  /**
   * Cache output
   */
  private async cacheOutput(
    path: string,
    output: DocsMemberOutput,
    context: AgentExecutionContext
  ): Promise<void> {
    if (!this.docsConfig.cache?.enabled) {
      return
    }

    const cacheKey = `docs:${this.name}:${path}`
    const ttl = this.docsConfig.cache.ttl || 300

    await context.env.DOCS_CACHE?.put(cacheKey, JSON.stringify(output), { expirationTtl: ttl })
  }
}
