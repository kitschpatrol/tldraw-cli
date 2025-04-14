import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import getPort from 'get-port'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import log from './utilities/log'

export default class LocalTldrawServer {
	get href(): string {
		if (!this.server) throw new Error('Server not started')
		const { port } = this.server.address() as AddressInfo
		return `http://localhost:${port}`
	}

	private server?: Server

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
		const app = express()
		const port = await getPort()

		// Provide the initial state data at an endpoint
		app.get('/tldr-data', (_, response) => {
			if (this.tldrData === undefined) {
				response.status(404).send('No tldr data provided')
			} else {
				response.setHeader('Content-Type', 'text/plain; charset=utf-8')
				response.send(this.tldrData)
			}
		})

		app.use(express.static(tldrawPath))

		try {
			this.server = app.listen(port)
		} catch (error) {
			log.error(error)
		}

		log.info(`tldraw hosted at "${this.href}"`)
	}
}
