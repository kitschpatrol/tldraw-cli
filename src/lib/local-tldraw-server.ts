import type { ServerType } from '@hono/node-server'
import type { AddressInfo } from 'node:net'
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
		// eslint-disable-next-line ts/no-unsafe-type-assertion
		const { port } = this.server.address() as AddressInfo
		return `http://localhost:${port}`
	}

	private server?: ServerType

	constructor(private readonly tldrData?: string) {}

	close(): void {
		if (!this.server) throw new Error('Server not started')
		this.server.close()
		log.info('Stopped tldraw server')
	}

	async start() {
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
		const port = await getPort()

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
				port,
			})
		} catch (error) {
			log.error(error)
		}

		log.info(`tldraw hosted at "${this.href}"`)
	}
}
