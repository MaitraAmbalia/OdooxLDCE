function boundary(context, forbidden) {
  return {
    files: [`src/contexts/${context}/**/*.js`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: `(^|/)(${forbidden}|${forbidden}-client|modules)(/|$)|^@prisma/client$`,
          message: 'Use your own context/client, platform libraries, or published read contracts.',
        }],
      }],
      'no-restricted-syntax': ['error',
        { selector: 'ImportExpression', message: 'Use static imports so context boundaries can be checked.' },
        { selector: 'CallExpression[callee.name="require"]', message: 'Use static ESM imports.' },
      ],
    },
  };
}

export default [
  { ignores: ['src/generated/**', 'node_modules/**'] },
  { files: ['**/*.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  boundary('people', 'commerce'),
  boundary('commerce', 'people'),
];
