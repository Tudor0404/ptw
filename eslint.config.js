import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  ignores: ['**/node_modules/**', '**/dist/**', '**/*.ohm-bundle.js', '**/*.ohm-bundle.d.ts', 'docs/.vitepress/cache/**', 'docs/.vitepress/dist/**'],
}, {
  files: ['docs/**/*'],
  rules: {
    'node/prefer-global/process': 'off',
  },
}, {
  files: ['**/*.test.ts'],
  rules: {
    'no-console': 'off',
  },
}, {
  rules: {
    'no-unused-vars': 'off',
    'unused-imports/no-unused-vars': ['warn', {
      vars: 'all',
      args: 'none',
      varsIgnorePattern: '^[A-Z][A-Z_]*$',
    }],
    'unicorn/no-new-array': 'off',
  },
})
