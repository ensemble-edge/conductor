/**
 * Dev server management for integration tests
 */

import { spawn, ChildProcess } from 'node:child_process'

export interface ServerOptions {
	port?: number
	timeout?: number
}

/**
 * Manages a wrangler dev server for testing
 */
export class TestServer {
	private process?: ChildProcess
	private port: number

	private inspectorPort: number

	constructor(private projectDir: string, options: ServerOptions = {}) {
		// Use a random port between 9000-9999 to avoid conflicts
		this.port = options.port || (9000 + Math.floor(Math.random() * 1000))
		// Use a random inspector port to avoid conflicts when running tests in parallel
		// Avoid 9229 (default) and 9230 (common) - use 10000-10999 instead
		this.inspectorPort = 10000 + Math.floor(Math.random() * 1000)
	}

	/**
	 * Start the dev server
	 */
	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.log(`🚀 Starting dev server on port ${this.port}...`)

			// IMPORTANT: Must cd into directory first for wrangler to work properly in dev containers
			const command = `cd "${this.projectDir}" && npx wrangler dev --port ${this.port} --inspector-port ${this.inspectorPort} --local-protocol http --ip 0.0.0.0`

			this.process = spawn('sh', ['-c', command], {
				env: { ...process.env, NODE_ENV: 'test' },
				stdio: ['ignore', 'pipe', 'pipe']
			})

			const timeout = setTimeout(() => {
				this.stop()
				reject(new Error('Server start timeout (30s)'))
			}, 30000)

			let output = ''

			this.process.stdout?.on('data', (data) => {
				const text = data.toString()
				output += text

				// Look for "Ready on" or direct URL
				if (text.includes('Ready on') || text.includes(`http://0.0.0.0:${this.port}`)) {
					clearTimeout(timeout)
					console.log('✅ Dev server ready')
					resolve()
				}
			})

			let stderrOutput = ''

			this.process.stderr?.on('data', (data) => {
				const text = data.toString()
				stderrOutput += text
				// Log all stderr output to help with debugging
				console.error('Server stderr:', text)
			})

			this.process.on('error', (error) => {
				clearTimeout(timeout)
				reject(error)
			})

			this.process.on('exit', (code) => {
				if (code !== 0 && code !== null) {
					clearTimeout(timeout)
					reject(new Error(`Server exited with code ${code}`))
				}
			})
		})
	}

	/**
	 * Wait for server to respond to HTTP requests
	 */
	async waitForReady(maxWait: number = 10000): Promise<void> {
		const startTime = Date.now()

		while (Date.now() - startTime < maxWait) {
			try {
				const response = await fetch(`http://localhost:${this.port}/`)
				if (response.status === 200 || response.status === 404) {
					console.log('✅ Server responding to HTTP requests')
					return
				}
			} catch {
				// Server not ready yet, continue waiting
			}

			await new Promise((resolve) => setTimeout(resolve, 500))
		}

		throw new Error('Server did not become ready')
	}

	/**
	 * Stop the dev server
	 */
	async stop(): Promise<void> {
		if (!this.process) {
			return
		}

		console.log('🛑 Stopping dev server...')

		return new Promise((resolve) => {
			if (!this.process) {
				resolve()
				return
			}

			this.process.on('exit', () => {
				console.log('✅ Dev server stopped')
				resolve()
			})

			// Try graceful shutdown first
			this.process.kill('SIGTERM')

			// Force kill after 2 seconds if still running
			setTimeout(() => {
				if (this.process && !this.process.killed) {
					this.process.kill('SIGKILL')
				}
				resolve()
			}, 2000)
		})
	}

	/**
	 * Get the server URL
	 */
	getUrl(path: string = '/'): string {
		return `http://localhost:${this.port}${path}`
	}
}
