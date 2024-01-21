// Staying basic, always log to stderr

import chalk from 'chalk'

const log = {
	error(...data: unknown[]): void {
		console.error(chalk.red('[Error]'), ...data)
	},
	info(...data: unknown[]): void {
		if (!this.verbose) return
		// Even info logs to stderr for ease of redirection
		console.warn(chalk.green('[Info]'), ...data)
	},
	verbose: false,
	warn(...data: unknown[]): void {
		console.warn(chalk.yellow('[Warning]'), ...data)
	},
}

export default log
