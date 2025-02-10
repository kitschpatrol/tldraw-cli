import { eslintConfig } from '@kitschpatrol/eslint-config'

export default eslintConfig(
	{
		md: {
			overridesEmbeddedScripts: {
				'import/no-unresolved': 'off',
			},
		},
		react: true,
		tsx: {
			overrides: {
				'jsdoc/require-returns': 'off',
			},
		},
		type: 'lib',
	},
	{
		files: ['*/**'],
		rules: {
			'node/no-unsupported-features/node-builtins': 'off',
		},
	},
	{
		files: ['readme.md/**/*.html'],
		rules: {
			'html/require-img-alt': 'off',
		},
	},
	{
		files: ['src/cli/**/*'],
		rules: {
			'node/hashbang': 'off',
		},
	},
)
