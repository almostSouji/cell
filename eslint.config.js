export default {
	extends: ['neon/common', 'neon/node', 'neon/typescript', 'neon/prettier'],
	parserOptions: {
		project: './tsconfig.eslint.json',
	},
	rules: {
		'@typescript-eslint/naming-convention': 0,
		'no-console': 1,
	},
};
