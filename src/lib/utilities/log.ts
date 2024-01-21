/* eslint-disable perfectionist/sort-objects */
// Staying basic, always log to stderr

import chalk from 'chalk'

const log = {
	verbose: false,

	info(...data: unknown[]): void {
		if (!this.verbose) return
		// Even info logs to stderr for ease of redirection
		console.warn(chalk.green('[Info]'), ...data)
	},
	infoPrefixed(prefix: string, ...data: unknown[]): void {
		this.info(chalk.blue(`[${prefix}]`), ...data)
	},

	warn(...data: unknown[]): void {
		console.warn(chalk.yellow('[Warning]'), ...data)
	},
	warnPrefixed(prefix: string, ...data: unknown[]): void {
		this.warn(chalk.blue(`[${prefix}]`), ...data)
	},

	error(...data: unknown[]): void {
		console.error(chalk.red('[Error]'), ...data)
	},
	errorPrefixed(prefix: string, ...data: unknown[]): void {
		this.error(chalk.blue(`[${prefix}]`), ...data)
	},
}

export default log
