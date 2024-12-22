import sharedConfig, { overrideRules } from '@kitschpatrol/remark-config'

const localConfig = {
	...sharedConfig,
	// Some issue with the escaped `[` characters in the "Background" section...
	plugins: overrideRules(sharedConfig.plugins, [['remark-lint-no-undefined-references', false]]),
}

export default localConfig
