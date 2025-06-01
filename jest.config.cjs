module.exports = {
	transform: {
		'\\.[tj]sx?': ['babel-jest', { configFile: './babel.config.test.cjs' }],
	},
};
