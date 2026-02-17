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
		files: ['readme.md/**/*.html'],
		rules: {
			'html/require-img-alt': 'off',
		},
	},
)
