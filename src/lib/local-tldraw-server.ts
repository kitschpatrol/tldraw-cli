import type { ServerType } from '@hono/node-server'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import getPort from 'get-port'
import { Hono } from 'hono'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import log from './utilities/log'

export default class LocalTldrawServer {
	get href(): string {
		if (!this.server) throw new Error('Server not started')
		if (!this.port) throw new Error('Server port not available')
		return `http://localhost:${this.port}`
	}

	private port?: number
	private server?: ServerType

	constructor(private readonly tldrData?: string) {}

	close(): void {
		if (!this.server) throw new Error('Server not started')
		this.server.close()
		log.info('Stopped tldraw server')
	}

	async start(): Promise<void> {
		// Serve local tldraw
		log.info('Starting tldraw server...')

		const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))

		// Handle dev or prod relative paths, brittle
		const tldrawPath = path.join(
			scriptDirectory,
			scriptDirectory.endsWith('/src/lib')
				? '../../dist/tldraw'
				: scriptDirectory.endsWith('/dist/lib')
					? '../tldraw'
					: '../dist/tldraw',
		)

		log.info(`tldraw served from "${tldrawPath}"`)
		const app = new Hono()
		this.port = await getPort()

		// Provide the initial state data at an endpoint
		app.get('/tldr-data', (c) =>
			this.tldrData === undefined
				? c.text('No tldr data provided', 404)
				: c.text(this.tldrData, 200, {
						'Content-Type': 'text/plain; charset=utf-8',
					}),
		)

		// Serve static files
		app.use('/*', serveStatic({ root: tldrawPath }))

		try {
			this.server = serve({
				fetch: app.fetch,
				port: this.port,
			})

			// Wait for the server to actually start listening
			await this.waitForServer()
		} catch (error) {
			log.error(error)
			throw error
		}

		log.info(`tldraw hosted at "${this.href}"`)
	}

	private async waitForServer(maxAttempts = 50, delay = 10): Promise<void> {
		if (!this.server) throw new Error('Server not initialized')

		for (let i = 0; i < maxAttempts; i++) {
			const address = this.server.address()
			if (address !== null) {
				// Server is ready
				return
			}
			// Wait a bit before checking again
			await new Promise((resolve) => {
				setTimeout(resolve, delay)
			})
		}

		throw new Error('Server failed to start within timeout')
	}
}
