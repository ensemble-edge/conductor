/**
 * MCP Server Routes
 *
 * Expose Conductor ensembles as MCP (Model Context Protocol) tools.
 *
 * Endpoints:
 * - GET  /mcp/tools            - List all available tools (manifest)
 * - POST /mcp/tools/{name}     - Invoke a tool (execute ensemble)
 */

import { Hono } from 'hono'
import { Parser, type EnsembleConfig } from '../../runtime/parser.js'
import { Executor } from '../../runtime/executor.js'
import { createLogger } from '../../observability/index.js'

const app = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-mcp' })

/**
 * List all available MCP tools
 * GET /mcp/tools
 *
 * Returns a manifest of all ensembles exposed as MCP tools
 */
app.get('/tools', async (c) => {
	const env = c.env

	try {
		// TODO: Load all ensemble configurations from KV or catalog
		// For now, return a mock response showing the expected format
		const tools = await discoverExposedEnsembles(env)

		return c.json({
			tools,
		})
	} catch (error) {
		logger.error('Failed to list MCP tools', error instanceof Error ? error : undefined)

		return c.json(
			{
				error: 'Failed to list MCP tools',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		)
	}
})

/**
 * Invoke an MCP tool (execute ensemble)
 * POST /mcp/tools/{name}
 *
 * Executes an ensemble exposed as an MCP tool
 */
app.post('/tools/:name', async (c) => {
	const ensembleName = c.req.param('name')
	const env = c.env

	try {
		// Get request body (MCP tool invocation format)
		const body = await c.req.json().catch(() => ({}))
		const toolArgs = body.arguments || {}

		// Load ensemble configuration
		// TODO: Load from catalog or KV
		const ensembleYAML = await loadEnsembleYAML(ensembleName, env)
		if (!ensembleYAML) {
			return c.json(
				{
					error: 'Ensemble not found',
					ensemble: ensembleName,
				},
				404
			)
		}

		const ensemble = Parser.parseEnsemble(ensembleYAML)

		// Check if ensemble is exposed as MCP tool
		const mcpExpose = ensemble.expose?.find((exp) => exp.type === 'mcp')
		if (!mcpExpose) {
			return c.json(
				{
					error: 'Ensemble is not exposed as an MCP tool',
					ensemble: ensembleName,
				},
				404
			)
		}

		// Authenticate if not public
		if (!mcpExpose.public) {
			if (!mcpExpose.auth) {
				return c.json(
					{
						error: 'MCP tool requires authentication but none configured',
						ensemble: ensembleName,
					},
					500
				)
			}

			const authResult = await authenticateMCP(c, mcpExpose.auth)
			if (!authResult.success) {
				return c.json(
					{
						error: 'MCP authentication failed',
						message: authResult.error,
					},
					401
				)
			}
		}

		// Execute ensemble
		const ctx = {
			waitUntil: (promise: Promise<unknown>) => {},
			passThroughOnException: () => {},
		} as ExecutionContext

		const executor = new Executor({ env, ctx })
		const result = await executor.executeEnsemble(ensemble, toolArgs)

		if (!result.success) {
			return c.json({
				content: [
					{
						type: 'text',
						text: `Execution failed: ${result.error.message}`,
					},
				],
				isError: true,
			})
		}

		// Format output in MCP response format
		const output = result.value.output

		// Convert output to MCP content format
		const content = formatMCPContent(output)

		return c.json({
			content,
			isError: false,
		})
	} catch (error) {
		logger.error('MCP tool invocation failed', error instanceof Error ? error : undefined, {
			ensembleName,
		})

		return c.json({
			content: [
				{
					type: 'text',
					text: `Tool invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				},
			],
			isError: true,
		})
	}
})

/**
 * Discover all ensembles exposed as MCP tools
 */
async function discoverExposedEnsembles(env: Env): Promise<any[]> {
	// TODO: Implement actual discovery from KV/catalog
	// For now, return empty array
	// In production, this would:
	// 1. List all ensemble YAMLs from KV or catalog
	// 2. Parse each one
	// 3. Filter for those with expose.type === 'mcp'
	// 4. Generate tool definitions from input schemas

	return []
}

/**
 * Load ensemble YAML from storage
 */
async function loadEnsembleYAML(name: string, env: Env): Promise<string | null> {
	// TODO: Implement actual loading from KV or catalog
	// For now, return null (not found)
	// In production, this would load from:
	// - KV namespace (deployed ensembles)
	// - Or file system (development)

	return null
}

/**
 * Format ensemble output as MCP content
 */
function formatMCPContent(output: any): Array<{
	type: 'text' | 'image' | 'resource'
	text?: string
	data?: string
	mimeType?: string
}> {
	// If output is a string, return as text content
	if (typeof output === 'string') {
		return [{ type: 'text', text: output }]
	}

	// If output is an object, stringify it
	if (typeof output === 'object') {
		return [
			{
				type: 'text',
				text: JSON.stringify(output, null, 2),
			},
		]
	}

	// Default: convert to string
	return [{ type: 'text', text: String(output) }]
}

/**
 * Authenticate MCP request
 */
async function authenticateMCP(
	c: any,
	auth: { type: 'bearer' | 'oauth'; secret?: string }
): Promise<{ success: boolean; error?: string }> {
	const ctx = c as { req: { header: (name: string) => string | undefined } }

	if (auth.type === 'bearer') {
		const authHeader = ctx.req.header('Authorization')
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return { success: false, error: 'Missing or invalid Authorization header' }
		}

		const token = authHeader.substring(7)
		if (auth.secret && token !== auth.secret) {
			return { success: false, error: 'Invalid bearer token' }
		}

		return { success: true }
	}

	if (auth.type === 'oauth') {
		// TODO: Implement OAuth validation
		// For now, just check for Authorization header
		const authHeader = ctx.req.header('Authorization')
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return { success: false, error: 'Missing or invalid Authorization header' }
		}

		return { success: true }
	}

	return { success: false, error: 'Unknown auth type' }
}

export default app
