/* eslint-disable perfectionist/sort-objects */
/* @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: ['@kitschpatrol/eslint-config'],
	overrides: [
		{
			files: ['*/**'],
			rules: {
				'n/no-unsupported-features/node-builtins': 'off',
			},
		},
		{
			files: ['src/cli/**/*'],
			rules: {
				'n/hashbang': 'off',
			},
		},
	],
}
