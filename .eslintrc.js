module.exports = {
	overrides: [
		{
			parser: '@typescript-eslint/parser', // Specifies the ESLint parser
			plugins: ['@typescript-eslint'],
			extends: [
				'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
			],
			rules: {
				'@typescript-eslint/no-empty-interface': [
					'off',
					{
						allowSingleExtends: true,
					},
				],
				'no-use-before-define': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'@typescript-eslint/interface-name-prefix': 'off',
				'@typescript-eslint/no-use-before-define': ['error'],
				'@typescript-eslint/explicit-module-boundary-types': 'off',
				'@typescript-eslint/no-explicit-any': 'off',
				'no-unused-vars': 'off',
				'@typescript-eslint/no-unused-vars': [
					'warn', // or "error"
					{
						argsIgnorePattern: '^_',
						varsIgnorePattern: '^_',
						caughtErrorsIgnorePattern: '^_',
					},
				],
			},
			files: ['*.ts', '*.tsx'],
			parserOptions: {
				project: 'tsconfig.json',
			},
		},
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'plugin:react/recommended', // React reccoemndations
		'plugin:@next/next/recommended', // Next
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
		'next/core-web-vitals',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/consistent-type-imports': 'warn',
		'prettier/prettier': ['error', { useTabs: true }],
	},
};
